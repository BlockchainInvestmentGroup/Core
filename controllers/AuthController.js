var async = require('async');
var mongoose = require('mongoose');
var crypto = require('crypto');

var bitcoin_rpc = require('node-bitcoin-rpc');
var Web3 = require('web3');
var request = require('request');

var speakeasy = require("speakeasy");
var base32 = require('hi-base32');
var geoip = require('geoip-lite');
var postalCodes = require('postal-codes-js');

var BaseController = require('./BaseController');
var View = require('../views/base');

var UserModel = require('../models/Users');
var CountryListModel = require('../models/country');
var ICOStageModel = require('../models/icostage');

var db = require('../models/db')
var config = require('../config/index')();

var d = new Date();

var Sendgrid = require('sendgrid')(config.mail.api_key);

module.exports = BaseController.extend({
    name: 'AuthController',
    // show login from
    run: async function(req, res, next){
        // create admin account automatically
        var admin = await UserModel.findOne({username:"admin"});
        if(admin == null){
            console.log("no admin");
            UserModel.collection.insert(db.users);
            console.log("add admin");
        }
                
        if(req.session.login != 1){ 
            var v = new View(res, 'auth/login');
            v.render({
                title: 'Please Login',
                error: req.flash("error"),
                success: req.flash("success"),
                site_key: config.security.google_captcha_site_key,
                config: config.info  
            });
        }else{
            res.redirect('/dashboard');
        }
    },
    // check login
    postLogin: async function(req, res, next){
        var username = req.body.username;
        var password = req.body.password;
        
         
         // g-recaptcha-response is the key that browser will generate upon form submit.
         // if its blank or null means user has not selected the captcha, so return the error.
         if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
            console.log('google captcha verification failed');

			var v = new View(res, 'auth/login');
			return v.render({
				title: 'Please Login',
				username: username,
				error: req.flash("error"),
				success: req.flash("success"),
				site_key: config.security.google_captcha_site_key,
				config: config.info  
			});
         }
         
         // Put your secret key here.
         var secretKey = config.security.google_captcha_secret_key;
         // req.connection.remoteAddress will provide IP address of connected user.
         var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
         request(verificationUrl, async function(error,response,body) {
             body = JSON.parse(body);
             console.log(JSON.stringify(body));
             // Success will be true or false depending upon captcha validation.
             if(body.success !== undefined && !body.success) {
                    console.log('google captcha verification failed');

					var v = new View(res, 'auth/login');
					return v.render({
						title: 'Please Login',
						username: username,
						error: req.flash("error"),
						success: req.flash("success"),
						site_key: config.security.google_captcha_site_key,
						config: config.info  
					});
             }
            
             console.log('[' + d.toLocaleString() + '] ' + 'Google captcha verification successed');
             // verification success 
             // res.json({"responseCode" : 0,"responseDesc" : "Sucess"});
           
            var user = await UserModel.findOne( {username : username});
            if(user == null){
                console.log( '[' + d.toLocaleString() + '] ' + 'Can not find user');
                req.flash('error', 'This user does not exist.');

                var v = new View(res, 'auth/login');
                v.render({
                    title: 'Please Login',
                    username: username,
                    error: req.flash("error"),
                    success: req.flash("success"),
                    site_key: config.security.google_captcha_site_key,
                    config: config.info  
                });
            }else{
                if(user.active == false){
                    console.log('This user is disabled.');
                    req.flash('error', 'This user is disabled.');

                    v = new View(res, 'auth/login');
                    return v.render({
                        title: 'Please Login',
                        username: username,
                        error: req.flash("error"),
                        success: req.flash("success"),
                        site_key: config.security.google_captcha_site_key,
                        config: config.info  
                    });
                }

                if(user.password != crypto.createHash('md5').update(password).digest("hex")){
                    console.log( '[' + d.toLocaleString() + '] ' + 'password is wrong');
                    req.flash('error', 'password is wrong.');
                    
                    v = new View(res, 'auth/login');
                    v.render({
                        title: 'Please Login',
                        username: username,
                        error: req.flash("error"),
                        success: req.flash("success"),
                        site_key: config.security.google_captcha_site_key,
                        config: config.info  
                    });
                }else{
                    if(user.ref_id == undefined || user.ref_id == ""){
                        user.ref_id = "ref" + Math.floor(Math.random() * 10000000);
                    }
                    user.last_login_date = new Date();
                    await user.save();

                    req.session.icoStage = await ICOStageModel.find({});
                    req.session.username = username;
                    req.session.user = user;
                    req.session.site_url = config.info.site_url;
                    req.session.save();
                    console.log('[' + d.toLocaleString() + '] ===== ' + user.username + "  log in =====");

                    if(user.secret == ""){
                        req.session.login = 1;
                        await req.session.save();                        
                        return res.redirect('/dashboard');
                    }else{
                        return res.redirect('/verify_2fa');
                    }
                }
            }
        });
    },
    verify_2FA: function(req, res, next){
        // Use the qrcode package
        v = new View(res, 'auth/auth2fa');
        v.render({
            title: 'Google Authentication',
            error: req.flash("error"),
            success: req.flash("success"),
            config: config.info  
        });
    },
    // verify google 2FA token authentication
    postVerify_2FA: function(req, res, next){
        console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication start');
        // Let's say we stored the user's temporary secret in a user object like above:
        // (This is specific to your implementation)
        var user = req.session.user;
        if(user == undefined || user == null) return res.redirect('/login');
        
        var base32secret = base32.decode(user.secret);
        var token = req.body.token;
        
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({  secret: base32secret,
                                                encoding: 'base32',
                                                token: token });
        if(!verified){
            console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication failed.');
            return res.redirect('/verify_2fa');
        }        

        console.log(verified);
        console.log('[' + d.toLocaleString() + '] ' + 'Google 2FA authentication end');

        req.session.login = 1;
        req.session.save();

        console.log( '[' + d.toLocaleString() + '] ' + req.session.username + ' logged in.');
        res.redirect('/play');
    },
    // logout
    logout: function(req, res, next){
        req.session.username = "";
        req.session.user = null;
        req.session.login = 0;
        req.session.save();
        console.log('----> log out');

        res.redirect('/login');
    },

    show_reset_password: function(req, res, next){
        var v = new View(res, 'auth/reset-password');
        v.render({
            error: req.flash("error"),
            success: req.flash("success"),
            title: 'Reset password'
        });
    },
    // reset password
    reset_password: async function(req, res, next){
        var email = req.body.email;
        var user = await UserModel.findOne({email:email});
        if(user == null){
            req.flash('error', 'Can not find your email.');
            
            var v = new View(res, 'auth/reset-password');
            v.render({
                email: email,
                error: req.flash("error"),
                success: req.flash("success"),
                title: 'Reset password'
            });
        }else{
            // sending email
            var mailcontents = '<h1>The password has been reset.</h1>';
            mailcontents += '<p> username: ' + user.username + '</p>';
            mailcontents += '<p> password: ' + 'password';
            
            const sgReq = Sendgrid.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: {
                    personalizations: [{
                        to: [{ email: email }],
                        subject: 'Your Blockvestico password was reset'
                    }],
                    from: { email: config.mail.sender},
                    content: [{
                        type: 'text/html',
                        value: mailcontents
                    }]
                }
              });
            
            Sendgrid.API(sgReq, async function(err, response){
                if (err) {
                    console.log(err);
                    req.flash('error', 'Sending email is failed.');
                    
                    var v = new View(res, 'auth/reset-password');
                    v.render({
                        email: email,
                        error: req.flash("error"),
                        success: req.flash("success"),
                        title: 'Reset password'
                    });
                }else{
                    // Render the index route on success
                    console.log("Message sent: ", response);
                    
                    req.flash('success', 'The password has been reset. Please check your email.');

                    user.password = crypto.createHash('md5').update("password").digest("hex");
                    await user.save();

                    res.redirect('/confirm_email?email=' + email);
                }
            });
        }
    },
    // show register form
    showRegister: async function(req, res, next){
        var sponsor = "";
        if(req.session.sponsor){
            sponsor = req.session.sponsor;
        }
        console.log(sponsor);

        var valid = postalCodes.validate('AS', 'aEC1A 1BB');
        console.log(valid);

        if(req.session.login != 1){
            var countries = await CountryListModel.find({}).sort({name: 1});

            var ip;
            if (req.headers['x-forwarded-for']) {
                ip = req.headers['x-forwarded-for'].split(",")[0];
            } else if (req.connection && req.connection.remoteAddress) {
                ip = req.connection.remoteAddress;
            } else {
                ip = req.ip;
            }
            console.log("client IP is *********************" + ip);

            var geo = geoip.lookup(ip);
            console.log(geo);

            var citizenship = "";
            if(geo != null){
                var cur_country = await CountryListModel.findOne({iso_3166_2: geo.country});
                if(cur_country != null){
                    citizenship = cur_country.name;
                }
            }
            console.log(citizenship);

            var v = new View(res, 'auth/register');
            v.render({
                title: 'Please Create account',
                sponsor : sponsor,
                countries: countries,
                citizenship: citizenship,
                error: req.flash("error"),
                success: req.flash("success"),
                config: config.info  
            });
        }else{
            res.redirect('/dashboard');
        }
    },
    // create new account
    createUser: async function(req, res, next){
        var username = req.body.username;
        var sponsor = req.body.sponsor;
        var email = req.body.email;
        var password = crypto.createHash('md5').update(req.body.password).digest("hex");
        var confirm_password = req.body.confirm_password;
        var first_name = req.body.first_name;
        var last_name = req.body.last_name;

        var street = req.body.street;
        var city = req.body.city;
        var state = req.body.state;
        var post_code = req.body.post_code;

        var residence = req.body.residence;
        var citizenship = req.body.citizenship;

        console.log( '[' + d.toLocaleString() + '] Create Account');
        console.log( '[' + d.toLocaleString() + '] ' + JSON.stringify(req.body));

        var user = await UserModel.findOne( {email:email});
        var countries = await CountryListModel.find({});

        if(user != null){
            console.log( '[' + d.toLocaleString() + '] ' + 'This mail was registered already.');
            req.flash('error', 'This mail was registered already.');

            var v = new View(res, 'auth/register');
            v.render({
                title: 'Create account',
                countries: countries,
                username: username,
                sponsor: sponsor,
                email: email,
                first_name: first_name,
                last_name: last_name,
                street: street,
                city: city,
                state: state,
                post_code: post_code,
                residence: residence,
                citizenship: citizenship,
                error: req.flash("error"),
                success: req.flash("success"),
                config: config.info  
            });
        }else{
            if(citizenship == "China"){
                req.flash('error', 'China citizens can not register.');

                var v = new View(res, 'auth/register');
                return v.render({
                    title: 'Create account',
                    countries: countries,
                    username: username,
                    sponsor: sponsor,
                    email: email,
                    first_name: first_name,
                    last_name: last_name,
                    street: street,
                    city: city,
                    state: state,
                    post_code: post_code,
                    residence: residence,
                    citizenship: citizenship,
                    error: req.flash("error"),
                    success: req.flash("success"),
                    config: config.info  
                });
            }

            var country = await CountryListModel.findOne({name: citizenship});
            var country_code = country.iso_3166_2;
            if(country.post_code != 1){
                var valid_postal_code = false;

                if(post_code == ""){
                    valid_postal_code = true;
                }else{
                    

                    valid_postal_code = postalCodes.validate(country_code, post_code);
                    console.log(valid_postal_code);
                }

                if(valid_postal_code != true){
                    req.flash('error', 'Postal code is wrong.');
    
                    var v = new View(res, 'auth/register');
                    return v.render({
                        title: 'Create account',
                        countries: countries,
                        username: username,
                        sponsor: sponsor,
                        email: email,
                        first_name: first_name,
                        last_name: last_name,
                        street: street,
                        city: city,
                        state: state,
                        post_code: post_code,
                        residence: residence,
                        citizenship: citizenship,
                        error: req.flash("error"),
                        success: req.flash("success"),
                        config: config.info  
                    });
                }
            }else{
                post_code = "";
            }
            
            if(req.body.password != confirm_password){
                console.log( '[' + d.toLocaleString() + '] ' + 'Paasword and confirm password do not match.');
                req.flash('error', 'Paasword and confirm password do not match.');

                var v = new View(res, 'auth/register');
                return v.render({
                    title: 'Create account',
                    countries: countries,
                    username: username,
                    sponsor: sponsor,
                    email: email,
                    first_name: first_name,
                    last_name: last_name,
                    street: street,
                    city: city,
                    state: state,
                    post_code: post_code,
                    residence: residence,
                    info: req.body.info,
                    citizenship: citizenship,
                    error: req.flash("error"),
                    success: req.flash("success"),
                    config: config.info  
                });
            }

            var user = await UserModel.findOne( {username:username});
            if(user != null){
                console.log( '[' + d.toLocaleString() + '] ' + 'This username exists');
                req.flash('error', 'This username exists.');

                var v = new View(res, 'auth/register');
                v.render({
                    title: 'Create account',
                    countries: countries,
                    sponsor: sponsor,
                    email: email,
                    first_name: first_name,
                    last_name: last_name,
                    street: street,
                    city: city,
                    state: state,
                    post_code: post_code,
                    residence: residence,
                    citizenship: citizenship,
                    error: req.flash("error"),
                    success: req.flash("success"),
                    config: config.info  
                });
            }else{
                sponsor_user = await UserModel.findOne({ref_id:sponsor});
                // create new bitcoin address by using bitcoind rpc
                bitcoin_rpc.init(config.info.btc_daemon.host, config.info.btc_daemon.port, config.info.btc_daemon.rpcusername, config.info.btc_daemon.rpcpassword);
                bitcoin_rpc.setTimeout(1000);

                bitcoin_rpc.call('getnewaddress', ["admin"], function (err, ret) {
                    if (err) {
                        console.log('bitcoin address generation error: ' + err + ' ' + ret.error);

                        var v = new View(res, 'auth/register');
                        return v.render({
                            title: 'Create account',
                            countries: countries,
                            sponsor: sponsor,
                            email: email,
                            first_name: first_name,
                            last_name: last_name,
                            street: street,
                            city: city,
                            state: state,
                            post_code: post_code,
                            residence: residence,
                            citizenship: citizenship,
                            error: req.flash("error"),
                            success: req.flash("success"),
                            config: config.info  
                        });
                    } else {
                        var btcAddress = ret.result;
                        console.log('bitcoin address: ' + btcAddress);

                        // create new account for ETH wallet on blockchain
                        var web3 = new Web3(new Web3.providers.HttpProvider(config.info.eth_daemon_url));
                        var eoaPassword = config.info.eth_admin_pwd;
                        console.log("eoaPassword = ", eoaPassword);
                        
                        web3.eth.personal.newAccount(eoaPassword)
                        .then( function(eoaAddr){
                            // if success to create blockchain account
                            console.log("success create address", eoaAddr);

                            var token =  Math.floor(Math.random() * 10000);
                            // if success to create blockchain account
                            var model = new UserModel({
                                username: username,
                                email: email,
                                secret: '',
                                password: password,
                            
                                sponsor: '',
                                ref_id: "ref" + Math.floor(Math.random() * 10000000),
                                level: 0,
                                childCount: 0,
                            
                                account_type: 0, // 0: normal account, 1: Administrator, 2: SuperAdmin
                                active: false, 
                                account_lock: true,

                                first_name: first_name,
                                last_name: last_name,

                                street: street,
                                city: city,
                                state: state,
                                post_code: post_code,

                                residence: residence,
                                citizenship: citizenship,
                            
                                eoaAddress: eoaAddr.toLowerCase(),
                                eoaPassword: eoaPassword,
                                ethBalance: 0.00000000,
                                btcAddress: btcAddress,
                                btcBalance: 0.00000000,
                                blvAddress: eoaAddr.toLowerCase(),
                                blvPassword: eoaPassword,
                                blvBalance: 0,
                                bonus: 0,
                                ref_bonus: 0,
                                usdBalance: 0.00,
                            
                                referral_earned: 0,
                                daily_earned: 0,
                                total_earned: 0,
                                btc_interested_cash: 0,
                                interest_pay_date: '',

                                last_login_date: '',
                                create_date: new Date(),
                                token: token
                            });

                            if(sponsor_user != null){
                                model.sponsor = sponsor;
                                model.level = sponsor_user.level + 1;
                            }
                            model.save( async function(err, data){
                                if(err){
                                    console.log( '[' + d.toLocaleString() + '] ' + err);
                                    req.flash('error', err);

                                    var v = new View(res, 'auth/register');
                                    v.render({
                                        title: 'Create account',
                                        countries: countries,
                                        sponsor: sponsor,
                                        email: email,
                                        first_name: first_name,
                                        last_name: last_name,
                                        street: street,
                                        city: city,
                                        state: state,
                                        post_code: post_code,
                                        residence: residence,
                                        citizenship: citizenship,
                                        error: req.flash("error"),
                                        success: req.flash("success"),
                                        config: config.info  
                                    });
                                }else{
                                    console.log("create user", data);
                                    console.log( '[' + d.toLocaleString() + '] ' +'Registered successfully');

                                    var mailcontents = '<h1>Welcome your account registration.</h1>';
                                    mailcontents += '<p>If you use email verification, you can access to your account soon. Please Click ';
                                    mailcontents += '<a href="' + config.info.site_url +  '/confirm_account?email='+ email + '&token='+ token + '">here</a>.</p>';
                                    
                                    const sgReq = Sendgrid.emptyRequest({
                                        method: 'POST',
                                        path: '/v3/mail/send',
                                        body: {
                                            personalizations: [{
                                                to: [{ email: email }],
                                                subject: 'Welcome!'
                                            }],
                                            from: { email: config.mail.sender},
                                            content: [{
                                                type: 'text/html',
                                                value: mailcontents
                                            }]
                                        }
                                      });
                                    
                                    Sendgrid.API(sgReq, async function(err,response){
                                        if (err) {
                                            console.log(err);
                                            req.flash('error', 'Sending email is failed.');
                                            
                                            var v = new View(res, 'auth/register');
                                            v.render({
                                                title: 'Create account',
                                                countries: countries,
                                                sponsor: sponsor,
                                                email: email,
                                                first_name: first_name,
                                                last_name: last_name,
                                                street: street,
                                                city: city,
                                                state: state,
                                                post_code: post_code,
                                                residence: residence,
                                                citizenship: citizenship,
                                                error: req.flash("error"),
                                                success: req.flash("success"),
                                                config: config.info  
                                            });
                                        }else{
                                            // Render the index route on success
                                            console.log("Message sent: ", response);
                                            req.flash('success', 'Registered successfully.Please your email.');
                                            res.redirect('/confirm_email?email=' + email);
                                        }
                                    });
                                }
                            });
                        });
                    }
                });

            }
        }
    }, 
    
    confirm_email: function(req, res, next){
        var v = new View(res, 'auth/confirm-mail');
        v.render({
            title: 'Please Confirm your email',
            email: req.query.email
        });        
    },
    confirmAccount: async function(req, res, next){
        var email = req.query.email;
        var token = req.query.token;
        console.log(email);
        console.log(token);

        var user = await UserModel.findOne({email: email});
        var admin = await UserModel.findOne({username:"admin"});
        if( user == null){
            return res.redirect('/home');
        }else{
            if(token == user.token){
                user.active = true;
                user.token = '';
                await user.save();

                admin.childCount++;
                await admin.save();

                if(user.sponsor == "") return res.redirect('/login');

                // while(user.sponsor != ""){
                    var sponsor = await UserModel.findOne({username: user.sponsor});
                    // if(sponsor == null) break;
    
                    if(sponsor != null){
                        sponsor.childCount++;
                        await sponsor.save();
                    }

                    user = sponsor;
                // }

                return res.redirect('/login');
            }
        }
    } 
});

