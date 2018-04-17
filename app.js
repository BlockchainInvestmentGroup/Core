
/**
 * Module dependencies.
 */
var express = require('express');
var flash = require('connect-flash');
var http = require('http');
var path = require('path');
var session = require('express-session');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var schedule = require('node-schedule');

var fileUpload = require('express-fileupload');

var app = express();
var route = require('./route.js');
var config = require('./config')();
var d = new Date();

var wallet_controller = require('./controllers/WalletController');
var ico_controller = require('./controllers/ICOController');

// all environments
// app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret:"OzhclfxGp956SMjtq", 
    resave: true,
    saveUninitialized: true
}));
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request
// use connect-flash for flash messages stored in session
app.use(flash());
app.use(fileUpload());

//trading price updating job
var trading_price_schedule = schedule.scheduleJob("*/10 * * * *", function(){ 
    wallet_controller.getTradePrice();
    console.log("trading price updating job");
});

// ico progress schedule
var ico_progress_schedule = schedule.scheduleJob("0 */2 * * *", function(){ // daily
    ico_controller.processICOStage();
    console.log("ICO status checking job");
});


// btc transaction monitoring pool
var btc_transaction_schedule = schedule.scheduleJob("*/1 * * * *", function(){
    wallet_controller.btcTransactionPool();
    console.log("btc_transaction_schedule");
});

// eth transaction monitoring pool
var eth_transaction_schedule = schedule.scheduleJob("*/1 * * * *", function(){ 
    wallet_controller.ethTransactionPool();
    console.log("eth_transaction_schedule");
});

// blv transaction monitoring pool
var blv_transaction_schedule = schedule.scheduleJob("*/1 * * * *", function(){ 
    wallet_controller.blvTransactionPool();
    console.log("blv_transaction_schedule");
});

// history initialization
var init_history_schedule = schedule.scheduleJob("0 */2 * * *", function(){ 
    wallet_controller.dailyHistoryInitialize();
    console.log("history initialization schedule");
});

mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/blockvest', function(err, db) {
	if(err) {
		console.log( '[' + d.toLocaleString() + '] ' +'Sorry, there is no mongo db server running.');
	} else {
		var attachDB = function(req, res, next) {
			req.db = db;
            next();
        };
        
        app.use('/', attachDB, route);

        http.createServer(app).listen(config.port, function(){
            console.log( '[' + d.toLocaleString() + '] ' +'Express server listening on port ' + config.port);
        });
    }
});
  