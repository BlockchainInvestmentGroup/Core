var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var BLVTransactionSchema   = new Schema({
	userid: String,
	performer: String,
	type: Number,   // 0: desposit, 1: withdraw, 2: ico, 3: affiliate
	from: String,   // sender blockvest address
	to: String,		// receiver blockvest address
	Amount: Number,	// blv amount
	status: String,
	txHash: String,
	fee: Number,
	icoType: String,		// coin type for ico( btc, eth)
	icoAmount: Number,		// coin amount for ico,   //  purchased amount in the affiliate transaction
	coin_price: Number,		// coin price to purchase blv
	price: Number,			// blv price
	bonus: Number,
	coin_tx: String, 	// transaction id of bitcoin or ethereum for ICO 
	create_date: Date
});

module.exports = mongoose.model('blvtransaction', BLVTransactionSchema);
