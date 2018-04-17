var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var CountrySchema   = new Schema({
	capital: String,
    citizenship: String,
    country_code: String,
    currency: String,
    currency_code: String,
    currency_sub_unit: String,
    currency_symbol: String,
    full_name: String,
    iso_3166_2: String,
    iso_3166_3: String,
    name: String,
    region_code: String,
    sub_region_code: String,
    eea: Number,
    calling_code: Number,
    flag: String
});

module.exports = mongoose.model('country', CountrySchema);
