var ChatClient = function(hostaddr) {
    var host = hostaddr;
    var socket;

    var reconnect = true;
    var reconnectinterval = 15000;

    var connect = function() {
        socket = new WebSocket("ws://" + host);

        socket.onerror = function(evt) {
            devent("error", "Socket error. " + JSON.stringify(evt));
        }

        socket.onopen = function(evt) {
            connected = true;
            devent("connection");
        }

        socket.onclose = function (evt) {
            if (evt.code > 1000) {
                devent("error", "Socket close. " + JSON.stringify(evt));

                logedin = false;
                rooms = [];
                
                if (reconnect) setTimeout(connect, this.reconnectinterval);
            }
        }

        socket.onmessage = function (event) {
            var cmdstr = event.data.split(' ');
            var cmd = cmdstr[0];

            switch (cmd) {
                case "/login":
                    if (cmdstr[1] == "ok") {
                        logedin = true;
                        devent("login", true);
                    }
                    else devent("login", false);
                    break;
                case "/rooms":
                    cmdstr.shift();
                    addRooms(cmdstr);
                    break;
                default:
                    console.log("[ChatClient] Mensaje del servidor no capturado: " + event.data);
                    break;
            }
        }
    }

    var connected = false;

    var logedin = false;
    var rooms = [];

    var onhandlers = {
        "connection": false,
        "error": false,
        "login": false,
        "message": false,
        "room": false
    }

    var duser = false;
    var dcookie = false;

    this.getRooms = function() {
        return rooms;
    }

    var addRooms = function(roomsa) {
        for (var roomi in roomsa) {
            if (rooms.indexOf(roomsa[roomi]) == -1)
            {
                rooms.push(roomsa[roomi]);
                console.log("[ChatClient] El usuario ha entrado en la sala: " + roomsa[roomi]);
            }
        }
    }

    var checks = function(con, lin) {
        if (con && !connected) devent("error", "The chat client is not connected."); return false;
        if (lin && !logedin) devent("error", "User is not logedin on the chat server."); return false;
        return true;
    }

    this.login = function(user, cookie) {
        if (checks(true, false)) return;
        if (!duser || typeof(user) != "undefined") duser = user;
        if (!dcookie || typeof(cookie) != "undefined") dcookie = cookie;

        socket.send("/login " + duser + " " + dcookie);
    }

    this.message = function(room, message) {
        if (checks(true, true)) return;
        if (!connected) devent("error", "The chat client is not connected."); return;
        socket.send("/msg " + room + " " + message);
    }

    this.flirt = function(username) {
        if (checks(true, true)) return;
        socket.send("/flirt " + username);
    }

    this.on = function(handler, cb) {
        if (onhandlers[handler] != "undefined") {
            onhandlers[handler] = cb;
        }
    }

    var devent = function(handler, param) {
        if (onhandlers[handler] != "undefined") {
            onhandlers[handler](param);
        }
        else {
            console.log("[ChatClient] Evento {" + handler + "} no capturado.")
        }
    }

    connect();
}
