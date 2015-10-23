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

    // Logged in an user
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
                        cb(user);
                    }
                    else {
                        Db.createUser(username, function(err, user) {
                            if (err) client.send("/err Internal server error.");
                            else cb(user);
                        })
                    }
                });
            }
        });
    }

    //
    var msgCommand = function(client, command) {
        var cmdstr = command.split(" ");
        var room = cmdstr[1];
        var msg = cmdstr[2];

        // Si usuario tiene sala, se registra en bd y se manda broadcast a los demas
        // Si no tiene sala, devuelve error
    }

    var joinCommand = function(client, command) {
        var cmdstr = command.split(" ");
        var room = cmdstr[1];

        // Si usuario ya registrado en sala, se manda broadcast a los demas
        // de que se conecto, y se le mandan los ultimos 10 msg
    }

    var flirtCommand = function(client, command) {
        var cmdstr = command.split(" ");
        var user = cmdstr[1];

        // Si el usuario destino tiene al usuario en el campo flirts, se abre sala.
        // Sino, se guarda en BD y se avisa al destinatario.
    }

    this.listen = function(cb) {
        dispatchEvent("listen", null);

        wsserver.on('connection', function connection(client) {
            // False si no login, string con el nick si logeado
            var loggedin = false;

            client.on('open', function open() {
            });

            client.on('close', function close() {
                loggedin = false;
            });

            client.on('message', function incoming(message) {
                var cmd = message.split(' ')[0];

                switch (cmd) {
                    case "/login":
                        loginCommand(client, message, function(granted) {
                            if (granted) {
                                loggedin = true;
                                client.send("/login ok");
                            }
                            else {
                                client.send("/login err")
                            }
                        });
                        break;
                    case "/msg":
                        if (loggedin) msgCommand(client, message);
                        else client.send("/err denied msg");
                        break;
                    case "/join":
                        if (loggedin) joinCommand(client, message);
                        else client.send("/err denied join");
                        break;
                    case "/flirt":
                        if (loggedin) flirtCommand(client, message);
                        else client.send("/err denied flirt");
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
