// ASCII-Grafiken: die Station im Querschnitt, die Gürtelkarte, das Schiff.
// Reine Funktionen vom Spielstand zum Text. Kein DOM.

import { CONFIG } from './config.js';
import { EINRICHTUNG_NAME } from './events.js';
import { kojen } from './tick.js';

// Ein Modul: 4 Zeilen, 11 Zeichen breit, mit Gang (=) links und rechts.
function modul(titel, muster) {
  const t = titel.padEnd(7).slice(0, 7);
  const m = muster.padEnd(7).slice(0, 7);
  return [' .-------. ', ` |${m}| `, `=|${t}|=`, " '-------' "];
}

function reihe(module) {
  if (module.length === 0) return [];
  return [0, 1, 2, 3].map((z) => module.map((m) => m[z]).join(''));
}

// Zwei Zustände im Wechsel, damit die Station lebt.
function blinkt(s, a, b) {
  return s.zeit.ticks % 2 === 0 ? a : b;
}

const KABINE_MUSTER = ['* . * .', '.  *  .', '   .   ', ' ~ ~ ~ '];

const MUSTER = {
  kantine: (s) => (s.jobs.kantine > 0 ? blinkt(s, ' ~u~u~ ', ' u~u~u ') : ' _ _ _ '),
  krankenstation: (s) => `+ ${'='.repeat(Math.min(3, s.verletzte.length)).padEnd(3, '_')} +`,
  schule: () => ' [ABC] ',
  ruheraum: (s) => blinkt(s, ' z  z  ', '  z  z '),
  versammlung: () => '(o o o)',
  gewaechshaus: () => '\\|/\\|/\\',
  schlepper: () => ' <==>  ',
  bergbaulaser: (s) => blinkt(s, ' --==> ', ' -===> '),
  schrottlager: () => '[][][] ',
};

const TITEL = {
  kantine: 'KANTINE',
  krankenstation: 'KRANKEN',
  schule: 'SCHULE',
  ruheraum: 'RUHE',
  versammlung: 'HALLE',
  gewaechshaus: 'GEWÄCHS',
  schlepper: 'HANGAR',
  bergbaulaser: 'LASER',
  schrottlager: 'LAGER',
};

const WOHNEN = ['kantine', 'krankenstation', 'schule', 'ruheraum', 'versammlung'];
const TECHNIK = ['gewaechshaus', 'schlepper', 'bergbaulaser', 'schrottlager'];

function baustelle(s) {
  const anteil = s.bau.fortschritt / CONFIG.einrichtungen[s.bau.key].arbeit;
  const voll = Math.min(7, Math.floor(anteil * 7));
  const titel = (TITEL[s.bau.key] ?? EINRICHTUNG_NAME[s.bau.key]).slice(0, 7);
  return modul(titel.toLowerCase(), '#'.repeat(voll).padEnd(7, '.'));
}

function einrichtungen(s, liste) {
  const module = [];
  for (const key of liste) {
    if (s.bauten[key]) module.push(modul(TITEL[key], MUSTER[key](s)));
    else if (s.bau?.key === key) module.push(baustelle(s));
    // Der Hangar steht da, bevor der Schlepper fliegt: mit Wrack.
    else if (key === 'schlepper' && s.frei.schlepper) module.push(modul('HANGAR', ' __x__ '));
  }
  return module;
}

export function stationsBild(s) {
  const wohnen = [modul('KABINE', KABINE_MUSTER[s.kabine])];
  if (s.kolonie.leute > 0) {
    const belegt = Math.round((7 * s.kolonie.leute) / kojen(s));
    wohnen.push(modul('KOJEN', 'o'.repeat(belegt).padEnd(7, '.')));
  }
  wohnen.push(...einrichtungen(s, WOHNEN));

  const r = s.bauten.reaktorRepariert;
  const reaktor = r ? blinkt(s, ' (***) ', ' (*+*) ') : s.res.energie > 1 ? ' ( * ) ' : ' ( . ) ';
  const technik = [modul('REAKTOR', reaktor)];
  if (s.bauten.algentank > 0) {
    const blase = s.tanksStehen ? '_' : blinkt(s, 'o', 'O');
    technik.push(modul('TANKS', ` ${Array(s.bauten.algentank).fill(blase).join(' ')}`));
  }
  technik.push(...einrichtungen(s, TECHNIK));

  const kopf = s.stationsName ? ` ${s.stationsName.toUpperCase()}` : '';
  return [kopf, ...reihe(wohnen), ...reihe(technik)].filter((z, i) => i > 0 || z).join('\n');
}

// Gürtelkarte: Iskra in der Mitte, die Stationen drumherum.
const HIMMEL = [
  ' .        *          .      .   ',
  '     .          .        *      ',
  '  *       .            .      . ',
  '      .        .    *           ',
  ' .         *          .     .   ',
  '    *            .         .    ',
  '  .      .    *       .       * ',
];
const LAGE = {
  zarja: [1, 2],
  vela: [1, 21],
  tamm: [5, 1],
  okkar: [5, 20],
};
const ZEICHEN = { kollektiv: '+', netz: '+', streik: '!', konzern: '#' };

function setze(zeilen, z, sp, text) {
  const zeile = zeilen[z];
  zeilen[z] = zeile.slice(0, sp) + text + zeile.slice(sp + text.length);
}

export function karte(s) {
  const zeilen = [...HIMMEL];
  setze(zeilen, 3, 11, `(${(s.stationsName ?? 'Station').toUpperCase()})`);
  for (const [key, [z, sp]] of Object.entries(LAGE)) {
    const st = s.guertel.stationen[key];
    setze(zeilen, z, sp, `${ZEICHEN[st.status]} ${CONFIG.guertel.stationen[key].name}`);
  }
  setze(zeilen, 6, 21, `# ${CONFIG.konzern.name}`);
  return [...zeilen, '', ' + Netz   ! Streik   # Konzern'].join('\n');
}

export const SCHIFF = [
  '              __',
  '      _______/  \\_______',
  '  ---<___ KONZERN _______>',
  '             \\__/',
].join('\n');
