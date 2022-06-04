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

const RoomList = () => {
  const [roomList, setRoomList] = React.useState([]);

  socket.on("room_change", (list) => {
    setRoomList(list);
  });

  return (
    <div className="room-list">
      <h3>방 목록</h3>
      <ul className="room-list__container">{roomList.map(RoomItem)}</ul>
    </div>
  );
};

const WaitingRoom = () => {
  return (
    <>
      <NewRoom />
      <RoomList />
    </>
  );
};

const GamingRoom = () => {
  return (
    <>
      <button
        onClick={() => {
          socket.emit("room_leave");
        }}
      >
        방 나가기
      </button>
    </>
  );
};

const App = () => {
  const [gaming, setGaming] = React.useState(false);
  socket.on("room_enter", () => {
    setGaming(true);
  });

  socket.on("room_leave", () => {
    setGaming(false);
  });

  return (
    <>
      <Header />
      {gaming ? <GamingRoom /> : <WaitingRoom />}
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
