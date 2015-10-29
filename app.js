var chat = require('./chatserver.js');
var config = require('./config.json');

chat.listen(config.port, function() {
    console.log("[Server] Listening on ws://localhost:" + config.port);
});
