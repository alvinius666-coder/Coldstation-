// Oberfläche. Elemente erscheinen erst, wenn sie freigeschaltet sind.

import { CONFIG } from './config.js';
import { KABINE, EINRICHTUNG_NAME } from './events.js';
import * as A from './actions.js';
import { kojen } from './tick.js';

const NAMEN = { energie: 'Energie', schrott: 'Schrott', algen: 'Algen' };
const JOBS = {
  schrott: 'Ausschlachten',
  algen: 'Algentanks',
  energie: 'Reaktor',
  bau: 'Baustelle',
  ...EINRICHTUNG_NAME,
};

// Wann eine Jobzeile sichtbar ist.
function jobSichtbar(s, job) {
  if (CONFIG.jobs[job]) return true;
  if (job === 'bau') return Boolean(s.bau) || s.jobs.bau > 0;
  return s.bauten[job];
}

// Wie es den Leuten geht, in Worten. Die Zahl E sieht nur der Debug-Modus.
function zustand(E) {
  if (E < 0.15) return '';
  if (E < 0.3) return 'müde';
  if (E < 0.5) return 'erschöpft';
  if (E < 0.7) return 'am Ende';
  return 'brechen ein';
}

function einrichtungAktion(key) {
  return {
    id: key,
    text: (s) => {
      if (s.bau?.key !== key) return `${EINRICHTUNG_NAME[key]} bauen`;
      const anteil = s.bau.fortschritt / CONFIG.einrichtungen[key].arbeit;
      return `${EINRICHTUNG_NAME[key]}: im Bau, ${Math.floor(anteil * 100)} %`;
    },
    sichtbar: (s) => s.frei[key] && !s.bauten[key],
    kosten: (s) => (s.bau?.key === key ? null : A.einrichtungKosten(key)),
    gesperrt: (s) => Boolean(s.bau),
    tun: (s) => A.einrichtungBauen(s, key),
  };
}

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
  {
    id: 'notsignal',
    text: () => 'Notsignal senden',
    sichtbar: (s) => s.frei.notsignal && !s.notsignal.gesendet,
    kosten: A.notsignalKosten,
    tun: A.notsignalSenden,
  },
  {
    id: 'koje',
    text: () => 'Kojen herrichten',
    sichtbar: (s) => s.frei.leute,
    kosten: A.kojeKosten,
    tun: A.kojeHerrichten,
  },
  ...Object.keys(CONFIG.einrichtungen).map(einrichtungAktion),
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

function vorzeichen(n) {
  const r = Math.round(n * 10) / 10;
  if (r === 0) return '';
  return (r > 0 ? '+' : '−') + zahl(Math.abs(r), 1);
}

function quoteText(q) {
  if (q < 0.8) return 'kurze Schichten';
  if (q < 1.2) return 'Normalschicht';
  if (q < 1.45) return 'lange Schichten';
  return 'Doppelschichten';
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
let jobZeilen = [];
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
    el.innerHTML = `<span>${NAMEN[def.key]}</span><span class="rate"></span><span class="wert"></span>`;
    liste.appendChild(el);
    return { def, el, wert: el.querySelector('.wert'), rate: el.querySelector('.rate') };
  });

  const jobListe = $('job-liste');
  jobZeilen = Object.entries(JOBS).map(([job, name]) => {
    const el = document.createElement('div');
    el.className = 'job';
    el.innerHTML =
      `<span>${name}</span>` +
      `<button aria-label="${name}: eine Person weniger">−</button>` +
      `<span class="n"></span>` +
      `<button aria-label="${name}: eine Person mehr">+</button>`;
    const [minus, plus] = el.querySelectorAll('button');
    minus.addEventListener('click', () => {
      A.jobAendern(holeSpiel(), job, -1);
      render(holeSpiel());
    });
    plus.addEventListener('click', () => {
      A.jobAendern(holeSpiel(), job, 1);
      render(holeSpiel());
    });
    jobListe.appendChild(el);
    return { job, el, minus, plus, n: el.querySelector('.n') };
  });

  const regler = $('quote');
  regler.min = CONFIG.quote.min;
  regler.max = CONFIG.quote.max;
  regler.step = CONFIG.quote.schritt;
  regler.addEventListener('input', () => {
    A.quoteSetzen(holeSpiel(), Number(regler.value));
    render(holeSpiel());
  });
}

// Nach Import/Neustart alles neu aufbauen lassen.
export function zuruecksetzen() {
  letzteLogNr = -1;
  for (const k of knoepfe) k.el.hidden = true;
  for (const z of zeilen) z.el.hidden = true;
  $('vorraete').hidden = true;
  $('ertrag').hidden = true;
  $('leute').hidden = true;
  $('schicht').hidden = true;
}

export function render(s) {
  $('ort-name').textContent = s.kolonie.leute > 0 ? 'Station' : 'Kabine';
  $('temp').textContent = KABINE[s.kabine];

  for (const k of knoepfe) {
    const { def } = k;
    zeige(k.el, def.sichtbar(s));
    if (k.el.hidden) continue;
    k.text.textContent = def.text(s);
    let gesperrt = def.gesperrt ? def.gesperrt(s) : false;
    const kosten = def.kosten ? def.kosten(s) : null;
    k.kosten.textContent = kosten ? kostenText(kosten) : '';
    if (kosten && !A.bezahlbar(s, kosten)) gesperrt = true;
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
    z.rate.textContent = s.frei.leute ? vorzeichen(s.raten[z.def.key]) : '';
  }

  zeige($('leute'), s.frei.leute);
  if (s.frei.leute) {
    const frei = A.ohneAufgabe(s);
    const wie = zustand(s.kolonie.erschoepfung);
    $('leute-zahl').textContent = `${s.kolonie.leute} / ${kojen(s)}`;
    $('leute-zustand').textContent = wie ? `· ${wie}` : '';
    $('leute-frei').textContent = frei;
    zeige($('verletzt-zeile'), s.verletzte.length > 0);
    $('leute-verletzt').textContent = s.verletzte.length;
    for (const z of jobZeilen) {
      zeige(z.el, jobSichtbar(s, z.job));
      z.n.textContent = s.jobs[z.job];
      z.minus.disabled = s.jobs[z.job] === 0;
      const voll = CONFIG.einrichtungen[z.job] && s.jobs[z.job] >= 1;
      z.plus.disabled = frei === 0 || voll || (z.job === 'bau' && !s.bau);
    }
  }

  zeige($('schicht'), s.frei.leute);
  if (s.frei.leute) {
    const regler = $('quote');
    if (document.activeElement !== regler) regler.value = s.kolonie.quote;
    $('quote-wert').textContent = zahl(s.kolonie.quote, 1);
    $('quote-text').textContent = quoteText(s.kolonie.quote);
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
