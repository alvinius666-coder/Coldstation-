// Das Ende (Phase 6): Konzernschiff, Ratsentscheid, Gehen oder Bleiben,
// Steuerelemente abgeben, Schlussbild. Kein DOM.

import { CONFIG } from './config.js';
import { log, ENDE_SZENE, GEHEN, UEBERGABE, STEUER } from './events.js';
import { leistung } from './tick.js';

export { STEUER };

export function abgegeben(s, key) {
  return s.ende.abgegeben.includes(key);
}

// Wahl steht an, wenn die Szene durch ist und noch nicht gewählt wurde.
export function wahlOffen(s) {
  return s.ende.aktiv && s.ende.zeile >= ENDE_SZENE.length && !s.ende.wahl;
}

export function schlussbild(s) {
  return s.ende.schlussAb > 0 && s.zeit.spielMs >= s.ende.schlussAb;
}

function schlussPlanen(s) {
  s.ende.schlussAb = s.zeit.spielMs + CONFIG.ende.schlussNachMs;
  s.ende.naechsterKonzernAbgang = s.ende.schlussAb + CONFIG.ende.konzernAbgangMs;
  s.teil2.miliz = s.kolonie.leute * s.kolonie.solidaritaet;
}

export function waehlen(s, wahl) {
  if (!wahlOffen(s)) return;
  s.ende.wahl = wahl;
  if (wahl === 'gehen') {
    s.ende.abgegeben = [...STEUER];
    s.kolonie.quote = 1;
    log(s, GEHEN);
    schlussPlanen(s);
  }
}

// Das nächste Steuerelement, das abgegeben werden kann. Das Funkpult kommt zuletzt.
export function naechsteAbgaben(s) {
  if (s.ende.wahl !== 'bleiben') return [];
  const offen = STEUER.filter((k) => !abgegeben(s, k));
  return offen.length === 1 ? offen : offen.filter((k) => k !== 'funk');
}

export function abgeben(s, key) {
  if (!naechsteAbgaben(s).includes(key)) return;
  s.ende.abgegeben.push(key);
  if (key === 'schicht') s.kolonie.quote = 1;
  log(s, UEBERGABE[key][1]);
  if (key === 'funk') schlussPlanen(s);
}

// Nach der Übergabe verteilt der Rat die Leute selbst:
// genug für Essen und Wärme, der Rest schlachtet aus.
function jobsVerteilen(s) {
  const L = CONFIG.leute;
  for (const job of Object.keys(CONFIG.jobs)) s.jobs[job] = 0;
  const frei = s.kolonie.leute - Object.values(s.jobs).reduce((a, b) => a + b, 0) - s.verletzte.length;
  const f = Math.max(leistung(s), 0.2);
  const A = s.kolonie.leute;
  let algen = Math.ceil((A * L.algenProKopf - s.bauten.algentank * CONFIG.algentank.algenProTick) / f) + 1;
  let energie = Math.ceil((A * L.energieProKopf + 1) / f);
  algen = Math.min(Math.max(algen, 0), frei);
  energie = Math.min(Math.max(energie, 0), frei - algen);
  s.jobs.algen = algen;
  s.jobs.energie = energie;
  s.jobs.schrott = frei - algen - energie;
}

export function endeTick(s) {
  const e = s.ende;
  if (!e.aktiv) return;

  if (e.zeile < ENDE_SZENE.length && s.zeit.spielMs >= e.naechsteZeile) {
    const z = ENDE_SZENE[e.zeile];
    log(s, typeof z === 'function' ? z(s) : z);
    e.zeile++;
    e.naechsteZeile = s.zeit.spielMs + CONFIG.ende.zeileMs;
    if (e.zeile === 1) s.teil2.konzernschiffImOrbit = true;
    if (z.toString().includes('Söldner leise')) s.teil2.soeldnerGeruechte++;
  }

  if (abgegeben(s, 'jobs')) jobsVerteilen(s);

  // Im Schlussbild wächst das Netz weiter, der Konzern verliert Leute.
  if (schlussbild(s)) {
    e.sZuwachs += CONFIG.ende.netzSProTick;
    if (s.zeit.spielMs >= e.naechsterKonzernAbgang && s.konzern.leute > 0) {
      s.konzern.leute--;
      e.naechsterKonzernAbgang = s.zeit.spielMs + CONFIG.ende.konzernAbgangMs;
    }
    s.teil2.miliz = s.kolonie.leute * s.kolonie.solidaritaet;
  }
}
