// Spielstand: Aufbau, Speichern, Laden, Export/Import.
// Der Spielstand ist reines JSON, damit Teil 2 ihn übernehmen kann.

import { CONFIG } from './config.js';

const SPEICHER_KEY = 'kalteStation.spielstand';
export const VERSION = 1;

export function neuerSpielstand() {
  return {
    version: VERSION,
    zeit: { spielMs: 0, ticks: 0 },
    res: { energie: CONFIG.energie.start, schrott: 0, algen: 0 },
    kolonie: { ...CONFIG.kolonie },
    jobs: { schrott: 0, algen: 0, energie: 0, bau: 0, kantine: 0, krankenstation: 0, schule: 0 },
    bau: null, // { key, fortschritt } der laufenden Baustelle
    bauten: {
      algentank: 0,
      reaktorRepariert: false,
      kojen: 0,
      kantine: false,
      krankenstation: false,
      schule: false,
    },
    verletzte: [], // { job, bis }
    frei: {
      vorraete: false,
      schrott: false,
      algentank: false,
      reaktorReparatur: false,
      ertrag: false,
      notsignal: false,
      leute: false,
      kantine: false,
      krankenstation: false,
      schule: false,
    },
    kantineMs: 0, // wie lange die Kantine schon besetzt ist
    notsignal: { gesendet: false, naechsteAnkunft: 0, ankuenfte: 0, kojenVoll: false },
    mangel: { hunger: false, kaelte: false },
    phase: 1,
    kabine: 0, // Index der Temperaturstufe
    ertrag: 0, // Materialproduktion im letzten Tick
    raten: { energie: 0, schrott: 0, algen: 0 }, // Nettoänderung im letzten Tick
    tanksStehen: false,
    cooldowns: { reaktor: 0, schrott: 0 }, // Spielzeit, ab der wieder bereit
    gesehen: {}, // einmalige Ereignisse
    log: [],
    logNr: 0,
    // Gegenprobe, sichtbar ab Phase 5.
    konzern: { ertrag: 0 },
    // Haken für Teil 2.
    teil2: {
      miliz: 0,
      buendnisse: [],
      industrie: { bergbaulaser: false, schlepper: false, schrottlager: false },
      soeldnerGeruechte: 0,
      konzernschiffImOrbit: false,
    },
  };
}

function istObjekt(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

// Ältere Spielstände auf den aktuellen Aufbau heben: fehlende Felder
// kommen aus dem Standard, vorhandene bleiben.
function mischen(basis, daten) {
  const out = { ...basis };
  for (const k of Object.keys(daten)) {
    out[k] = istObjekt(basis[k]) && istObjekt(daten[k]) ? mischen(basis[k], daten[k]) : daten[k];
  }
  return out;
}

function migrieren(daten) {
  if (!istObjekt(daten) || typeof daten.version !== 'number') {
    throw new Error('Kein Spielstand.');
  }
  const s = mischen(neuerSpielstand(), daten);
  s.version = VERSION;
  return s;
}

export function laden() {
  try {
    const roh = localStorage.getItem(SPEICHER_KEY);
    return roh ? migrieren(JSON.parse(roh)) : null;
  } catch (e) {
    console.warn('Laden fehlgeschlagen', e);
    return null;
  }
}

export function speichern(s) {
  try {
    localStorage.setItem(SPEICHER_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Speichern fehlgeschlagen', e);
  }
}

export function loeschen() {
  try {
    localStorage.removeItem(SPEICHER_KEY);
  } catch (e) {
    console.warn('Löschen fehlgeschlagen', e);
  }
}

export function exportieren(s) {
  return JSON.stringify(s);
}

// Wirft bei ungültigem Text.
export function importieren(text) {
  return migrieren(JSON.parse(text));
}
