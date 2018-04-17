var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var BTCHistorySchema   = new Schema({
	date: String,
	amount: Number
});

module.exports = mongoose.model('btchistory', BTCHistorySchema);
