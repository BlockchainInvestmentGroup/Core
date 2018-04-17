var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var IcoStageSchema   = new Schema({
	round: Number,
	coins: Number,
	price: Number,
	days: Number,
	bonus: Number,
	status: Number,
	startDate: Date,
	endDate: Date,
	soldAmount: Number
});

module.exports = mongoose.model('icostage', IcoStageSchema);
