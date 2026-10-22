// Ereignisse: Log, einmalige Meldungen, Freischaltungen.
// Eine Zeile pro Ereignis, karger Ton.

import { CONFIG } from './config.js';
import { guertelOeffnen } from './guertel.js';

export const KABINE = ['eiskalt', 'kalt', 'kühl', 'warm'];

// Funde beim Schrottsammeln. Jeder kommt höchstens einmal.
export const FUNDE = [
  'Ein Helm. Statt eines Namens eine Nummer.',
  'Eine Thermoskanne, noch halb voll. Jemand ist in Eile gegangen.',
  'Ein Dienstplan. Die Spalte „Schichtleitung“ ist abgerissen.',
  'Eine Quotentafel. Die letzte Woche rot unterstrichen.',
];

// Ankünfte nach dem Notsignal, in dieser Reihenfolge. Danach ANKUNFT_REST.
export const ANKUENFTE = [
  'Jemand klopft an die Schleuse. Ein Bohrhauer, halb erfroren.',
  'Eine Technikerin aus Schacht 4. Sie hat ihr Werkzeug dabei.',
  'Ein Junge aus der Raffinerie. Zu jung für die Liste.',
  'Eine ältere Frau, Schweißerin. Sie sieht dich lange an.',
  'Ein Koch. Er fragt zuerst nach den Tanks.',
  'Ein Mann mit Handfunkgerät. Er hat das Signal gehört.',
  'Eine Sanitäterin ohne Medikamente.',
  'Ein Lader aus dem Hangar. Er war beim letzten Shuttle. Nicht drin.',
  'Eine Frau mit Narben an den Händen. Schacht 2.',
  'Ein Rohrleger. Er sagt nichts.',
];
const ANKUNFT_REST = 'Noch jemand kommt durch die Schleuse.';

const UNFAELLE = [
  'Unfall am Förderband. Eine gequetschte Hand.',
  'Ein Bohrkopf bricht. Splitter im Gesicht.',
  'Jemand schläft an der Presse ein.',
  'Ein Sturz im Schacht. Das Bein ist gebrochen.',
  'Verbrühung am Reaktorkreislauf.',
  'Ein Kabel reißt. Verbrennungen am Arm.',
];

const ABGAENGE = [
  'Eine Koje ist leer. Jemand ist gegangen.',
  'Ein Raumanzug fehlt. Und einer von uns.',
  'Jemand nimmt die Kapsel zur Nachbarstation.',
  'Am Morgen fehlt einer. Niemand fragt.',
];

function zufall(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

export function log(s, text) {
  s.log.unshift({ t: s.zeit.spielMs, text });
  if (s.log.length > CONFIG.logMax) s.log.length = CONFIG.logMax;
  s.logNr++;
}

export function einmal(s, key, text) {
  if (s.gesehen[key]) return false;
  s.gesehen[key] = true;
  log(s, text);
  return true;
}

export function startTexte(s) {
  log(s, 'Die Kabine ist eiskalt.');
  log(s, 'Draußen kein Laut. Der Hangar ist leer.');
}

export function kabineGeaendert(s) {
  const ort = s.kolonie.leute > 0 ? 'Die Station' : 'Die Kabine';
  log(s, `${ort} ist ${KABINE[s.kabine]}.`);
}

export function ankunft(s) {
  const i = s.notsignal.ankuenfte - 1;
  log(s, ANKUENFTE[i] ?? ANKUNFT_REST);
}

export function kojenVoll(s) {
  log(s, 'Die Kojen sind voll. Jemand schläft im Gang.');
}

export function mangel(s, art, an) {
  const texte = {
    hunger: ['Die Algen sind alle. Es wird hungrig gearbeitet.', 'Es gibt wieder zu essen.'],
    kaelte: ['Zu wenig Strom. Die Leute frieren bei der Arbeit.', 'Die Heizung läuft wieder.'],
  };
  log(s, texte[art][an ? 0 : 1]);
}

export function quoteGeaendert(s) {
  const q = s.kolonie.quote;
  if (q >= 1.4) einmal(s, 'quoteHoch', 'Doppelschichten. Niemand widerspricht.');
  if (q <= 0.6) einmal(s, 'quoteNiedrig', 'Kurze Schichten. Die Leute sehen dich fragend an.');
}

const EINGERICHTET = {
  kantine: 'Die Kantine ist warm. Es riecht nach Algenbrot.',
  krankenstation: 'Die Krankenstation hat sechs Betten und einen Kasten Verbandszeug.',
  schule: 'In der Werkschule hängt eine Tafel. Jemand schreibt darauf.',
  ruheraum: 'Der Ruheraum ist dunkel und still. Er ist nie leer.',
  gewaechshaus: 'Im Gewächshaus wachsen Algen auf Draht. Jemand hat Tomaten dazugesetzt.',
  versammlung: 'Die Versammlungshalle hat keine Bühne. Die Stühle stehen im Kreis.',
  schlepper: 'Der Schlepper hustet, dann zieht er. Der Gürtel ist wieder erreichbar.',
  bergbaulaser: 'Der Bergbaulaser schneidet wieder. Er war für Erz gedacht.',
  schrottlager: 'Das Schrottlager ist sortiert. Platten, Träger, Rohre. Man könnte alles daraus bauen.',
};

export const EINRICHTUNG_NAME = {
  kantine: 'Kantine',
  krankenstation: 'Krankenstation',
  schule: 'Werkschule',
  ruheraum: 'Ruheraum',
  gewaechshaus: 'Gewächshaus',
  versammlung: 'Versammlungshalle',
  schlepper: 'Schlepper',
  bergbaulaser: 'Bergbaulaser',
  schrottlager: 'Schrottlager',
};

// Funksprüche aus dem Gürtel. Bei Kontakt, bei Streikbeginn, bei Befreiung.
export const FUNK = {
  hesper: ['Funk aus Hesper: „Wir machen das seit einem Jahr so. Willkommen.“'],
  vela: [
    'Funk aus Vela: „Sie haben die Quote auf 160 gesetzt und die Krankenstation geschlossen.“',
    'Funk aus Vela: „Also haben wir die Bohrer abgestellt. Aber wir haben nichts zu essen.“',
  ],
  tamm: [
    'Funk aus Tamm: „Zwei Tote im Eisschacht. Die Antwort war eine Prämie für die anderen.“',
    'Funk aus Tamm: „Die Prämie hat keiner abgeholt.“',
  ],
  okkar: ['Funk aus Okkar, leise: „An den Schleusen stehen Söldner. Bezahlt hat man die auch nicht.“'],
};

export const OKKAR_STREIK = 'In Okkar legen sie die Arbeit nieder. Die Söldner sehen zu.';

// Entschlüsselte Konzernmemos aus dem Datenkern des Schleppers, in dieser Reihenfolge.
export const MEMOS = [
  'Memo, Abt. Gürtel: „Kalte Station: Förderquote 140 %. Ausfälle 9 %. Im Rahmen.“',
  'Memo, Personal: „Arbeitskräfte werden als Betriebsmittel geführt. Abschreibung über vier Jahre.“',
  'Memo, Sicherheit: „Sold für den Dienst in Okkar wird ins nächste Quartal verschoben.“',
  'Memo, Abt. Gürtel: „Kalte Station unrentabel. Räumung. Das Shuttle fasst 40.“',
  'Memo, Räumung: „Auswahl durch die Schichtleitung nach Produktivität. Liste anbei.“',
  'Memo, Räumung: „Liste erhalten. Gezeichnet: SL-07.“',
];
// Nach dem letzten Memo. Keine Erklärung.
export const NACH_DER_LISTE = [
  'Die alte Schweißerin legt den Ausdruck vor dich auf den Tisch.',
  'Niemand sagt etwas. Dann geht die Arbeit weiter.',
];

// Streitgespräche im Rat: zwei Stimmen, je eine Zeile. Nach Anlass sortiert.
const DEBATTEN = {
  quoteHoch: [
    ['Der Lader: „Mehr Schicht, mehr Erz. Wir brauchen Reserven.“', 'Die Sanitäterin: „Ich habe sechs Betten. Die waren schon mal voll.“'],
    ['Der Bohrhauer: „Ich kann noch. Lass mich arbeiten.“', 'Die alte Schweißerin: „Das hast du früher auch gesagt. Dann kam die Liste.“'],
    ['Der Rohrleger: „Ein paar Wochen Doppelschicht, dann sind wir durch.“', 'Die Frau aus Schacht 2: „Durch womit? Mit uns?“'],
  ],
  quoteRunter: [
    ['Der Koch: „Wer ausgeschlafen ist, verbrennt sich nicht.“', 'Der Lader: „Und wer schafft dann das Erz?“'],
    ['Die Technikerin: „Weniger Stunden, weniger Fehler. Ich hab’s gezählt.“', 'Der Bohrhauer: „Gezählt hat hier früher nur einer.“'],
  ],
  bau: [
    ['Die Technikerin: „Gute Idee. Aber wer baut?“', 'Der Junge: „Ich.“'],
    ['Der Rohrleger: „Erst die Rohre in Schacht 2.“', 'Die Frau aus Schacht 2: „Die Rohre laufen nicht weg. Die Leute schon.“'],
    ['Der Lader: „Das Material bräuchten wir für Kojen.“', 'Der Koch: „Kojen für wen? Für Leute, die nicht bleiben wollen?“'],
  ],
  allgemein: [
    ['Der Bohrhauer: „Wozu ein Rat? Früher gab es den Schichtleiter.“', 'Die alte Schweißerin: „Ja. Früher.“'],
    ['Der Funker: „Andere Stationen funken auch. Wir könnten teilen.“', 'Der Lader: „Teilen? Wir haben selbst kaum genug.“'],
    ['Die Technikerin: „Im Hangar steht der alte Schlepper. Den könnte man flicken.“', 'Der Koch: „Und dann? Abhauen?“'],
    ['Der Junge: „Wer entscheidet eigentlich, wer im Rat sitzt?“', 'Die Sanitäterin: „Alle. Du auch.“'],
    ['Die Frau aus Schacht 2: „Der Überschuss liegt im Lager. Wem gehört der?“', 'Der Funker: „Wem gehörte er vorher?“'],
  ],
};

export function debatte(s, thema) {
  const liste = DEBATTEN[thema];
  const offen = liste.map((_, i) => i).filter((i) => !s.gesehen[`debatte_${thema}_${i}`]);
  const i = offen.length > 0 ? offen[Math.floor(Math.random() * offen.length)] : Math.floor(Math.random() * liste.length);
  s.gesehen[`debatte_${thema}_${i}`] = true;
  for (const zeile of liste[i]) log(s, zeile);
}

export function baubeginn(s, key) {
  log(s, `Baustelle: ${EINRICHTUNG_NAME[key]}. Es braucht Hände.`);
}

export function eingerichtet(s, key) {
  log(s, EINGERICHTET[key]);
}

export function unfall(s) {
  log(s, zufall(UNFAELLE));
}

export function abgang(s) {
  log(s, zufall(ABGAENGE));
}

export function tanksStehen(s, stehen) {
  log(s, stehen ? 'Kein Strom. Die Tanks stehen still.' : 'Die Tanks blubbern wieder.');
}

export function fund(s) {
  const offen = FUNDE.filter((_, i) => !s.gesehen['fund' + i]);
  if (offen.length === 0) return;
  const text = offen[Math.floor(Math.random() * offen.length)];
  einmal(s, 'fund' + FUNDE.indexOf(text), text);
}

// Nach jedem Tick und jeder Aktion: was ist neu sichtbar?
export function pruefeAusloeser(s) {
  const { res, frei, bauten } = s;

  if (!frei.vorraete && res.energie > 0) {
    frei.vorraete = true;
  }
  if (!frei.schrott && res.energie >= CONFIG.schrott.freiAbEnergie) {
    frei.schrott = true;
    log(s, 'Im Notlicht: Schrott, überall.');
  }
  if (!frei.algentank && res.schrott >= CONFIG.algentank.freiAbSchrott) {
    frei.algentank = true;
    log(s, 'Im Nebenraum ein Algentank. Gesprungen, aber ganz.');
  }
  if (!frei.reaktorReparatur && bauten.algentank >= 1) {
    frei.reaktorReparatur = true;
    log(s, 'Der Kühlkreislauf leckt. Das ließe sich flicken.');
  }
  if (!frei.ertrag && s.ertrag > 0) {
    frei.ertrag = true;
  }
  if (!frei.notsignal && res.energie > CONFIG.notsignal.freiAbEnergie) {
    frei.notsignal = true;
    log(s, 'Das Funkpult hat wieder Strom.');
  }
  if (!frei.leute && s.kolonie.leute > 0) {
    frei.leute = true;
  }

  // Phase 3: die Wand. Oder spätestens nach einiger Zeit, für Vorsichtige.
  const E = s.kolonie.erschoepfung;
  if (s.phase === 2) {
    if (E > CONFIG.erschoepfung.wandAb) {
      s.phase = 3;
      log(s, 'Die Leute schleppen sich zur Schicht.');
    } else if (s.zeit.spielMs >= CONFIG.phase3SpaetestensMs && s.kolonie.leute > 0) {
      s.phase = 3;
    }
  }
  if (s.phase >= 3 && !frei.kantine) {
    frei.kantine = true;
    log(s, 'Der Koch zeigt dir die alte Kantine. Sie ließe sich herrichten.');
  }
  if (s.phase >= 3 && !frei.krankenstation && (s.gesehen.ersterUnfall || bauten.kantine)) {
    frei.krankenstation = true;
    log(s, 'Die Sanitäterin braucht einen Raum.');
  }
  // Phase 4: der Rat.
  const stehen = Object.keys(CONFIG.einrichtungen).filter((key) => bauten[key]).length;
  if (s.phase === 3 && stehen >= CONFIG.rat.abEinrichtungen) {
    s.phase = 4;
    s.rat.aktiv = true;
    s.rat.naechsterBau = s.zeit.spielMs + CONFIG.rat.bauIntervallMs;
    s.rat.naechsteDebatte = s.zeit.spielMs + CONFIG.rat.debatteIntervallMs / 3;
    log(s, 'Nach dem Essen bleiben alle sitzen.');
    log(s, 'Die alte Schweißerin: „Ab jetzt reden wir mit. Über alles.“');
  }

  // Phase 5: der Gürtel. Erst der Schlepper, dann der Kontakt.
  if (s.phase === 4 && !frei.schlepper && s.zeit.spielMs >= CONFIG.schlepperAbMs) {
    frei.schlepper = true;
    log(s, 'Die Technikerin: „Der Schlepper im Hangar. Jetzt hätten wir das Material.“');
  }
  if (s.phase === 4 && bauten.schlepper) {
    s.phase = 5;
    guertelOeffnen(s);
  }

  if (!frei.schule && bauten.kantine && bauten.krankenstation) {
    frei.schule = true;
    log(s, 'Die Technikerin will den Jungen etwas beibringen. Und den anderen.');
  }
  if (E >= CONFIG.erschoepfung.ankunftStopAb && s.notsignal.gesendet) {
    einmal(s, 'ankunftStop', 'Über Funk: Niemand will mehr hierher.');
  }

  // Nach dem ersten richtigen Essen sagt die alte Schweißerin etwas.
  if (bauten.kantine && s.kantineMs >= CONFIG.essenNachMs && !s.gesehen.essen) {
    const wand = s.gesehen.ersterUnfall || s.gesehen.ersterAbgang;
    einmal(
      s,
      'essen',
      wand
        ? 'Die alte Schweißerin, beim Essen: „Mehr Schicht heißt nicht mehr Erz. Es heißt weniger von uns.“'
        : 'Die alte Schweißerin, beim Essen: „So hat hier noch nie jemand gegessen.“',
    );
  }
}
