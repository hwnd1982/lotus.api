import { readFileSync, writeFileSync } from "node:fs";
import * as env from "./env";
import express from "express";
import { createServer } from "node:http";
import { join, parse } from "node:path";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import { Auction, Participant } from "./types";
import { randomBytes } from "node:crypto";

const app = express();
const port = process.env.PORT || 4001;
const server = createServer(app);
var jsonParser = bodyParser.json();
const io = new Server(server);

const state: Auction<[string, string]> = {
  id: "",
  title: "",
  status: "idle",
  supervisor: "",
  participants: [],
  requirements: [],
  production_cost: "",
  online: [],
};

app.post("/action/*", jsonParser, (req, res) => {
  if (/\/action\/registration/.test(req.url)) {
    const db = JSON.parse(readFileSync(join(__dirname, env.DB_URL, "db.json"), "utf8"));

    if (db?.auctions[req.body.id]) {
      const { participants }: { participants: Participant[] } = db.auctions[req.body.id];
      const newParticipant: Participant = {
        ...req.body,
        id: randomBytes(8).toString("hex"),
        status: "accepted",
        role: "participant",
      };

      const registeredParticipant: Participant | undefined = participants.find(item => item.name === req.body.name);

      if (!registeredParticipant) {
        db.auctions[req.body.id] = {
          ...db.auctions[req.body.id],
          participants: [...participants, newParticipant],
        };

        writeFileSync(join(__dirname, env.DB_URL, "db.json"), JSON.stringify(db), "utf8");

        state.participants = [...state.participants, newParticipant];

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

  const db = JSON.parse(readFileSync(join(__dirname, env.DB_URL, "db.json"), "utf8"));
  const url = parse(req.url);
  const { base: userId } = url;
  const { base: auctionId } = parse(url.dir);

  if (/\/action\/state/.test(req.url)) {
    const [auctionId] = Object.keys(db.auctions);

    if (state.status === "idle") {
      const { title, status, supervisor, participants, requirements }: Auction = db.auctions[auctionId];

      state.id = auctionId;
      state.title = title;
      state.status = status;
      state.supervisor = supervisor;
      state.participants = participants;
      state.requirements = requirements.map(requirement => [requirement.name, requirement.title]);
    }

    if (auctionId && !state.online.includes(userId)) {
      console.log(userId);
      state.online = [...state.online, userId];
    }

    res.json(state);
    io.emit("connection", state);
    return;
  }

  if (/\/action\/registration/.test(req.url)) {
    const url = parse(req.url);

    if (db?.auctions[url.name]) {
      const { title, requirements } = db?.auctions[url.name];

      res.json({ title, requirements });
      return;
    }
  }

  if (/\/auction/.test(req.url)) {
    io.once("connection", socket => {
      if (state.status === "idle") {
        const { title, status, supervisor, participants, requirements }: Auction = db.auctions[auctionId];

        state.id = auctionId;
        state.title = title;
        state.status = status;
        state.supervisor = supervisor;
        state.participants = participants;
        state.requirements = requirements.map(requirement => [requirement.name, requirement.title]);
      }

      if (userId && !state.online.includes(userId)) {
        console.log(userId);
        state.online = [...state.online, userId];
      }

      socket.broadcast.emit("connection", state);

      socket.on("left", id => {
        state.online = state.online.filter(item => item !== id);
        socket.broadcast.emit("left", state);
        console.log("left", id);
      });
    });
  }

  res.sendFile(join(__dirname, env.APP_URL, "index.html"));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
