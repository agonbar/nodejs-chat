var config = require('./config.json');
var http = require('http');

module.exports.isAuth = function(user, cookie, cb) {
    cb(false, true);
    return true;
    var path = config.web.api.validate_auth;

    if (cookie.indexOf(user) == -1) {
        cb("Cookie data don't correspond with the user nick.");
        return;
    }

    if (path.indexOf("{{cookie}}") == -1) {
        cb("Malformed api key <validate_auth> on config.json file.");
        return;
    }

    path = path.replace("{{cookie}}", cookie);

    var options = {
        host : config.web.host,
        path : path,
        port : config.web.port,
        method : 'GET'
    }

    console.log("[Server::ApiClient => Wordpress] Command <" + options.method + " : " + options.path + ">");

    var request = http.request(options, function(response) {
        var body = "";

        response.on('data', function(data) {
            body += data;
        });

        response.on('end', function() {
            console.log("[Wordpress => Server::ApiClient] Data <" + body + ">");

            var rescontent = JSON.parse(body);
            if (rescontent.valid) cb(false, true);
            else cb(false, false)
        });
    });

    request.on('error', function(e) {
        request.end();
        cb(e, false);
    });

    request.end();
}
