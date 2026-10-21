// Oberfläche. Elemente erscheinen erst, wenn sie freigeschaltet sind.

import { CONFIG } from './config.js';
import { KABINE } from './events.js';
import * as A from './actions.js';

const NAMEN = { energie: 'Energie', schrott: 'Schrott', algen: 'Algen' };

const AKTIONEN = [
  {
    id: 'reaktor',
    text: () => 'Reaktor anwerfen',
    sichtbar: () => true,
    cooldown: 'reaktor',
    tun: A.reaktorAnwerfen,
  },
  {
    id: 'schrott',
    text: () => 'Schrott sammeln',
    sichtbar: (s) => s.frei.schrott,
    cooldown: 'schrott',
    tun: A.schrottSammeln,
  },
  {
    id: 'algentank',
    text: (s) => (s.bauten.algentank === 0 ? 'Algentank reparieren' : 'Weiteren Tank reparieren'),
    sichtbar: (s) => s.frei.algentank && s.bauten.algentank < CONFIG.algentank.max,
    kosten: A.algentankKosten,
    tun: A.algentankReparieren,
  },
  {
    id: 'reaktorFlicken',
    text: () => 'Kühlkreislauf flicken',
    sichtbar: (s) => s.frei.reaktorReparatur && !s.bauten.reaktorRepariert,
    kosten: A.reaktorKosten,
    tun: A.reaktorFlicken,
  },
];

const VORRAETE = [
  { key: 'energie', sichtbar: (s) => s.frei.vorraete },
  { key: 'schrott', sichtbar: (s) => s.frei.schrott },
  { key: 'algen', sichtbar: (s) => s.bauten.algentank > 0 },
];

const $ = (id) => document.getElementById(id);

function zahl(n, stellen = 0) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
}

function kostenText(kosten) {
  return Object.entries(kosten)
    .map(([r, n]) => `${n} ${NAMEN[r]}`)
    .join(', ');
}

// Sichtbarkeit umschalten; beim ersten Auftauchen blendet CSS ein.
function zeige(el, an) {
  if (an && el.hidden) {
    el.hidden = false;
    el.classList.add('neu');
  } else if (!an && !el.hidden) {
    el.hidden = true;
  }
}

let knoepfe = [];
let zeilen = [];
let letzteLogNr = -1;

export function initUI(holeSpiel) {
  const box = $('aktionen');
  knoepfe = AKTIONEN.map((def) => {
    const el = document.createElement('button');
    el.className = 'aktion';
    el.hidden = true;
    el.innerHTML = '<span class="text"></span><span class="kosten"></span><span class="balken"></span>';
    el.addEventListener('click', () => {
      def.tun(holeSpiel());
      render(holeSpiel());
    });
    box.appendChild(el);
    return { def, el, text: el.querySelector('.text'), kosten: el.querySelector('.kosten'), balken: el.querySelector('.balken') };
  });

  const liste = $('vorrat-liste');
  zeilen = VORRAETE.map((def) => {
    const el = document.createElement('div');
    el.className = 'vorrat';
    el.hidden = true;
    el.innerHTML = `<span>${NAMEN[def.key]}</span><span class="wert"></span>`;
    liste.appendChild(el);
    return { def, el, wert: el.querySelector('.wert') };
  });
}

// Nach Import/Neustart alles neu aufbauen lassen.
export function zuruecksetzen() {
  letzteLogNr = -1;
  for (const k of knoepfe) k.el.hidden = true;
  for (const z of zeilen) z.el.hidden = true;
  $('vorraete').hidden = true;
  $('ertrag').hidden = true;
}

export function render(s) {
  $('temp').textContent = KABINE[s.kabine];

  for (const k of knoepfe) {
    const { def } = k;
    zeige(k.el, def.sichtbar(s));
    if (k.el.hidden) continue;
    k.text.textContent = def.text(s);
    let gesperrt = false;
    if (def.kosten) {
      const kosten = def.kosten(s);
      k.kosten.textContent = kostenText(kosten);
      gesperrt = !A.bezahlbar(s, kosten);
    }
    if (def.cooldown) {
      const rest = s.cooldowns[def.cooldown] - s.zeit.spielMs;
      const anteil = rest > 0 ? rest / A.COOLDOWN[def.cooldown] : 0;
      k.balken.style.width = `${anteil * 100}%`;
      if (rest > 0) gesperrt = true;
    }
    k.el.disabled = gesperrt;
  }

  zeige($('vorraete'), s.frei.vorraete);
  for (const z of zeilen) {
    zeige(z.el, z.def.sichtbar(s));
    z.wert.textContent = zahl(Math.floor(s.res[z.def.key]));
  }

  zeige($('ertrag'), s.frei.ertrag);
  $('ertrag-wert').textContent = zahl(s.ertrag, 1);

  if (s.logNr !== letzteLogNr) {
    letzteLogNr = s.logNr;
    const ul = $('log');
    ul.replaceChildren(
      ...s.log.map((eintrag, i) => {
        const li = document.createElement('li');
        li.textContent = eintrag.text;
        li.style.opacity = Math.max(0.15, 1 - i * 0.07);
        return li;
      }),
    );
  }
}

export function renderDebug(s, tempo) {
  const k = s.kolonie;
  const sek = Math.floor(s.zeit.spielMs / 1000);
  const zeit = `${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, '0')}`;
  $('debug-werte').textContent = [
    `Zeit  ${zeit}  (x${tempo})`,
    `Phase ${s.phase}  Tick ${s.zeit.ticks}`,
    `A ${zahl(k.leute)}  q ${zahl(k.quote, 2)}`,
    `E ${zahl(k.erschoepfung, 2)}  S ${zahl(k.solidaritaet, 2)}  R ${zahl(k.regeneration, 2)}`,
    `Ertrag ${zahl(s.ertrag, 2)}`,
    `Energie ${zahl(s.res.energie, 2)}`,
  ].join('\n');
}
