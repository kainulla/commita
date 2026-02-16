import express from "express";
import cardRouter from "./routes/card";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

app.get("/", (_req, res) => {
  res.type("text/html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Commita — GitHub Insights, Beautifully Visualized</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; background: #0d1117; color: #c9d1d9; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem; }
    h1 { font-size: 2.5rem; font-weight: 700; color: #f0f6fc; margin-bottom: 0.5rem; }
    .tagline { color: #8b949e; font-size: 1.1rem; margin-bottom: 2rem; text-align: center; }
    .search { display: flex; gap: 0.5rem; margin-bottom: 2rem; width: 100%; max-width: 400px; }
    input { padding: 0.75rem 1rem; font-size: 1rem; border: 1px solid #30363d; border-radius: 6px; background: #161b22; color: #c9d1d9; flex: 1; min-width: 0; outline: none; }
    input:focus { border-color: #58a6ff; }
    button { padding: 0.75rem 1.5rem; font-size: 1rem; border: none; border-radius: 6px; background: #238636; color: #fff; cursor: pointer; font-weight: 600; white-space: nowrap; }
    button:hover { background: #2ea043; }
    .preview { margin-top: 1.5rem; width: 100%; max-width: 520px; overflow-x: auto; }
    .preview svg { width: 100%; height: auto; }
    .embed-box { margin-top: 1.5rem; background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; width: 100%; max-width: 520px; display: none; }
    .embed-box code { font-size: 0.85rem; color: #58a6ff; word-break: break-all; display: block; margin-bottom: 0.75rem; }
    .embed-box p { margin-bottom: 0.5rem; color: #8b949e; font-size: 0.9rem; }
    .copy-btn { padding: 0.4rem 0.75rem; font-size: 0.85rem; border: 1px solid #30363d; border-radius: 6px; background: #21262d; color: #c9d1d9; cursor: pointer; }
    .copy-btn:hover { background: #30363d; }
    footer { margin-top: 3rem; color: #484f58; font-size: 0.85rem; }
    a { color: #58a6ff; text-decoration: none; }
    @media (max-width: 480px) {
      h1 { font-size: 2rem; }
      .tagline { font-size: 0.95rem; }
      .search { flex-direction: column; }
      button { width: 100%; }
    }
  </style>
</head>
<body>
  <h1>Commita</h1>
  <p class="tagline">Personal GitHub insights, beautifully visualized</p>
  <div class="search">
    <input id="username" type="text" placeholder="Enter GitHub username" />
    <button onclick="generate()">Generate</button>
  </div>
  <div class="preview" id="preview"></div>
  <div class="embed-box" id="embed-box">
    <p>Add this to your GitHub README:</p>
    <code id="embed-code"></code>
    <button class="copy-btn" onclick="copyEmbed()">Copy</button>
  </div>
  <footer><a href="https://github.com/commita">GitHub</a></footer>
  <script>
    function generate() {
      var u = document.getElementById('username').value.trim();
      if (!u) return;
      var p = document.getElementById('preview');
      var box = document.getElementById('embed-box');
      box.style.display = 'none';
      p.innerHTML = '<p style="color:#8b949e">Generating card for @' + u + '...</p>';
      var url = '/' + encodeURIComponent(u) + '?theme=dark';
      console.log('[Commita] Fetching:', url);
      fetch(url)
        .then(function(res) {
          console.log('[Commita] Response:', res.status, res.headers.get('content-type'));
          if (!res.ok) {
            return res.text().then(function(text) { throw new Error(text || ('HTTP ' + res.status)); });
          }
          return res.text();
        })
        .then(function(svg) {
          console.log('[Commita] SVG received, length:', svg.length);
          p.innerHTML = svg;
          var svgEl = p.querySelector('svg');
          if (svgEl) svgEl.style.maxWidth = '100%';
          box.style.display = 'block';
          document.getElementById('embed-code').textContent = '![Commita](' + location.origin + url + ')';
        })
        .catch(function(err) {
          console.error('[Commita] Error:', err);
          p.innerHTML = '<p style="color:#f85149">' + err.message + '</p>';
        });
    }
    function copyEmbed() {
      var code = document.getElementById('embed-code').textContent;
      navigator.clipboard.writeText(code).then(function() {
        var btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
      });
    }
    document.getElementById('username').addEventListener('keydown', function(e) { if (e.key === 'Enter') generate(); });
  </script>
</body>
</html>`);
});

app.use("/", cardRouter);

app.listen(PORT, () => {
  console.log(`Commita server running at http://localhost:${PORT}`);
});

export default app;
