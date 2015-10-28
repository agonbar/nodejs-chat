var Db = require('./database.js');



console.log("Empieza:");

Db.createUser('testUsuario2', function cb(res1, res2) {
  console.log("createUser: " + res2);
});

// Still not working, need a better solution for searching user in array os users
/*Db.getUserRooms('testUsuario2', function cb(res1, res2) {
  console.log("getRooms: " + res1);
  JSON.stringify(res2, undefined, 4);
});*/

//Not for now
/*Db.addUserRoom("as", function cb(res1, res2) {
  console.log("addUserRoom: " + res1);
  console.log("addUserRoom: " + res2);
});*/

Db.addMsgRoom("testUsuario2", "main", "Esto es un test", function cb(res1, res2) {
  console.log("addMsgRoom: " + res2);
});

Db.getRoomUsers("main", function cb(res1, res2) {
  console.log("getRoomUsers: " + JSON.stringify(res2, undefined, 4));
});

//TODO: add a limit
Db.getRoomMessages("main", 10, function cb(res1, res2) {
  console.log("getRoomMessages: " + JSON.stringify(res2, undefined, 4));
});
