import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";

const io = new Server();
const engine = new Engine({
  path: "/socket.io/",
  cors: {
    origin: "*",
  },
});

io.bind(engine);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on("leave_room", (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room: ${room}`);
  });

  socket.on("new_message", (data: { room: string; messageId?: string }) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("ticket_created", (data: { projectRoom: string }) => {
    io.to(data.projectRoom).emit("ticket_list_updated", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

export default {
  port: 3001,
  ...engine.handler(),
};
