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

function getJoinedRoomName(socket) {
  return Array.from(socket.rooms)[1];
}

function getPublicRoom(name) {
  return publicRoom.find((room) => room.name == name);
}

function findSocketByID(id) {
  return wsServer.sockets.sockets.get(id);
}

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

function emitPlayerChange(room) {
  room.takes = [];
  wsServer.in(room.name).emit("player_change", {
    blackPlayer: room.blackPlayer,
    whitePlayer: room.whitePlayer,
  });

  if (room.blackPlayer !== "" && room.whitePlayer !== "") {
    findSocketByID(room.blackPlayer).emit("player_select");
  }
}

function enterRoom(socket, name) {
  const room = getPublicRoom(name);
  console.log(`Socket ${socket.id} is entering room ${name}.`);

  if (room === undefined) {
    socket.emit("error", "정상적인 방이 아닙니다.");
    return;
  }

  socket.join(name);
  socket.emit("room_enter", room);
  wsServer.to(name).emit("message", `${socket.id} 님이 입장하셨습니다.`);
}

function leaveRoom(socket) {
  const name = getJoinedRoomName(socket);

  console.log(`Socket ${socket.id} is leaving room ${name}.`);

  if (name != undefined) {
    //현재 Disconnect 하는 Socket이 해당 방의 마지막 소켓일 경우 방 제거
    if (countRoom(name) == 1) {
      console.log(`Remove room ${name}`);
      publicRoom = publicRoom.filter((value) => value.name != name);
      wsServer.sockets.emit("room_list", publicRoom);
    } else {
      const room = getPublicRoom(name);
      if (room.blackPlayer === socket.id) {
        room.blackPlayer = "";
        emitPlayerChange(room);
      } else if (room.whitePlayer === socket.id) {
        room.whitePlayer = "";
        emitPlayerChange(room);
      }

      wsServer.to(name).emit("message", `${socket.id} 님이 퇴장하셨습니다.`);
    }
    socket.leave(name);
  }
}

//오목 완성 판별
function checkOmokCompleted(coord, takes) {
  //(0, 1), (1, 1), (1, 0), (1, -1)
  const offset = [
    { x: 1, y: 0 }, //가로
    { x: 1, y: 1 }, //대각선1
    { x: 0, y: 1 }, //세로
    { x: -1, y: 1 }, //대각선2
  ];
}

wsServer.on("connection", (socket) => {
  socket.onAny((event) => {
    console.log(`Socket event: ${event}`);
  });

  //방 목록 반환
  socket.on("room_list", () => {
    socket.emit("room_list", publicRoom);
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

    publicRoom.push(roomInfo);
    wsServer.sockets.emit("room_list", publicRoom);

    enterRoom(socket, name);
  });

  //기존 방 참가
  socket.on("room_enter", (name) => {
    if (socket.rooms.size > 1) {
      console.log(`socket ${socket.id} is already in room.`);
      console.log(socket.rooms);
      socket.emit("error", "이미 다른 방에 참가중입니다.");
      return;
    }

    enterRoom(socket, name);
  });

  socket.on("room_leave", () => {
    leaveRoom(socket);
    socket.emit("room_leave");
  });

  socket.on("player_change", (color) => {
    const roomName = getJoinedRoomName(socket);
    const room = getPublicRoom(roomName);

    if (color === "black") {
      if (room.blackPlayer !== "") {
        socket.emit("error", "다른 플레이어가 참가중입니다.");
        return;
      } else {
        if (room.whitePlayer === socket.id) room.whitePlayer = "";
        room.blackPlayer = socket.id;
      }
    } else if (color === "white") {
      if (room.whitePlayer !== "") {
        socket.emit("error", "다른 플레이어가 참가중입니다.");
        return;
      } else {
        if (room.blackPlayer === socket.id) room.blackPlayer = "";
        room.whitePlayer = socket.id;
      }
    }

    emitPlayerChange(room);
  });

  socket.on("player_selected", (coord) => {
    const name = getJoinedRoomName(socket);
    const room = getPublicRoom(name);

    if (room === undefined) {
      console.log(`Room ${name} is not existing.`);
      return;
    }

    if (room.takes.length % 2 == 0) {
      //흑돌
      if (room.blackPlayer !== socket.id) {
        socket.emit("error", "흑돌 플레이어가 아닙니다.");
        return;
      }
    } else {
      //백돌
      if (room.whitePlayer !== socket.id) {
        socket.emit("error", "백돌 플레이어가 아닙니다.");
        return;
      }
    }

    if (
      findSocketByID(room.blackPlayer) === undefined ||
      findSocketByID(room.whitePlayer) === undefined
    ) {
      socket.emit("error", "상대가 존재하지 않습니다.");
      return;
    }

    if (
      room.takes.find((c) => c.x === coord.x && c.y === coord.y) !== undefined
    ) {
      socket.emit("error", "이미 다른 돌이 위치하고 있습니다.");
      socket.emit("player_select");
      return;
    }

    room.takes.push(coord);
    wsServer.in(name).emit("player_selected", coord);

    if (room.takes.length % 2 == 0) {
      findSocketByID(room.blackPlayer).emit("player_select");
    } else {
      findSocketByID(room.whitePlayer).emit("player_select");
    }
  });

  socket.on("disconnecting", () => {
    console.log(`Socket ${socket.id} is disconnecting.`);
    leaveRoom(socket);
  });
});

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
