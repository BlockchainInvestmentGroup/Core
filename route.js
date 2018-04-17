var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

var auth_controller = require('./controllers/AuthController');
var home_controller = require('./controllers/HomeController');   
var dashboard_controller = require('./controllers/DashboardController');   
var transaction_controller = require('./controllers/TransactionController');   
var member_controller = require('./controllers/MemberController');   
var wallet_controller = require('./controllers/WalletController');   
var setting_controller = require('./controllers/SettingController');   
var ico_controller = require('./controllers/ICOController');   

var d = new Date();
//------ home routing
router.get('/', function(req, res, next){
    wallet_controller.dailyHistoryInitialize();
    home_controller.run(req, res, next);
});
router.get('/ref/:name', function(req, res, next){
    home_controller.reference(req, res, next);
});

//------ home routing

router.get('/dashboard', function(req, res, next){
    dashboard_controller.run(req, res, next);
 });

//----- wallet controller -----------------
router.post('/depositBLV', function(req, res, next){
    wallet_controller.blvDeposit(req, res, next);
 });

 router.post('/withdrawBLV', function(req, res, next){
    wallet_controller.withdrawBLV(req, res, next);
 });

 router.post('/depositBTC', function(req, res, next){
    wallet_controller.depositBTC(req, res, next);
 });

 router.post('/withdrawBTC', function(req, res, next){
    wallet_controller.withdrawBTC(req, res, next);
 });

 router.post('/depositETH', function(req, res, next){
    wallet_controller.depositETH(req, res, next);
 });

 router.post('/withdrawETH', function(req, res, next){
    wallet_controller.withdrawETH(req, res, next);
 });

 router.post('/ethereumICOfromTxID', function(req, res, next){
    wallet_controller.ethereumICOfromTxID(req, res, next);
 });

 router.post('/bitcoinICOfromTxID', function(req, res, next){
    wallet_controller.bitcoinICOfromTxID(req, res, next);
 });

 router.post('/getPending', function(req, res, next){
    wallet_controller.getPending(req, res, next);
 });

 //----  transaction controller ------------
 router.get('/btctransaction', function(req, res, next){
    transaction_controller.btctransaction(req, res, next);
 });

 router.get('/ethtransaction', function(req, res, next){
    transaction_controller.ethtransaction(req, res, next);
 });

 router.get('/blvtransaction', function(req, res, next){
    transaction_controller.blvtransaction(req, res, next);
 });

 router.get('/blockvest', function(req, res, next){
    wallet_controller.blockvest(req, res, next);
 });

 router.get('/exchange', function(req, res, next){
    wallet_controller.exchange(req, res, next);
 });

 router.get('/get_trade_price', function(req, res, next){
    wallet_controller.getTradePrice(req, res, next);
 });

 router.post('/getTradeInfo', function(req, res, next){
    wallet_controller.getTradeInfo(req, res, next);
 });

 router.post('/getLatestTransaction', function(req, res, next){
    wallet_controller.getLatestTransaction(req, res, next);
 });

 router.post('/get_exchange_rate', function(req, res, next){
    wallet_controller.getExchangeRate(req, res, next);
 });


 router.get('/icosetting', function(req, res, next){
    ico_controller.run(req, res, next);
 });

 router.post('/icostart', function(req, res, next){
    ico_controller.setActivation(req, res, next);
 });

 router.post('/icosetting', function(req, res, next){
    ico_controller.saveICO(req, res, next);
 });

 router.get('/security', function(req, res, next){
    setting_controller.run(req, res, next);
 });

 router.get('/affiliate_bonus', function(req, res, next){
    setting_controller.affiliate_bonus(req, res, next);
 });

 router.post('/affiliate_bonus', function(req, res, next){
    setting_controller.modify_affiliate_bonus(req, res, next);
 });
//------ user management routing ----------

router.get('/profile', function(req, res, next){
    member_controller.profile(req, res, next);
 });

 router.post('/profile', function(req, res, next){
    member_controller.modify_profile(req, res, next);
 });

 router.get('/affiliate', function(req, res, next){
    member_controller.affiliate(req, res, next);
 });

 router.get('/memberlist', function(req, res, next){
    member_controller.memberlist(req, res, next);
 });

 router.post('/setAccountType', function(req, res, next){
    member_controller.setAccountType(req, res, next);
 });

 router.post('/setActivate', function(req, res, next){
    member_controller.setAccountActivate(req, res, next);
 });

 router.post('/setAccountLock', function(req, res, next){
    member_controller.setAccountLock(req, res, next);
 });

 router.post('/treeNodes', function(req, res, next){
    member_controller.treeNodes(req, res, next);
 });


//----- authentication routing 
router.get('/login', function(req, res, next){
    auth_controller.run(req, res, next);
 });

router.post('/login', function(req, res, next){
    auth_controller.postLogin(req, res, next);
 });

router.get('/verify_2fa', function(req, res, next){
    auth_controller.verify_2FA(req, res, next);
 });

 router.post('/setting_2fa', function(req, res, next){
    setting_controller.setting_2fa(req, res, next);
 });
 
router.post('/verify_2fa', function(req, res, next){
    auth_controller.postVerify_2FA(req, res, next);
 });

router.get('/logout', function(req, res, next){
    auth_controller.logout(req, res, next);
 });

router.get('/reset_password', function(req, res, next){
    auth_controller.show_reset_password(req, res, next);
 });

router.post('/reset_password', function(req, res, next){
    auth_controller.reset_password(req, res, next);
 });

router.get('/register', function(req, res, next){
    auth_controller.showRegister(req, res, next);
 });

router.get('/confirm_account', function(req, res, next){
    auth_controller.confirmAccount(req, res, next);
 });

 router.post('/register', function(req, res, next){
    auth_controller.createUser(req, res, next);
 });

 router.get('/confirm_email', function(req, res, next){
    auth_controller.confirm_email(req, res, next);
 });

//----- authentication routing 

router.post('/getAvailableGasAmount', function(req, res, next){
    wallet_controller.getAdminBalance(req, res, next);
 });

router.post('/upload_img', function(req, res, next){
    member_controller.uploadImage(req, res, next);
 });

// ----- All route
router.get('*', function(req, res, next){
    res.redirect('/dashboard');
})

//export this router to use in our index.js
module.exports = router;