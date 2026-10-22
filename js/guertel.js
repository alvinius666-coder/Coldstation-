// Der Gürtel (Phase 5): Stationen, Lieferungen, Netz, Memos.
// Dazu die Konzernstation als Gegenprobe, die ab Spielstart mitläuft. Kein DOM.

import { CONFIG } from './config.js';
import { log, einmal, FUNK, OKKAR_STREIK, MEMOS, NACH_DER_LISTE } from './events.js';
import { regeneration } from './tick.js';

export function befreit(st) {
  return st.status === 'kollektiv' || st.status === 'netz';
}

// Stationen im Netz (ohne die eigene).
export function imNetz(s) {
  return Object.values(s.guertel.stationen).filter(befreit).length;
}

export function netzSolidaritaet(s) {
  return s.guertel.aktiv ? imNetz(s) * CONFIG.guertel.sProStation : 0;
}

export function lieferKosten() {
  return CONFIG.guertel.lieferung;
}

export function schlepperDa(s) {
  return s.zeit.spielMs >= s.guertel.schlepperZurueck;
}

export function kannLiefern(s) {
  return schlepperDa(s) && Object.entries(lieferKosten()).every(([r, n]) => s.res[r] >= n);
}

function funk(s, key) {
  for (const zeile of FUNK[key]) log(s, zeile);
}

// Eine Lieferung an eine streikende Station. Abgeben ist kein Vorschlag.
export function liefern(s, key, vomRat = false) {
  const st = s.guertel.stationen[key];
  if (!s.guertel.aktiv || st.status !== 'streik' || !kannLiefern(s)) return false;
  for (const [r, n] of Object.entries(lieferKosten())) s.res[r] -= n;
  s.guertel.schlepperZurueck = s.zeit.spielMs + CONFIG.guertel.fahrtMs;
  st.hilfe++;
  const name = CONFIG.guertel.stationen[key].name;
  log(
    s,
    vomRat
      ? `Der Rat schickt den Überschuss nach ${name}. Gehortet wird nicht.`
      : `Der Schlepper bringt Algen und Schrott nach ${name}.`,
  );
  if (st.hilfe >= CONFIG.guertel.stationen[key].bedarf) befreien(s, key);
  return true;
}

function befreien(s, key) {
  const st = s.guertel.stationen[key];
  st.status = 'netz';
  log(s, `${CONFIG.guertel.stationen[key].name} schließt sich dem Netz an.`);
  s.teil2.buendnisse = Object.keys(s.guertel.stationen).filter((k) => befreit(s.guertel.stationen[k]));
  s.konzern.leute = Math.max(0, s.konzern.leute - CONFIG.guertel.konzernVerlustProStation);

  // Stationen unter Konzernsicherheit treten in den Streik, wenn genug frei sind.
  const frei = Object.values(s.guertel.stationen).filter((x) => x.status === 'netz').length;
  for (const [k, def] of Object.entries(CONFIG.guertel.stationen)) {
    const x = s.guertel.stationen[k];
    if (x.status === 'konzern' && frei >= def.streikAbBefreit) {
      x.status = 'streik';
      log(s, OKKAR_STREIK);
    }
  }
}

// Beginn von Phase 5: Kontakt zu allen Stationen.
export function guertelOeffnen(s) {
  const g = s.guertel;
  if (g.aktiv) return;
  g.aktiv = true;
  g.naechstesMemo = s.zeit.spielMs + CONFIG.guertel.memoIntervallMs / 2;
  g.naechsteRatLieferung = s.zeit.spielMs + CONFIG.guertel.ratLieferIntervallMs;
  s.teil2.industrie.schlepper = true;
  s.teil2.buendnisse = Object.keys(g.stationen).filter((k) => befreit(g.stationen[k]));
  log(s, 'Im Schlepper liegt ein Datenkern der Konzernflotte. Der Funker macht sich daran.');
  for (const key of Object.keys(CONFIG.guertel.stationen)) funk(s, key);
  s.teil2.soeldnerGeruechte++;
}

function memos(s) {
  const g = s.guertel;
  if (g.memos >= MEMOS.length || s.zeit.spielMs < g.naechstesMemo) return;
  log(s, MEMOS[g.memos]);
  if (MEMOS[g.memos].includes('Sold')) s.teil2.soeldnerGeruechte++;
  g.memos++;
  g.naechstesMemo = s.zeit.spielMs + CONFIG.guertel.memoIntervallMs;
  if (g.memos === MEMOS.length) {
    for (const zeile of NACH_DER_LISTE) log(s, zeile);
  }
}

// Der Rat gibt Überschuss ab, an die Station, die am längsten wartet.
function ratLiefert(s) {
  const G = CONFIG.guertel;
  const g = s.guertel;
  if (!s.rat.aktiv || s.zeit.spielMs < g.naechsteRatLieferung) return;
  g.naechsteRatLieferung = s.zeit.spielMs + G.ratLieferIntervallMs;
  const ueberschuss = Object.entries(G.ratLiefertAb).every(([r, n]) => s.res[r] >= n);
  if (!ueberschuss) return;
  const key = Object.keys(g.stationen).find((k) => g.stationen[k].status === 'streik');
  if (key) liefern(s, key, true);
}

export function guertelTick(s) {
  if (!s.guertel.aktiv) return;
  memos(s);
  ratLiefert(s);
  const f = 1 + s.kolonie.solidaritaet;
  let netz = s.ertrag;
  for (const [key, st] of Object.entries(s.guertel.stationen)) {
    if (befreit(st)) netz += CONFIG.guertel.stationen[key].ertrag * f;
  }
  s.guertel.netzErtrag = netz;
  einmal(s, 'konzernSichtbar', `Auf dem Schirm: Konzernstation ${CONFIG.konzern.name}. Ihre Zahlen kommen offen rein.`);
}

// Gegenprobe: Ertrag = A · q · (1 − E), ΔE = k · (q − R), ohne Einrichtungen.
export function konzernTick(s) {
  const k = s.konzern;
  const C = CONFIG.erschoepfung;
  const R = regeneration({ kolonie: { erschoepfung: k.erschoepfung }, bauten: {}, jobs: {} });
  k.erschoepfung = Math.min(1, Math.max(0, k.erschoepfung + C.k * (k.quote - R)));
  const G = CONFIG.abgang;
  if (k.leute > 0 && k.erschoepfung >= G.abE) {
    if (Math.random() < CONFIG.konzern.abgangRate * ((k.erschoepfung - G.abE) / (1 - G.abE))) {
      k.leute--;
      k.erschoepfung = Math.max(0, k.erschoepfung - C.entlastungProAbgang);
    }
  }
  k.ertrag = k.leute * k.quote * (1 - k.erschoepfung);
}
