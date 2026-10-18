const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = Number(process.env.PORT) || 3000;
const rooms = new Map();

app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "..", "frontend"), { extensions: ["html"] }));
app.get("/health", (_req, res) => res.json({ ok: true, rooms: rooms.size }));

const cleanText = (value, max = 240) => String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
const makeCode = () => crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
const publicRoom = room => ({
  code: room.code, hostId: room.hostId,
  members: [...room.members.values()].map(m => ({ id: m.id, name: m.name, isHost: m.id === room.hostId })),
  current: room.current, playback: room.playback,
  requests: room.requests.slice(-30), messages: room.messages.slice(-60)
});
function emitRoom(room) { io.to(room.code).emit("room:update", publicRoom(room)); }
function getRoom(socket) { return socket.data.roomCode ? rooms.get(socket.data.roomCode) : null; }
function leaveRoom(socket) {
  const room = getRoom(socket);
  if (!room) return;
  room.members.delete(socket.id);
  socket.leave(room.code);
  socket.data.roomCode = null;
  if (!room.members.size) rooms.delete(room.code);
  else {
    if (room.hostId === socket.id) room.hostId = room.members.keys().next().value;
    emitRoom(room);
  }
}
io.on("connection", socket => {
  socket.on("room:create", ({ name } = {}, done = () => {}) => {
    leaveRoom(socket);
    let code;
    do { code = makeCode(); } while (rooms.has(code));
    const member = { id: socket.id, name: cleanText(name, 28) || "Anfitrião" };
    const room = { code, hostId: socket.id, members: new Map([[socket.id, member]]), current: null,
      playback: { playing: false, time: 0, updatedAt: Date.now() }, requests: [], messages: [] };
    rooms.set(code, room); socket.data.roomCode = code; socket.join(code);
    done({ ok: true, room: publicRoom(room) }); emitRoom(room);
  });
  socket.on("room:join", ({ code, name } = {}, done = () => {}) => {
    const normalized = cleanText(code, 6).toUpperCase();
    const room = rooms.get(normalized);
    if (!room) return done({ ok: false, error: "Sala não encontrada. Confira o código." });
    leaveRoom(socket);
    room.members.set(socket.id, { id: socket.id, name: cleanText(name, 28) || "Convidado" });
    socket.data.roomCode = room.code; socket.join(room.code);
    done({ ok: true, room: publicRoom(room) }); emitRoom(room);
  });
  socket.on("room:leave", () => { leaveRoom(socket); socket.emit("room:left"); });
  socket.on("chat:send", ({ text } = {}) => {
    const room = getRoom(socket), message = cleanText(text, 400), member = room?.members.get(socket.id);
    if (!room || !member || !message) return;
    room.messages.push({ id: crypto.randomUUID(), name: member.name, text: message, at: Date.now() });
    room.messages = room.messages.slice(-100); emitRoom(room);
  });
  socket.on("content:request", ({ title, url } = {}) => {
    const room = getRoom(socket), member = room?.members.get(socket.id), safeTitle = cleanText(title, 160);
    if (!room || !member || !safeTitle) return;
    room.requests.push({ id: crypto.randomUUID(), name: member.name, title: safeTitle, url: cleanText(url, 1500), at: Date.now() });
    room.requests = room.requests.slice(-100); emitRoom(room);
  });
  socket.on("request:dismiss", ({ id } = {}) => {
    const room = getRoom(socket);
    if (!room || room.hostId !== socket.id) return;
    room.requests = room.requests.filter(r => r.id !== id); emitRoom(room);
  });
  socket.on("playback:select", ({ title, url, category } = {}) => {
    const room = getRoom(socket);
    if (!room || room.hostId !== socket.id || typeof url !== "string" || !/^https?:\/\//i.test(url)) return;
    room.current = { title: cleanText(title, 200) || "Sem título", url: url.slice(0, 3000), category: cleanText(category, 80) };
    room.playback = { playing: true, time: 0, updatedAt: Date.now() };
    io.to(room.code).emit("playback:changed", { current: room.current, playback: room.playback }); emitRoom(room);
  });
  socket.on("playback:control", ({ playing, time } = {}) => {
    const room = getRoom(socket);
    if (!room || room.hostId !== socket.id || !room.current) return;
    room.playback = { playing: Boolean(playing), time: Number.isFinite(Number(time)) ? Math.max(0, Number(time)) : room.playback.time, updatedAt: Date.now() };
    io.to(room.code).emit("playback:changed", { current: room.current, playback: room.playback });
  });
  socket.on("disconnect", () => leaveRoom(socket));
});
server.listen(PORT, "0.0.0.0", () => console.log(`CINEFRIEND rodando na porta ${PORT}`));
