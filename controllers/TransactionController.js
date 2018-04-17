var async = require('async');
var mongoose = require('mongoose');
var BaseController = require('./BaseController');
var View = require('../views/base');

var UserModel = require('../models/Users');
var BTCTransactionModel = require('../models/btctransaction');
var ETHTransactionModel = require('../models/ethtransaction');
var BLVTransactionModel = require('../models/blvtransaction');

var config = require('../config/index')();
var d = new Date();
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var QRCode = require('qrcode');

module.exports = BaseController.extend({
    name: 'TransactionController',
    btctransaction: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            var user = req.session.user;
            var receive_trans = [];
            var send_trans = [];

            switch(role){
                case "SuperAdmin":
                case "Administrator":
                    receive_trans = await BTCTransactionModel.find({$or:[{type: 0}, {type: 2}]}).sort({create_date:-1});
                    send_trans = await BTCTransactionModel.find({type:1}).sort({create_date:-1});
                    break;
                case "customer":
                    receive_trans = await BTCTransactionModel.find({to: user.eoaAddress}).sort({create_date:-1});
                    send_trans = await BTCTransactionModel.find({from: user.eoaAddress}).sort({create_date:-1});
                    break;

            }

            var v = new View(res, 'transaction/btctransaction');
            v.render({
                title: 'Bitcoin transaction',
                userinfo: req.session.user,
                send_trans: send_trans,
                receive_trans: receive_trans,
                config: config.info,  
                role: role
            });
        }
    },

    ethtransaction: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            var user = req.session.user;
            var receive_trans = [];
            var send_trans = [];

            switch(role){
                case "SuperAdmin":
                case "Administrator":
                    receive_trans = await ETHTransactionModel.find({$or:[{type: 0}, {type: 2}]}).sort({create_date:-1});
                    send_trans = await ETHTransactionModel.find({type:1}).sort({create_date:-1});
                    break;
                case "customer":
                    receive_trans = await ETHTransactionModel.find({to: user.eoaAddress}).sort({create_date:-1});
                    send_trans = await ETHTransactionModel.find({from: user.eoaAddress}).sort({create_date:-1});
                    break;

            }

            var v = new View(res, 'transaction/ethtransaction');
            v.render({
                title: 'Ethereum transaction',
                userinfo: req.session.user,
                send_trans: send_trans,
                receive_trans: receive_trans,
                config: config.info,  
                role: role
            });
        }
    },

    blvtransaction: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            var user = req.session.user;
            var trans = [];

            switch(role){
                case "SuperAdmin":
                case "Administrator":
                    trans = await BLVTransactionModel.find({}).sort({create_date:-1});
                    break;
                case "customer":
                    trans = await BLVTransactionModel.find({$or:[{from:user.eoaAddress}, {to:user.eoaAddress}]}).sort({create_date:-1});
                    
                    break;

            }

            var v = new View(res, 'transaction/blvtransaction');
            v.render({
                title: 'Blockvest transaction',
                userinfo: req.session.user,
                trans: trans,
                config: config.info,  
                role: role
            });
        }
    },

});
