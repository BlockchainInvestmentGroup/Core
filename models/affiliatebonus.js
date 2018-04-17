var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var AffiliatebonusSchema   = new Schema({
	level: Number,
	bonus: Number
});

module.exports = mongoose.model('affiliatebonus', AffiliatebonusSchema);
