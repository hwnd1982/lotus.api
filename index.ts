import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import { Server } from "socket.io";

const state = {
  count: 0,
};
const APP_URL = "app/";
const app = express();
const port = process.env.PORT || 4001;
const server = createServer(app);
const io = new Server(server);

app.get("/*", (req, res) => {
  if (/.js|.css|.svg$/.test(req.url)) {
    return res.sendFile(join(__dirname, APP_URL, req.url));
  }

  if (/\/test/.test(req.url)) {
    io.once("connection", socket => {
      console.log("a user connected");
      socket.emit("connection", state.count);

      socket.on("disconnect", () => {
        console.log("user disconnected");
      });

      socket.on("inc", count => {
        state.count = count + 1;
        io.emit("inc", count + 1);
        console.log("inc", count);
      });
    });
  }

  res.sendFile(join(__dirname, APP_URL, "index.html"));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
