var mongoose = require('mongoose');
var config = require('./config.json');

var mongouri = "mongodb://";

if (config.db.auth.user) {
    mongouri += config.db.auth.user + ":" + config.db.auth.pass + "@";
}

mongouri += config.db.host + ":" config.db.port + "/" + config.db.dbname;

var db = mongoose.connect(mongouri);

var UserSchema = new Schema({
    nick: String,
    lastLogin: Date,
    flirts: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    lastGPS: {
        n: Number,
        w: Number
    }
});

var User = mongoose.model('User', UserSchema);

var MessageSchema = new Schema({
    nick: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    content: String,
    date: Date
});

var Message = mongoose.model('Message', MessageSchema);

var ChatSchema = new Schema({
    name: String,
    users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}],
    createdDate: Date
});

var Chat = mongoose.model('Chat', ChatSchema);

/* Callback an user object if exist or false if not */
module.exports.getUser = function(user, cb) {
    User.findone({ "nick": user }, function(err, user) {
        if (err) cb(err, false);
        else cb(null, user);
    });
}

/* Callback an chatroom object if exist or false if not */
module.exports.getChat = function(name, cb) {
    User.findone({ "name": name }, function(err, chat) {
        if (err) cb(err, false);
        else cb(null, chat);
    });
}

/* Callback an private chatroom between two users if exist or false if not */
module.exports.getPrivateChat = function(userone, usertwo, cb) {
    module.exports.getChat(userone + "#" + usertwo, function(err, room) {
        if (err || !room)
        {
            module.exports.getChat(usertwo + "#" + userone, function(err, room) {
                if (err || !room) cb(err, false),
                cb(false, room);
            });
        }
        else cb(false, room);
    })
}

/* Create a private chat if the two users flirt between him. The name of the chatroom is user_one#user_two.
   The callback return the room object or false */
var createPrivateChat = function(userone, usertwo, cb) {
    useroneobj = module.exports.getUser(userone);
    usertwoobj = module.exports.getUser(usertwo);

    User.findone({ "nick": userone, "flirts": usertwoobj }, function(err, user) {
        if (err) cb(err);
        else
        {
            User.findone({ "nick": usertwo, "flirts": useroneobj }, function(err, user) {
                if (err) cb(err);
                else
                {
                    var chat = new Chat({
                        name: userone + "#" + usertwo,
                        users: [useroneobj, usertwoobj],
                        messages: [],
                        createdDate: new Date()
                    });

                    chat.save(function(err, chat) {
                        if (err) cb(err);
                        else cb(false, chat);
                    })
                }
            });
        }
    });
}

/* Flirt a user by the side of other user. If the two user flirt between him, a new chatroom is created.
  The callback return the chatroom or false */
module.exports.setFlirt = function(flirter, toflirt, cb) {
    flirterobj = module.exports.getUser(flirter);
    toflirtobj = module.exports.getUser(toflirt);

    if (flirterobj) cb("Flirter not found", false);
    else if (toflirtobj) cb("User to flirt not found", false);
    else {
        toflirtobj.flirts.push(flirterobj);
        toflirtobj.save();

        createPrivateChat(flirter, toflirt, function(err, chat) {
            if (err) cb(false, false);
            else cb(false, chat);
        });
    }
}
