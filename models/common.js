var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var CommonSchema   = new Schema({
	ico_activation: Boolean,				
	ico_cur_stage: Number,
	ico_cur_price: Number,
	ico_start_date: Date,
	ico_start_time: String,
	ico_end_time: String,

	lending_price: Number,

	btcPrice: Number,
	btcusdChangeRate: Number,
	ethusdRate: Number,
	ethusdChangeRate: Number
});

module.exports = mongoose.model('common', CommonSchema);
