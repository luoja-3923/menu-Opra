// db.js — JSON-Datei-Datenbank für Wochenmenu OPRA
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR        = path.join(__dirname, 'data');
const USERS_FILE      = path.join(DATA_DIR, 'users.json');
const MENUS_FILE      = path.join(DATA_DIR, 'menus.json');
const RECIPIENTS_FILE = path.join(DATA_DIR, 'recipients.json');
const SMTP_FILE       = path.join(DATA_DIR, 'smtp.json');

// data/-Ordner anlegen falls nicht vorhanden
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// ── Hilfsfunktionen ──────────────────────────────────────────
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}
function readMenus() {
  if (!fs.existsSync(MENUS_FILE)) return {};
  return JSON.parse(fs.readFileSync(MENUS_FILE, 'utf8'));
}
function writeMenus(menus) {
  fs.writeFileSync(MENUS_FILE, JSON.stringify(menus, null, 2), 'utf8');
}
function readRecipients() {
  if (!fs.existsSync(RECIPIENTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf8'));
}
function writeRecipients(list) {
  fs.writeFileSync(RECIPIENTS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// ── Standard-Admin anlegen beim ersten Start ─────────────────
const users = readUsers();
if (users.length === 0) {
  const hash = bcrypt.hashSync('opra2026', 10);
  writeUsers([{ id: 1, name: 'Administrator', username: 'admin', password_hash: hash, role: 'admin' }]);
  console.log('');
  console.log('  ✦ Standard-Benutzer angelegt:');
  console.log('    Benutzername: admin');
  console.log('    Passwort:     opra2026');
  console.log('  → Bitte nach dem ersten Login ändern!');
  console.log('');
}

// ── Exportierte Funktionen ───────────────────────────────────
module.exports = {
  // Benutzer
  getUserByUsername(username) {
    return readUsers().find(u => u.username === username) || null;
  },
  getUsers() {
    return readUsers().map(({ id, name, username, role }) => ({ id, name, username, role }));
  },
  createUser(name, username, passwordHash, role) {
    const users = readUsers();
    if (users.find(u => u.username === username)) throw new Error('Benutzername bereits vergeben');
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.push({ id, name, username, password_hash: passwordHash, role });
    writeUsers(users);
    return id;
  },
  updatePassword(id, passwordHash) {
    const users = readUsers();
    const user = users.find(u => u.id === id);
    if (user) { user.password_hash = passwordHash; writeUsers(users); }
  },
  deleteUser(id) {
    writeUsers(readUsers().filter(u => u.id !== id));
  },

  // Menus
  getMenu(year, week) {
    const menus = readMenus();
    return menus[`${year}_${week}`] || null;
  },
  saveMenu(year, week, data) {
    const menus = readMenus();
    menus[`${year}_${week}`] = data;
    writeMenus(menus);
  },

  // Empfänger (Verteilerliste)
  getRecipients() {
    return readRecipients();
  },
  addRecipient(name, email, gruppe) {
    const list = readRecipients();
    if (list.find(r => r.email.toLowerCase() === email.toLowerCase()))
      throw new Error('E-Mail bereits vorhanden');
    const id = list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1;
    list.push({ id, name, email, gruppe });
    writeRecipients(list);
    return id;
  },
  deleteRecipient(id) {
    writeRecipients(readRecipients().filter(r => r.id !== id));
  },

  // SMTP-Konfiguration
  getSmtp() {
    if (!fs.existsSync(SMTP_FILE)) return null;
    return JSON.parse(fs.readFileSync(SMTP_FILE, 'utf8'));
  },
  saveSmtp(config) {
    fs.writeFileSync(SMTP_FILE, JSON.stringify(config, null, 2), 'utf8');
  }
};
