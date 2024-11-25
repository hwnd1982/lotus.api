import { readFileSync } from "node:fs";
import * as env from "./env";
import express from "express";
import { createServer } from "node:http";
import { join, parse } from "node:path";
import { Server } from "socket.io";
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 4001;
const server = createServer(app);
var jsonParser = bodyParser.json();
const io = new Server(server);

app.post("/action/*", jsonParser, (req, res) => {
  if (/\/action\/registration/.test(req.url)) {
    console.log(req.body);
    res.json("123");
  }
});

app.get("/*", (req, res) => {
  if (/.js|.css|.svg$/.test(req.url)) {
    return res.sendFile(join(__dirname, env.APP_URL, req.url));
  }

  if (/\/action\/registration/.test(req.url)) {
    const db = JSON.parse(readFileSync(join(__dirname, env.DB_URL, "db.json"), "utf8"));
    const url = parse(req.url);

    if (db?.auctions[url.name]) {
      const { title, requirements } = db?.auctions[url.name];

      res.json({ title, requirements });

      return;
    }
  }

  if (/\/registration/.test(req.url)) {
    // io.once("connection", socket => {
    //   socket.emit("connection", socket.id);
    //   console.log("connection registration", req.url);
    //   if (db?.auctions[url.name]) {
    //     const { title, requirements } = db?.auctions[url.name];
    //     console.log(title, req.url);
    //     socket.emit(
    //       "registration",
    //       JSON.stringify({
    //         id: socket.id,
    //         settings: {
    //           title,
    //           requirements,
    //         },
    //       })
    //     );
    //   }
    // });
  }

  // if (/\/test/.test(req.url)) {
  //   io.once("connection", socket => {
  //     socket.emit("connection", state.count);
  //     console.log(`a user ${socket.id} connected`);

  //     socket.on("connection", () => {
  //       socket.emit("connection", { count: state.count, id: socket.id });
  //       state.users.push(socket.id);
  //       console.log(`a user: ${socket.id} connected`);
  //     });

  //     socket.on("disconnecting", reason => {
  //       for (const room of socket.rooms) {
  //         if (room !== socket.id) {
  //           socket.to(room).emit("left", socket.id);
  //         }
  //       }
  //     });

  //     socket.on("disconnect", () => {
  //       console.log(`user ${socket.id} disconnected`);
  //     });

  //     socket.on("inc", count => {
  //       state.count = count + 1;
  //       io.emit("inc", count + 1);
  //       console.log("inc", count);
  //     });
  //   });
  // }

  res.sendFile(join(__dirname, env.APP_URL, "index.html"));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
