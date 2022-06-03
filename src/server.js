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

let publicRoom = [];

//이름이 name인 방에 속한 Socket 개수 반환
function countRoom(name) {
  return wsServer.sockets.adapter.rooms.get(name).size;
}

//중복된 이름의 방이 존재할 경우 false, 없을 경우 true
function checkDuplicateRoomName(name) {
  if (wsServer.sockets.adapter.rooms.get(name)) {
    return false;
  } else {
    return true;
  }
}

function leaveRoom(socket, name) {
  console.log(`Socket ${socket.id} is leaving room ${name}.`);

  if (name != undefined) {
    //현재 Disconnect 하는 Socket이 해당 방의 마지막 소켓일 경우 방 제거
    console.log(countRoom(name));
    if (countRoom(name) == 1) {
      console.log(`Remove room ${name}`);
      publicRoom = publicRoom.filter((value) => value.name != name);
      wsServer.sockets.emit("room_change", publicRoom);
    }
  }

  socket.leave(name);
}

wsServer.on("connection", (socket) => {
  socket.onAny((event) => {
    console.log(`Socket event: ${event}`);
  });

  //방 만들기
  socket.on("room_new", (name) => {
    name = name.trim();
    console.log(`Socket ${socket.id} is creating room ${name}.`);

    //Socket은 ID와 같은 Room을 Default로 갖고 있음
    if (socket.rooms.size > 1) {
      console.log(`socket ${socket.id} is already in room.`);
      console.log(socket.rooms);
      socket.emit("error", "이미 다른 방에 참가중입니다.");
      return;
    }

    //동일한 방이 존재할 경우
    if (!checkDuplicateRoomName(name)) {
      console.log(`Room name ${name} already exists.`);
      socket.emit("error", "동일한 방이 이미 존재합니다.");
      return;
    }

    const roomInfo = {
      name: "room",
      blackPlayer: "",
      whitePlayer: "",
      takes: [],
    };

    roomInfo.name = name;
    roomInfo.blackPlayer = socket.id;

    publicRoom.push(roomInfo);
    wsServer.sockets.emit("room_change", publicRoom);

    socket.join(name);
    socket.emit("room_enter", name);

    console.log(publicRoom);
  });

  //기존 방 참가
  socket.on("room_enter", (name) => {
    console.log(`Socket ${socket.id} is entering room ${name}.`);

    if (socket.rooms.size > 1) {
      console.log(`socket ${socket.id} is already in room.`);
      console.log(socket.rooms);
      socket.emit("error", "이미 다른 방에 참가중입니다.");
      return;
    }

    socket.join(name);
    socket.emit("room_enter", name);
  });

  socket.on("room_leave", () => {
    const name = Array.from(socket.rooms)[1];
    leaveRoom(socket, name);
    socket.emit("room_leave");
    socket.emit("room_change", publicRoom);
  });

  socket.on("disconnecting", () => {
    console.log(`Socket ${socket.id} is disconnecting.`);
    socket.rooms.forEach((name) => {
      if (name == socket.id) return;
      leaveRoom(socket, name);
    });
  });

  //최초 방 리스트 불러오기
  socket.emit("room_change", publicRoom);
});

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
