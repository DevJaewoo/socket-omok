const socket = io();

function handleNewRoom(event) {
  event.preventDefault();
  const name = event.target.roomname.value;
  if (name.length == 0) return;
  socket.emit("new_room", name);
}

function handleEnterRoom(event, name) {
  event.preventDefault();
}

const NewRoom = () => {
  return (
    <form onSubmit={handleNewRoom}>
      <input type="text" name="roomname" placeholder="방 이름"></input>
      <button>방 만들기</button>
    </form>
  );
};

const RoomItem = (name) => {
  return (
    <li key={name} class="room-list__item">
      <p>{name}</p>
      <button class="room-list__enter">입장하기</button>
    </li>
  );
};

const RoomList = () => {
  const [roomList, setRoomList] = React.useState([]);
  const listItems = roomList.map(RoomItem);

  socket.on("room_list", (list) => {
    setRoomList(list);
  });

  return <ul class="room-list">{listItems}</ul>;
};

const WaitingRoom = () => {
  return (
    <>
      <NewRoom />
      <RoomList />
    </>
  );
};

ReactDOM.render(<WaitingRoom />, document.getElementById("root"));
