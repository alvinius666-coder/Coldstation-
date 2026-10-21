// Debug: spielt Boss-Weg und Kollektiv-Weg automatisch durch und gibt die
// Ertragstabelle aus, damit die Balance prüfbar bleibt. Kein DOM.
// Im Browser: Knopf „Simulation“ im Debug-Overlay. In Node:
//   node --input-type=module -e "import('./js/sim.js').then(m => console.log(m.bericht()))"

import { CONFIG } from './config.js';
import { neuerSpielstand } from './state.js';
import { tick, kojen, leistung } from './tick.js';
import * as A from './actions.js';

// Zielwerte aus CLAUDE.md (Ertrag pro Tick).
export const ZIELE = {
  5: { boss: 10, kollektiv: 6 },
  15: { boss: 22, kollektiv: 18 },
  30: { boss: 14, kollektiv: 45 },
  60: { boss: 8, kollektiv: 140 },
};

// Fester Zufall, damit Läufe vergleichbar sind.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Jobs so verteilen, dass Essen und Wärme reichen; der Rest schlachtet aus.
function verteilen(s) {
  for (const job of Object.keys(CONFIG.jobs)) s.jobs[job] = 0;
  const f = Math.max(leistung(s), 0.2);
  const n = A.ohneAufgabe(s);
  const L = CONFIG.leute;
  const leute = s.kolonie.leute;
  let algen = Math.ceil((leute * L.algenProKopf - s.bauten.algentank * CONFIG.algentank.algenProTick + 0.2) / f);
  if (s.res.algen < 20) algen++;
  let energie = Math.ceil((leute * L.energieProKopf + 0.8 - CONFIG.reaktor.passivProTick) / f);
  if (s.res.energie < 30) energie++;
  algen = Math.min(Math.max(algen, 0), n);
  energie = Math.min(Math.max(energie, 0), n - algen);
  s.jobs.algen = algen;
  s.jobs.energie = energie;
  s.jobs.schrott = n - algen - energie;
}

// n Leute aus dem Ausschlachten holen, falls niemand frei ist.
function frei(s, n) {
  while (A.ohneAufgabe(s) < n && s.jobs.schrott > 0) s.jobs.schrott--;
}

const STRATEGIEN = {
  // Volle Quote, keine Einrichtungen.
  boss(s) {
    if (s.kolonie.leute > 0) A.quoteSetzen(s, 1.5);
  },
  // Normalschicht, Einrichtungen bauen und besetzen, sobald möglich.
  kollektiv(s) {
    if (s.kolonie.leute > 0) A.quoteSetzen(s, s.kolonie.erschoepfung > 0.15 ? 0.8 : 1.0);
    for (const key of Object.keys(CONFIG.einrichtungen)) {
      A.einrichtungBauen(s, key);
      if (s.bauten[key] && s.jobs[key] === 0) frei(s, 1);
      if (s.bauten[key]) A.jobAendern(s, key, 1);
    }
    // Drei Leute auf die Baustelle.
    if (s.bau && s.jobs.bau < 3) {
      frei(s, 3 - s.jobs.bau);
      A.jobAendern(s, 'bau', Math.min(3 - s.jobs.bau, A.ohneAufgabe(s)));
    }
  },
};

export function simuliere(name, minuten = 60, seed = 1) {
  const zufall = Math.random;
  Math.random = mulberry32(seed);
  const strategie = STRATEGIEN[name];
  const s = neuerSpielstand();
  const verlauf = [];
  let summe = 0;
  try {
    for (let sek = 0; sek < minuten * 60; sek++) {
      s.zeit.spielMs = sek * 1000;
      // Klickt alle 2 s, wie eine aufmerksame Spielerin.
      if (sek % 2 === 0) {
        A.reaktorAnwerfen(s);
        A.schrottSammeln(s);
      }
      if (s.bauten.algentank === 0 || s.bauten.reaktorRepariert) A.algentankReparieren(s);
      A.reaktorFlicken(s);
      A.notsignalSenden(s);
      if (s.kolonie.leute >= kojen(s) - 1) A.kojeHerrichten(s);
      strategie(s);
      verteilen(s);
      tick(s);
      // Ertrag als Minutenmittel, damit Zufall nicht stört.
      summe += s.ertrag;
      if ((sek + 1) % 60 === 0) {
        verlauf.push({
          min: (sek + 1) / 60,
          ertrag: summe / 60,
          leute: s.kolonie.leute,
          E: s.kolonie.erschoepfung,
          S: s.kolonie.solidaritaet,
          R: s.kolonie.regeneration,
        });
        summe = 0;
      }
    }
  } finally {
    Math.random = zufall;
  }
  return verlauf;
}

export function bericht(minuten = 60, seed = 1) {
  const boss = simuliere('boss', minuten, seed);
  const koll = simuliere('kollektiv', minuten, seed);
  const r = (x) => x.toFixed(1).padStart(6);
  const zeilen = ['min    Boss   Ziel   Koll   Ziel   A(B) A(K)  E(B)  E(K)  S(K)'];
  for (let i = 0; i < boss.length; i++) {
    const b = boss[i];
    const k = koll[i];
    const ziel = ZIELE[b.min];
    if (!ziel && b.min % 5 !== 0) continue;
    zeilen.push(
      String(b.min).padStart(3) +
        r(b.ertrag) +
        (ziel ? r(ziel.boss) : '      ') +
        r(k.ertrag) +
        (ziel ? r(ziel.kollektiv) : '      ') +
        String(b.leute).padStart(5) +
        String(k.leute).padStart(5) +
        b.E.toFixed(2).padStart(6) +
        k.E.toFixed(2).padStart(6) +
        k.S.toFixed(2).padStart(6),
    );
  }
  const kipp = koll.find((k, i) => k.min >= 5 && k.ertrag > boss[i].ertrag);
  zeilen.push(`Kipppunkt: ${kipp ? `Minute ${kipp.min}` : 'keiner'}`);
  return zeilen.join('\n');
}
