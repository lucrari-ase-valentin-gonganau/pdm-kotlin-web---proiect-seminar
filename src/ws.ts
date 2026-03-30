import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import * as Service from "./service.js";

const wss = new WebSocketServer({ noServer: true });
let lastClient: WebSocket | null = null;

const ACK_TIMEOUT_MS = 5000;
type AckEntry = { timer: ReturnType<typeof setTimeout>; onAck?: () => void };
const pendingAcks = new Map<string, AckEntry>();

export function attachWebSocket(server: Server) {
  server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });
}

async function flushPending() {
  const messages = await Service.getPendingMessages();
  for (const msg of messages) {
    sendWithAck(msg.phone, msg.message, msg.id);
  }
}

function sendWithAck(phone: string, message: string, pendingId?: number) {
  if (!isLastClientConnected()) return;

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  lastClient!.send(JSON.stringify({ type: "send-sms", id, phone, message }));
  console.log("Sending message:", { id, phone, message });

  const timer = setTimeout(() => {
    pendingAcks.delete(id);
    console.log("No ack for message, saving to pending:", id);
    if (!pendingId) Service.savePendingMessage(phone, message);
  }, ACK_TIMEOUT_MS);

  pendingAcks.set(id, { timer, onAck: () => pendingId && Service.deletePendingMessage(pendingId) });
}

async function handleConnection(ws: WebSocket, req: import("http").IncomingMessage) {
  console.log("WebSocket client connected");
  lastClient = ws;

  const clientIp = req.socket.remoteAddress || "unknown";
  const { clientIdSavedInDatabase } = await Service.newClient(clientIp);
  ws.send(JSON.stringify({ type: "connection", clientIdSavedInDatabase }));

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString()) as { type: string; id?: string };
      console.log("Received from client:", data);
      if (data.type === "ack" && data.id) {
        const entry = pendingAcks.get(data.id);
        if (entry) {
          clearTimeout(entry.timer);
          entry.onAck?.();
          pendingAcks.delete(data.id);
          console.log("Ack received for message:", data.id);
        }
      }
    } catch {
      console.log("Received non-JSON message:", raw.toString());
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    Service.removeClient(clientIdSavedInDatabase);
    if (lastClient === ws) lastClient = null;
  });

  // flush dupa ce message handler e inregistrat
  flushPending();
}

wss.on("connection", (ws, req) => { handleConnection(ws, req); });

wss.addListener("error", (error) => {
  console.error("WebSocket error:", error);
});

export function isLastClientConnected() {
  return lastClient !== null && lastClient.readyState === WebSocket.OPEN;
}

export function sendToLastClient(phone: string, message: string) {
  if (!isLastClientConnected()) {
    Service.savePendingMessage(phone, message);
    return false;
  }

  sendWithAck(phone, message);
  return true;
}

export default wss;
