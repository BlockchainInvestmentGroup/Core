var async = require('async');
var mongoose = require('mongoose');
var BaseController = require('./BaseController');
var View = require('../views/base');

var UserModel = require('../models/Users');
var CountryModel = require('../models/country');
var ICOStageModel = require('../models/icostage');
var CommonModel = require('../models/common');
var AffiliateBonusModel = require('../models/affiliatebonus');

var config = require('../config/index')();
var db = require('../models/db')

module.exports = BaseController.extend({
    name: 'HomeController',
    run: async function(req, res, next){
        this.config();


        var ref_name = req.query.raf;
        if(ref_name != undefined && ref_name != ""){
            req.session.sponsor = ref_name;
            req.session.save();
            return res.redirect('/register');
        }
        else  return res.redirect('/login');

        var v = new View(res, 'home');
        v.render({
            title: 'Home page',
            config: config.info,  
        })
    },

    reference: function(req, res, next){
        var ref_name = req.params.name;
        req.session.sponsor = ref_name;
        req.session.save();
        console.log(' storing sponsor name to session.....: ' + ref_name);

        res.redirect('/');
    }, 
    config: async function(req, res, next){
        // if admin no, add admin record
        var admin = await UserModel.findOne({username:"admin"});
        if(admin == null){
            console.log("no admin");
            var admin = db.users[0];
            admin.btcAddress = config.info.btc_daemon.btc_admin_addr;
            admin.create_date = new Date();
            // console.log(admin);
            UserModel.collection.insert(admin);
            console.log("add admin");
        }

        var countries = await CountryModel.find({});
        if(countries.length == 0){
            CountryModel.collection.insert(db.coutries);
            console.log("add countries");
        }

        // create ico setting information automatically
        var ico_stages = await ICOStageModel.find();
        if(ico_stages.length == 0){
            ICOStageModel.collection.insert(db.icostages);
            console.log('standard ico stages added');
        }

        var common_data = await CommonModel.find();
        if(common_data.length == 0){
            CommonModel.collection.insert(db.common_data);
            console.log('standard common data added.');
        }

        var affiliate_bonus = await AffiliateBonusModel.find();
        if(affiliate_bonus.length == 0){
            AffiliateBonusModel.collection.insert(db.affiliate_bonus);
            console.log('standard affiliate bonus added');
        }
    }
});
