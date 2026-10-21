// Ein Spieltick. Ändert nur den Spielstand, kein DOM.

import { CONFIG } from './config.js';
import { kabineGeaendert, tanksStehen, ankunft, kojenVoll, mangel, pruefeAusloeser } from './events.js';

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

// Leistung einer Person: q · (1 − E) · (1 + S), bei Hunger oder Kälte gedrosselt.
export function leistung(s) {
  const k = s.kolonie;
  let f = k.quote * (1 - k.erschoepfung) * (1 + k.solidaritaet);
  if (s.mangel.hunger) f *= CONFIG.leute.mangelFaktor;
  if (s.mangel.kaelte) f *= CONFIG.leute.mangelFaktor;
  return f;
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
  if (s.mangel.hunger) return;
  n.kojenVoll = false;
  n.ankuenfte++;
  s.kolonie.leute++;
  ankunft(s);
  const L = CONFIG.leute;
  const streuung = 1 + (Math.random() - 0.5) * L.ankunftStreuung;
  const abstand = L.ankunftIntervallMs * (1 + L.ankunftZuwachs * n.ankuenfte);
  n.naechsteAnkunft = s.zeit.spielMs + abstand * streuung;
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

  // Leute arbeiten
  const f = leistung(s);
  for (const [job, n] of Object.entries(s.jobs)) {
    const menge = n * CONFIG.jobs[job].proTick * f;
    res[CONFIG.jobs[job].res] += menge;
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

  ankuenfte(s);

  s.zeit.ticks++;
  pruefeAusloeser(s);
}
