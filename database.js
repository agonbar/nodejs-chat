var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('./config.json');

var mongouri = "mongodb://";

if (config.db.auth.user) {
    mongouri += config.db.auth.user + ":" + config.db.auth.pass + "@";
}

mongouri += config.db.host + ":" + config.db.port + "/" + config.db.dbname;

var db = mongoose.connect(mongouri);

var UserSchema = new Schema({
    nick: { type: String, required: true, unique: true },
    lastLogin: Date,
    flirts: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    lastGPS: {
        n: Number,
        w: Number
    }
});

mongoose.model('User', UserSchema);

var MessageSchema = new Schema({
    nick: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    content: { type: String, required: true },
    date: Date
});

mongoose.model('Message', MessageSchema);
var Message = mongoose.model('Message');

var ChatSchema = new Schema({
    name: { type: String, required: true, unique: true },
    users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}],
    createdDate: Date
});

mongoose.model('Chat', ChatSchema);

/* Callback an user object if exist or false if not */
module.exports.getUser = function(user, cb) {
    var User = mongoose.model('User');

    User.findOne({ "nick": user }, function(err, user) {
        if (err) cb(err, false);
        else {
            if (user) {
                user.lastLogin = Date.now();
                user.save();
                cb(null, user);
            }
            else {
                cb(null, null)
            }
        }
    });
}

module.exports.createUser = function(user, cb) {
    var User = mongoose.model('User');

    User.create({
        nick: user,
        lastLogin: Date.now()
    },
    function(err, user) {
        cb(err, user);
    });
}

/* Callback an chatroom object if exist or false if not */
module.exports.getChat = function(name, cb) {
    var User = mongoose.model('User');

    User.findOne({ "name": name }, function(err, chat) {
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
    var User = mongoose.model('User');
    var Chat = mongoose.model('Chat');

    var useroneobj = module.exports.getUser(userone);
    var usertwoobj = module.exports.getUser(usertwo);

    User.findOne({ "nick": userone, "flirts": usertwoobj }, function(err, user) {
        if (err) cb(err);
        else
        {
            User.findOne({ "nick": usertwo, "flirts": useroneobj }, function(err, user) {
                if (err) cb(err);
                else
                {
                    var chat = new Chat({
                        name: userone + "#" + usertwo,
                        users: [useroneobj, usertwoobj],
                        messages: [],
                        createdDate: Date.now()
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
