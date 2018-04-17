var https = require('https');
var async = require('async');
var mongoose = require('mongoose');
var request = require('request');
var BaseController = require('./BaseController');
var View = require('../views/base');

var UserModel = require('../models/Users');
var CommonModel = require('../models/common');
var BTCTransaction = require('../models/btctransaction');
var ETHTransaction = require('../models/ethtransaction');
var BLVTransaction = require('../models/blvtransaction');
var ICOStageModel = require('../models/icostage');
var AffiliateBonusModel = require('../models/affiliatebonus');

var BLVHistory = require('../models/blvhistory');
var ETHHistory = require('../models/ethhistory');
var BTCHistory = require('../models/btchistory');

var config = require('../config/index')();

var speakeasy = require("speakeasy");
var base32 = require('hi-base32');

var bitcoin_rpc = require('node-bitcoin-rpc');
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var abiDecoder = require('abi-decoder');
var QRCode = require('qrcode');

var d = new Date();

module.exports = BaseController.extend({
    name: 'WalletController',
    blockvest: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            var user = req.session.user;
            var common = await CommonModel.findOne({});
            req.session.common = common;
            req.session.save();
            var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));

            var abi = config.info.blv_abi;
            var addr = config.info.blv_address.toLowerCase();
            var blvContract = new web3.eth.Contract(abi, addr);
            
            // Get the data URL of the authenticator URL
            var btc_qrcode_url = await QRCode.toDataURL(user.btcAddress);
            var eth_qrcode_url = await QRCode.toDataURL(user.eoaAddress);
            var blv_qrcode_url = await QRCode.toDataURL(user.blvAddress); 

            var eth_account_list = [];
            if(role != "customer"){
                var users = await UserModel.find({username:{$ne:"admin"}});
                for( var i = 0; i < users.length; i++){
                    eth_account_list.push({
                        addr: users[i].eoaAddress,
                        balance: users[i].ethBalance
                    });
                }
            }

            var v = new View(res, 'wallets/blockvest');
            if(role == "SuperAdmin"){
                v.render({
                    title: 'Blockvest Wallet',
                    userinfo: req.session.user,
                    eth_account_list: eth_account_list,
                    blv_qrcode_url: blv_qrcode_url,
                    btc_qrcode_url: btc_qrcode_url,
                    eth_qrcode_url: eth_qrcode_url,
                    config: config.info,  
                    common: common,
                    role: role
                });

            }else{
                v.render({
                    title: 'Blockvest Wallet',
                    userinfo: req.session.user,
                    blv_qrcode_url: blv_qrcode_url,
                    config: config.info,  
                    common: common,
                    role: role
                });
            }
        }
    },

    exchange: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            var user = req.session.user;
            var common = await CommonModel.findOne({});
            req.session.common = common;
            req.session.save();
            
            if(user.secret == ""){
                req.flash('error', 'First You should enable Google Two-Factor Authentication.');
            }

            // Get the data URL of the authenticator URL
            var btc_qrcode_url = await QRCode.toDataURL(user.btcAddress);
            var eth_qrcode_url = await QRCode.toDataURL(user.eoaAddress);
            
            var v = new View(res, 'wallets/exchange');
            v.render({
                title: 'Exchange',
                userinfo: req.session.user,
                btc_qrcode_url: btc_qrcode_url,
                eth_qrcode_url: eth_qrcode_url,
                error: req.flash("error"),
                success: req.flash("success"),
                config: config.info,  
                common: common,
                role: role
            });
        }
    },
    bitcoinICOfromTxID: async function(req, res, next){
        var btc = req.body.btc;
        var blv = req.body.blv;
        var txid = req.body.txid;
        var token = req.body.token;
        var coin_price = req.body.coin_price;
        var price = req.body.price;
        var username = req.body.username;
        
        var common = await CommonModel.findOne({});
        var icoStage = await ICOStageModel.find({});
        
        if(!common.ico_activation){
            return res.send({status:"fail", message:"ICO was finished and so you can not purchase blockvest."});
        }else{
            if(icoStage[common.ico_cur_stage-1].status == 0){
                return res.send({status:"fail", message:"You should wait until new ICO stage is started."});
            }
        }

        // check transaction id in database
        var trans = await BTCTransaction.findOne({txHash: txid});
        if(trans != null){
            return res.send({status:"fail", message:"This transaction was used already."});
        }

        var blv_price = parseFloat(blv) * parseFloat(price);
        if(blv_price < 25){
            return res.send({status:"fail", message:"You should purchase more than 25$."});
        }

        if(blv_price > 250000){
            return res.send({status:"fail", message:"You should purchase more than 250,000$."});
        }

        var blv_amount = parseFloat(btc) * parseFloat(coin_price) / parseFloat(price);
        if( parseFloat(blv) > blv_amount){
            return res.send({status:"fail", message:"This blockvest amount is wrong."});
        }

        var admin = await UserModel.findOne({username:"admin"});
        var user = await UserModel.findOne({username: username});
        if( user == null){
            return res.send({status: "fail", message: "Can not find user. Please login again."});
        }

        
        // calculate bonus and store transaction.
        var bonus = parseFloat(blv) * icoStage[common.ico_cur_price-1].bonus/100;
        bonus = Math.floor(bonus*10);
        bonus = bonus/10;
		console.log('-------blv, bonus => ' + blv + "," + bonus);

        blv = parseFloat(blv) + bonus;
		console.log('-------blockvest amount for ICO : ' + blv);
        if(admin.blvBalance < blv){
            return res.send({status:"fail", message:"Site has no blockvest now."});
        }

        var base32secret = base32.decode(user.secret);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
                                            
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.send({status: "fail", message:"Google 2FA authentication failed. Please input correct token again."});
        }        

        await bitcoin_rpc.init(config.info.btc_daemon.host, config.info.btc_daemon.port, config.info.btc_daemon.rpcusername, config.info.btc_daemon.rpcpassword);
        await bitcoin_rpc.call('gettransaction', [txid], async function(err, ret){
            if(err){
                console.log(err);
                return res.send({staus: "fail", message:"Tranaction hash is wrong."});
            }

            var cur_trans = ret.result;
			if(cur_trans == null || cur_trans.details[0] == null) {
                return res.send({staus: "fail", message:"Tranaction hash is wrong."});
            } 

            if( cur_trans.details[0].category == "receive"){
                var to_addr = cur_trans.details[0].address;
                var amount = cur_trans.details[0].amount;
                var confirmations = cur_trans.confirmations;

                if(to_addr != user.btcAddress){
                    return res.send({status: "fail", message:"This transaction is not yours."});
                }

                if( amount < btc) {
                    return res.send({status:"fail", message:"This transaction amount is different from the bitcoin amount you entered."});
                }

                var trans_time = new Date("01-01-1970");
                trans_time.setSeconds(trans_time.getSeconds() + cur_trans.timereceived);
                await bitcoin_rpc.call('getrawtransaction', [cur_trans.txid, 1], async function(err, ret){
                    var fromAddr = "";
        
                    if(err){
                        console.log(err);
                        return res.send({staus: "fail", message:"Tranaction hash format is wrong."});
                    }
                    
                    fromAddr = ret.result.vout[1].scriptPubKey.addresses[0];

                    console.log("-----deposit Bitcoin for ICO------ <= " +  user.username);
                    console.log("\ttransaction time: "+ trans_time);
                    console.log("\ttxid: "+ txid);
                    console.log("\tamount: " + amount);
                    console.log("\tto_addr: " +to_addr);
                    console.log("\tfrom_addr: " +fromAddr);
                    
                    // store bitcoin transaction and update admin bitcoin balance.
                    var btc_trans = new BTCTransaction({
                        userid: user._id,
                        performer: user.username,
                        type: 2,
                        from: fromAddr,
                        to: to_addr,
                        Amount: amount,
                        status: "pending",
                        txHash: cur_trans.txid,
                        fee: 0,
                        create_date: new Date()
                    });

                    if(confirmations > 1) {
                        btc_trans.status = "complete";

                        admin.btcBalance += amount;
                        await admin.save();
                    }
                    await btc_trans.save();

                    var tx = new BLVTransaction({
                        userid: user._id,
                        performer: user.username,
                        type: 2,   // 0: desposit, 1: withdraw, 2: ico
                        from: admin.blvAddress,   
                        to: user.blvAddress,	
                        Amount: blv,	
                        status: "waiting",
                        txHash: "",
                        fee: 0,
                        icoType: "BTC",		
                        icoAmount: btc,		
                        coin_price: coin_price,	
                        price: price,			
                        bonus: bonus,
                        coin_tx: cur_trans.txid,
                        create_date: new Date()
                    });
                    if(confirmations > 1) tx.status = "pending";
                    await tx.save();
                    
                    var cur_date = new Date();
                    // btc trade history
                    var history = await BTCHistory.findOne({date: cur_date.toLocaleDateString()});
                    if(history != null){
                        history.amount += parseFloat(btc);
                    }else{
                        history = new BTCHistory({
                            date: cur_date.toLocaleDateString(),
                            amount: parseFloat(btc)
                        });
                    }
                    await history.save();

                    // affiliate bonus of first ico 
                    var transes = await BLVTransaction.find({$and:[{userid:user._id}, {type: 2}]});
                    if(transes.length == 0){
                        var ref_bonuses = await AffiliateBonusModel.find();
                        var sponsor = user.sponsor; 
                        for(var i = 0; i < 6; i++){
                            if(sponsor == "") break;

                            var sponsor_user = await UserModel.findOne({ref_id:sponsor});
                            if(sponsor_user == null) break;

                            var ref_bonus = (blv - bonus)*ref_bonus[i]/100;
                            ref_bonus = parseInt(ref_bonus*10);
                            ref_bonus = ref_bonus/10;
                            if(ref_bonus == 0) continue;

                            sponsor_user.blvBalance += ref_bonus;
                            sponsor_user.ref_bonus += ref_bonus;
                            await sponsor_user.save();

                            var ref_tx = new BLVTransaction({
                                userid: sponsor_user._id,
                                performer: user.username,
                                type: 3,   // 0: desposit, 1: withdraw, 2: ico, 3:affiliate bonus
                                from: admin.blvAddress,   
                                to: sponsor_user.blvAddress,	
                                Amount: ref_bonus,	
                                status: "pending",
                                txHash: "",
                                fee: 0,
                                icoType: "",		
                                icoAmount: blv-bonus,		
                                coin_price: 0,	
                                price: 0,			
                                bonus: 0,
                                coin_tx: "",
                                create_date: new Date()
                            });
                            await ref_tx.save();

                            sponsor = sponsor_user.sponsor;
                        }
                    }

                    return res.send({status: "success", message: "Your transaction is pending. Please check in transaction page."});
                });
            }else{
                return res.send({status: "fail", message:"transaction hash is wrong. Please correct transaction hash."})
            }
    
        });

    },

    ethereumICOfromTxID: async function(req, res, next){
        var eth = req.body.eth;
        var blv = req.body.blv;
        var txid = req.body.txid;
        var token = req.body.token;
        var coin_price = req.body.coin_price;
        var price = req.body.price;
        var username = req.body.username;
        
        var common = await CommonModel.findOne({});
        var icoStage = await ICOStageModel.find({});
        
        if(!common.ico_activation){
            return res.send({status:"fail", message:"ICO was finished and so you can not purchase blockvest."});
        }else{
            if(icoStage[common.ico_cur_stage-1].status == 0){
                return res.send({status:"fail", message:"You should wait until new ICO stage is started."});
            }
        }

        // check transaction id in database
        var trans = await ETHTransaction.findOne({txHash: txid});
        if(trans != null){
            return res.send({status:"fail", message:"This transaction was used already."});
        }

        var blv_price = parseFloat(blv) * parseFloat(price);
        if(blv_price < 25){
            return res.send({status:"fail", message:"You should purchase more than 25$."});
        }

        if(blv_price > 250000){
            return res.send({status:"fail", message:"You should purchase more than 250,000$."});
        }

        var blv_amount = parseFloat(eth) * parseFloat(coin_price) / parseFloat(price);
        if( parseFloat(blv) > blv_amount){
            return res.send({status:"fail", message:"This blockvest amount is wrong."});
        }

        var admin = await UserModel.findOne({username:"admin"});
        var user = await UserModel.findOne({username: username});
        if( user == null){
            return res.send({status: "fail", message: "Can not find user. Please login again."});
        }

        var bonus = parseFloat(blv) * icoStage[common.ico_cur_stage-1].bonus/100;
        bonus = Math.floor(bonus*10);
        bonus = bonus/10;
		console.log('-------blv, bonus => ' + blv + "," + bonus);

        blv = parseFloat(blv) + bonus;
		console.log('-------blockvest amount for ICO : ' + blv);
        if(admin.blvBalance < blv){
            return res.send({status:"fail", message:"Site has no blockvest now."});
        }

        var base32secret = base32.decode(user.secret);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
                                            
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.send({status: "fail", message:"Google 2FA authentication failed. Please input correct token again."});
        }        


        var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));
        web3.eth.getTransaction(txid, async function(err, trans){
            //console.log(trans);
            if( trans == null || trans.to == null || trans.from == null || trans.value == 0 ) {
                return res.send({status:"fail", message:"Tranaction hash is wrong."});
            }
            
            var toAddr = trans.to.toLowerCase();
            var fromAddr = trans.from.toLowerCase();
            var amount = web3.utils.fromWei(trans.value, "ether"); 
            amount = new BigNumber(amount).toString();
            //console.log(fromAddr + " -> " + toAddr + " : " + amount);
            if(toAddr != user.eoaAddress){
                return res.send({status: "fail", message:"This transaction is not yours."});
            }

            if( amount < eth) {
                return res.send({status:"fail", message:"This transaction amount is different from the ethereum amount you entered."});
            }


            console.log("---- deposit ethereum for ICO ------- <= " +  user.username);
            console.log("\ttxid: "+ txid);
            console.log("\tamount: " + amount);
            console.log("\tto_addr: " +toAddr);
            console.log("\tfrom_addr: " +fromAddr);
            
            // store ethereum transaction and update admin ethereum balance.
            var eth_trans = new ETHTransaction({
                userid: user._id,
                performer: user.username,
                type: 2,
                from: fromAddr,
                to: toAddr,
                Amount: amount,
                status: "pending",
                txHash: txid,
                fee: 0,
                create_date: new Date()
            });
            await eth_trans.save();

            // calculate bonus and store transaction.
           
            var tx = new BLVTransaction({
                userid: user._id,
                performer: user.username,
                type: 2,   // 0: desposit, 1: withdraw, 2: ico
                from: admin.blvAddress,   
                to: user.blvAddress,	
                Amount: blv,	
                status: "waiting",
                txHash: "",
                fee: 0,
                icoType: "ETH",		
                icoAmount: amount,		
                coin_price: coin_price,	
                price: price,			
                bonus: bonus,
                coin_tx: txid,
                create_date: new Date()
            });
            
            await tx.save();

            var cur_date = new Date();
            // eth trade history
            history = await ETHHistory.findOne({date: cur_date.toLocaleDateString()});
            if(history != null){
                history.amount += parseFloat(eth);
            }else{
                history = new ETHHistory({
                    date: cur_date.toLocaleDateString(),
                    amount: parseFloat(eth)
                });
            }
            await history.save();
            
            // affiliate bonus of first ico 
            var transes = await BLVTransaction.find({$and:[{userid:user._id}, {type: 2}]});
            if(transes.length == 0){
                var ref_bonuses = await AffiliateBonusModel.find();
                var sponsor = user.sponsor; 
                for(var i = 0; i < 6; i++){
                    if(sponsor == "") break;

                    var sponsor_user = await UserModel.findOne({ref_id:sponsor});
                    if(sponsor_user == null) break;

                    var ref_bonus = (blv - bonus)*ref_bonus[i]/100;
                    ref_bonus = parseInt(ref_bonus*10);
                    ref_bonus = ref_bonus/10;
                    if(ref_bonus == 0) continue;

                    sponsor_user.blvBalance += ref_bonus;
                    sponsor_user.ref_bonus += ref_bonus;
                    await sponsor_user.save();

                    var ref_tx = new BLVTransaction({
                        userid: sponsor_user._id,
                        performer: user.username,
                        type: 3,   // 0: desposit, 1: withdraw, 2: ico, 3:affiliate bonus
                        from: admin.blvAddress,   
                        to: sponsor_user.blvAddress,	
                        Amount: ref_bonus,	
                        status: "pending",
                        txHash: "",
                        fee: 0,
                        icoType: "",		
                        icoAmount: blv-bonus,		
                        coin_price: 0,	
                        price: 0,			
                        bonus: 0,
                        coin_tx: "",
                        create_date: new Date()
                    });
                    await ref_tx.save();

                    sponsor = sponsor_user.sponsor;
                }
            }

            return res.send({status: "success", message: "Your transaction is pending. Please check in transaction page."});    
        });
    },

    depositBTC: async function(req, res, next){
        var btc = req.body.btc;
        var txid = req.body.txid;
        var token = req.body.token;
        var username = req.body.username;
        
        // check transaction id in database
        var trans = await BTCTransaction.findOne({txHash: txid});
        if(trans != null){
            return res.send({status:"fail", message:"This transaction was used already."});
        }

        if(username != "admin") {
            return res.send({status: "fail", message:"Can not find user. Please try to do again."});
        }

        var user = await UserModel.findOne({username:username});
       
        var base32secret = base32.decode(user.secret);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
                                            
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.send({status: "fail", message:"Google 2FA authentication failed. Please input correct token again."});
        }        

        await bitcoin_rpc.init(config.info.btc_daemon.host, config.info.btc_daemon.port, config.info.btc_daemon.rpcusername, config.info.btc_daemon.rpcpassword);
        await bitcoin_rpc.call('gettransaction', [txid], async function(err, ret){
            if(err){
                console.log(err);
                return res.send({staus: "fail", message:"Tranaction hash is wrong."});
            }

            var cur_trans = ret.result;
            if( cur_trans.details[0].category == "receive"){
                var to_addr = cur_trans.details[0].address;
                var amount = cur_trans.details[0].amount;
                var confirmations = cur_trans.confirmations;

                if(to_addr != user.btcAddress){
                    return res.send({status: "fail", message:"This transaction is not yours."});
                }

                if( amount < btc) {
                    return res.send({status:"fail", message:"This transaction amount is different from the bitcoin amount you entered."});
                }

                var trans_time = new Date("01-01-1970");
                trans_time.setSeconds(trans_time.getSeconds() + cur_trans.timereceived);

                await bitcoin_rpc.call('getrawtransaction', [cur_trans.txid, 1], async function(err, ret){
                    var fromAddr = "";
        
                    if(err){
                        console.log(err);
                        return res.send({staus: "fail", message:"Tranaction hash format is wrong."});
                    }
                    
                    fromAddr = ret.result.vout[1].scriptPubKey.addresses[0];

                    console.log("-----deposit Bitcoin for ICO------ <= " +  user.username);
                    console.log("\ttransaction time: "+ trans_time);
                    console.log("\ttxid: "+ txid);
                    console.log("\tamount: " + amount);
                    console.log("\tto_addr: " +to_addr);
                    console.log("\tfrom_addr: " +fromAddr);
                    
                    // store bitcoin transaction and update admin bitcoin balance.
                    var btc_trans = new BTCTransaction({
                        userid: user._id,
                        performer: user.username,
                        type: 0,
                        from: fromAddr,
                        to: to_addr,
                        Amount: amount,
                        status: "pending",
                        txHash: cur_trans.txid,
                        fee: 0,
                        create_date: new Date()
                    });
                    if(cur_trans.confirmations > 1){
                        btc_trans.status = "complete";

                        user.btcBalance += parseFloat(amount);
                        await user.save();
                    }
                    await btc_trans.save();


                    return res.send({status: "success", message: "Deposit successfully."});
                });
            }else{
                return res.send({status: "fail", message:"transaction hash is wrong. Please correct transaction hash."});
            }
    
        });
    },

    withdrawBTC: async function(req, res,next){
        console.log("withdrawBTC ---------");
        console.log(req.body.toAddr);
        console.log(req.body.amount);

        if(req.body.username != "admin"){
            return res.send({status:"fail", message:"You can not withdraw bitcoin."});
        }

        var admin = await UserModel.findOne({username:"admin"});
        var user = await UserModel.findOne({username:req.body.username});
        if( req.body.toAddr == undefined || req.body.amount == undefined || user == null) {
            res.send({ status: "error", message: "Parameter is not valid." });
            return;
        }

        var token = req.body.token;
        var base32secret = base32.decode(user.secret);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
                                            
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.send({status: "fail", message:"Google 2FA authentication failed. Please input correct token again."});
        }        

        var toAddr = req.body.toAddr;
        var fromAddr = admin.btcAddress;
        var amount = req.body.amount;
        if(amount < 0.01){
            console.log("You can withdraw at least 0.01BTC.");
            return res.send({status:"fail", message:"You can withdraw at least 0.01BTC."});
        }

        var tx = new BTCTransaction({
            userid: user._id,
            performer: user.username,
            type : 1,
            from: fromAddr,
            to: toAddr,
            Amount: amount,
            status: "pending",
            txHash: '',
            fee: 0,
            create_date: new Date()
        });

        ret = await tx.save();
        res.send({ status: "success", message: "Your transaction is pending. Please check in transaction page." });
        console.log("Your transaction is pending. Please check in transaction page.");
    },

    depositETH: async function(req, res, next){
        var eth = req.body.eth;
        var txid = req.body.txid;
        var token = req.body.token;
        var username = req.body.username;
        
        // check transaction id in database
        var trans = await ETHTransaction.findOne({txHash: txid});
        if(trans != null){
            return res.send({status:"fail", message:"This transaction was used already."});
        }

        var user = await UserModel.findOne({username:username});
        var base32secret = base32.decode(user.secret);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
                                            
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.send({status: "fail", message:"Google 2FA authentication failed. Please input correct token again."});
        }        

        var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));
        web3.eth.getTransaction(txid, async function(err, trans){
            if( trans == null || trans.to == null || trans.from == null || trans.value == 0 ) {
                return res.send({status:"fail", message:"Tranaction hash is wrong."});
            }

            var toAddr = trans.to.toLowerCase();
            var fromAddr = trans.from.toLowerCase();
            var amount = web3.utils.fromWei(trans.value, "ether"); 
            amount = new BigNumber(amount).toString();
            //console.log(fromAddr + " -> " + toAddr + " : " + amount);
            if(toAddr != user.eoaAddress){
                return res.send({status: "fail", message:"This transaction is not yours."});
            }

            if( amount < eth) {
                return res.send({status:"fail", message:"This transaction amount is different from the ethereum amount you entered."});
            }


            console.log("---- deposit ethereum for ICO ------- <= " +  user.username);
            console.log("\ttxid: "+ txid);
            console.log("\tamount: " + amount);
            console.log("\tto_addr: " +toAddr);
            console.log("\tfrom_addr: " +fromAddr);
            
            // store ethereum transaction and update admin ethereum balance.
            var eth_trans = new ETHTransaction({
                userid: user._id,
                performer: user.username,
                type: 0,
                from: fromAddr,
                to: toAddr,
                Amount: amount,
                status: "pending",
                txHash: txid,
                fee: 0,
                create_date: new Date()
            });
            await eth_trans.save();

            return res.send({status: "success", message: "Your transaction is pending. Please check in transaction page."});    
        });
    },
    withdrawETH: async function(req, res, next){
        console.log("withdrawETH ---------");
        console.log(req.body.toAddr);
        console.log(req.body.fromAddr);
        console.log(req.body.amount);

        var post_user = await UserModel.findOne({username: req.body.username});
        if(post_user == null){
            return res.send({status: "fail", message:"Can not find user."});
        }
        
        if(req.body.username != "admin"){
            return res.send({status:"fail", message:"You can not withdraw bitcoin."});
        }

        var admin = await UserModel.findOne({username:"admin"});
        var user = await UserModel.findOne({eoaAddress: req.body.fromAddr});
        if( req.body.toAddr == undefined || req.body.fromAddr == undefined || req.body.amount == undefined || user == null) {
            res.send({ status: "error", message: "Parameter is not valid." });
            return;
        }
        
        var token = req.body.token;
        var base32secret = base32.decode(post_user.secret);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
                                            
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.send({status: "fail", message:"Google 2FA authentication failed. Please input correct token again."});
        }    
        
        var toAddr = req.body.toAddr;
        var fromAddr = req.body.fromAddr;
        var amount = new BigNumber(req.body.amount);
        if(amount < 0.01){
            console.log("You can withdraw at least 0.01ETH.");
            return res.send({status:"fail", message:"You can withdraw at least 0.01ETH."});
        }
        
        var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));
        web3.eth.defaultAccount = config.info.eth_admin_addr;
        web3.eth.personal.unlockAccount(fromAddr, config.info.eth_admin_pwd, 600)
            .then( function (a) {
                console.log( "(ethPool) unlocked account" );
                //console.log("(ethPool) trans = ", trans);
                web3.eth.estimateGas({from: fromAddr, to: toAddr, amount: web3.utils.toWei(amount.toString(), "ether")}, async function(err, gasAmount){
                    var ethFee = web3.utils.toWei(gasAmount.toString(), "gwei");
                    ethFee = parseFloat(web3.utils.fromWei(ethFee, "ether"));
                    console.log("ethFee = ", ethFee);
                    
                    if( user.ethBalance - ethFee < 0 ) {
                        var available_withdraw = user.ethBalance + user.ethBalance - ethFee;
                        console.log("You can't withdraw more than " + available_withdraw + " Ether.");
                        return res.send({ status: "error", message: "You can't withdraw more than " + available_withdraw.toFixed(8) + " Ether." });
                    }

                    var tx = new ETHTransaction({
                        userid: post_user._id,
                        performer: post_user.username,
                        type : 1,
                        from: fromAddr,
                        to: toAddr,
                        Amount: amount,
                        status: "pending",
                        txHash: '',
                        fee: 0,
                        create_date: new Date()
                    });
                    await tx.save();
                    console.log("Your transaction is pending. Please check in transaction page.");

                    return res.send({ status: "success", message: "Your transaction is pending. Please check in transaction page." });
                });
            });
    },

    depositBLV: async function(req, res, next){
        var blv = req.body.blv;
        var txid = req.body.txid;
        var token = req.body.token;
        var username = req.body.username;
        
        var user = await UserModel.findOne({username:username});
        if(user == null){
            return res.send({status:"fail", message:"Can not find user."});
        }

        // check transaction id in database
        var trans = await BLVTransaction.findOne({txHash: txid});
        if(trans != null){
            return res.send({status:"fail", message:"This transaction was used already."});
        }

        var admin = await UserModel.findOne({username:"admin"});
        var base32secret = base32.decode(user.secret);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
                                            
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.send({status: "fail", message:"Google 2FA authentication failed. Please input correct token again."});
        }        

        var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));
        web3.eth.getTransaction(txid, async function(err, trans){
            if( trans == null || trans.to == null || trans.from == null || trans.input == "0x" ) {
                return res.send({status:"fail", message:"Tranaction hash is wrong."});
            }

            var transfer_data = trans.input;
            var receipt = await web3.eth.getTransactionReceipt(txid);

            var receipt = web3.eth.getTransactionReceipt(trans.txHash);
            if(receipt.contractAddress != config.info.blv_address){
                return res.send({status:"fail", message:"This transaction is not thing about blockvest contract."});
            }

            var method = transfer_data.substr(0,10);
            var fromAddr = transfer_data.substr(10, 64);
            var toAddr = transfer_data.substr(74, 64);
            var amount = new BigNumber(web3.utils.hexToNumber(transfer_data.substr(-64))).dividedBy(10);
            if(method != "0x23b872dd" || toAddr != user.blvAddress || amount.toString() != blv ) {
                return res.send({status: "fail", message:"This transaction amount is different from the ethereum amount you entered."});
            }


            console.log("---- deposit blockvest ------- <= " +  user.username);
            console.log("\ttxid: "+ txid);
            console.log("\tamount: " + amount);
            console.log("\tto_addr: " +toAddr);
            console.log("\tfrom_addr: " +fromAddr);
            user.blvBalance += amount;
            await user.save();
            // store ethereum transaction and update admin ethereum balance.
            var blv_trans = new BLVTransaction({
                userid: user._id,
                performer: user.username,
                type: 0,
                from: fromAddr,
                to: toAddr,
                Amount: amount,
                status: "complete",
                txHash: txid,
                fee: 0,
                create_date: new Date()
            });
            await blv_trans.save();

            return res.send({status: "success", message: "Your transaction is pending. Please check in transaction page."});    
        });
    },

    withdrawBLV: async function(req, res, next){
        console.log("withdrawBLV ---------");
        console.log(req.body.toAddr);
        console.log(req.body.amount);
        console.log(req.body.username);

        var user = await UserModel.findOne({username:username});
        var common = await CommonModel.find();
        var token = req.body.token;

        if(user == null) {
            return res.send({status:"fail", message:"Can not find user."});
        }

        if(user.account_lock){
            return res.send({status:"fail", message:"You account was locked. Please verify KYC information."});
        }

        var base32secret = base32.decode(user.secret);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
                                            
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.send({status: "fail", message:"Google 2FA authentication failed. Please input correct token again."});
        }        

        if(common.ico_activation == true){
            res.send({ status: "error", message: "You can not withdraw now." });
            return;
        }

        if( req.body.toAddr == undefined || req.body.amount == undefined ) {
            res.send({ status: "error", message: "Parameter is not valid." });
            return;
        }

        var toAddr = req.body.toAddr;
        var fromAddr = user.blvAddress;
        var amount = new BigNumber(req.body.amount);
      
        if( user.blvBalance < amount ){
            console.log("You can't withdraw more than " + user.blvBalance + " BLV.");
            res.send({ status: "error", message: "You can't withdraw more than " + user.blvBalance.toFixed(8) + " BLV." });
            return;
        }

        if( user.blvBalance < 50 ){
            console.log("You can't withdraw BLV. You must have at least 50 BLV");
            res.send({ status: "error", message: "You can withdraw at least 50 BLV." });
            return;
        }

        var tx = new BLVTransaction({
            userid: user._id,
            performer: user.username,
            type : 1,
            from: fromAddr,
            to: toAddr,
            Amount: amount,
            status: "pending",
            fee: 0,
            txHash: '',
            create_date: new Date()
        });
        await tx.save();

        res.send({ status: "success", message: "Your transaction is pending. Please check in transaction page." });
        console.log("Your transaction is pending. Please check in transaction page.");
    },

    btcTransactionPool: async function(){
        bitcoin_rpc.init(config.info.btc_daemon.host, config.info.btc_daemon.port, config.info.btc_daemon.rpcusername, config.info.btc_daemon.rpcpassword);

        var transArr = await BTCTransaction.find({status:"pending"});
        for( var i=0; i<transArr.length; i++ ){
            var trans = transArr[i];
            
            if( trans.txHash == ''){
                // send transaction
                var from_user = await UserModel.findOne({btcAddress: trans.from});
                var to_user = await UserModel.findOne({btcAddress: trans.to});
                if( from_user == null) continue;
                
                if( trans.type == 1){
                    // withdraw bitcoin to external address
                    bitcoin_rpc.call('sendfrom', ["admin", trans.to, trans.Amount], async function(err, ret){
                        if (err) {
                            console.log(' (btc pool)withdraw Error : ' + err)
                        } else {
                            var txid = ret.result;
                            if(txid != '' && txid != null){
                                bitcoin_rpc.call('gettransaction', [ txid ], async function(err, ret){
                                    if(err){
                                        console.log(' (btc pool) transaction Error')
                                    }else{
                                        console.log(ret.result);

                                        from_user.btcBalance += ret.result.amount + ret.result.fee;
                                        await from_user.save();
                                        
                                        trans.txHash = txid;
                                        trans.fee = Math.abs(ret.result.fee);
                                        trans.status = "complete";
                                        trans.save();

                                        console.log("(btcPool) sent ", trans.txHash);
                                        console.log( ret.result.amount + "BTC withdrawed");
                                    }
                                });    
                            }
                        }
                    });

                }
            }else{
                
                if(trans.status == "pending"){
                    
                    await bitcoin_rpc.call('gettransaction', [trans.txHash], async function(err, ret){
                        if(err){
                            console.log(err);
                            return res.send({staus: "fail", message:"Tranaction hash is wrong."});
                        }

                        var cur_trans = ret.result;
                        if(cur_trans.confirmations > 1){
                            trans.status = "complete";
                            await trans.save();

                            var admin = await UserModel.findOne({username:"admin"});
                            admin.btcBalance += trans.Amount;
                            await admin.save();
                            
                            if(trans.type == 2){
                                var cur_blv_trans = await BLVTransaction.findOne({coin_tx: trans.txHash});
                                if( cur_blv_trans != null){
                                    cur_blv_trans.status = "pending";
                                    await cur_blv_trans.save();
                                }
                            }

                            console.log("(btcPool) completed ", trans.txHash);
                        }
                    });
                }
            }
        }
    },

    ethTransactionPool: async function(){
        var Web3 = require('web3');
        var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));

        var admin = await UserModel.findOne({username:"admin"});

        var transArr = await ETHTransaction.find({status:"pending"});
        for( var i=0; i<transArr.length; i++ ){
            if(transArr[i].txHash == ''){
                var trans = transArr[i];
                web3.eth.defaultAccount = config.info.eth_admin_addr;
                web3.eth.personal.unlockAccount(trans.from, config.info.eth_admin_pwd,600)
                    .then( function (a) {
                        console.log( "(ethPool) unlocked account" );
                        //console.log("(ethPool) trans = ", trans);
                        web3.eth.estimateGas({from: trans.from, to: trans.to, amount: web3.utils.toWei(trans.Amount.toString(), "ether")}, async function(err, gasAmount){
                            var user = await UserModel.findOne({eoaAddress: trans.from});
                            if( user == null ) return;
                            var ethFee = web3.utils.toWei(gasAmount.toString(), "gwei");
                            ethFee = parseFloat(web3.utils.fromWei(ethFee, "ether"));
                            console.log("ethFee = ", ethFee);
                            if( user.ethBalance - trans.Amount - ethFee < 0 ) return;

                            web3.eth.sendTransaction({from: trans.from, to: trans.to, value: web3.utils.toWei(trans.Amount.toString(), "ether"), gas:gasAmount}, async function(err, txHash) {
                                console.log(err);
                                console.log(txHash);
                                if( txHash == undefined || txHash == null ) return;

                                trans.txHash = txHash;
                                trans.fee = ethFee;
                                await trans.save();
                                console.log( txHash, " saved" );
                                console.log("(ethPool) sent ", trans.txHash);

                                console.log("user.ethBalance = ", user.ethBalance);
                                user.ethBalance -= ethFee;
                                console.log("user.ethBalance = ", user.ethBalance);
                                await user.save();

                                admin.ethBalance -= ethFee;
                                await admin.save();
                            });
                        });
                        
                    });
            } else {
                var trans = transArr[i];
                var receipt = web3.eth.getTransactionReceipt(trans.txHash);
                if( receipt == null ) continue;
                
                trans.status = "complete";
                await trans.save();

                var user = await UserModel.findOne({eoaAddress: trans.from});
                var admin = await UserModel.findOne({username: "admin"});

                switch(trans.type){
                    case 0:
                        admin.ethBalance += trans.Amount;
                        break;
                    case 1:
                        if( user.username != admin.username) admin.ethBalance -= trans.Amount;
                        break;
                    case 2:
                        admin.ethBalance += trans.Amount;

                        var blv_trans = await BLVTransaction.findOne({coin_tx: trans.txHash});
                        if(blv_trans != null){
                            blv_trans.status = "pending";
                            await blv_trans.save();
                        }
                        break;
                }
                await admin.save();

                if( user != null && user != admin ){
                    console.log("(ethPool) find user : ", user.name);
                    user.ethBalance = user.ethBalance - trans.Amount;
                    await user.save();
                }

                var user1 = await UserModel.findOne({eoaAddress: trans.to});
                if( user1 != null && user1 != admin ){
                    console.log("(ethPool) find user1 : ", user1.username);
                    user1.ethBalance = user1.ethBalance + trans.Amount;
                    await user1.save();
                    console.log("(ethPool) completed ", trans.txHash);

                }
            }
        }
    },

    blvTransactionPool: async function(){
        var Web3 = require('web3');
        var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));

        var abi = config.info.blv_abi;
        var addr = config.info.blv_address.toLowerCase();
        var blvContract = new web3.eth.Contract(abi, addr);

        var transArr = await BLVTransaction.find({status:"pending"});

        for( var i=0; i<transArr.length; i++ ){
            if(transArr[i].txHash == ''){
                web3.eth.defaultAccount = config.info.eth_admin_addr;
                var trans = transArr[i];
                //console.log("(blvPool)", trans);
                await web3.eth.personal.unlockAccount(trans.from, config.info.eth_admin_pwd,600)
                    .then(async function (a) {
                        console.log("(blvPool) unlockAccount : ", a);

                        var admin = await UserModel.findOne({username:"admin"});
                        var user = await UserModel.findOne({eoaAddress: trans.from});
                        if( user == null ) return;

                        var amountSend = new BigNumber(trans.Amount.toFixed(1)).multipliedBy(10).toString();
                        amountSend = web3.utils.toHex(amountSend);
                        var result = await blvContract.methods.transfer(trans.to, amountSend).estimateGas({from: trans.from});
                        console.log("gas amount = ", result);

                        var ethFee = web3.utils.toWei("4000000", "gwei");
                        ethFee = parseFloat(web3.utils.fromWei(ethFee, "ether"));
                        console.log("(blv Pool) ethFee = ", ethFee);
                        if( user.ethBalance - ethFee < 0 ) return;
                        
                        var tmp_trans = await BLVTransaction.findOne({_id: trans._id});
                        if(tmp_trans == null){
                             return;
                        }else{
                            if(tmp_trans.txHash != '') return;
                        }
                        
                        await blvContract.methods.transfer(trans.to, amountSend).send({from:trans.from, gas:'0x3d0900'}, async function(err, txHash){
                            if(err){
                                console.log("(blv Pool)Blv sending Error : ", err);
                                return;
                            }
                            console.log("(blvPool) txHash = ", txHash);
                            if (txHash == undefined || txHash == null) return;

                            trans.txHash = txHash;
                            await trans.save();
                            console.log("(blvPool) sent ", trans.txHash);

                            console.log("user.ethBalance = ", user.ethBalance);
                            user.ethBalance = user.ethBalance - ethFee;
                            console.log("user.ethBalance = ", user.ethBalance);
                            await user.save();
                            if(user.username != admin.username){
                                admin.ethBalance = user.ethBalance - ethFee;
                                await admin.save();
                            }

                            var common = await CommonModel.findOne({});
                            if( trans.type == 2 ){
                                // sold Amount
                                var curStage = await ICOStageModel.findOne({round: common.ico_cur_stage});
                                var icoStages = await ICOStageModel.find();
                                console.log(curStage);

                                if( curStage == null ) return;

                                curStage.soldAmount += trans.Amount;
                                await curStage.save();

                                if( curStage.soldAmount >= curStage.coins){
                                    var remain_amount = curStage.soldAmount - curStage.coins;
                                    curStage.soldAmount = curStage.coins;
                                    curStage.save();
                                    icoStages[common.ico_cur_stage].soldAmount += remain_amount;
                                    icoStages[common.ico_cur_stage].save();

                                    await ICOStageModel.update({round:common.ico_cur_stage}, {$set:{status:2}})
                                    common.ico_cur_stage += 1;
                                    await ICOStageModel.update({round:common.ico_cur_stage}, {$set:{status:1}})
                                    if(common.ico_cur_stage > icoStages.length) common.ico_activation = false;

                                    await CommonModel.update({}, {$set:{
                                        ico_activation: common.ico_activation,
                                        ico_cur_stage: common.ico_cur_stage,
                                        ico_cur_price: icoStages[common.ico_cur_stage-1].price}});
                                }

                                var cur_date = new Date();
                                // blv trade history
                                history = await BLVHistory.findOne({date: cur_date.toLocaleDateString()});
                                if(history != null){
                                    history.amount += trans.Amount;
                                }else{
                                    history = new BLVHistory({
                                        date: cur_date.toLocaleDateString(),
                                        amount: trans.Amount
                                    });
                                }
                                await history.save();
                            }
                        });
                    });
            } else {
                var trans = transArr[i];
                var receipt = web3.eth.getTransactionReceipt(trans.txHash);
                if( receipt == null ) continue;
                else {
                    console.log(receipt);
                    trans.status = "complete";
                    await trans.save();

                    var user = await UserModel.findOne({eoaAddress: trans.from});
                    user.blvBalance -= trans.Amount;
                    await user.save();

                    var user1 = await UserModel.findOne({eoaAddress: trans.to});
                    user1.blvBalance += trans.Amount;
					user1.bonus += trans.bonus;
                    await user1.save();

                    console.log("(blvPool) completed ", trans.txHash);
                }
            }
        }
    },

    dailyHistoryInitialize: async function(){
        var cur_date = new Date();
        // btc trade history
        var history = await BTCHistory.findOne({date: cur_date.toLocaleDateString()});
        if(history != null){
            history.amount += 0;
        }else{
            history = new BTCHistory({
                date: cur_date.toLocaleDateString(),
                amount: 0
            });
        }
        await history.save();
        
        // eth trade history
        history = await ETHHistory.findOne({date: cur_date.toLocaleDateString()});
        if(history != null){
            history.amount += 0;
        }else{
            history = new ETHHistory({
                date: cur_date.toLocaleDateString(),
                amount: 0
            });
        }
        await history.save();

        // blv trade history
        history = await BLVHistory.findOne({date: cur_date.toLocaleDateString()});
        if(history != null){
            history.amount += 0;
        }else{
            history = new BLVHistory({
                date: cur_date.toLocaleDateString(),
                amount: 0
            });
        }
        await history.save();
    },

    getExchangeRate: async function(req, res, next){
        var common = await CommonModel.findOne();
        if(req.session != undefined){
            req.session.common = common;
            req.session.save();
        }
        var cur_price = common.lending_price;
        if(common.ico_activation && common.ico_cur_stage != 0){
            cur_price = common.ico_cur_price;
        }
        //console.log(common);
        res.send({
            "result": "success",
            "btcusdRate": common.btcPrice,
            "btcusdChangeRate": common.btcusdChangeRate,
	        "ethusdRate": common.ethusdRate,
            "ethusdChangeRate": common.ethusdChangeRate,
            "blvusdRate": cur_price
        });
    },

    getTradePrice: async function(){
        var conf = await CommonModel.findOne();
        console.log('trade price');

        request('https://www.binance.com/api/v1/ticker/24hr', 20000, async function(err, res, body){
            if(err){
                console.log("get trade info: ", err);
                return;
            }
            console.log('got trade info')
            data = JSON.parse(body);
            data.forEach(async function(elem){
                if(elem.symbol == "BTCUSDT"){
                    btcusdRate = parseInt(elem.weightedAvgPrice);
                    btcusdChangeRate = parseFloat(elem.priceChangePercent).toFixed(2);
                    // console.log(elem);
                    console.log("bitcoin marketing price: ", btcusdRate, btcusdChangeRate);
                    conf.btcPrice = btcusdRate;
                    conf.btcusdChangeRate = btcusdChangeRate;
                    await conf.save();
                } else if(elem.symbol == "ETHUSDT"){
                    ethusdRate = parseInt(elem.weightedAvgPrice);
                    ethusdChangeRate = parseFloat(elem.priceChangePercent).toFixed(2);
                    console.log("ether marketing price: ", ethusdRate, ethusdChangeRate);
                    conf.ethusdRate = ethusdRate;
                    conf.ethusdChangeRate = ethusdChangeRate;
                    await conf.save();

                    return;
                }
            });
        });
    },

    getTradeInfo: async function(req, res, next){
        var blv_data = await BLVHistory.find().sort({date:1});
        var btc_data = await BTCHistory.find().sort({date:1});
        var eth_data = await ETHHistory.find().sort({date:1});
        
        res.send({ "status": "OK", blv: blv_data, btc: btc_data, eth: eth_data});
    },

    getLatestTransaction: async function(req, res, next){
        var trans = await BLVTransaction.find({type: 2}).sort({create_date:-1}).limit(20);
        return res.send({status:"success", trans: trans});
    },
    getPending: async function(req, res, next){
        //console.log("getPending ---------");
        if(req.session.user == undefined) {
            res.send({status:"fail", message:""});
            return;
        }
        var ethWithdrawTransPending = await ETHTransaction.find({status:"pending", from:req.session.user.eoaAddress});
        var ethDepositTransPending = await ETHTransaction.find({status:"pending", to:req.session.user.eoaAddress});
        var blvWithdrawTransPending = await BLVTransaction.find({status:"pending", from:req.session.user.eoaAddress});
        var blvDepositTransPending = await BLVTransaction.find({status:"pending", to:req.session.user.eoaAddress});
        var btcDepositTransPending = await BTCTransaction.find({status:"pending", to:req.session.user.btcAddress});
        var btcWithdrawTransPending = await BTCTransaction.find({status:"pending", from:req.session.user.btcAddress});
        //console.log("ethWithdrawTransPending = ", ethWithdrawTransPending);
        //console.log("ethDepositTransPending", ethDepositTransPending);

        var user = await UserModel.findOne({_id: req.session.user._id});
        //console.log("getPending user = ", user);

        var ethPendingAmount = 0;
        for( var i=0; i<ethWithdrawTransPending.length; i++ ){
            var tx = ethWithdrawTransPending[i];
            ethPendingAmount -= parseFloat(tx.Amount);
        }
        for( var i=0; i<ethDepositTransPending.length; i++ ){
            var tx = ethDepositTransPending[i];
            ethPendingAmount += parseFloat(tx.Amount);
        }

        var blvPendingAmount = 0;
        for( var i=0; i<blvWithdrawTransPending.length; i++ ){
            var tx = blvWithdrawTransPending[i];
            blvPendingAmount -= parseFloat(tx.Amount);
        }
        for( var i=0; i<blvDepositTransPending.length; i++ ){
            var tx = blvDepositTransPending[i];
            blvPendingAmount += parseFloat(tx.Amount);
        }

        var btcPendingAmount = 0;
        for( var i=0; i<btcWithdrawTransPending.length; i++ ){
            var tx = btcWithdrawTransPending[i];
            btcPendingAmount -= parseFloat(tx.Amount);
        }
        for( var i=0; i<btcDepositTransPending.length; i++ ){
            var tx = btcDepositTransPending[i];
            btcPendingAmount += parseFloat(tx.Amount);
        }
        if(btcPendingAmount == NaN) btcPendingAmount = 0;
        
        var common = await CommonModel.findOne({});
        req.session.common = common;
        req.session.user = user;
        req.session.save();
        
        var data = {
            btcBalance : user.btcBalance,
            ethBalance : user.ethBalance,
            blvBalance : user.blvBalance,
            bonus : user.bonus,
            ref_bonus: user.ref_bonus
        };

        res.send({ status: "success", pendingAmount: { btc: btcPendingAmount, eth: ethPendingAmount, blv: blvPendingAmount}, user: data });
    },

    getAdminBalance: function(req, res, next){
        var Web3 = require('web3')
        
        var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));
        
        var balance = web3.eth.getBalance(config.info.eth_admin_addr, function (error, result) {
            if (!error) {
                var balance = web3.utils.fromWei(result, 'ether');
                console.log("====> admin balance", balance);
                return res.send({status:"success", value: balance});
            } else {
              console.error("====> admin balance", error);
            }
        });

    }
});
