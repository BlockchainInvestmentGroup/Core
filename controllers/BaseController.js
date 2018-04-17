var _ = require("underscore");

module.exports = {
	name: "BaseController",

	extend: function(child) {
		return _.extend({}, this, child);
	},
	run: function(req, res, next) {

	},
	checkLogin: function(req, res, next) {
		if(!(req.session.login || req.session.user)){
            res.redirect('/login');
        }else{
			if( req.session.username == "admin" ) return "SuperAdmin";
			else if(req.session.user.type == 1) return "Administrator";
			else return "customer";
        }
	},
}