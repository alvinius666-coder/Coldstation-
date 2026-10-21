// Alle Balancewerte an einer Stelle. Zeiten in Millisekunden Spielzeit,
// Raten pro Tick. Im Debug-Modus läuft die Spielzeit schneller, die Werte
// hier bleiben gleich.

export const CONFIG = {
  // Grundtakt: Länge eines Ticks.
  tickMs: 1000,
  // Zeitraffer bei ?debug=1.
  debugTempo: 10,
  // Automatisch speichern, alle n ms Echtzeit.
  autosaveMs: 10000,
  // So viele Zeilen behält das Ereignislog.
  logMax: 30,
  // Nach einer Pause (Tab im Hintergrund) höchstens so viel Echtzeit nachholen.
  maxNachholMs: 60 * 60 * 1000,

  energie: {
    start: 0,
    max: 100,
    // Wärmeverlust pro Tick = verlustFest + verlustAnteil · Energie.
    // Dadurch pendelt sich Energie ein, statt endlos zu steigen:
    // nur Klicken ≈ 37, Reaktor geflickt ohne Klicken ≈ 40, beides ≈ 80.
    verlustFest: 0.05,
    verlustAnteil: 0.02,
  },

  reaktor: {
    // Energie pro Klick auf „Reaktor anwerfen“.
    klickEnergie: 4,
    cooldownMs: 5000,
    // „Kühlkreislauf flicken“: danach liefert der Reaktor von selbst.
    reparaturKosten: { schrott: 30 },
    passivProTick: 1.0,
  },

  schrott: {
    // Knopf erscheint, sobald Energie diesen Wert erreicht.
    freiAbEnergie: 10,
    klickMenge: 2,
    cooldownMs: 4000,
    // Chance pro Sammeln auf einen Fund (einzeiliges Ereignis).
    fundChance: 0.15,
  },

  algentank: {
    // Bauoption erscheint ab so viel Schrott.
    freiAbSchrott: 5,
    // Kosten des ersten Tanks, jeder weitere · kostenFaktor.
    basisKosten: { schrott: 12 },
    kostenFaktor: 1.6,
    max: 3,
    // Pro Tank und Tick. Ohne genug Energie stehen die Tanks still.
    algenProTick: 0.25,
    energieProTick: 0.1,
  },

  kabine: {
    // Energieschwellen der Temperaturstufen (eiskalt, kalt, kühl, warm).
    stufenAb: [0, 8, 25, 50],
    // Abwärts erst, wenn Energie so weit unter die Schwelle fällt.
    hysterese: 5,
  },

  notsignal: {
    // Funkpult wird nutzbar, sobald Energie diesen Wert überschreitet.
    freiAbEnergie: 50,
    kosten: { energie: 20 },
  },

  leute: {
    // Erste Ankunft nach dem Notsignal, danach im Abstand Intervall ± Streuung.
    // Jede Ankunft verlängert den Abstand um ankunftZuwachs (Anteil):
    // ca. 6 Leute nach 5 min Spielzeit, ca. 17 nach 15 min.
    ersteAnkunftMs: 15000,
    ankunftIntervallMs: 20000,
    ankunftZuwachs: 0.15,
    ankunftStreuung: 0.5, // ±25 %
    // Kojen: Startplätze, jede hergerichtete Koje bringt weitere.
    kojenStart: 4,
    kojePlaetze: 2,
    kojeKosten: { schrott: 15 },
    kojeFaktor: 1.4,
    // Verbrauch pro Person und Tick.
    algenProKopf: 0.2,
    energieProKopf: 0.1,
    // Hunger oder Kälte: Leistung der Leute mal diesen Faktor.
    mangelFaktor: 0.5,
  },

  // Ertrag einer Person pro Tick bei q = 1, E = 0, S = 0.
  jobs: {
    schrott: { res: 'schrott', proTick: 1.0 },
    algen: { res: 'algen', proTick: 1.0 },
    energie: { res: 'energie', proTick: 1.0 },
  },

  // Schichtregler q.
  quote: { min: 0.5, max: 1.5, schritt: 0.1 },

  // Startwerte der Kolonie. Ab Block 2/3 in Gebrauch.
  // Ertrag = A · q · (1 − E) · (1 + S),  ΔE = k · (q − R)
  kolonie: {
    leute: 0, // A
    quote: 1.0, // q, Regler 0,5 … 1,5
    erschoepfung: 0, // E, 0 … 1
    solidaritaet: 0, // S, 0 … offen
    regeneration: 0, // R
  },
};
