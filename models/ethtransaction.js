var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ETHTransactionSchema   = new Schema({
	userid: String,
	performer: String,
	type: Number,   // 0: desposit, 1: withdraw
	from: String,   // sender bitcoin address
	to: String,		// receiver bitcoin address
	Amount: Number,
	fee: Number,
	status: String,
	txHash: String,
	create_date: Date
});

module.exports = mongoose.model('ethtransaction', ETHTransactionSchema);
