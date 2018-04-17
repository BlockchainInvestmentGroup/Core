var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var BLVHistorySchema   = new Schema({
	date: String,
	amount: Number
});

module.exports = mongoose.model('blvhistory', BLVHistorySchema);
