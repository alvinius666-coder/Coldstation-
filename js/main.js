// Einstieg: Spielschleife, Speichern, Spielstand-Menü, Debug.

import { CONFIG } from './config.js';
import * as St from './state.js';
import { tick } from './tick.js';
import { startTexte } from './events.js';
import { initUI, render, renderDebug, zuruecksetzen } from './ui.js';

const debug = new URLSearchParams(location.search).get('debug') === '1';
const tempo = debug ? CONFIG.debugTempo : 1;

function neuesSpiel() {
  const s = St.neuerSpielstand();
  startTexte(s);
  return s;
}

let s = St.laden() ?? neuesSpiel();
let zuletzt = performance.now();

const $ = (id) => document.getElementById(id);

// Spielzeit vorrücken und fällige Ticks abarbeiten.
function schritt() {
  const jetzt = performance.now();
  const dt = Math.min(jetzt - zuletzt, CONFIG.maxNachholMs) * tempo;
  zuletzt = jetzt;
  s.zeit.spielMs += dt;
  while (s.zeit.ticks < Math.floor(s.zeit.spielMs / CONFIG.tickMs)) tick(s);
}

function frame() {
  render(s);
  if (debug) renderDebug(s, tempo);
  requestAnimationFrame(frame);
}

function sichern() {
  St.speichern(s);
}

function ersetzen(neu) {
  s = neu;
  zuruecksetzen();
  St.speichern(s);
  render(s);
}

// Spielstand-Menü
function meldung(text) {
  $('spielstand-meldung').textContent = text;
}

$('spielstand-auf').addEventListener('click', () => {
  $('spielstand').hidden = !$('spielstand').hidden;
  meldung('');
});
$('export').addEventListener('click', () => {
  const feld = $('spielstand-text');
  feld.value = St.exportieren(s);
  feld.select();
  meldung('Spielstand steht im Feld.');
});
$('import').addEventListener('click', () => {
  try {
    ersetzen(St.importieren($('spielstand-text').value));
    meldung('Spielstand geladen.');
  } catch {
    meldung('Das ist kein gültiger Spielstand.');
  }
});
$('neustart').addEventListener('click', () => {
  if (!confirm('Alles löschen und neu beginnen?')) return;
  ersetzen(neuesSpiel());
  meldung('Neu begonnen.');
});

// Debug
if (debug) {
  $('debug').hidden = false;
  $('dbg-energie').addEventListener('click', () => {
    s.res.energie = Math.min(CONFIG.energie.max, s.res.energie + 20);
  });
  $('dbg-schrott').addEventListener('click', () => {
    s.res.schrott += 50;
  });
}

initUI(() => s);
setInterval(schritt, 50);
setInterval(sichern, CONFIG.autosaveMs);
addEventListener('pagehide', sichern);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) sichern();
});
requestAnimationFrame(frame);
