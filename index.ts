import { readFileSync, writeFileSync } from "node:fs";
import * as env from "./env";
import express from "express";
import { createServer } from "node:http";
import { join, parse } from "node:path";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import { Participant } from "./types";
import { randomBytes } from "node:crypto";

const app = express();
const port = process.env.PORT || 4001;
const server = createServer(app);
var jsonParser = bodyParser.json();
const io = new Server(server);

app.post("/action/*", jsonParser, (req, res) => {
  if (/\/action\/registration/.test(req.url)) {
    const db = JSON.parse(readFileSync(join(__dirname, env.DB_URL, "db.json"), "utf8"));

    if (db?.auctions[req.body.id]) {
      const { participants }: { participants: Participant[] } = db.auctions[req.body.id];
      const newParticipant: Participant = { ...req.body, id: randomBytes(8).toString("hex"), status: "accepted" };
      const registeredParticipant: Participant | undefined = participants.find(item => item.name === req.body.name);

      if (!registeredParticipant) {
        db.auctions[req.body.id] = {
          ...db.auctions[req.body.id],
          participants: [...participants, newParticipant],
        };

        writeFileSync(join(__dirname, env.DB_URL, "db.json"), JSON.stringify(db), "utf8");
        res.status(201);
        res.json({ id: newParticipant.id });
        return;
      }

      res.status(200);
      res.json({ id: registeredParticipant.id });
    }
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

  if (/\/auction/.test(req.url)) {
    io.once("connection", socket => {
      const state = {};
      const url = parse(req.url);

      console.log(url);

      socket.emit("connection", socket.id);
      socket.on("connection", ({ auctionId, userId }) => {
        console.log(auctionId, userId);
      });
    });
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
