var mongoose = require('mongoose');
var config = require('./config.json');

var mongouri = "mongodb://";

if (config.db.auth.user) {
    mongouri += config.db.auth.user + ":" + config.db.auth.pass + "@";
}

mongouri += config.db.host + ":" config.db.port + "/" + config.db.dbname;

var db = false;

module.exports.db = function() {
    if (!db) db = mongoose.connect(mongouri);
    return db;
}
