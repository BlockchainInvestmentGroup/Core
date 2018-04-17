var async = require('async');
var mongoose = require('mongoose');
var BaseController = require('./BaseController');
var View = require('../views/base');

var UserModel = require('../models/Users');
var ICOStageModel = require('../models/icostage');
var CommonModel = require('../models/common');

var config = require('../config/index')();
var d = new Date();
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var QRCode = require('qrcode');

module.exports = BaseController.extend({
    name: 'ICOController',
    run: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            var user = req.session.user;
            var common = await CommonModel.findOne({});
            var icostage = await ICOStageModel.find({});

            var v = new View(res, 'settings/icosetting');
            v.render({
                title: 'ICO Settings',
                userinfo: req.session.user,
                stages: icostage,
                common: common,
                config: config.info,  
                role: role
            });
        }
    },
    saveICO: async function(req, res, next){
        var  stages = JSON.parse(req.body.data);

        console.log("-----remove ico stages");
        var ret = await ICOStageModel.remove();        
        // console.log(ret);
        console.log("----- add new ico stages");
        ret = await ICOStageModel.collection.insert(stages);
        // console.log(ret);
        
        if(ret.result.ok == 1){
            req.session.icoStage = stages;
            req.session.save();
            res.send({"result": "success"});
        }else
            res.send({"result" : "fail"});
    },
    setActivation: async function(req, res, next){
        console.log(req.session.icoStage);
        if(req.body.ico_activation == "1"){
            var icoStage = await ICOStageModel.find({});
            req.session.icoStage = icoStage;
            req.session.save();

            if(icoStage.length == 0) {
                return res.send({status:"fail", message:"There is no ICO stages."});
            }

            var today = new Date();

            
            var cur_stage = 0, cur_price = 0;
            // console.log(today);

            for(var i = 0; i < icoStage.length; i++){
                var ico_date = new Date(icoStage[i].startDate);
                if( i > 0){
                    var tmp_date = new Date(icoStage[i-1].startDate);
                    tmp_date = tmp_date.setDate(tmp_date.getDate() + icoStage[i-1].days-1);
					console.log(ico_date);
					console.log(new Date(tmp_date));
                    if( tmp_date > ico_date){
                        return res.send({status:"fail", message:"Setting information is wrong."});                        
                    }
                }    

                await ICOStageModel.updateOne({round:i+1}, {$set: { status: 0}});
                if(today >= ico_date){
                    cur_stage = i + 1;
                    cur_price = icoStage[i].price;
                    await ICOStageModel.updateOne({round:cur_stage}, {$set: {status: 1}});

                    if( i > 0){
                        await ICOStageModel.updateOne({round:i}, {$set: {status: 2}});
                    }
                }
                
                ico_date.setDate(ico_date.getDate() + icoStage[i].days);
                if( today >= ico_date){
                    await ICOStageModel.updateOne({round:cur_stage}, {$set: {status: 2}});
                    cur_stage += 1;
                }
            }

            if(today >= ico_date){
                req.body.ico_activation = false;
                await ICOStageModel.updateOne({round:cur_stage}, {$set: {status: 2}});
                cur_stage += 1;
            }
            
            await CommonModel.updateOne({}, {$set:{
                ico_cur_stage: cur_stage, 
                ico_activation: req.body.ico_activation,
                ico_cur_price: cur_price
            }});
        }else{
            await CommonModel.update({}, {$set:{ico_activation: req.body.ico_activation}});
        }
       
        return res.send({status:"OK"});
    },
    convertTo24Hour: function(time) {
        var hours = parseInt(time.substr(0, 2));
        if(time.indexOf('am') != -1 && hours == 12) {
            time = time.replace('12', '0');
        }
        if(time.indexOf('pm')  != -1 && hours < 12) {
            time = time.replace(hours, (hours + 12));
        }
        return time.replace(/(am|pm)/, '');
    },
    // function for ico processing 
    processICOStage: async function(){
        var icoStage = await ICOStageModel.find({});
        var common = await CommonModel.findOne({});
        if(icoStage.length == 0 || common.ico_activation == false) {
            return;
        }

        var today = new Date();
        
        var cur_stage = 0, cur_price = 0;
        // console.log(today);

        for(var i = 0; i < icoStage.length; i++){
            var ico_date = new Date(icoStage[i].startDate);

            await ICOStageModel.updateOne({round:i+1}, {$set: { status: 0}});
            if(today >= ico_date){
                cur_stage = i + 1;
                cur_price = icoStage[i].price;
                await ICOStageModel.updateOne({round:cur_stage}, {$set: {status: 1}});

                if( i > 0){
                    await ICOStageModel.updateOne({round:i}, {$set: {status: 2}});
                }
            }
            
            ico_date.setDate(ico_date.getDate() + icoStage[i].days);
            if( today >= ico_date){
                await ICOStageModel.updateOne({round:cur_stage}, {$set: {status: 2}});
                cur_stage += 1;
            }
        }

        if(today >= ico_date){
            req.body.ico_activation = false;
            await ICOStageModel.updateOne({round:cur_stage}, {$set: {status: 2}});
            cur_stage += 1;
        }
        
        await CommonModel.updateOne({}, {$set:{
            ico_cur_stage: cur_stage, 
            ico_activation: req.body.ico_activation,
            ico_cur_price: cur_price
        }});
    }
});
