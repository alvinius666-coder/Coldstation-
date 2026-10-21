// Ein Spieltick. Ändert nur den Spielstand, kein DOM.

import { CONFIG } from './config.js';
import { kabineGeaendert, tanksStehen, pruefeAusloeser } from './events.js';

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

export function tick(s) {
  const { res, bauten } = s;
  const E = CONFIG.energie;
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

  // Wärmeverlust
  res.energie -= E.verlustFest + E.verlustAnteil * res.energie;
  res.energie = klemmen(res.energie, 0, E.max);

  s.ertrag = ertrag;

  const stufe = kabinenStufe(s.kabine, res.energie);
  if (stufe !== s.kabine) {
    s.kabine = stufe;
    kabineGeaendert(s);
  }

  s.zeit.ticks++;
  pruefeAusloeser(s);
}
