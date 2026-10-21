// Ereignisse: Log, einmalige Meldungen, Freischaltungen.
// Eine Zeile pro Ereignis, karger Ton.

import { CONFIG } from './config.js';

export const KABINE = ['eiskalt', 'kalt', 'kühl', 'warm'];

// Funde beim Schrottsammeln. Jeder kommt höchstens einmal.
export const FUNDE = [
  'Ein Helm. Statt eines Namens eine Nummer.',
  'Eine Thermoskanne, noch halb voll. Jemand ist in Eile gegangen.',
  'Ein Dienstplan. Die Spalte „Schichtleitung“ ist abgerissen.',
  'Eine Quotentafel. Die letzte Woche rot unterstrichen.',
];

export function log(s, text) {
  s.log.unshift({ t: s.zeit.spielMs, text });
  if (s.log.length > CONFIG.logMax) s.log.length = CONFIG.logMax;
  s.logNr++;
}

export function einmal(s, key, text) {
  if (s.gesehen[key]) return false;
  s.gesehen[key] = true;
  log(s, text);
  return true;
}

export function startTexte(s) {
  log(s, 'Die Kabine ist eiskalt.');
  log(s, 'Draußen kein Laut. Der Hangar ist leer.');
}

export function kabineGeaendert(s) {
  log(s, `Die Kabine ist ${KABINE[s.kabine]}.`);
}

export function tanksStehen(s, stehen) {
  log(s, stehen ? 'Kein Strom. Die Tanks stehen still.' : 'Die Tanks blubbern wieder.');
}

export function fund(s) {
  const offen = FUNDE.filter((_, i) => !s.gesehen['fund' + i]);
  if (offen.length === 0) return;
  const text = offen[Math.floor(Math.random() * offen.length)];
  einmal(s, 'fund' + FUNDE.indexOf(text), text);
}

// Nach jedem Tick und jeder Aktion: was ist neu sichtbar?
export function pruefeAusloeser(s) {
  const { res, frei, bauten } = s;

  if (!frei.vorraete && res.energie > 0) {
    frei.vorraete = true;
  }
  if (!frei.schrott && res.energie >= CONFIG.schrott.freiAbEnergie) {
    frei.schrott = true;
    log(s, 'Im Notlicht: Schrott, überall.');
  }
  if (!frei.algentank && res.schrott >= CONFIG.algentank.freiAbSchrott) {
    frei.algentank = true;
    log(s, 'Im Nebenraum ein Algentank. Gesprungen, aber ganz.');
  }
  if (!frei.reaktorReparatur && bauten.algentank >= 1) {
    frei.reaktorReparatur = true;
    log(s, 'Der Kühlkreislauf leckt. Das ließe sich flicken.');
  }
  if (!frei.ertrag && s.ertrag > 0) {
    frei.ertrag = true;
  }
}
