var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ETHHistorySchema   = new Schema({
	date: String,
	amount: Number
});

module.exports = mongoose.model('ethhistory', ETHHistorySchema);
