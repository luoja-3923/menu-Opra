// themes.js — Design-Themes für Menü OPRA Exports
// Überschreibt die Export-Funktionen mit Theme-Support
// Wird automatisch nach patch.js in die App injiziert

(async function initThemes() {

  const DAYS_DE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
  const GFONTS  = '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" rel="stylesheet">';

  // ── Logo laden ───────────────────────────────────────────────
  let LOGO = null;
  try {
    const r = await fetch('/opra-logo.png');
    const blob = await r.blob();
    LOGO = await new Promise(res => {
      const rd = new FileReader();
      rd.onload = () => res(rd.result);
      rd.readAsDataURL(blob);
    });
  } catch(e) {}

  // ── Design-Definitionen ──────────────────────────────────────
  const THEMES = {
    waldgruen: {
      label: '🌿 Waldgrün',
      bg:        '#2d5a3d',
      bg2:       '#3d6b50',
      text:      '#f5efe0',
      textMuted: 'rgba(245,239,224,0.58)',
      gold:      '#c8a050',
      menu2:     '#e8c878',
      border:    'rgba(200,160,80,0.42)',
      divider:   'rgba(200,160,80,0.22)',
      logoInvert: true,
    },
    blanc: {
      label: '✦ Blanc & Or',
      bg:        '#fdfbf7',
      bg2:       '#f0ece0',
      text:      '#1a1a1a',
      textMuted: '#888',
      gold:      '#9a6c28',
      menu2:     '#6b4520',
      border:    'rgba(154,108,40,0.38)',
      divider:   'rgba(154,108,40,0.18)',
      logoInvert: false,
    },
    noir: {
      label: '◆ Noir Élégant',
      bg:        '#0f0f0f',
      bg2:       '#1c1c1c',
      text:      '#e8e0d0',
      textMuted: 'rgba(232,224,208,0.48)',
      gold:      '#c8a050',
      menu2:     '#e8c878',
      border:    'rgba(200,160,80,0.30)',
      divider:   'rgba(200,160,80,0.14)',
      logoInvert: true,
    },
  };

  let activeKey = localStorage.getItem('opra_theme') || 'waldgruen';
  const T = () => THEMES[activeKey] || THEMES.waldgruen;

  // ── Hilfsfunktionen ──────────────────────────────────────────
  function kwDate(kw, year, di) {
    const jan4 = new Date(year, 0, 4);
    const mon  = new Date(jan4);
    mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (kw - 1) * 7 + di);
    return mon.toLocaleDateString('de-CH', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  function logoImg(h, invert) {
    if (!LOGO) return `<span style="font-family:'Cinzel',Georgia,serif;color:#c8a050;font-size:${Math.round(h*0.45)}px;letter-spacing:.15em;">OPRA</span>`;
    return `<img src="${LOGO}" alt="OPRA" style="height:${h}px;display:block;${invert ? 'filter:brightness(0) invert(1);' : ''}">`;
  }

  function menuData() {
    return typeof data !== 'undefined' ? data : [[], []];
  }

  function setStatus(msg) {
    ['export-status','day-export-status'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = msg;
    });
  }

  function getKW() {
    return {
      kw:   parseInt(document.getElementById('kw-input').value)   || 1,
      year: parseInt(document.getElementById('year-input').value) || 2026,
    };
  }

  function getDayIdx(arg) {
    if (arg !== undefined && arg !== null) return parseInt(arg);
    return typeof currentDay !== 'undefined' ? currentDay : 0;
  }

  function dl(content, mime, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = name;
    a.click();
  }

  function slug(key) { return THEMES[key] ? THEMES[key].label.replace(/[^a-zA-Z]/g,'') : key; }

  // ── Canvas-Renderer ──────────────────────────────────────────
  function toCanvas(cardHtml, w, h) {
    return new Promise((resolve, reject) => {
      if (typeof html2canvas === 'undefined') {
        reject(new Error('html2canvas nicht verfügbar')); return;
      }
      const wrap = document.createElement('div');
      wrap.style.cssText = `position:fixed;left:-${w + 200}px;top:0;width:${w}px;height:${h}px;overflow:hidden;z-index:0;`;
      wrap.innerHTML = cardHtml;
      document.body.appendChild(wrap);
      setTimeout(() => {
        html2canvas(wrap.firstElementChild || wrap, {
          width: w, height: h, scale: 1, useCORS: true, allowTaint: true, logging: false,
        }).then(canvas => {
          document.body.removeChild(wrap);
          resolve(canvas);
        }).catch(err => {
          if (document.body.contains(wrap)) document.body.removeChild(wrap);
          reject(err);
        });
      }, 700);
    });
  }

  // ── WOCHENKARTE 1920 × 1080 ──────────────────────────────────
  function weekCard(t, kw, year) {
    const [m1, m2] = menuData();

    const cols = DAYS_DE.map((day, i) => {
      const d1 = (m1 && m1[i]) || {};
      const d2 = (m2 && m2[i]) || {};
      const dt  = kwDate(kw, year, i);
      return `
      <div style="padding:20px 18px;border-right:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;">
        <div style="font-family:'Cinzel',Georgia,serif;color:${t.gold};font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:3px;">${day}</div>
        <div style="font-size:11px;color:${t.textMuted};margin-bottom:15px;">${dt}</div>

        ${d1.vorspeise ? `
        <div style="margin-bottom:13px;">
          <div style="font-size:8.5px;color:${t.gold};text-transform:uppercase;letter-spacing:.12em;margin-bottom:4px;">Vorspeise</div>
          <div style="font-size:13.5px;color:${t.text};font-family:Georgia,serif;font-style:italic;line-height:1.35;">${d1.vorspeise}</div>
        </div>` : ''}

        <div style="border-top:1px solid ${t.divider};padding-top:13px;margin-bottom:13px;">
          <div style="font-size:8.5px;color:${t.gold};text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px;">Menu 1</div>
          ${d1.hauptgang ? `<div style="font-size:16.5px;color:${t.text};font-family:Georgia,serif;font-weight:bold;line-height:1.25;margin-bottom:3px;">${d1.hauptgang}</div>` : ''}
          ${d1.beilage   ? `<div style="font-size:12.5px;color:${t.textMuted};font-family:Georgia,serif;font-style:italic;margin-bottom:2px;">${d1.beilage}</div>` : ''}
          ${d1.dessert   ? `<div style="font-size:12px;color:${t.textMuted};font-family:Georgia,serif;">${d1.dessert}</div>` : ''}
          ${d1.fleisch   ? `<div style="font-size:9.5px;color:${t.textMuted};margin-top:5px;font-style:italic;">${d1.fleisch}</div>` : ''}
        </div>

        <div style="border-top:1px solid ${t.divider};padding-top:13px;">
          <div style="font-size:8.5px;color:${t.menu2};text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px;">Menu 2</div>
          ${d2.hauptgang ? `<div style="font-size:16.5px;color:${t.text};font-family:Georgia,serif;font-weight:bold;line-height:1.25;margin-bottom:3px;">${d2.hauptgang}</div>` : ''}
          ${d2.beilage   ? `<div style="font-size:12.5px;color:${t.textMuted};font-family:Georgia,serif;font-style:italic;margin-bottom:2px;">${d2.beilage}</div>` : ''}
          ${d2.fleisch   ? `<div style="font-size:9.5px;color:${t.textMuted};margin-top:5px;font-style:italic;">${d2.fleisch}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    return `
    <div style="width:1920px;height:1080px;background:${t.bg};display:flex;flex-direction:column;font-family:Georgia,serif;">
      <div style="background:${t.bg2};padding:16px 40px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${t.border};flex-shrink:0;min-height:86px;">
        ${logoImg(52, t.logoInvert)}
        <div style="text-align:center;">
          <div style="font-family:'Cinzel',Georgia,serif;color:${t.gold};font-size:18px;letter-spacing:.2em;text-transform:uppercase;">Wochenmenu</div>
          <div style="color:${t.textMuted};font-size:13px;margin-top:4px;letter-spacing:.06em;">Kalenderwoche ${kw} &nbsp;·&nbsp; ${year}</div>
        </div>
        <div style="font-family:'Cinzel',Georgia,serif;color:${t.textMuted};font-size:9.5px;letter-spacing:.1em;text-align:right;line-height:1.7;">QUALIFIZIERENDES<br>ARBEITSMARKTPROGRAMM</div>
      </div>
      <div style="flex:1;display:grid;grid-template-columns:repeat(5,1fr);overflow:hidden;">
        ${cols}
      </div>
    </div>`;
  }

  function weekDoc(t, kw, year) {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">${GFONTS}<style>*{margin:0;padding:0;box-sizing:border-box}body{width:1920px;height:1080px;overflow:hidden;background:${t.bg};}</style></head><body>${weekCard(t,kw,year)}</body></html>`;
  }

  // ── TAGESKARTE A4 (794 × 1123 px) ───────────────────────────
  function dayCard(t, kw, year, di) {
    const [m1, m2] = menuData();
    const d1 = (m1 && m1[di]) || {};
    const d2 = (m2 && m2[di]) || {};
    const dayName = DAYS_DE[di] || '';
    const dt = kwDate(kw, year, di);

    const rows = (items) => items
      .filter(([, v]) => v)
      .map(([k, v]) => `
        <tr>
          <td style="font-size:13px;color:${t.textMuted};width:100px;padding:7px 14px 7px 0;vertical-align:top;white-space:nowrap;">${k}</td>
          <td style="font-size:20px;color:${t.text};font-family:Georgia,serif;font-style:italic;line-height:1.3;padding:5px 0;">${v}</td>
        </tr>`
      ).join('');

    const m1rows = rows([['Vorspeise',d1.vorspeise],['Hauptgang',d1.hauptgang],['Beilage',d1.beilage],['Dessert',d1.dessert],['Fleisch',d1.fleisch]]);
    const m2rows = rows([['Hauptgang',d2.hauptgang],['Beilage',d2.beilage],['Fleisch',d2.fleisch]]);

    return `
    <div style="width:794px;height:1123px;background:${t.bg};display:flex;flex-direction:column;font-family:Georgia,serif;">
      <div style="background:${t.bg2};padding:28px 48px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${t.border};flex-shrink:0;">
        ${logoImg(64, t.logoInvert)}
        <div style="text-align:right;">
          <div style="font-family:'Cinzel',Georgia,serif;color:${t.gold};font-size:22px;letter-spacing:.12em;">${dayName.toUpperCase()}</div>
          <div style="color:${t.textMuted};font-size:14px;margin-top:5px;">${dt} &nbsp;·&nbsp; KW ${kw} / ${year}</div>
        </div>
      </div>
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;padding:38px 48px;gap:0;align-content:start;">
        <div style="padding-right:32px;border-right:1px solid ${t.border};">
          <div style="font-family:'Cinzel',Georgia,serif;color:${t.gold};font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid ${t.border};">Menu 1</div>
          <table style="border-collapse:collapse;width:100%;">${m1rows}</table>
        </div>
        <div style="padding-left:32px;">
          <div style="font-family:'Cinzel',Georgia,serif;color:${t.menu2};font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid ${t.border};">Menu 2</div>
          <table style="border-collapse:collapse;width:100%;">${m2rows}</table>
        </div>
      </div>
      <div style="padding:14px 48px;border-top:1px solid ${t.border};text-align:center;flex-shrink:0;">
        <span style="font-family:'Cinzel',Georgia,serif;color:${t.textMuted};font-size:9px;letter-spacing:.18em;">OPRA &nbsp;·&nbsp; QUALIFIZIERENDES ARBEITSMARKTPROGRAMM</span>
      </div>
    </div>`;
  }

  function dayDoc(t, kw, year, di) {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">${GFONTS}<style>*{margin:0;padding:0;box-sizing:border-box}body{width:794px;height:1123px;overflow:hidden;background:${t.bg};}</style></head><body>${dayCard(t,kw,year,di)}</body></html>`;
  }

  // ── Export-Overrides ─────────────────────────────────────────
  window.exportWeekHTML = function() {
    const {kw,year} = getKW(); const t = T();
    dl(weekDoc(t,kw,year), 'text/html', `OPRA_Woche_KW${kw}_${year}_${slug(activeKey)}.html`);
    setStatus('HTML heruntergeladen — F11 für Vollbild.');
  };

  window.exportWeekJPG = function() {
    const {kw,year} = getKW(); const t = T();
    setStatus('JPG wird erstellt…');
    toCanvas(weekCard(t,kw,year), 1920, 1080)
      .then(c => c.toBlob(b => {
        dl(b, 'image/jpeg', `OPRA_Woche_KW${kw}_${year}_${slug(activeKey)}.jpg`);
        setStatus('JPG heruntergeladen.');
      }, 'image/jpeg', 0.95))
      .catch(() => setStatus('Fehler beim JPG-Export.'));
  };

  window.exportWeekPDF = function() {
    const {kw,year} = getKW(); const t = T();
    setStatus('PDF wird erstellt…');
    toCanvas(weekCard(t,kw,year), 1920, 1080)
      .then(c => {
        const {jsPDF} = window.jspdf;
        const doc = new jsPDF({orientation:'landscape', unit:'mm', format:'a4'});
        doc.addImage(c.toDataURL('image/jpeg',0.95), 'JPEG', 0, 0, 297, 210);
        doc.save(`OPRA_Woche_KW${kw}_${year}_${slug(activeKey)}.pdf`);
        setStatus('PDF heruntergeladen.');
      })
      .catch(() => setStatus('Fehler beim PDF-Export.'));
  };

  window.exportDayHTML = function(di) {
    const {kw,year} = getKW(); const t = T(); const i = getDayIdx(di);
    dl(dayDoc(t,kw,year,i), 'text/html', `OPRA_Tag_${DAYS_DE[i]}_KW${kw}_${slug(activeKey)}.html`);
    setStatus('HTML heruntergeladen.');
  };

  window.exportDayJPG = function(di) {
    const {kw,year} = getKW(); const t = T(); const i = getDayIdx(di);
    setStatus('JPG wird erstellt…');
    toCanvas(dayCard(t,kw,year,i), 794, 1123)
      .then(c => c.toBlob(b => {
        dl(b, 'image/jpeg', `OPRA_Tag_${DAYS_DE[i]}_KW${kw}_${slug(activeKey)}.jpg`);
        setStatus('JPG heruntergeladen.');
      }, 'image/jpeg', 0.95))
      .catch(() => setStatus('Fehler beim JPG-Export.'));
  };

  window.exportDayPDF = function(di) {
    const {kw,year} = getKW(); const t = T(); const i = getDayIdx(di);
    setStatus('PDF wird erstellt…');
    toCanvas(dayCard(t,kw,year,i), 794, 1123)
      .then(c => {
        const {jsPDF} = window.jspdf;
        const doc = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
        doc.addImage(c.toDataURL('image/jpeg',0.95), 'JPEG', 0, 0, 210, 297);
        doc.save(`OPRA_Tag_${DAYS_DE[i]}_KW${kw}_${slug(activeKey)}.pdf`);
        setStatus('PDF heruntergeladen.');
      })
      .catch(() => setStatus('Fehler beim PDF-Export.'));
  };

  // ── Design-Picker in der Info-Leiste ─────────────────────────
  setTimeout(() => {
    // Findet die grüne Leiste unten (von patch.js hinzugefügt)
    const bar = Array.from(document.querySelectorAll('div')).find(el =>
      el.style.position === 'fixed' && el.style.bottom === '0px' && el.style.left === '0px'
    );
    if (!bar) return;
    const span = bar.querySelector('span:last-child');
    if (!span) return;

    const sel = document.createElement('select');
    sel.title = 'Export-Design wählen';
    sel.style.cssText = [
      'background:rgba(200,160,80,0.15)',
      'border:1px solid rgba(200,160,80,0.4)',
      'color:#c8a050',
      'border-radius:6px',
      'padding:3px 8px',
      'font-size:12px',
      'cursor:pointer',
      'font-family:inherit',
      'margin-right:10px',
      'outline:none',
    ].join(';');

    Object.entries(THEMES).forEach(([key, th]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = th.label;
      if (key === activeKey) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', e => {
      activeKey = e.target.value;
      localStorage.setItem('opra_theme', activeKey);
    });

    span.insertBefore(sel, span.firstChild);
  }, 500);

})();
