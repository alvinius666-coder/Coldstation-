// Ein Spieltick. Ändert nur den Spielstand, kein DOM.

import { CONFIG } from './config.js';
import { ratTick } from './rat.js';
import { guertelTick, konzernTick, netzSolidaritaet } from './guertel.js';
import { endeTick } from './ende.js';
import {
  kabineGeaendert,
  tanksStehen,
  ankunft,
  kojenVoll,
  mangel,
  unfall,
  abgang,
  eingerichtet,
  pruefeAusloeser,
} from './events.js';

function klemmen(x, min, max) {
  return Math.min(max, Math.max(min, x));
}

// Temperaturstufe aus Energie, abwärts mit Hysterese gegen Flackern.
function kabinenStufe(alt, energie) {
  const ab = CONFIG.kabine.stufenAb;
  let st = alt;
  while (st + 1 < ab.length && energie >= ab[st + 1]) st++;
  while (st > 0 && energie < ab[st] - CONFIG.kabine.hysterese) st--;
  return st;
}

export function kojen(s) {
  return CONFIG.leute.kojenStart + s.bauten.kojen * CONFIG.leute.kojePlaetze;
}

// Einrichtungen wirken nur, wenn gebaut und (falls nötig) besetzt.
export function besetzt(s, key) {
  const e = CONFIG.einrichtungen[key];
  return Boolean(s.bauten[key]) && (e.personal === 0 || s.jobs[key] >= e.personal);
}

function einrichtungsSumme(s, feld) {
  let summe = 0;
  for (const [key, e] of Object.entries(CONFIG.einrichtungen)) {
    if (besetzt(s, key)) summe += e[feld] ?? 0;
  }
  return summe;
}

// R = rBasis − rSinkt · min(E, eKnick) + rZusammenbruch · max(0, E − eKnick) + Einrichtungen
export function regeneration(s) {
  const C = CONFIG.erschoepfung;
  const E = s.kolonie.erschoepfung;
  return (
    C.rBasis -
    C.rSinkt * Math.min(E, C.eKnick) +
    C.rZusammenbruch * Math.max(0, E - C.eKnick) +
    einrichtungsSumme(s, 'R')
  );
}

// Leistung einer Person: q · (1 − E) · (1 + S), dazu Ausbildung und Mangel.
export function leistung(s) {
  const k = s.kolonie;
  let f = k.quote * (1 - k.erschoepfung) * (1 + k.solidaritaet);
  f *= 1 + einrichtungsSumme(s, 'ausbildung');
  if (s.mangel.hunger) f *= CONFIG.leute.mangelFaktor;
  if (s.mangel.kaelte) f *= CONFIG.leute.mangelFaktor;
  return f;
}

function arbeitende(s) {
  return Object.keys(CONFIG.jobs).reduce((n, job) => n + s.jobs[job], 0);
}

function setzeMangel(s, art, an) {
  if (s.mangel[art] === an) return;
  s.mangel[art] = an;
  mangel(s, art, an);
}

function ankuenfte(s) {
  const n = s.notsignal;
  if (!n.gesendet || s.zeit.spielMs < n.naechsteAnkunft) return;
  if (s.kolonie.leute >= kojen(s)) {
    if (!n.kojenVoll) {
      n.kojenVoll = true;
      kojenVoll(s);
    }
    return;
  }
  if (s.mangel.hunger || s.kolonie.erschoepfung >= CONFIG.erschoepfung.ankunftStopAb) return;
  n.kojenVoll = false;
  n.ankuenfte++;
  s.kolonie.leute++;
  ankunft(s);
  const L = CONFIG.leute;
  const streuung = 1 + (Math.random() - 0.5) * L.ankunftStreuung;
  const abstand = L.ankunftIntervallMs * (1 + L.ankunftZuwachs * n.ankuenfte);
  n.naechsteAnkunft = s.zeit.spielMs + abstand * streuung;
}

// Eine Person aus dem größten Arbeitsjob nehmen (oder aus den Freien).
function nimmPerson(s) {
  const frei = s.kolonie.leute - Object.values(s.jobs).reduce((a, b) => a + b, 0) - s.verletzte.length;
  if (frei > 0) return null;
  let job = null;
  for (const j of Object.keys(s.jobs)) {
    if (s.jobs[j] > 0 && (job === null || s.jobs[j] > s.jobs[job])) job = j;
  }
  if (job) s.jobs[job]--;
  return job;
}

// ΔE = k · (q − R), Unfälle ab 0,5, Abgänge ab 0,7.
function erschoepfung(s) {
  const C = CONFIG.erschoepfung;
  const k = s.kolonie;
  if (k.leute === 0) return;

  const R = regeneration(s);
  const last = k.quote + (s.mangel.hunger ? C.mangelLast : 0) + (s.mangel.kaelte ? C.mangelLast : 0);
  k.erschoepfung = klemmen(k.erschoepfung + C.k * (last - R), 0, 1);
  k.regeneration = R;
  k.solidaritaet = einrichtungsSumme(s, 'S') + s.rat.solidaritaet + netzSolidaritaet(s) + s.ende.sZuwachs;

  const E = k.erschoepfung;
  const U = CONFIG.unfall;
  if (E >= U.abE) {
    const chance = arbeitende(s) * U.rateProPerson * ((E - U.abE) / (1 - U.abE));
    if (Math.random() < chance) {
      const job = nimmPerson(s);
      const dauer = besetzt(s, 'krankenstation') ? U.heilMsKrankenstation : U.heilMs;
      s.verletzte.push({ job, bis: s.zeit.spielMs + dauer });
      s.gesehen.ersterUnfall = true;
      unfall(s);
    }
  }

  const G = CONFIG.abgang;
  if (E >= G.abE && Math.random() < G.rate * ((E - G.abE) / (1 - G.abE))) {
    if (s.verletzte.length > 0 && Math.random() < s.verletzte.length / k.leute) {
      s.verletzte.pop();
    } else {
      nimmPerson(s);
    }
    k.leute--;
    k.erschoepfung = Math.max(0, k.erschoepfung - C.entlastungProAbgang);
    s.gesehen.ersterAbgang = true;
    abgang(s);
  }
}

function heilen(s) {
  const fertig = s.verletzte.filter((v) => v.bis <= s.zeit.spielMs);
  if (fertig.length === 0) return;
  s.verletzte = s.verletzte.filter((v) => v.bis > s.zeit.spielMs);
  for (const v of fertig) {
    // Zurück an den alten Platz, wenn der noch frei ist.
    if (v.job && (CONFIG.jobs[v.job] || s.jobs[v.job] === 0)) s.jobs[v.job]++;
  }
}

// Leute auf dem Bau bringen Arbeit statt Material.
function bauen(s, f) {
  if (!s.bau) return;
  s.bau.fortschritt += s.jobs.bau * f;
  const key = s.bau.key;
  if (s.bau.fortschritt >= CONFIG.einrichtungen[key].arbeit) {
    s.bauten[key] = true;
    s.bau = null;
    s.jobs.bau = 0;
    if (key in s.teil2.industrie) s.teil2.industrie[key] = true;
    eingerichtet(s, key);
  }
}

export function tick(s) {
  const { res, bauten } = s;
  const vorher = { ...res };
  let ertrag = 0;

  // Reaktor
  if (bauten.reaktorRepariert) {
    res.energie += CONFIG.reaktor.passivProTick;
    ertrag += CONFIG.reaktor.passivProTick;
  }

  // Algentanks: laufen nur, wenn genug Energie für alle da ist.
  if (bauten.algentank > 0) {
    const bedarf = bauten.algentank * CONFIG.algentank.energieProTick;
    const stehen = res.energie < bedarf;
    if (stehen !== s.tanksStehen) {
      s.tanksStehen = stehen;
      tanksStehen(s, stehen);
    }
    if (!stehen) {
      const algen = bauten.algentank * CONFIG.algentank.algenProTick;
      res.energie -= bedarf;
      res.algen += algen;
      ertrag += algen;
    }
  }

  // Einrichtungen, die selbst etwas liefern (Gewächshaus)
  for (const [key, e] of Object.entries(CONFIG.einrichtungen)) {
    if (!e.produktion || !besetzt(s, key)) continue;
    for (const [r, n] of Object.entries(e.produktion)) {
      res[r] += n;
      ertrag += n;
    }
  }

  // Leute arbeiten
  const f = leistung(s);
  for (const [job, def] of Object.entries(CONFIG.jobs)) {
    const menge = s.jobs[job] * def.proTick * f;
    res[def.res] += menge;
    ertrag += menge;
  }

  // Leute essen und brauchen Wärme
  const A = s.kolonie.leute;
  if (A > 0) {
    const essen = A * CONFIG.leute.algenProKopf;
    const waerme = A * CONFIG.leute.energieProKopf;
    setzeMangel(s, 'hunger', res.algen < essen);
    setzeMangel(s, 'kaelte', res.energie < waerme);
    res.algen = Math.max(0, res.algen - essen);
    res.energie = Math.max(0, res.energie - waerme);
  }

  // Wärmeverlust
  const E = CONFIG.energie;
  res.energie -= E.verlustFest + E.verlustAnteil * res.energie;
  res.energie = klemmen(res.energie, 0, E.max);

  s.ertrag = ertrag;
  for (const r of Object.keys(s.raten)) s.raten[r] = res[r] - vorher[r];

  const stufe = kabinenStufe(s.kabine, res.energie);
  if (stufe !== s.kabine) {
    s.kabine = stufe;
    kabineGeaendert(s);
  }

  bauen(s, f);
  ratTick(s);
  erschoepfung(s);
  heilen(s);
  ankuenfte(s);
  if (besetzt(s, 'kantine')) s.kantineMs += CONFIG.tickMs;
  konzernTick(s);
  endeTick(s);
  guertelTick(s);

  s.zeit.ticks++;
  pruefeAusloeser(s);
}
