import express from "express";
import path from "path";
import { Server } from "socket.io";
import http from "http";

const __dirname = path.resolve() + "/src";
const __viewroot = path.join(__dirname, "/public/views");

const app = express();
const port = 3000;

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __viewroot });
});

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

///////////////////////////////////////////////////////////

const publicRoom = [];

wsServer.on("connection", (socket) => {
  socket.onAny((event) => {
    console.log(`Socket event: ${event}`);
  });

  socket.on("new_room", (name) => {
    //Socket은 ID와 같은 Room을 Default로 갖고 있음
    if (socket.rooms.size > 1) {
      console.log(`socket ${socket.id} is already in room.`);
      console.log(socket.rooms);
      return;
    }

    if (publicRoom.includes(name)) {
      console.log(`Room name ${name} already exists.`);
      return;
    }

    publicRoom.push(name);
    wsServer.sockets.emit("room_list", publicRoom);

    socket.join(name);
    socket.emit("room_enter", name);
  });

  socket.emit("room_list", publicRoom);
});

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
