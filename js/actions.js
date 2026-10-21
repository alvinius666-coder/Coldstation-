// Spieleraktionen. Ändern nur den Spielstand, kein DOM.

import { CONFIG } from './config.js';
import { log, einmal, fund, quoteGeaendert, baubeginn, pruefeAusloeser } from './events.js';

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
  einmal(s, 'ersterFunke', 'Der Reaktor hustet. Licht flackert.');
  pruefeAusloeser(s);
}

export function schrottSammeln(s) {
  if (!bereit(s, 'schrott')) return;
  s.res.schrott += CONFIG.schrott.klickMenge;
  starteCooldown(s, 'schrott');
  if (!einmal(s, 'ersterSchrott', 'Kabelreste, Blech. Brauchbar.') && Math.random() < CONFIG.schrott.fundChance) {
    fund(s);
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
  if (s.notsignal.gesendet || !bezahlbar(s, kosten)) return;
  bezahlen(s, kosten);
  s.notsignal.gesendet = true;
  s.notsignal.naechsteAnkunft = s.zeit.spielMs + CONFIG.leute.ersteAnkunftMs;
  s.phase = 2;
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

export function kojeHerrichten(s) {
  const kosten = kojeKosten(s);
  if (!bezahlbar(s, kosten)) return;
  bezahlen(s, kosten);
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
  // Einrichtungen brauchen genau eine Person.
  if (delta > 0 && CONFIG.einrichtungen[job] && (!s.bauten[job] || s.jobs[job] + delta > 1)) return;
  if (delta > 0 && job === 'bau' && !s.bau) return;
  if (delta < 0 && s.jobs[job] < -delta) return;
  s.jobs[job] += delta;
}

export function quoteSetzen(s, q) {
  const Q = CONFIG.quote;
  s.kolonie.quote = Math.round(Math.min(Q.max, Math.max(Q.min, q)) * 10) / 10;
  quoteGeaendert(s);
}

export function einrichtungKosten(key) {
  return CONFIG.einrichtungen[key].kosten;
}

// Startet eine Baustelle. Es läuft immer nur eine.
export function einrichtungBauen(s, key) {
  const kosten = einrichtungKosten(key);
  if (s.bauten[key] || s.bau || !s.frei[key] || !bezahlbar(s, kosten)) return;
  bezahlen(s, kosten);
  s.bau = { key, fortschritt: 0 };
  baubeginn(s, key);
  pruefeAusloeser(s);
}
