// patch.js — Server-Sync & Auth-Erweiterung für Menü OPRA
// Wird von server.js automatisch vor </body> in die App injiziert.
// Überschreibt saveData/onKWChange mit Server-API-Aufrufen.

(async function () {
  // ── 1. Aktuellen Benutzer laden ──────────────────────────────
  let currentUser = null;
  try {
    const r = await fetch('/api/me');
    currentUser = await r.json();
  } catch (e) {}

  if (!currentUser) {
    window.location.href = '/login.html';
    return;
  }

  // ── 2. Info-Leiste einfügen ──────────────────────────────────
  const bar = document.createElement('div');
  bar.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0',
    'background:#2d5a3d', 'color:#c8a050',
    'display:flex', 'align-items:center', 'justify-content:space-between',
    'padding:7px 20px', 'font-size:12px', 'z-index:9999',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    'border-top:1px solid rgba(200,160,80,0.3)'
  ].join(';');

  const adminLink = currentUser.role === 'admin'
    ? '<a href="/admin" style="color:#c8a050;margin-right:16px;text-decoration:underline">Benutzerverwaltung</a>'
    : '';

  bar.innerHTML = `
    <span>✦ Menü OPRA &nbsp;·&nbsp; Angemeldet als <strong>${currentUser.name}</strong></span>
    <span>
      ${adminLink}
      <button onclick="logout()" style="background:rgba(200,160,80,0.15);border:1px solid rgba(200,160,80,0.4);color:#c8a050;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer;font-family:inherit">Abmelden</button>
    </span>
  `;
  document.body.appendChild(bar);
  // Damit die Leiste den unteren Inhalt nicht verdeckt
  document.body.style.paddingBottom = '38px';

  // ── 3. Abmelden ──────────────────────────────────────────────
  window.logout = async function () {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  };

  // ── 4. Hilfsfunktionen für Server-Sync ──────────────────────
  async function serverLoad(kw, year) {
    try {
      const r = await fetch(`/api/menu/${year}/${kw}`);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  async function serverSave(kw, year) {
    try {
      await fetch(`/api/menu/${year}/${kw}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) // data ist die globale Variable der App
      });
    } catch (e) {}
  }

  // ── 5. saveData patchen: zusätzlich auf Server speichern ─────
  const _origSaveData = window.saveData;
  window.saveData = function () {
    if (_origSaveData) _origSaveData(); // localStorage-Backup
    const kw   = document.getElementById('kw-input').value;
    const year = document.getElementById('year-input').value;
    serverSave(kw, year); // fire-and-forget
  };

  // ── 6. onKWChange patchen: erst Server, dann localStorage ────
  window.onKWChange = async function () {
    const kw   = document.getElementById('kw-input').value;
    const year = document.getElementById('year-input').value;
    const serverData = await serverLoad(kw, year);
    if (serverData) {
      // eslint-disable-next-line no-global-assign
      data = serverData; // globale Variable der App überschreiben
    } else {
      // Fallback: localStorage (für Offline-Betrieb)
      try {
        const key = 'opra_menu_v4_' + kw + '_' + year;
        const stored = localStorage.getItem(key);
        if (stored) data = JSON.parse(stored);
        else resetData();
      } catch (e) { resetData(); }
    }
    render();
  };

  // ── 7. Wochenübersicht ausblenden ───────────────────────────
  window.buildWeekGrid = function () {};
  const weekSection = document.getElementById('week-grid');
  if (weekSection) {
    weekSection.style.display = 'none';
    // Auch den Titel darüber ausblenden
    const prev = weekSection.previousElementSibling;
    if (prev && prev.classList.contains('section-title')) prev.style.display = 'none';
  }

  // ── 8. Initialer Ladevorgang: Server hat Vorrang ─────────────
  const kw   = document.getElementById('kw-input').value;
  const year = document.getElementById('year-input').value;
  const serverData = await serverLoad(kw, year);
  if (serverData) {
    data = serverData;
    render(); // neu rendern mit Serverdaten (überschreibt lokales Init)
  }
  // Falls kein Server-Daten → die App hat bereits localStorage geladen (ihr eigenes Init)

})();
