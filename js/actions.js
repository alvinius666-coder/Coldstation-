// Spieleraktionen. Ändern nur den Spielstand, kein DOM.

import { CONFIG } from './config.js';
import { log, einmal, fund, AUSDRUCK, quoteGeaendert, baubeginn, EINRICHTUNG_NAME, pruefeAusloeser } from './events.js';
import { vorschlagen } from './rat.js';

export const COOLDOWN = {
  reaktor: CONFIG.reaktor.cooldownMs,
  schrott: CONFIG.schrott.cooldownMs,
};

export function bereit(s, key) {
  return s.zeit.spielMs >= s.cooldowns[key];
}

function starteCooldown(s, key) {
  s.cooldowns[key] = s.zeit.spielMs + COOLDOWN[key];
}

export function bezahlbar(s, kosten) {
  return Object.entries(kosten).every(([r, n]) => s.res[r] >= n);
}

function bezahlen(s, kosten) {
  for (const [r, n] of Object.entries(kosten)) s.res[r] -= n;
}

export function algentankKosten(s) {
  const k = CONFIG.algentank;
  const faktor = k.kostenFaktor ** s.bauten.algentank;
  const out = {};
  for (const [r, n] of Object.entries(k.basisKosten)) out[r] = Math.round(n * faktor);
  return out;
}

export function reaktorKosten() {
  return CONFIG.reaktor.reparaturKosten;
}

export function reaktorAnwerfen(s) {
  if (!bereit(s, 'reaktor')) return;
  s.res.energie = Math.min(CONFIG.energie.max, s.res.energie + CONFIG.reaktor.klickEnergie);
  starteCooldown(s, 'reaktor');
  if (einmal(s, 'ersterFunke', 'Der Reaktor hustet. Licht flackert.')) {
    log(s, 'Auf der Brusttasche deines Overalls steht: SL-07.');
  }
  pruefeAusloeser(s);
}

export function schrottSammeln(s) {
  if (!bereit(s, 'schrott')) return;
  s.res.schrott += CONFIG.schrott.klickMenge;
  starteCooldown(s, 'schrott');
  s.schrottKlicks++;
  const ausdruckFaellig = !s.gesehen['fund' + AUSDRUCK] && s.schrottKlicks >= CONFIG.schrott.ausdruckSpaetestensKlick;
  if (!einmal(s, 'ersterSchrott', 'Kabelreste, Blech. Brauchbar.')) {
    if (ausdruckFaellig) fund(s, true);
    else if (Math.random() < CONFIG.schrott.fundChance) fund(s);
  }
  pruefeAusloeser(s);
}

export function algentankReparieren(s) {
  const kosten = algentankKosten(s);
  if (s.bauten.algentank >= CONFIG.algentank.max || !bezahlbar(s, kosten)) return;
  bezahlen(s, kosten);
  s.bauten.algentank++;
  log(s, s.bauten.algentank === 1 ? 'Der Algentank blubbert.' : 'Noch ein Tank läuft.');
  pruefeAusloeser(s);
}

export function reaktorFlicken(s) {
  const kosten = reaktorKosten();
  if (s.bauten.reaktorRepariert || !bezahlbar(s, kosten)) return;
  bezahlen(s, kosten);
  s.bauten.reaktorRepariert = true;
  log(s, 'Der Reaktor brummt. Er hält sich selbst.');
  pruefeAusloeser(s);
}

export function notsignalKosten() {
  return CONFIG.notsignal.kosten;
}

export function notsignalSenden(s) {
  const kosten = notsignalKosten();
  if (!s.frei.notsignal || s.notsignal.gesendet || !bezahlbar(s, kosten)) return;
  bezahlen(s, kosten);
  s.notsignal.gesendet = true;
  s.notsignal.naechsteAnkunft = s.zeit.spielMs + CONFIG.leute.ersteAnkunftMs;
  s.phase = 2;
  s.stationsName = 'Förderstation 7';
  log(s, 'Das Funkpult sendet die Kennung vom Typenschild: Förderstation 7.');
  log(s, 'Das Signal geht raus. Rauschen.');
  pruefeAusloeser(s);
}

export function kojeKosten(s) {
  const L = CONFIG.leute;
  const faktor = L.kojeFaktor ** s.bauten.kojen;
  const out = {};
  for (const [r, n] of Object.entries(L.kojeKosten)) out[r] = Math.round(n * faktor);
  return out;
}

// Mit Rat wird daraus ein Vorschlag.
export function kojeHerrichten(s) {
  if (!bezahlbar(s, kojeKosten(s))) return;
  if (s.rat.aktiv) {
    vorschlagen(s, { art: 'koje', text: 'Kojen herrichten', thema: 'bau' });
    return;
  }
  kojeDirekt(s);
}

export function kojeDirekt(s) {
  bezahlen(s, kojeKosten(s));
  s.bauten.kojen++;
  s.notsignal.kojenVoll = false;
  log(s, 'Neue Kojen. Matratzen aus Dämmwolle.');
  pruefeAusloeser(s);
}

export function ohneAufgabe(s) {
  return s.kolonie.leute - Object.values(s.jobs).reduce((a, b) => a + b, 0) - s.verletzte.length;
}

export function jobAendern(s, job, delta) {
  if (delta > 0 && ohneAufgabe(s) < delta) return;
  // Einrichtungen brauchen genau so viele Leute wie vorgesehen.
  const e = CONFIG.einrichtungen[job];
  if (e && e.personal === 0) return;
  if (delta > 0 && e && (!s.bauten[job] || s.jobs[job] + delta > e.personal)) return;
  if (delta > 0 && job === 'bau' && !s.bau) return;
  if (delta < 0 && s.jobs[job] < -delta) return;
  s.jobs[job] += delta;
}

// Mit Rat wird daraus ein Vorschlag.
export function quoteSetzen(s, q) {
  const Q = CONFIG.quote;
  const wert = Math.round(Math.min(Q.max, Math.max(Q.min, q)) * 10) / 10;
  if (wert === s.kolonie.quote) return;
  if (s.rat.aktiv) {
    const text = `Schicht auf ${wert.toLocaleString('de-DE', { minimumFractionDigits: 1 })}`;
    vorschlagen(s, { art: 'quote', wert, text, thema: wert > s.kolonie.quote ? 'quoteHoch' : 'quoteRunter' });
    return;
  }
  quoteDirekt(s, wert);
}

export function quoteDirekt(s, wert) {
  s.kolonie.quote = wert;
  quoteGeaendert(s);
}

export function einrichtungKosten(key) {
  return CONFIG.einrichtungen[key].kosten;
}

// Startet eine Baustelle, mit Rat als Vorschlag. Es läuft immer nur eine.
export function einrichtungBauen(s, key) {
  if (s.bauten[key] || s.bau || !s.frei[key] || !bezahlbar(s, einrichtungKosten(key))) return;
  if (s.rat.aktiv) {
    vorschlagen(s, { art: 'bau', key, text: `${EINRICHTUNG_NAME[key]} bauen`, thema: 'bau' });
    return;
  }
  bauStarten(s, key, false);
}

export function bauStarten(s, key, vomRat) {
  bezahlen(s, einrichtungKosten(key));
  s.bau = { key, fortschritt: 0, vomRat };
  baubeginn(s, key);
  pruefeAusloeser(s);
}
