var mongoose = require('mongoose');
var config = require('./config.json');

var mongouri = "mongodb://";

if (config.db.auth.user) {
    mongouri += config.db.auth.user + ":" + config.db.auth.pass + "@";
}

mongouri += config.db.host + ":" config.db.port + "/" + config.db.dbname;

var db = false;

module.exports.connection = function() {
    if (!db) db = mongoose.connect(mongouri);
    return db;
}

var UserSchema = new Schema({
    nick: String,
    lastLogin: Date,
    flirts: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    lastGPS: {
        n: Number,
        w: Number
    }
});

var MessageSchema = new Schema({
    nick: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    content: String,
    date: Date
});

var ChatSchema = new Schema({
    name: String,
    users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}],
    createdDate: Date
});
