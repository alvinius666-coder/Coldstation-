// Der Rat: Vorschläge, Abstimmungen, eigene Bauten. Kein DOM.

import { CONFIG } from './config.js';
import { log, debatte, EINRICHTUNG_NAME } from './events.js';
import { bauStarten, kojeDirekt, quoteDirekt, bezahlbar, einrichtungKosten, kojeKosten } from './actions.js';

// Einen Vorschlag einbringen. Es läuft immer nur einer.
export function vorschlagen(s, v) {
  if (s.rat.vorschlag) return false;
  s.rat.vorschlag = { ...v, bis: s.zeit.spielMs + CONFIG.rat.beratungMs };
  log(s, `Vorschlag: ${v.text}. Der Rat berät.`);
  debatte(s, v.thema);
  return true;
}

// Anteil Ja-Stimmen, bevor der Zufall dazukommt.
function zustimmung(s, v) {
  const Z = CONFIG.rat.zustimmung;
  if (v.art === 'bau') return Z.bau;
  if (v.art === 'koje') return Z.koje;
  // Schicht
  if (v.wert < s.kolonie.quote) return v.wert <= 1 ? Z.quoteRunter : Z.quoteNormal;
  if (v.wert <= 1) return Z.quoteNormal;
  if (v.wert <= 1.2) return Z.quoteLang - Z.erschoepfungMalus * s.kolonie.erschoepfung;
  return Z.quoteDoppel;
}

function ausfuehren(s, v) {
  if (v.art === 'quote') {
    quoteDirekt(s, v.wert);
    return true;
  }
  if (v.art === 'koje') {
    if (!bezahlbar(s, kojeKosten(s))) return false;
    kojeDirekt(s);
    return true;
  }
  if (s.bau || s.bauten[v.key] || !bezahlbar(s, einrichtungKosten(v.key))) return false;
  bauStarten(s, v.key, false);
  return true;
}

function abstimmen(s) {
  const v = s.rat.vorschlag;
  s.rat.vorschlag = null;
  s.rat.sitzungen++;
  const R = CONFIG.rat;
  const p = Math.min(1, Math.max(0, zustimmung(s, v) + (Math.random() - 0.5) * 2 * R.rauschen));
  const stimmen = s.kolonie.leute;
  const ja = Math.round(p * stimmen);
  const nein = stimmen - ja;
  const angenommen = ja > nein;
  s.rat.letztes = { text: v.text, ja, nein, angenommen };
  log(s, `Der Rat stimmt ab: ${ja} dafür, ${nein} dagegen. ${angenommen ? 'Angenommen.' : 'Abgelehnt.'}`);
  if (angenommen && !ausfuehren(s, v)) log(s, 'Angenommen, aber das Material reicht nicht mehr.');
}

// n Leute auf eine Stelle setzen; zuerst Freie, dann aus dem Ausschlachten.
function besetzen(s, job, n) {
  const frei = () =>
    s.kolonie.leute - Object.values(s.jobs).reduce((a, b) => a + b, 0) - s.verletzte.length;
  let gesetzt = 0;
  while (gesetzt < n) {
    if (frei() <= 0) {
      if (s.jobs.schrott === 0) break;
      s.jobs.schrott--;
    }
    s.jobs[job]++;
    gesetzt++;
  }
  return gesetzt;
}

function eigenerBau(s) {
  const R = CONFIG.rat;
  if (s.bau || s.rat.vorschlag || s.zeit.spielMs < s.rat.naechsterBau) return;
  s.rat.naechsterBau = s.zeit.spielMs + R.bauIntervallMs;
  const key = Object.keys(CONFIG.einrichtungen).find(
    (k) =>
      CONFIG.einrichtungen[k].nurRat &&
      s.phase >= (CONFIG.einrichtungen[k].abPhase ?? 0) &&
      !s.bauten[k] &&
      bezahlbar(s, einrichtungKosten(k)),
  );
  if (!key) return;
  log(s, `Der Rat beschließt: ${EINRICHTUNG_NAME[key]}. Du wurdest nicht gefragt.`);
  bauStarten(s, key, true);
}

export function ratTick(s) {
  if (!s.rat.aktiv) return;
  const R = CONFIG.rat;
  const jetzt = s.zeit.spielMs;

  if (s.rat.vorschlag && jetzt >= s.rat.vorschlag.bis) abstimmen(s);

  // Zu erschöpft: der Rat setzt die Normalschicht selbst durch.
  if (s.kolonie.erschoepfung > R.eingreifenAbE && s.kolonie.quote > 1) {
    quoteDirekt(s, 1);
    log(s, 'Der Rat beschließt die Normalschicht. Ohne Abstimmung.');
  }

  // Leere Einrichtungen besetzen.
  for (const [key, e] of Object.entries(CONFIG.einrichtungen)) {
    if (e.personal > 0 && s.bauten[key] && s.jobs[key] < e.personal) besetzen(s, key, e.personal - s.jobs[key]);
  }

  // Jede Baustelle bekommt Leute; der Rat organisiert sie selbst.
  if (s.bau && s.jobs.bau < R.bauLeute) besetzen(s, 'bau', R.bauLeute - s.jobs.bau);

  eigenerBau(s);

  if (jetzt >= s.rat.naechsteDebatte && !s.rat.vorschlag) {
    s.rat.naechsteDebatte = jetzt + R.debatteIntervallMs;
    debatte(s, 'allgemein');
  }

  s.rat.solidaritaet = Math.min(R.sMax, s.rat.solidaritaet + R.sProTick);
}
