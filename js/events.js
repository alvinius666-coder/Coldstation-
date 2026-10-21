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

// Ankünfte nach dem Notsignal, in dieser Reihenfolge. Danach ANKUNFT_REST.
export const ANKUENFTE = [
  'Jemand klopft an die Schleuse. Ein Bohrhauer, halb erfroren.',
  'Eine Technikerin aus Schacht 4. Sie hat ihr Werkzeug dabei.',
  'Ein Junge aus der Raffinerie. Zu jung für die Liste.',
  'Eine ältere Frau, Schweißerin. Sie sieht dich lange an.',
  'Ein Koch. Er fragt zuerst nach den Tanks.',
  'Ein Mann mit Handfunkgerät. Er hat das Signal gehört.',
  'Eine Sanitäterin ohne Medikamente.',
  'Ein Lader aus dem Hangar. Er war beim letzten Shuttle. Nicht drin.',
  'Eine Frau mit Narben an den Händen. Schacht 2.',
  'Ein Rohrleger. Er sagt nichts.',
];
const ANKUNFT_REST = 'Noch jemand kommt durch die Schleuse.';

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
  const ort = s.kolonie.leute > 0 ? 'Die Station' : 'Die Kabine';
  log(s, `${ort} ist ${KABINE[s.kabine]}.`);
}

export function ankunft(s) {
  const i = s.notsignal.ankuenfte - 1;
  log(s, ANKUENFTE[i] ?? ANKUNFT_REST);
}

export function kojenVoll(s) {
  log(s, 'Die Kojen sind voll. Jemand schläft im Gang.');
}

export function mangel(s, art, an) {
  const texte = {
    hunger: ['Die Algen sind alle. Es wird hungrig gearbeitet.', 'Es gibt wieder zu essen.'],
    kaelte: ['Zu wenig Strom. Die Leute frieren bei der Arbeit.', 'Die Heizung läuft wieder.'],
  };
  log(s, texte[art][an ? 0 : 1]);
}

export function quoteGeaendert(s) {
  const q = s.kolonie.quote;
  if (q >= 1.4) einmal(s, 'quoteHoch', 'Doppelschichten. Niemand widerspricht.');
  if (q <= 0.6) einmal(s, 'quoteNiedrig', 'Kurze Schichten. Die Leute sehen dich fragend an.');
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
  if (!frei.notsignal && res.energie > CONFIG.notsignal.freiAbEnergie) {
    frei.notsignal = true;
    log(s, 'Das Funkpult hat wieder Strom.');
  }
  if (!frei.leute && s.kolonie.leute > 0) {
    frei.leute = true;
  }
}
