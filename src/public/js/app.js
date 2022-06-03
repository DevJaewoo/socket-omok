const socket = io();

socket.onAny((event) => {
  console.log(`Socket event: ${event}`);
});

socket.on("error", (message) => {
  alert(message);
});

function handleNewRoom(event) {
  event.preventDefault();
  const name = event.target.roomname.value;
  event.target.roomname.value = "";
  if (name.length == 0) return;
  socket.emit("new_room", name);
}

function handleEnterRoom(name) {
  event.preventDefault();
  socket.emit("enter_room", name);
}

const Header = () => {
  return <h1 className="title">Socket Omok</h1>;
};

const NewRoom = () => {
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

const RoomItem = (name) => {
  return (
    <li key={name} className="room-list__item">
      <p className="room-list__name">{name}</p>
      <button
        className="room-list__enter"
        onClick={() => handleEnterRoom(name)}
      >
        입장하기
      </button>
    </li>
  );
};

const RoomList = () => {
  const [roomList, setRoomList] = React.useState([]);
  const listItems = roomList.map(RoomItem);

  socket.on("room_change", (list) => {
    setRoomList(list);
  });

  return (
    <div className="room-list">
      <h3>방 목록</h3>
      <ul className="room-list__container">{listItems}</ul>
    </div>
  );
};

const WaitingRoom = () => {
  return (
    <>
      <Header />
      <NewRoom />
      <RoomList />
    </>
  );
};

ReactDOM.render(<WaitingRoom />, document.getElementById("root"));
