import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { attachWebSocket, isLastClientConnected, sendToLastClient } from "./ws.js";
import { generateQRCodeUrlForWS, } from "./utils.js";
import { getPendingMessages } from "./service.js";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.render("index");
});

app.get("/qr-code", (_req, res) => {
  const qrDataUrl = generateQRCodeUrlForWS();
  const qrDataUrlOnly = generateQRCodeUrlForWS(true);
  res.render("qr-code", { qrDataUrl, qrDataUrlOnly });
});

app.get("/send-sms", (_req, res) => {
  res.render("send-sms");
});

app.post("/send-sms", (req, res) => {
  const { phone, message } = req.body as { phone: string; message: string };
  const sent = sendToLastClient(phone, message);
  res.json({ ok: true, sent });
});

app.get("/api/ws-status", (_req, res) => {
  res.json({ connected: isLastClientConnected() });
});

app.get("/api/pending-messages", async (_req, res) => {
  const messages = await getPendingMessages();
  res.json(messages);
});

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

attachWebSocket(server);
