const socket = io();

socket.onAny((event) => {
  console.log(`Socket event: ${event}`);
});

socket.on("error", (message) => {
  alert(message);
});

const Header = () => {
  return <h1 className="title">Socket Omok</h1>;
};

const NewRoom = () => {
  const handleNewRoom = (event) => {
    event.preventDefault();
    const name = event.target.roomname.value;
    event.target.roomname.value = "";
    if (name.length == 0) return;
    socket.emit("room_new", name);
  };

  return (
    <div className="newroom">
      <form className="newroom__form" onSubmit={handleNewRoom}>
        <input
          className="newroom__input"
          type="text"
          name="roomname"
          placeholder="방 이름"
        ></input>
        <button className="newroom__submit">방 만들기</button>
      </form>
    </div>
  );
};

const RoomItem = (room) => {
  const handleEnterRoom = () => {
    socket.emit("room_enter", room.name);
  };

  return (
    <li key={room.name} className="room-list__item">
      <p className="room-list__name">{room.name}</p>
      <button className="room-list__enter" onClick={handleEnterRoom}>
        입장하기
      </button>
    </li>
  );
};

const RoomList = ({ roomList }) => {
  return (
    <div className="room-list">
      <h3>방 목록</h3>
      <ul className="room-list__container">{roomList.map(RoomItem)}</ul>
    </div>
  );
};

const WaitingRoom = () => {
  const [roomList, setRoomList] = React.useState([]);
  React.useEffect(() => {
    socket.on("room_list", (list) => {
      console.log(list);
      setRoomList(list);
    });
    socket.emit("room_list");

    return () => {
      socket.off("room_list");
    };
  }, []);

  return (
    <div className="waiting-room">
      <NewRoom />
      <RoomList roomList={roomList} />
    </div>
  );
};

////////////////////////////////////////////////////////////////////////

//크기: 5%
//칸: 5.29%
//공백: 3.62%
const stone = ({ white, x, y }) => {
  console.log(`${white} (${x},${y})`);
  return (
    <div
      className="omokboard__stone"
      key={`${x}${y}`}
      style={{
        backgroundColor: white ? "white" : "black",
        left: `${x * 5.14 + 3.62}%`,
        top: `${y * 5.14 + 3.62}%`,
      }}
    ></div>
  );
};

const MemoriedStone = React.memo(stone);

const OmokBoard = ({ takes }) => {
  return (
    <div className="omokboard">
      {takes.map((takes, index) => (
        <MemoriedStone white={index % 2 == 1} x={takes.x} y={takes.y} />
      ))}
    </div>
  );
};

const GamePanel = ({ roomname, blackPlayer, whitePlayer }) => {
  const Player = ({ name, onClick }) => {
    return (
      <>
        {name !== "" ? <p>{name}</p> : <button onClick={onClick}>참가</button>}
      </>
    );
  };

  const blackPlayerCallback = () => {
    socket.emit("player_change", "black");
  };

  const whitePlayerCallback = () => {
    socket.emit("player_change", "white");
  };

  return (
    <div className="game-panel">
      <h3 className="game-panel__title">{roomname}</h3>
      <div className="game-panel__player">
        <div className="game-panel__blackplayer">
          <h4>Black</h4>
          <Player name={blackPlayer} onClick={blackPlayerCallback} />
        </div>
        <div className="game-panel__blackplayer">
          <h4>White</h4>
          <Player name={whitePlayer} onClick={whitePlayerCallback} />
        </div>
      </div>
    </div>
  );
};

const GamingRoom = ({ publicRoom }) => {
  const [roomName, setRoomName] = React.useState(publicRoom.name);
  const [blackPlayer, setBlackPlayer] = React.useState(publicRoom.blackPlayer);
  const [whitePlayer, setWhitePlayer] = React.useState(publicRoom.whitePlayer);
  const [takes, setTakes] = React.useState(publicRoom.takes);

  console.log(publicRoom);

  React.useEffect(() => {
    socket.on("player_change", ({ blackPlayer, whitePlayer }) => {
      setBlackPlayer(blackPlayer);
      setWhitePlayer(whitePlayer);
    });
  }, []);

  return (
    <div className="gaming-room">
      <OmokBoard takes={takes} />
      <GamePanel
        roomname={roomName}
        blackPlayer={blackPlayer}
        whitePlayer={whitePlayer}
      />
      <button
        onClick={() => {
          socket.emit("room_leave");
        }}
      >
        방 나가기
      </button>
    </div>
  );
};

const App = () => {
  const [publicRoom, setPublicRoom] = React.useState({});

  React.useEffect(() => {
    socket.on("room_enter", (room) => {
      console.log(`Enter room ${room.name}`);
      setPublicRoom(room);
    });

    socket.on("room_leave", () => {
      setPublicRoom({});
    });
  }, []);

  return (
    <>
      <Header />
      {publicRoom.name === undefined ? (
        <WaitingRoom />
      ) : (
        <GamingRoom publicRoom={publicRoom} />
      )}
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
