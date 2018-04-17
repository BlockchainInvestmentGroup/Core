var async = require('async');
var mongoose = require('mongoose');
var crypto = require('crypto');
var BaseController = require('./BaseController');
var View = require('../views/base');

var UserModel = require('../models/Users');
var AffiliateBonusModel = require('../models/affiliatebonus');

var config = require('../config/index')();
var db = require('../models/db')
var speakeasy = require("speakeasy");
var base32 = require('hi-base32');

var d = new Date();

module.exports = BaseController.extend({
    name: 'SettingController',

    run: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            if(req.session.user.secret == ""){
                // generate google 2FA authenticator secret key 
                var answer = speakeasy.generate_key({
                    name: 'blockvestico.io (' + req.session.user.email + ")",
                    google_auth_qr: true
                });
            
                var secret = new Buffer(answer.base32, 'ascii');
                var secret_key = secret;
                console.log("secret key: " + secret);
                if (Buffer.isBuffer(secret)) secret = base32.encode(secret);

                var QRCode = require('qrcode');
                // Get the data URL of the authenticator URL
                QRCode.toDataURL(answer.otpauth_url, function(err, data_url) {

                    var v = new View(res, 'settings/index');
                    v.render({
                        title: 'Security',
                        userinfo: req.session.user,
                        data_url: data_url,
                        data_secret: secret,
                        secret_key: secret_key,
                        error: req.flash('error'),
                        success: req.flash('succcess'),
                        config: config.info, 
                        role: role
                    });
                });

            }else{
                var v = new View(res, 'settings/index');
                v.render({
                    title: 'Security',
                    userinfo: req.session.user,
                    error: req.flash('error'),
                    success: req.flash('succcess'),
                    config: config.info,  
                    role: role
                });
            }
        }
    },

    verify_2fa: function(req){
        console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication start');
        // Let's say we stored the user's temporary secret in a user object like above:
        // (This is specific to your implementation)
        var user = req.session.user;
        var base32secret = base32.decode(user.secret);
        if(user.secret == "") {
            base32secret = base32.decode(req.body.secret);
        }

        var token = req.body.token;
        console.log(token);
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
        
        return verified;
    },

    setting_2fa: function(req, res, next){
        var role = this.checkLogin(req, res, next);

        if( role){
            verified = this.verify_2fa(req);
            console.log(verified);

            if(!verified){
                console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
                req.flash('error', 'Google 2FA authentication failed.');
                
                var v = new View(res, 'settings/index');
                if(req.session.user.secret == ""){
                    v.render({
                        title: 'Security',
                        userinfo: req.session.user,
                        data_url: req.body.data_url,
                        data_secret: req.body.secret,
                        secret_key: req.body.secret_key,
                        error: req.flash('error'),
                        success: req.flash('succcess'),
                        config: config.info,  
                        role: role
                    });
                }else{
                    v.render({
                        title: 'Security',
                        userinfo: req.session.user,
                        error: req.flash('error'),
                        success: req.flash('succcess'),
                        config: config.info,  
                        role: role
                    });
                }
            }else{
                if(req.session.user.secret == ""){
                    this.enable_2fa(req, res, next);
                }else{
                    this.disable_2fa(req, res, next);
                }
            }        
        }
    },

    enable_2fa: async function(req, res, next){
        var role = this.checkLogin(req, res, next);

        if( role){
            console.log('[' + d.toLocaleString() + '] ' + 'Enable Google 2FA authentication');

            var user = await UserModel.findOne({email : req.session.user.email});
            user.secret = req.body.secret;
            user.save(function(err){
                if( err ){
                    console.log(err);
                    
                    var v = new View(res, 'settings/index');
                    v.render({
                        title: 'Security',
                        userinfo: req.session.user,
                        data_url: req.body.data_url,
                        data_secret: req.body.secret,
                        secret_key: req.body.secret_key,
                        error: req.flash('error'),
                        success: req.flash('succcess'),
                        config: config.info,  
                        role: role
                    });
                } else {
                    req.session.user.secret = req.body.secret;
                    console.log("success");

                    var v = new View(res, 'settings/index');
                    v.render({
                        title: 'Security',
                        userinfo: req.session.user,
                        error: req.flash('error'),
                        success: req.flash('succcess'),
                        config: config.info,  
                        role: role
                    });
                }
            });
        }
    },

    disable_2fa: function(req, res, next){
        var role = this.checkLogin(req, res, next);

        if( role){
            console.log('[' + d.toLocaleString() + '] ' + 'Disable Google 2FA authentication');

            UserModel.findOne({email : req.session.user.email}, function(err,user){
                user.secret = "";
                user.save(function(err){
                    if( err ){
                        console.log(err);

                        var v = new View(res, 'settings/index');
                        v.render({
                            title: 'Security',
                            userinfo: req.session.user,
                            error: req.flash('error'),
                            success: req.flash('succcess'),
                            config: config.info,  
                            common: req.session.common,
                            role: role
                        });
                    } else {
                        req.session.user.secret = "";
                        console.log("success");
                        res.redirect('/profile');
                    }
                })
            });
        }
    },

    affiliate_bonus: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        if(role){
            var affiliate_bonus = await AffiliateBonusModel.find();

            var v = new View(res, 'settings/affiliate_bonus_setting');
            v.render({
                title: 'Affiliate Setting Page',
                userinfo: req.session.user,
                bonus: affiliate_bonus,
                config: config.info,  
                common: req.session.common,
                role: role
            });
        }
    },

    modify_affiliate_bonus: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        if(role){
            var affiliate_bonus = await AffiliateBonusModel.find();
            
            if(req.body.level1 != "") {
                affiliate_bonus[0].bonus = parseFloat(req.body.level1);
                await affiliate_bonus[0].save();
            }

            if(req.body.level2 != "") {
                affiliate_bonus[1].bonus = parseFloat(req.body.level2);
                await affiliate_bonus[1].save();
            }

            if(req.body.level3 != "") {
                affiliate_bonus[2].bonus = parseFloat(req.body.level3);
                await affiliate_bonus[2].save();
            }

            if(req.body.level4 != "") {
                affiliate_bonus[3].bonus = parseFloat(req.body.level4);
                await affiliate_bonus[3].save();
            }

            if(req.body.level5 != "") {
                affiliate_bonus[4].bonus = parseFloat(req.body.level5);
                await affiliate_bonus[4].save();
            }

            if(req.body.level6 != "") {
                affiliate_bonus[5].bonus = parseFloat(req.body.level6);
                await affiliate_bonus[5].save();
            }

            res.redirect('/affiliate_bonus');
        }
    }

});

