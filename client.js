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
                if (reconnect) setTimeout(connect, this.reconnectinterval);
            }
        }

        socket.onmessage = function (event) {
            console.log("[ChatClient] Mensaje del servidor no capturado: " + event.data);
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
