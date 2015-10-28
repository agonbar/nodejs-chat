var Db = require('./database.js');



console.log("Begins:");

Db.createUser('testUsuario2', function cb(res1, res2) {
  console.log("createUser: " + res2);
});

Db.getUserRooms('testUsuario2', function cb(res1, res2) {
  console.log("getUserRooms: " + JSON.stringify(res2, undefined, 4));
});

Db.addMsgRoom("testUsuario2", "main", "Esto es un test", function cb(res1, res2) {
  console.log("addMsgRoom: " + res2);
});


Db.getRoomUsers("main", function cb(res1, res2) {
  console.log("getRoomUsers: " + JSON.stringify(res2, undefined, 4));
});

Db.getRoomMessages("main", 10, function cb(res1, res2) {
  console.log("getRoomMessages: " + JSON.stringify(res2, undefined, 4));
});

//Not for now
/*Db.addUserRoom("as", function cb(res1, res2) {
  console.log("addUserRoom: " + res1);
  console.log("addUserRoom: " + res2);
});*/
