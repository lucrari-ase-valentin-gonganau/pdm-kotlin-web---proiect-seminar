import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { generateQRCodeUrlForWS } from "./utils";
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => {
    res.render("index");
});
app.get("/qr-code", (_req, res) => {
    const qrDataUrl = generateQRCodeUrlForWS();
    res.render("qr-code", { qrDataUrl });
});
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
//# sourceMappingURL=index.js.map