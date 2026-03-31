import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import {
  attachWebSocket,
  isLastClientConnected,
  sendToLastClient,
} from "./ws.js";
import { generateQRCodeUrlForWS } from "./utils.js";
import { getPendingMessages } from "./service.js";

const API_TOKEN = crypto.randomBytes(32).toString("hex");

const app = express();

function requireBearer(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${API_TOKEN}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/", (_req, res) => {
  const apkExists = fs.existsSync(
    path.join(process.cwd(), "public", "app.apk"),
  );
  res.render("index", { apkExists });
});

app.get("/qr-code", (_req, res) => {
  const qrDataUrl = generateQRCodeUrlForWS();
  const qrDataUrlOnly = generateQRCodeUrlForWS(true);
  res.render("qr-code", { qrDataUrl, qrDataUrlOnly });
});

app.get("/send-sms", (_req, res) => {
  res.render("send-sms", { token: API_TOKEN, host: process.env.HOST });
});

app.post("/send-sms", requireBearer, (req, res) => {
  const { phone, message } = req.body as { phone: string; message: string };
  const normalized = phone?.startsWith("+4") ? phone.slice(2) : phone;
  if (!normalized || !/^07\d{8}$/.test(normalized)) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }
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
  console.log(`API Token: ${API_TOKEN}`);
});

attachWebSocket(server);
