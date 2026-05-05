// themes.js — Modern Design-Themes für Menü OPRA Exports
// 3 Themes: Licht · Nacht · Ton
// Wird nach patch.js injiziert.

(async function initThemes() {

  const DAYS_DE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

  const GFONTS = '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">';

  // ── Logo laden (Original opra26-farbe.png) ───────────────────
  let LOGO = null;
  try {
    const r = await fetch('/opra26-farbe.png');
    if (r.ok) {
      const blob = await r.blob();
      LOGO = await new Promise(res => {
        const rd = new FileReader();
        rd.onload = () => res(rd.result);
        rd.readAsDataURL(blob);
      });
    }
  } catch(e) {}

  // ── Theme-Definitionen ───────────────────────────────────────
  // Jedes Theme: font, bg, bg2, bgStripe, text, sub, accent, accent2, border, divider, logoBg
  const THEMES = {

    licht: {
      label:     '☀ Licht',
      font:      '"DM Sans", system-ui, sans-serif',
      bg:        '#FFFFFF',
      bg2:       '#F2F2F2',
      bgStripe:  '#F8F8F8',
      text:      '#111111',
      sub:       '#777777',
      accent:    '#D63B2F',      // warmes Rot
      accent2:   '#1A1A1A',
      border:    'rgba(0,0,0,0.09)',
      divider:   'rgba(0,0,0,0.05)',
      logoBg:    'transparent',  // weißer Logo-Hintergrund passt direkt
    },

    nacht: {
      label:     '◈ Nacht',
      font:      '"Space Grotesk", system-ui, sans-serif',
      bg:        '#0D1117',
      bg2:       '#161B22',
      bgStripe:  '#0F1318',
      text:      '#E6EDF3',
      sub:       '#7D8590',
      accent:    '#58A6FF',      // helles Blau
      accent2:   '#3FB950',      // grün für Menu 2
      border:    'rgba(255,255,255,0.08)',
      divider:   'rgba(255,255,255,0.04)',
      logoBg:    'white',        // Logo in weißer Pille
    },

    ton: {
      label:     '◻ Ton',
      font:      '"DM Sans", system-ui, sans-serif',
      bg:        '#FAF7F2',
      bg2:       '#EDE8DF',
      bgStripe:  '#F5F1EA',
      text:      '#1E1A14',
      sub:       '#8A7968',
      accent:    '#B85C38',      // Terrakotta
      accent2:   '#6B7C5C',      // gedämpftes Grün
      border:    'rgba(184,92,56,0.14)',
      divider:   'rgba(184,92,56,0.07)',
      logoBg:    'transparent',
    },

  };

  let activeKey = localStorage.getItem('opra_theme') || 'licht';
  const T = () => THEMES[activeKey] || THEMES.licht;

  // ── Hilfsfunktionen ──────────────────────────────────────────
  function kwDate(kw, year, di) {
    const jan4 = new Date(year, 0, 4);
    const mon  = new Date(jan4);
    mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (kw - 1) * 7 + di);
    return mon.toLocaleDateString('de-CH', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  function logoImg(h, t) {
    if (!LOGO) {
      return `<span style="font-family:${t.font};font-weight:700;font-size:${Math.round(h*0.55)}px;color:${t.accent};letter-spacing:-.02em;">OPRA</span>`;
    }
    const wrap = t.logoBg && t.logoBg !== 'transparent'
      ? `background:${t.logoBg};border-radius:5px;padding:5px 10px;display:inline-flex;align-items:center;`
      : `display:inline-flex;align-items:center;`;
    return `<div style="${wrap}"><img src="${LOGO}" alt="OPRA" style="height:${h}px;display:block;"></div>`;
  }

  function menuData() {
    return typeof data !== 'undefined' ? data : [[], []];
  }

  function setStatus(msg) {
    ['export-status', 'day-export-status'].forEach(id => {
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

  function slug(key) {
    return (THEMES[key] ? THEMES[key].label : key).replace(/[^a-zA-Z]/g, '');
  }

  // ── Canvas-Renderer ──────────────────────────────────────────
  function toCanvas(cardHtml, w, h) {
    return new Promise((resolve, reject) => {
      if (typeof html2canvas === 'undefined') {
        reject(new Error('html2canvas nicht verfügbar')); return;
      }
      const wrap = document.createElement('div');
      wrap.style.cssText = `position:fixed;left:-${w + 300}px;top:0;width:${w}px;height:${h}px;overflow:hidden;z-index:0;`;
      wrap.innerHTML = cardHtml;
      document.body.appendChild(wrap);
      setTimeout(() => {
        html2canvas(wrap.firstElementChild || wrap, {
          width: w, height: h, scale: 1,
          useCORS: true, allowTaint: true, logging: false,
        }).then(canvas => {
          document.body.removeChild(wrap);
          resolve(canvas);
        }).catch(err => {
          if (document.body.contains(wrap)) document.body.removeChild(wrap);
          reject(err);
        });
      }, 800);
    });
  }

  // ════════════════════════════════════════════════════════════
  // WOCHENKARTE  1920 × 1080
  // ════════════════════════════════════════════════════════════
  function weekCard(t, kw, year) {
    const [m1, m2] = menuData();

    const cols = DAYS_DE.map((day, i) => {
      const d1  = (m1 && m1[i]) || {};
      const d2  = (m2 && m2[i]) || {};
      const dt  = kwDate(kw, year, i);
      const odd = i % 2 === 1;

      return `
      <div style="
        background:${odd ? t.bgStripe : t.bg};
        border-right:1px solid ${t.border};
        display:flex;flex-direction:column;
        padding:26px 22px 22px;
        overflow:hidden;
        position:relative;
      ">
        <!-- Accent-Linie oben -->
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${t.accent};"></div>

        <!-- Kopfzeile Tag -->
        <div style="margin-bottom:20px;">
          <div style="
            font-family:${t.font};
            font-weight:700;
            font-size:13px;
            color:${t.text};
            text-transform:uppercase;
            letter-spacing:.06em;
            margin-bottom:3px;
          ">${day}</div>
          <div style="
            font-family:${t.font};
            font-size:11px;
            font-weight:300;
            color:${t.sub};
          ">${dt}</div>
        </div>

        ${d1.vorspeise ? `
        <div style="margin-bottom:16px;">
          <div style="font-family:${t.font};font-size:8.5px;font-weight:600;color:${t.sub};text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;">Vorspeise</div>
          <div style="font-family:${t.font};font-size:13px;font-weight:400;color:${t.text};line-height:1.4;font-style:italic;">${d1.vorspeise}</div>
        </div>` : ''}

        <!-- Menu 1 -->
        <div style="margin-bottom:16px;">
          <div style="
            font-family:${t.font};font-size:8.5px;font-weight:700;
            color:${t.accent};text-transform:uppercase;letter-spacing:.1em;
            margin-bottom:9px;
          ">Menu 1</div>
          ${d1.hauptgang ? `<div style="font-family:${t.font};font-size:18px;font-weight:600;color:${t.text};line-height:1.2;letter-spacing:-.015em;margin-bottom:5px;">${d1.hauptgang}</div>` : ''}
          ${d1.beilage   ? `<div style="font-family:${t.font};font-size:12px;font-weight:300;color:${t.sub};margin-bottom:2px;">${d1.beilage}</div>` : ''}
          ${d1.dessert   ? `<div style="font-family:${t.font};font-size:12px;font-weight:300;color:${t.sub};margin-bottom:2px;">${d1.dessert}</div>` : ''}
          ${d1.fleisch   ? `<div style="font-family:${t.font};font-size:10px;font-weight:300;color:${t.sub};font-style:italic;margin-top:4px;">${d1.fleisch}</div>` : ''}
        </div>

        <!-- Trennlinie -->
        <div style="height:1px;background:${t.divider};margin-bottom:14px;"></div>

        <!-- Menu 2 -->
        <div>
          <div style="
            font-family:${t.font};font-size:8.5px;font-weight:700;
            color:${t.accent2};text-transform:uppercase;letter-spacing:.1em;
            margin-bottom:9px;
          ">Menu 2</div>
          ${d2.hauptgang ? `<div style="font-family:${t.font};font-size:18px;font-weight:600;color:${t.text};line-height:1.2;letter-spacing:-.015em;margin-bottom:5px;">${d2.hauptgang}</div>` : ''}
          ${d2.beilage   ? `<div style="font-family:${t.font};font-size:12px;font-weight:300;color:${t.sub};margin-bottom:2px;">${d2.beilage}</div>` : ''}
          ${d2.fleisch   ? `<div style="font-family:${t.font};font-size:10px;font-weight:300;color:${t.sub};font-style:italic;margin-top:4px;">${d2.fleisch}</div>` : ''}
        </div>

      </div>`;
    }).join('');

    return `
    <div style="width:1920px;height:1080px;background:${t.bg};display:flex;flex-direction:column;font-family:${t.font};">

      <!-- Header -->
      <div style="
        background:${t.bg2};
        padding:0 48px;
        height:82px;
        flex-shrink:0;
        display:flex;
        align-items:center;
        justify-content:space-between;
        border-bottom:3px solid ${t.accent};
      ">
        ${logoImg(46, t)}

        <div style="text-align:center;">
          <div style="font-family:${t.font};font-weight:700;font-size:20px;color:${t.text};letter-spacing:-.02em;">Wochenmenu</div>
          <div style="font-family:${t.font};font-size:12px;font-weight:300;color:${t.sub};margin-top:3px;letter-spacing:.03em;">Kalenderwoche ${kw} &nbsp;·&nbsp; ${year}</div>
        </div>

        <div style="font-family:${t.font};color:${t.sub};font-size:10px;font-weight:400;letter-spacing:.08em;text-align:right;line-height:1.9;text-transform:uppercase;">
          Qualifizierendes<br>Arbeitsmarktprogramm
        </div>
      </div>

      <!-- 5 Tagesspalten -->
      <div style="flex:1;display:grid;grid-template-columns:repeat(5,1fr);overflow:hidden;">
        ${cols}
      </div>

    </div>`;
  }

  function weekDoc(t, kw, year) {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">${GFONTS}
<style>*{margin:0;padding:0;box-sizing:border-box}body{width:1920px;height:1080px;overflow:hidden;background:${t.bg};}</style>
</head><body>${weekCard(t, kw, year)}</body></html>`;
  }

  // ════════════════════════════════════════════════════════════
  // TAGESKARTE  794 × 1123 (A4 Hochformat)
  // ════════════════════════════════════════════════════════════
  function dayCard(t, kw, year, di) {
    const [m1, m2] = menuData();
    const d1      = (m1 && m1[di]) || {};
    const d2      = (m2 && m2[di]) || {};
    const dayName = DAYS_DE[di] || '';
    const dt      = kwDate(kw, year, di);

    function field(label, value) {
      if (!value) return '';
      return `
      <div style="margin-bottom:24px;">
        <div style="font-family:${t.font};font-size:9px;font-weight:600;color:${t.sub};text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">${label}</div>
        <div style="font-family:${t.font};font-size:22px;font-weight:500;color:${t.text};line-height:1.3;letter-spacing:-.015em;">${value}</div>
      </div>`;
    }

    const m1rows = [
      field('Vorspeise', d1.vorspeise),
      field('Hauptgang', d1.hauptgang),
      field('Beilage',   d1.beilage),
      field('Dessert',   d1.dessert),
      d1.fleisch ? `<div style="font-family:${t.font};font-size:11px;font-weight:300;color:${t.sub};font-style:italic;margin-top:-12px;margin-bottom:20px;">${d1.fleisch}</div>` : '',
    ].join('');

    const m2rows = [
      field('Hauptgang', d2.hauptgang),
      field('Beilage',   d2.beilage),
      d2.fleisch ? `<div style="font-family:${t.font};font-size:11px;font-weight:300;color:${t.sub};font-style:italic;margin-top:-12px;margin-bottom:20px;">${d2.fleisch}</div>` : '',
    ].join('');

    return `
    <div style="width:794px;height:1123px;background:${t.bg};display:flex;flex-direction:column;font-family:${t.font};">

      <!-- Header -->
      <div style="background:${t.bg2};padding:32px 52px 28px;border-bottom:3px solid ${t.accent};flex-shrink:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;">
          ${logoImg(44, t)}
          <div style="text-align:right;">
            <div style="font-family:${t.font};font-size:11px;font-weight:600;color:${t.sub};text-transform:uppercase;letter-spacing:.08em;">KW ${kw} · ${year}</div>
            <div style="font-family:${t.font};font-size:11px;font-weight:300;color:${t.sub};margin-top:2px;">${dt}</div>
          </div>
        </div>
        <!-- Grosser Tagname -->
        <div style="font-family:${t.font};font-weight:700;font-size:52px;color:${t.text};letter-spacing:-.04em;line-height:1;">${dayName}</div>
      </div>

      <!-- Inhalt: Menu 1 + Menu 2 nebeneinander -->
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;">

        <!-- Menu 1 -->
        <div style="padding:38px 36px 32px 52px;border-right:1px solid ${t.border};">
          <div style="
            font-family:${t.font};font-size:10px;font-weight:700;
            color:${t.accent};text-transform:uppercase;letter-spacing:.15em;
            margin-bottom:28px;padding-bottom:12px;border-bottom:2px solid ${t.accent};
          ">Menu 1</div>
          ${m1rows}
        </div>

        <!-- Menu 2 -->
        <div style="padding:38px 52px 32px 36px;">
          <div style="
            font-family:${t.font};font-size:10px;font-weight:700;
            color:${t.accent2};text-transform:uppercase;letter-spacing:.15em;
            margin-bottom:28px;padding-bottom:12px;border-bottom:2px solid ${t.accent2};
          ">Menu 2</div>
          ${m2rows}
        </div>

      </div>

      <!-- Footer -->
      <div style="
        padding:14px 52px;
        border-top:1px solid ${t.border};
        flex-shrink:0;
        display:flex;
        justify-content:space-between;
        align-items:center;
      ">
        <span style="font-family:${t.font};color:${t.sub};font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">OPRA</span>
        <span style="font-family:${t.font};color:${t.sub};font-size:9px;font-weight:300;letter-spacing:.08em;text-transform:uppercase;">Qualifizierendes Arbeitsmarktprogramm</span>
      </div>

    </div>`;
  }

  function dayDoc(t, kw, year, di) {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">${GFONTS}
<style>*{margin:0;padding:0;box-sizing:border-box}body{width:794px;height:1123px;overflow:hidden;background:${t.bg};}</style>
</head><body>${dayCard(t, kw, year, di)}</body></html>`;
  }

  // ── Export-Overrides ─────────────────────────────────────────
  window.exportWeekHTML = function () {
    const { kw, year } = getKW(); const t = T();
    dl(weekDoc(t, kw, year), 'text/html', `OPRA_Woche_KW${kw}_${year}_${slug(activeKey)}.html`);
    setStatus('HTML heruntergeladen — F11 für Vollbild.');
  };

  window.exportWeekJPG = function () {
    const { kw, year } = getKW(); const t = T();
    setStatus('JPG wird erstellt…');
    toCanvas(weekCard(t, kw, year), 1920, 1080)
      .then(c => c.toBlob(b => {
        dl(b, 'image/jpeg', `OPRA_Woche_KW${kw}_${year}_${slug(activeKey)}.jpg`);
        setStatus('JPG heruntergeladen.');
      }, 'image/jpeg', 0.95))
      .catch(() => setStatus('Fehler beim JPG-Export.'));
  };

  window.exportWeekPDF = function () {
    const { kw, year } = getKW(); const t = T();
    setStatus('PDF wird erstellt…');
    toCanvas(weekCard(t, kw, year), 1920, 1080)
      .then(c => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);
        doc.save(`OPRA_Woche_KW${kw}_${year}_${slug(activeKey)}.pdf`);
        setStatus('PDF heruntergeladen.');
      })
      .catch(() => setStatus('Fehler beim PDF-Export.'));
  };

  window.exportDayHTML = function (di) {
    const { kw, year } = getKW(); const t = T(); const i = getDayIdx(di);
    dl(dayDoc(t, kw, year, i), 'text/html', `OPRA_Tag_${DAYS_DE[i]}_KW${kw}_${slug(activeKey)}.html`);
    setStatus('HTML heruntergeladen.');
  };

  window.exportDayJPG = function (di) {
    const { kw, year } = getKW(); const t = T(); const i = getDayIdx(di);
    setStatus('JPG wird erstellt…');
    toCanvas(dayCard(t, kw, year, i), 794, 1123)
      .then(c => c.toBlob(b => {
        dl(b, 'image/jpeg', `OPRA_Tag_${DAYS_DE[i]}_KW${kw}_${slug(activeKey)}.jpg`);
        setStatus('JPG heruntergeladen.');
      }, 'image/jpeg', 0.95))
      .catch(() => setStatus('Fehler beim JPG-Export.'));
  };

  window.exportDayPDF = function (di) {
    const { kw, year } = getKW(); const t = T(); const i = getDayIdx(di);
    setStatus('PDF wird erstellt…');
    toCanvas(dayCard(t, kw, year, i), 794, 1123)
      .then(c => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
        doc.save(`OPRA_Tag_${DAYS_DE[i]}_KW${kw}_${slug(activeKey)}.pdf`);
        setStatus('PDF heruntergeladen.');
      })
      .catch(() => setStatus('Fehler beim PDF-Export.'));
  };

  // ── Design-Picker in der Info-Leiste (von patch.js) ─────────
  setTimeout(() => {
    const bar = Array.from(document.querySelectorAll('div')).find(el =>
      el.style.position === 'fixed' && el.style.bottom === '0px' && el.style.left === '0px'
    );
    if (!bar) return;
    const span = bar.querySelector('span:last-child');
    if (!span) return;

    const sel = document.createElement('select');
    sel.title = 'Export-Design wählen';
    sel.style.cssText = [
      'background:rgba(200,160,80,0.12)',
      'border:1px solid rgba(200,160,80,0.35)',
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
  }, 600);

})();
