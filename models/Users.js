var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
	username: String,
	email: String,
	secret: String,
	password: String,

	sponsor: String,
	ref_id: String,
	level: Number,
	childCount: Number,

	first_name: String,
	last_name: String,
	photo: String,
	info: String,
	
	street: String,
	city: String,
	state: String,
	post_code: String,

	residence: String,
	citizenship: String,

	eoaAddress: String,
	eoaPassword: String,
	ethBalance: Number,
	btcAddress: String,
	btcBalance: Number,
	blvAddress: String,
	blvPassword: String,
	blvBalance: Number,
	bonus: Number,
	ref_bonus: Number,
	usdBalance: Number,

	referral_earned: Number,
	daily_earned: Number,
	total_earned: Number,
	btc_interested_cash: Number,
	interest_pay_date: Date,
	last_login_date: Date,
	
	create_date: Date,
	account_type: Number,	// 0: normal account, 1: Administrator, 2: SuperAdmin
	active: Boolean,
	account_lock: Boolean,
	token: String
});

module.exports = mongoose.model('users', UserSchema);
