import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import { Server } from "socket.io";

const app = express();
const port = process.env.PORT || 4000;
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "/dist/index.html"));
});

io.on("connection", socket => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
