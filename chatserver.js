var WebSocketServer = require('ws').Server,
var ApiClient = require('./apiclient.js');

function ChatServer(port) {
    this.port = port;

    var wss = new WebSocketServer({
        host: '0.0.0.0',
        port: this.port
    });

    var oncallbacks = {
        "listen": []
    };

    // Logged in an user
    var loginCommand = function(client, command, cb) {
        var cmdstr = command.split(" ");
        var user = cmdstr[1];
        var cookie = cmdstr[2];

        ApiClient.isAuth(user, cookie, function(granted) {
            if (!granted) client.socket.send("/err denied");
            cb(user);
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

        wss.on('connection', function connection(client) {
            // False si no login, string con el nick si logeado
            var loggedin = false;

            client.on('open', function open() {
            });

            client.on('close', function close() {
            });

            client.on('message', function incoming(message) {
                var cmd = message.split(' ')[0];

                switch (expression) {
                    case "/login":
                        loginCommand(client, message, function(granted) {
                            loggedin = granted;
                        });
                        break;
                    case "/msg"
                        if (loggedin) msgCommand(client, message);
                        else client.socket.send("/err denied");
                        break;
                    case "/join"
                        if (loggedin) joinCommand(client, message);
                        else client.socket.send("/err denied");
                        break;
                    case "/flirt"
                        if (loggedin) flirtCommand(client, message);
                        else client.socket.send("/err denied");
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

    var dispatchEvent = funcion(action, param) {
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
