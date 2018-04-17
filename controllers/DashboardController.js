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
    name: 'DashboardController',
    run: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            var user = req.session.user;
            var common = await CommonModel.findOne({});
            var icostage = await ICOStageModel.find({});
            
            var total_tokens = 0;
            var cur_tokens = 0;
            var cur_price = common.lending_price;
            var total_days = 0;
            var cur_days = 0;
            var cur_percentage = 0;
            
            var cur_end_date = "";
            if(common.ico_activation){
                if(common.ico_cur_stage != 0) cur_price = common.ico_cur_price;

                if(common.ico_cur_stage == 0){
                    cur_end_date = new Date(icostage[0].startDate);
                }else{
                    var today = new Date();
                    var start_date = new Date(icostage[common.ico_cur_stage-1].startDate);
                    var end_date = new Date(icostage[common.ico_cur_stage-1].startDate);
                    end_date.setDate(end_date.getDate() + icostage[common.ico_cur_stage-1].days-1);
                    
                    if( today < start_date){
                        cur_end_date = start_date;
                    }else{
                        cur_end_date = end_date;
                        //cur_tokens = icostage[common.ico_cur_stage-1].coins;
                    }
                }
                cur_end_date.setDate(cur_end_date.getDate() + 1);
                cur_end_date.setHours(cur_end_date.getHours() + 12);

                for( var i = 0; i < icostage.length; i++){
                    total_tokens += icostage[i].soldAmount;
                    cur_tokens += icostage[i].soldAmount;
                    total_days += icostage[i].days;

                    if(i < common.ico_cur_stage - 1){
                        cur_days += icostage[i].days;
                    }else if( i == common.ico_cur_stage - 1){
                        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
                        var firstDate = new Date();
                        var secondDate = icostage[i].startDate;
                        if(firstDate > secondDate)
                            cur_days += Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
                    }
                }

                var admin = await UserModel.findOne({username:"admin"});
                total_tokens += admin.blvBalance;
                //cur_percentage = cur_days*100/total_days;
                cur_percentage = cur_tokens*100/total_tokens;
            }

            var v = new View(res, 'dashboard/index');
            v.render({
                title: 'Dashboard',
                userinfo: req.session.user,
                stages: icostage,
                total_tokens: total_tokens,
                cur_tokens: cur_tokens,
                cur_price: cur_price,
                cur_end_time: cur_end_date,
                total_days: total_days,
                cur_percentage: cur_percentage.toFixed(0),
                common: common,
                config: config.info,  
                role: role
            });
        }
    },

});
