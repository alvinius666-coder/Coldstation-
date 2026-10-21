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

  // Erschöpfung: ΔE = k · (q − R) pro Tick, E geklemmt auf 0 … 1.
  // R = rBasis − rSinkt · min(E, eKnick) + rZusammenbruch · max(0, E − eKnick)
  //     + Summe der besetzten Einrichtungen.
  // rSinkt: wer erschöpft ist, erholt sich schlechter. Das macht die Wand:
  // E steigt erst schleichend, dann immer schneller.
  // rZusammenbruch: jenseits von eKnick brechen Leute zusammen und liegen,
  // ob der Plan will oder nicht. Bei q = 1,5 pendelt E knapp über 0,7.
  erschoepfung: {
    k: 0.00042,
    rBasis: 1.0,
    rSinkt: 1.25,
    eKnick: 0.6,
    rZusammenbruch: 10,
    // Hunger oder Kälte wirken wie zusätzliche Schicht.
    mangelLast: 0.5,
    // Ab hier beginnt Phase 3 (die Wand).
    wandAb: 0.3,
    // Wer geht, ist meist der Erschöpfteste: der Schnitt sinkt etwas.
    entlastungProAbgang: 0.01,
    // Ab hier kommt niemand Neues mehr (es spricht sich herum).
    ankunftStopAb: 0.5,
  },

  unfall: {
    abE: 0.5,
    // Chance pro arbeitender Person und Tick bei E = 1 (linear ab abE).
    rateProPerson: 0.002,
    // So lange fällt eine verletzte Person aus.
    heilMs: 90000,
    heilMsKrankenstation: 30000,
  },

  abgang: {
    abE: 0.7,
    // Chance pro Tick bei E = 1 (linear ab abE), dass jemand geht.
    rate: 0.1,
  },

  // Einrichtungen werden gebaut: Material beim Baubeginn, dann Arbeit.
  // Arbeit = Summe der Leistung aller Leute auf dem Bau, pro Tick.
  // personal: so viele Leute braucht sie fertig, sonst wirkt sie nicht.
  // nurRat: baut nur der Rat, von sich aus.
  // R: Regeneration, S: Solidarität, ausbildung: Leistung · (1 + ausbildung),
  // produktion: Material pro Tick ohne Personal.
  einrichtungen: {
    kantine: { kosten: { schrott: 300, algen: 100 }, arbeit: 300, personal: 1, R: 0.3, S: 0.1 },
    krankenstation: { kosten: { schrott: 500, algen: 100 }, arbeit: 450, personal: 1, R: 0.2, S: 0.1 },
    schule: {
      kosten: { schrott: 800, algen: 200 },
      arbeit: 700,
      personal: 1,
      R: 0.05,
      S: 0.15,
      ausbildung: 0.2,
    },
    ruheraum: { kosten: { schrott: 600, algen: 150 }, arbeit: 500, personal: 0, nurRat: true, R: 0.15, S: 0.05 },
    gewaechshaus: {
      kosten: { schrott: 900, algen: 100 },
      arbeit: 700,
      personal: 0,
      nurRat: true,
      S: 0.05,
      produktion: { algen: 2 },
    },
    versammlung: { kosten: { schrott: 1500, algen: 300 }, arbeit: 1000, personal: 0, nurRat: true, S: 0.15 },
  },

  rat: {
    // Der Rat entsteht, sobald so viele Einrichtungen stehen.
    abEinrichtungen: 2,
    // So lange berät der Rat über einen Vorschlag.
    beratungMs: 15000,
    // Zustimmung (Anteil Ja-Stimmen) je Vorschlag, ± rauschen.
    rauschen: 0.12,
    zustimmung: {
      quoteRunter: 0.85, // kürzere Schichten
      quoteNormal: 0.7, // zurück auf höchstens 1,0
      quoteLang: 0.55, // bis 1,2; minus erschoepfungMalus · E
      quoteDoppel: 0.15, // über 1,2
      erschoepfungMalus: 2,
      bau: 0.8,
      koje: 0.7,
    },
    // Solidarität, die der Rat selbst aufbaut, pro Tick und höchstens.
    sProTick: 0.00015,
    sMax: 0.5,
    // Abstand zwischen eigenen Bauvorhaben (auch bis zum ersten), Leute pro Baustelle.
    bauIntervallMs: 240000,
    bauLeute: 3,
    // Ab dieser Erschöpfung setzt der Rat selbst die Normalschicht durch.
    eingreifenAbE: 0.3,
    // Abstand zwischen Streitgesprächen ohne Anlass.
    debatteIntervallMs: 90000,
  },

  // Wer die Wand nie erreicht, bekommt die Einrichtungen trotzdem angeboten.
  phase3SpaetestensMs: 13 * 60 * 1000,
  // So lange muss die Kantine besetzt sein, bis beim Essen jemand etwas sagt.
  essenNachMs: 20000,

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
