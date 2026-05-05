// server.js — Wochenmenu OPRA Server
const express = require('express');
const session = require('express-session');
const bcrypt  = require('bcryptjs');
const path    = require('path');
const fs      = require('fs');
const db      = require('./db');

const app  = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'opra-menu-2026-intern',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 60 * 60 * 1000 } // 10 Stunden
}));

// ── Auth-Middleware ──────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Nicht angemeldet' });
}
function requireAdmin(req, res, next) {
  if (req.session.role === 'admin') return next();
  res.status(403).json({ error: 'Kein Zugriff' });
}

// ── Hauptseite: HTML + Patch inline injizieren ───────────────
const patchJs = fs.readFileSync(path.join(__dirname, 'public', 'patch.js'), 'utf8');

app.get('/', (req, res) => {
  if (!req.session.userId) return res.redirect('/login.html');
  const htmlPath = path.join(__dirname, 'Menu_OPRA_App.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const lastBody = html.lastIndexOf('</body>');
  if (lastBody !== -1) {
    html = html.slice(0, lastBody) + '<script>\n' + patchJs + '\n</script></body>' + html.slice(lastBody + 7);
  }
  res.send(html);
});

// ── Auth-Routen ──────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Fehlende Felder' });
  const user = db.getUserByUsername(username.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Ungültiger Benutzername oder Passwort' });
  req.session.userId = user.id;
  req.session.name   = user.name;
  req.session.role   = user.role;
  res.json({ name: user.name, role: user.role });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json(null);
  res.json({ id: req.session.userId, name: req.session.name, role: req.session.role });
});

// ── Menu-Routen ──────────────────────────────────────────────
app.get('/api/menu/:year/:week', requireAuth, (req, res) => {
  res.json(db.getMenu(parseInt(req.params.year), parseInt(req.params.week)));
});
app.post('/api/menu/:year/:week', requireAuth, (req, res) => {
  db.saveMenu(parseInt(req.params.year), parseInt(req.params.week), req.body);
  res.json({ ok: true });
});

// ── Benutzer-Routen (nur Admin) ──────────────────────────────
app.get('/api/users', requireAuth, requireAdmin, (req, res) => {
  res.json(db.getUsers());
});
app.post('/api/users', requireAuth, requireAdmin, (req, res) => {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password) return res.status(400).json({ error: 'Fehlende Felder' });
  try {
    db.createUser(name.trim(), username.trim().toLowerCase(), bcrypt.hashSync(password, 10), role || 'admin');
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Benutzername bereits vergeben' });
  }
});
app.delete('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.session.userId) return res.status(400).json({ error: 'Eigenen Account nicht löschbar' });
  db.deleteUser(id);
  res.json({ ok: true });
});
app.post('/api/users/:id/password', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  if (id !== req.session.userId && req.session.role !== 'admin')
    return res.status(403).json({ error: 'Kein Zugriff' });
  const { password } = req.body;
  if (!password || password.length < 4) return res.status(400).json({ error: 'Passwort zu kurz (min. 4 Zeichen)' });
  db.updatePassword(id, bcrypt.hashSync(password, 10));
  res.json({ ok: true });
});

// ── Empfänger-Routen (nur Admin) ─────────────────────────────
app.get('/api/recipients', requireAuth, requireAdmin, (req, res) => {
  res.json(db.getRecipients());
});
app.post('/api/recipients', requireAuth, requireAdmin, (req, res) => {
  const { name, email, gruppe } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name und E-Mail erforderlich' });
  try {
    db.addRecipient(name.trim(), email.trim().toLowerCase(), gruppe || 'beide');
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete('/api/recipients/:id', requireAuth, requireAdmin, (req, res) => {
  db.deleteRecipient(parseInt(req.params.id));
  res.json({ ok: true });
});

// ── Admin-Seite ──────────────────────────────────────────────
app.get('/admin', (req, res) => {
  if (!req.session.userId) return res.redirect('/login.html');
  if (req.session.role !== 'admin') return res.status(403).send('Kein Zugriff');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ✦ Wochenmenu OPRA läuft');
  console.log(`  → Lokal:    http://localhost:${PORT}`);
  console.log(`  → Netzwerk: http://[IP-dieses-PCs]:${PORT}`);
  console.log('');
  console.log('  IP-Adresse dieses PCs finden: ipconfig (Windows)');
  console.log('');
});
