import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import * as Service from "./service.js";

const wss = new WebSocketServer({ noServer: true });
let lastClient: WebSocket | null = null;

export function attachWebSocket(server: Server) {
  server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });
}

wss.on("connection", (ws, req) => {
  console.log("WebSocket client connected");
  lastClient = ws;

  const clientIp = req.socket.remoteAddress || "unknown";
  const { clientIdSavedInDatabase } = Service.newClient(clientIp);
  ws.send(JSON.stringify({ type: "connection", clientIdSavedInDatabase }));

  ws.on("message", (message) => {
    console.log("Received message:", message.toString());
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    Service.removeClient(clientIdSavedInDatabase);
    if (lastClient === ws) lastClient = null;
  });
});

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
  lastClient!.send(JSON.stringify({ type: "send-sms", phone, message }));
  return true;
}

export default wss;
