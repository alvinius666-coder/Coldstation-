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
    bau: null, // { key, fortschritt, vomRat } der laufenden Baustelle
    bauten: {
      algentank: 0,
      reaktorRepariert: false,
      kojen: 0,
      kantine: false,
      krankenstation: false,
      schule: false,
      ruheraum: false,
      gewaechshaus: false,
      versammlung: false,
      schlepper: false,
      bergbaulaser: false,
      schrottlager: false,
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
      schlepper: false,
    },
    kantineMs: 0, // wie lange die Kantine schon besetzt ist
    rat: {
      aktiv: false,
      vorschlag: null, // { art, key | wert, text, thema, bis }
      letztes: null, // { text, ja, nein, angenommen }
      sitzungen: 0,
      solidaritaet: 0, // Anteil an S, den der Rat selbst aufbaut
      naechsterBau: 0,
      naechsteDebatte: 0,
    },
    notsignal: { gesendet: false, naechsteAnkunft: 0, ankuenfte: 0, kojenVoll: false },
    mangel: { hunger: false, kaelte: false },
    phase: 1,
    stationsName: null, // erst die Kennung vom Typenschild, später der eigene Name
    kabine: 0, // Index der Temperaturstufe
    ertrag: 0, // Materialproduktion im letzten Tick
    raten: { energie: 0, schrott: 0, algen: 0 }, // Nettoänderung im letzten Tick
    tanksStehen: false,
    cooldowns: { reaktor: 0, schrott: 0 }, // Spielzeit, ab der wieder bereit
    schrottKlicks: 0,
    gesehen: {}, // einmalige Ereignisse
    log: [],
    logNr: 0,
    // Der Gürtel (Phase 5): Stationen, Netz, entschlüsselte Memos.
    guertel: {
      aktiv: false,
      stationen: Object.fromEntries(
        Object.entries(CONFIG.guertel.stationen).map(([key, st]) => [key, { status: st.start, hilfe: 0 }]),
      ),
      netzErtrag: 0,
      memos: 0, // so viele sind entschlüsselt
      naechstesMemo: 0,
      naechsteRatLieferung: 0,
      schlepperZurueck: 0, // Spielzeit, ab der der Schlepper wieder da ist
      bitte: null, // { key, bis }: der Rat wartet auf den Lagerschlüssel
      bitten: 0, // so oft hat der Rat schon gebeten
      naechsteBitte: 0,
      ratLiefert: false, // der Rat hat das Lager übernommen
    },
    // Das Ende (Phase 6).
    ende: {
      aktiv: false,
      zeile: 0, // so viele Zeilen der Schlussszene sind gelaufen
      naechsteZeile: 0,
      wahl: null, // 'gehen' | 'bleiben'
      abgegeben: [], // Steuerelemente, die der Rat übernommen hat
      schlussAb: 0, // Spielzeit, ab der das Schlussbild steht (0 = noch nicht)
      naechsterKonzernAbgang: 0,
      sZuwachs: 0, // Solidarität, die im Schlussbild ohne Zutun wächst
    },
    // Gegenprobe, sichtbar ab Phase 5.
    konzern: {
      leute: CONFIG.konzern.leute,
      quote: CONFIG.konzern.quote,
      erschoepfung: 0,
      ertrag: 0,
      leuteSichtbar: null, // Bestand, als Aurel zum ersten Mal auf dem Schirm war
    },
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
  // Hesper heißt jetzt Zarja.
  const st = s.guertel.stationen;
  if (st.hesper) {
    st.zarja = st.hesper;
    delete st.hesper;
  }
  s.teil2.buendnisse = s.teil2.buendnisse.map((k) => (k === 'hesper' ? 'zarja' : k));
  // Ältere Spielstände ohne Namen bekommen ihn nachträglich.
  if (!s.stationsName) {
    if (s.guertel.aktiv) s.stationsName = 'Iskra';
    else if (s.notsignal.gesendet) s.stationsName = 'Förderstation 7';
  }
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
