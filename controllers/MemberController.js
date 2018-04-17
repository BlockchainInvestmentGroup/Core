var async = require('async');
var mongoose = require('mongoose');
var crypto = require('crypto');

var BaseController = require('./BaseController');
var View = require('../views/base');

var UserModel = require('../models/Users');
var CountryListModel = require('../models/country');
var BLVTransaction = require('../models/blvtransaction');

var config = require('../config/index')();
var d = new Date();
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var QRCode = require('qrcode');

module.exports = BaseController.extend({
    name: 'MemberController',
    profile: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        if( role ){
            var user = await UserModel.findOne({username:req.session.user.username});
            req.session.user = user;
            req.session.save();
            var countries = await CountryListModel.find({}).sort({name: 1});
            
            var v = new View(res, 'userinfo/profile');
            v.render({
                title: 'User Profile',
                userinfo: req.session.user,
                countries: countries,
                error: req.flash("error"),
                success: req.flash("success"),
                config: config.info,  
                role: role
            });
        }
    },

    modify_profile: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        if( role ){
            var username = req.body.username;
            var password = crypto.createHash('md5').update(req.body.old_password).digest("hex");
            var new_password = req.body.new_password;
            var confirm_password = req.body.confirm_password;
            
            var countries = await CountryListModel.find({}).sort({name: 1});
    
            var user = await UserModel.findOne({username: username});
            if(password != user.password){
                req.flash('error', 'Please input password correctly.');

                var v = new View(res, 'userinfo/profile');
                return v.render({
                    title: 'User Profile',
                    userinfo: req.session.user,
                    countries: countries,
                    error: req.flash("error"),
                    success: req.flash("success"),
                    config: config.info,  
                    role: role
                });
            }

            if(new_password != ""){
                user.password = crypto.createHash('md5').update(new_password).digest("hex");
                if(new_password != confirm_password){
                    req.flash('error', 'Mismatch new password and confirm password.');

                    var v = new View(res, 'userinfo/profile');
                    return v.render({
                        title: 'User Profile',
                        userinfo: req.session.user,
                        countries: countries,
                        error: req.flash("error"),
                        success: req.flash("success"),
                        config: config.info,  
                        role: role
                    });
                }
            }
            
            user.first_name = req.body.first_name;
            user.last_name = req.body.last_name;
            user.email = req.body.email;
            user.street = req.body.street;
            user.city = req.body.city;
            user.state = req.body.state;
            user.residence = req.body.residence
            user.citizenship = req.body.citizenship;
            user.post_code = req.body.post_code;

            await user.save();

            req.session.user = user;
            req.session.save();

            res.redirect('/profile');
        }
    },

    affiliate: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        
        if( role ){
            var user = req.session.user;
            var trans = await BLVTransaction.find({$and:[{userid: user._id},{type:3}]});

            var v = new View(res, 'userinfo/affiliate');
            v.render({
                title: 'Affiliate Page',
                userinfo: req.session.user,
                error: req.flash("error"),
                success: req.flash("success"),
                config: config.info,  
                trans: trans,
                role: role
            });
        }
    },

    memberlist: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        if(role){
            var user = req.session.user;
            var users = [];
            switch(role){
                case "SuperAdmin":
                    users = await UserModel.find({$and:[{username: {$ne: "admin"}}]}).sort({create_date: -1});
                    break;
                case "Adminitrator":
                    users = await UserModel.find({$and:[{username: {$ne: "admin"}}, {account_type: 0}]}).sort({create_date: -1});
                    break;
                case "customer":
                    break;
            }

            var v = new View(res, 'userinfo/memberlist');
            v.render({
                title: 'Members',
                userinfo: req.session.user,
                users: users,
                error: req.flash("error"),
                success: req.flash("success"),
                config: config.info,  
                role: role
            });
        }
    },

    setAccountType: async function(req, res, next){
        var userid = req.body.userid;
        var type = req.body.type;

        var user = await UserModel.findOne({_id: userid});
        if(user == null){
            res.send({status:"fail", message: "Can not find user."});
        }

        user.account_type = parseInt(type);
        await user.save();

        return res.send({status:"success", message: "Setting successfully."});
    },

    setAccountActivate: async function(req, res, next){
        var userid = req.body.userid;
        var status = req.body.status;

        var user = await UserModel.findOne({_id: userid});
        if(user == null){
            res.send({status:"fail", message: "Can not find user."});
        }

        user.active = status;
        await user.save();

        return res.send({status:"success", message: "Setting successfully."});
    },

    setAccountLock: async function( req, res, next){
        var userid = req.body.userid;
        var status = req.body.status;

        var user = await UserModel.findOne({_id: userid});
        if(user == null){
            res.send({status:"fail", message: "Can not find user."});
        }

        user.account_lock = status;
        await user.save();

        return res.send({status:"success", message: "Setting successfully."});
    },
    uploadImage:  function(req, res, next){
        var role = this.checkLogin(req, res, next);
        if(role){

            if (!req.files){
                console.log('No files were uploaded.');
                return res.redirect('/profile');
            }

            // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
            let upload_file = req.files.file;
            console.log(upload_file);

            var fn = upload_file.name;
            var ext = fn.substr(fn.lastIndexOf('.') + 1).toLowerCase();
            if(ext != "png" && ext != "jpg" && ext != "bmp"){
                req.flash('error', 'Should be uploaded image file(*.jpg, *.png, *.bmp');
                return res.redirect('/profile');
            }

            var dest_fn = req.session.user.username + "_" + fn.substr(0, fn.lastIndexOf('.'));
            dest_fn = crypto.createHash('md5').update(dest_fn).digest("hex") + "." + ext;
            console.log(dest_fn);

            // Use the mv() method to place the file somewhere on your server
            upload_file.mv('public/uploads/'+  dest_fn , async function(err) {
                if (err){
                    return res.redirect('/profile');
                }
                    

                var user = await UserModel.findOne({username: req.session.user.username});
                if(user == null) {
                    req.flash('error', 'User image uploading failed.');
                    return res.redirect('/profile');
                }

                user.photo = "uploads/" + dest_fn;
                await user.save();

                req.session.user = user;
                req.session.save();
                
                req.flash('success', 'User image uploading succeed.');
                res.redirect('/profile');
            });
        }
    },

    upload_any:  function(req, res, next){
        var role = this.checkLogin(req, res, next);
        if(role){

            if (!req.files){
                console.log('No files were uploaded.');
                return res.redirect('/upload_any');
            }

            // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
            let upload_file = req.files.file;
            console.log(upload_file);

            // Use the mv() method to place the file somewhere on your server
            upload_file.mv('public/uploads/'+ req.session.user.username + "_" + upload_file.name , async function(err) {
                if (err){
                    // return res.status(500).send(err);
                    return res.redirect('/upload_any');
                }
                    

                var user = await UserModel.findOne({username: req.session.user.username});
                if(user == null) {
                    req.flash('error', 'User image uploading failed.');
                    return res.redirect('/upload_any');
                }

                user.info = "uploads/" + req.session.user.username + "_" + upload_file.name;
                await user.save();

                req.session.user = user;
                req.session.save();
                
                // res.send({status:"OK", filename: "uploads/" + req.session.user.username + "_" + upload_file.name });
                req.flash('success', 'User image uploading succeed.');
                res.redirect('/upload_any');
            });
        }
    },

    cnt: 0,
    treeNodes: async function(req, res, next){
        var role = this.checkLogin(req, res, next);
        if(role){
            users = await UserModel.find({$and:[{active:true}, {username:{$ne: "admin"}}]});
            if(role == "customer"){
                return res.send({status:"OK", role:role, username:req.session.user.username, data: users});
            }else{
                return res.send({status:"OK", role:role, username:"", data: users});
            }
        }
    },


});
