var chat = require('./chatserver.js');
var config = require('./config.json');

chat.listen(config.port, function() {
    console.log("Chat server listening on localhost:" + config.port);
});
