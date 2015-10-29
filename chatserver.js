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

    // Loguea un usuario en el chat
    var loginUser = function(user, client, cb) {
        if (user && user.nick)
        {
            // Registramos el usuario
            users_login[user.nick] = user;
            users_login[user.nick].socket = client;

            // Enviamos aviso de login correcto
            client.send("/login ok");

            // Obtenemos la lista de salas
            Db.getUserRooms(user.nick, function(err, userrooms) {
                // Registramos los sockets en las salas
                for (var i in userrooms) {
                    var roomname = userrooms[i];
                    if (!room_sockets[roomname]) room_sockets[roomname] = [];
                    room_sockets[roomname][user.nick] = client;
                }

                // Mandamos al cliente la lista de salas
                client.send("/rooms main " + userrooms.join(" "));

                // Mandamos los ultimos 10 mensajes al usuario
                for (var i in userrooms) {
                    var roomname = userrooms[i];
                    var msgs = Db.getRoomMessages(roomname, 10);

                    for (var j in msgs) {
                        client.send("/msg " + roomname + " " + msgs[j]);
                    }
                }

                cb(null, user);
            });
        }
        else {
            client.send("/login err");

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
            if (err) client.send("/err Internal server error.");
            else {
                Db.getUser(username, function(err, user) {
                    if (err) client.send("/err Internal server error.");
                    else if(user) {
                        loginUser(user, client, cb);
                    }
                    else {
                        Db.createUser(username, function(err, user) {
                            if (err) client.send("/err Internal server error.");
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

        var dbrooms = Db.getUserRooms(username);

        if (dbrooms.indexOf(room) == -1) {
            client.send("/err User try to send a message to an unauthorized room.");
        }
        else {
            var msgobj = Db.addMsgRoom(username, room, msg);

            if (room_sockets[room])
            {
                for (var i in room_sockets[room])
                {
                    room_sockets[room][i].send("/msg " + room + " " + msgobj);
                }
            }
        }
    }

    var flirtCommand = function(client, command, username) {
        var cmdstr = command.split(" ");
        var user = cmdstr[1];

        // Registramos el flirt
        Db.setFlirt(username, user, function(err, chat) {
            if (err) client.send("/err Internal server error.");
            else if (chat) {
                // Si se crea un chat, notificarselo a los usuarios.
                if (users_login[user]) users_login[user].socket.send("/rooms " + chat.name);
                if (users_login[username]) users_login[username].socket.send("/rooms " + chat.name);
            }
        });
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

                switch (cmd) {
                    case "/login":
                        loginCommand(client, message, function(err, userobj) {
                            if (!err) user = userobj;
                        });
                        break;
                    case "/msg":
                        if (user) msgCommand(client, message, user.nick);
                        else client.send("/err Unauthorized user");
                        break;
                    case "/flirt":
                        if (user) flirtCommand(client, message, user.nick);
                        else client.send("/err Unauthorized user");
                        break;
                }
            });
        });
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
