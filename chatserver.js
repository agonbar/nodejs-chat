var WebSocketServer = require('ws').Server;
var ApiClient = require('./apiclient.js');
var Db = require('./database.js');

function ChatServer(port) {
    this.port = port;

    var wsserver = new WebSocketServer({
        host: '0.0.0.0',
        port: this.port
    });

    var oncallbacks = {
        "listen": []
    };

    var users_login = {};
    var room_sockets = {};

    var formatMsgObj = function(msgobj) {
        return {
            user: msgobj.nick.nick,
            content: msgobj.content,
            date: new Date(msgobj.date)
        }
    }

    // Loguea un usuario en el chat
    var loginUser = function(user, client, cb) {
        if (user && user.nick)
        {
            // Registramos el usuario
            users_login[user.nick] = user;
            users_login[user.nick].socket = client;

            // Enviamos aviso de login correcto
            sendCommand(client, "/login ok", user.nick);

            // Obtenemos la lista de salas
            Db.getUserRooms(user.nick, function(err, userrooms) {
                // Registramos los sockets en las salas
                for (var i in userrooms) {
                    var roomname = userrooms[i];
                    if (!room_sockets[roomname]) room_sockets[roomname] = [];
                    room_sockets[roomname][user.nick] = client;
                }

                // Mandamos al cliente la lista de salas
                sendCommand(client, "/rooms " + userrooms.join(" "), user.nick);

                // Mandamos los ultimos 10 mensajes al usuario
                for (var i in userrooms) {
                    var roomname = userrooms[i];
                    Db.getRoomMessages(roomname, 10, function(err, msgs) {
                        for (var j in msgs) {
                            sendCommand(client, "/msg " + roomname + " " + JSON.stringify(formatMsgObj(msgs[j])), user.nick);
                        }
                    });
                }

                cb(null, user);
            });
        }
        else {
            sendCommand(client, "/login err");

            cb("User not found.", false);
        }
    }

    var logoutUser = function(username) {
        if (users_login[username]) {
            delete users_login[username];
        }

        for (var i in room_sockets) {
            if (room_sockets[i][username]) {
                delete room_sockets[i][username];
            }
        }
    }

    // Loguea un usuario
    var loginCommand = function(client, command, cb) {
        var cmdstr = command.split(" ");
        var username = cmdstr[1];
        var cookie = cmdstr[2];

        ApiClient.isAuth(username, cookie, function(err, granted) {
            if (err) sendCommand(client, "/err Internal server error.", username);
            else {
                Db.getUser(username, function(err, user) {
                    if (err) sendCommand(client, "/err Internal server error.", username);
                    else if(user) {
                        loginUser(user, client, cb);
                    }
                    else {
                        Db.createUser(username, function(err, user) {
                            if (err) sendCommand(client, "/err Internal server error.", username);
                            else {
                                loginUser(user, client, cb);
                            }
                        })
                    }
                });
            }
        });
    }

    // Manda un msg a una sala
    var msgCommand = function(client, command, username) {
        var cmdstr = command.split(" ");
        var room = cmdstr[1];
        var msg = cmdstr[2];

        Db.getUserRooms(username, function(err, dbrooms) {
            if (dbrooms.indexOf(room) == -1) {
                sendCommand(client, "/err User try to send a message to an unauthorized room.", username);
            }
            else {
                Db.addMsgRoom(username, room, msg, function(err, msgobj) {
                    if (room_sockets[room])
                    {
                        for (var i in room_sockets[room])
                        {
                            var msgformated = formatMsgObj(msgobj);
                            msgformated.user = username;
                            sendCommand(room_sockets[room][i], "/msg " + room + " " + JSON.stringify(msgformated), username);
                        }
                    }
                });
            }
        });
    }

    var flirtCommand = function(client, command, username) {
        var cmdstr = command.split(" ");
        var user = cmdstr[1];

        // Registramos el flirt
        Db.setFlirt(username, user, function(err, chat) {
            if (err) sendCommand(client, "/err Internal server error. " + err, username);
            else if (chat) {
                // Si se crea un chat, notificarselo a los usuarios.
                if (users_login[user]) sendCommand(users_login[user].socket, "/rooms " + chat.name, username);
                if (users_login[username]) sendCommand(users_login[username].socket, "/rooms " + chat.name, username);
            }
        });
    }

    var sendCommand = function(client, msg, username) {
        var cmd = msg.split(" ")[0];
        console.log("[Server => Client] Command <" + cmd + ">" + ((username) ? " User <" + username + ">" : "") + " Data <" + msg + ">");
        client.send(msg);
    }

    this.listen = function(cb) {
        dispatchEvent("listen", null);

        wsserver.on('connection', function connection(client) {
            // False si no login, string con el nick si logeado
            var user = false;

            client.on('open', function open() {
            });

            client.on('close', function close() {
                if (user) {
                    logoutUser(user.nick);
                    user = false;
                }
            });

            client.on('message', function incoming(message) {
                var cmd = message.split(' ')[0];
                console.log("[Client => Server] Command <" + cmd + ">" + ((user) ? " User <" + user.nick + ">" : ""));

                switch (cmd) {
                    case "/login":
                        loginCommand(client, message, function(err, userobj) {
                            if (!err) user = userobj;
                        });
                        break;
                    case "/msg":
                        if (user) msgCommand(client, message, user.nick);
                        else sendCommand(client, "/err Unauthorized user");
                        break;
                    case "/flirt":
                        if (user) flirtCommand(client, message, user.nick);
                        else sendCommand(client, "/err Unauthorized user");
                        break;
                }
            });
        });

        cb();
    }

    this.on = function(action, callback) {
        if (oncallbacks[action] != 'undefined') {
            oncallbacks[action].push(callback);
        }
    }

    var dispatchEvent = function(action, param) {
        if (oncallbacks[action] != 'undefined') {
            oncallbacks[action].forEach(function(cb) {
                cb(param);
            });
        }
    }
}

module.exports.listen = function(port, callback) {
    var server = new ChatServer(port);
    server.listen(callback);
    return server;
}
