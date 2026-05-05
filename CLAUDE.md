# CLAUDE.md – Wochenmenu OPRA Projektblaupause

> Diese Datei ist die zentrale Referenz für die Entwicklung des Wochenmenu OPRA.
> Claude liest diese Datei zu Beginn jeder Session, um den Projektkontext zu kennen.
> Entwicklung erfolgt mit **Claude Code** – kein manuelles Lernen, direkt produzieren.

---

## Generelle Instruktionen (Verhaltensregeln für Claude Code)

**Abwägung:** Diese Richtlinien legen mehr Wert auf Vorsicht als auf Geschwindigkeit.
Bei trivialen Aufgaben ist das eigene Urteilsvermögen zu nutzen.

### 1. Erst nachdenken, dann programmieren
- Annahmen ausdrücklich formulieren. Wenn unklar, nachfragen.
- Wenn mehrere Interpretationen möglich sind, diese darstellen.
- Wenn es einen einfacheren Ansatz gibt, sagen.

### 2. Einfachheit geht vor
- Minimaler Code, der das Problem löst.
- Keine Abstraktionen für einmalig verwendbaren Code.
- Keine „Flexibilität", die nicht angefordert wurde.

### 3. Präzise Änderungen
- Nur das berühren, was unbedingt nötig ist.
- Dem bestehenden Stil anpassen.

---

## 1. Projektbeschreibung

**Wochenmenu OPRA** ist ein internes Web-Tool für ca. 10 Mitarbeitende.
Admins erfassen das Wochen- und Tagesmenü, alle sehen dieselben Daten.

**Organisation:** OPRA  
**Nutzer:** ~10 Personen  
**Rollen:** Admin (Menü bearbeiten) · später: User (Menü bestellen)  
**Hosting:** Lokales Büronetzwerk (ein PC als Server)

---

## 2. Aktueller Entwicklungsstand

### Phase 1 – ABGESCHLOSSEN ✓
Bestehende HTML-App (`Menu_OPRA_App.html`) – funktioniert als Standalone-Tool:
- Menu 1: Vorspeise + Hauptgang + Beilage + Dessert + Fleischherkunft
- Menu 2: Hauptgang + Beilage + Fleischherkunft (teilt Vorspeise von Menu 1)
- Wochennavigation per KW + Jahr
- Wochenübersicht (5-Spalten-Grid)
- Export: HTML / JPG / PDF für 55"-Bildschirm (1920×1080)
- Tagesexport: HTML / JPG / PDF (faltbares A4)
- Speicherung via localStorage (lokal, nicht geteilt)

### Phase 2 – FERTIG GEBAUT ✓ (noch nicht installiert)
Server-Erweiterung: Daten werden geteilt, Login hinzugefügt.

**Neue Dateien:**
```
Menu/
├── CLAUDE.md                ← diese Datei
├── Menu_OPRA_App.html       ← bestehende App (wird vom Server ausgeliefert)
├── package.json             ← Node.js Abhängigkeiten
├── server.js                ← Express-Server, API, Auth
├── db.js                    ← SQLite-Datenbankschicht
├── menu.db                  ← wird automatisch erstellt
└── public/
    ├── login.html           ← Anmeldeseite (grün/gold Design)
    ├── patch.js             ← wird in App injiziert: Server-Sync + Info-Leiste
    └── admin.html           ← Benutzerverwaltung (nur Admins)
```

**Wie es funktioniert:**
1. Server liefert `Menu_OPRA_App.html` aus und injiziert `patch.js` vor `</body>`
2. `patch.js` patcht `saveData()` und `onKWChange()` → Daten gehen auf den Server
3. Alle Nutzer sehen dieselben Daten (SQLite-DB auf dem Server-PC)
4. localStorage bleibt als Offline-Fallback erhalten

---

## 3. Tech-Stack

| Bereich | Technologie |
|---|---|
| Frontend | Bestehendes HTML/CSS/JS (unveränderter Code) |
| Patch-Layer | `patch.js` (injiziert, überschreibt saveData/onKWChange) |
| Backend | Node.js + Express |
| Datenbank | SQLite via `better-sqlite3` |
| Auth | express-session + bcryptjs |
| Hosting | Lokaler PC im Büronetzwerk, Port 3000 |

---

## 4. API-Übersicht

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/login` | Anmelden (username, password) |
| POST | `/api/logout` | Abmelden |
| GET | `/api/me` | Aktueller Benutzer |
| GET | `/api/menu/:year/:week` | Menüdaten laden |
| POST | `/api/menu/:year/:week` | Menüdaten speichern |
| GET | `/api/users` | Alle Benutzer (Admin) |
| POST | `/api/users` | Benutzer anlegen (Admin) |
| DELETE | `/api/users/:id` | Benutzer löschen (Admin) |
| POST | `/api/users/:id/password` | Passwort ändern |

---

## 5. Datenstruktur (SQLite)

**Tabelle `users`:**
- id, name, username, password_hash, role (admin)

**Tabelle `menus`:**
- id, year, week, data (JSON-String), updated_at

**Menü-Datenformat (JSON):**
```json
[
  [ {"vorspeise":"","hauptgang":"","beilage":"","dessert":"","fleisch":""}, ... ],
  [ {"hauptgang":"","beilage":"","fleisch":""}, ... ]
]
```
Index 0 = Menu 1, Index 1 = Menu 2, je 5 Einträge (Mo–Fr)

---

## 6. Standard-Zugangsdaten (erster Start)

```
Benutzername: admin
Passwort:     opra2026
```
→ **Sofort nach erstem Login in der Benutzerverwaltung ändern!**

---

## 7. Installation & Start

### Einmalig (auf dem Server-PC):
```bash
# Im Ordner Menu/ ausführen:
npm install
node server.js
```

### Täglicher Betrieb:
```bash
node server.js
```
→ App erreichbar unter `http://[IP-des-Server-PCs]:3000`

### IP-Adresse des Server-PCs herausfinden:
```
Windows: ipconfig
Mac/Linux: ifconfig
```

---

## 8. Nächste Schritte

### Sofort (Betreiber):
- [ ] Node.js installieren → https://nodejs.org (LTS)
- [ ] Im Ordner `Menu/` Terminal öffnen: `npm install` → `node server.js`
- [ ] Browser öffnen: `http://localhost:3000`
- [ ] Admin-Login testen, Passwort ändern
- [ ] Alle 10 Benutzer anlegen (Benutzerverwaltung)
- [ ] Anderen PCs die URL mitteilen: `http://[Server-IP]:3000`

### Phase 3 – Geplant (auf Anfrage):
- [ ] Bestellfunktion: Benutzer wählen täglich "Menu 1" oder "Menu 2"
- [ ] Auswertung: wer hat was bestellt (pro Tag / pro Woche)
- [ ] E-Mail-Versand des Wochenmenus
- [ ] Automatisch starten beim Windows-Start (PM2 oder Task Scheduler)

---

## 9. Design-Token (für UI-Konsistenz)

```css
--gruen:    #2d5a3d   /* Hauptfarbe, Buttons, Header */
--gruen2:   #3d6b50   /* Wandtafel-Hintergrund */
--braun:    #6b5030   /* Menu 2 */
--gold:     #c8a050   /* Schrift auf Grün */
--gold2:    #e8c878   /* Helleres Gold */
--creme:    #f5efe0   /* Heller Hintergrund */
--bg:       #f0efe8   /* App-Hintergrund */
--schrift:  Cormorant Garamond, Cinzel, Great Vibes  /* Exportschriften */
```

---

*Letzte Aktualisierung: Mai 2026*
*Projektname: Wochenmenu OPRA*
*Entwicklung: Claude Code*
*Plattform: Node.js + Express + SQLite (lokales Netzwerk)*
