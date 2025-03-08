const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors:{
        origin: '*',
        methods: ['GET', 'POST']
    }
});
app.use(cors());

const users = {}; 

io.on("connection", (socket) => {
    socket.on("userJoined", (name) => {
        if (!Object.values(users).includes(name)) {  
            users[socket.id] = name;
            io.emit("updateUserList", Object.values(users));
            io.emit("userJoined", name);
        }
      });

  socket.on("startStroke", ({ x, y }) => {
    socket.broadcast.emit("startStroke", { x, y });
  });

  socket.on("draw", ({ x, y, color, size }) => {
    socket.broadcast.emit("draw", { x, y, color, size });
  });

  socket.on("clearCanvas", () => {
    io.emit("clearCanvas");
  });

  socket.on("getUsers", () => {
    socket.emit("updateUserList", Object.values(users));
  });

  socket.on("disconnect", () => {
    const name = users[socket.id]; 
    delete users[socket.id]; 
    io.emit("updateUserList", Object.values(users));
    if (name) {
        io.emit("userDisconnected", `${name}`);
    }
  });
});

// server.listen(5000, ()=> {
//     console.log('Server is running on port 5000');
// })

module.exports = app;


