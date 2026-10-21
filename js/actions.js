// Spieleraktionen. Ändern nur den Spielstand, kein DOM.

import { CONFIG } from './config.js';
import { log, einmal, fund, pruefeAusloeser } from './events.js';

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
