# Kalte Station – Übergabe an Claude Code

Incremental-Spiel im Stil von *A Dark Room*. Setting: Sci-Fi-Bergbaustation. Die Aussage: Die Arbeiter gewinnen, und die kollektive Wirtschaft ist dem Boss-Weg mechanisch eindeutig überlegen. Das hier ist Teil 1. Teil 2 (Verteidigung gegen den Konzern) folgt später, deshalb werden Haken schon jetzt angelegt.

## Arbeitsweise

- Arbeite **in Blöcken** (siehe unten). Jeder Block endet mit einem spielbaren Stand.
- Nach jedem Block **anhalten**: kurz sagen, was steht, wie man es testet und welcher Abbruchpunkt zu prüfen ist. Erst nach Rückmeldung den nächsten Block beginnen.
- Keine langen offenen Aufgaben. Wenn ein Block zu groß wird, teile ihn und frag nach.
- Alle Spieltexte auf Deutsch.

## Technik

- Browser-Spiel, Vanilla HTML/CSS/JS, **kein Framework, kein Build-Schritt**.
- Struktur: `index.html`, `style.css`, `js/` mit kleinen Modulen (ES Modules): `state.js`, `tick.js`, `ui.js`, `events.js`, `config.js`.
- **Alle Balancewerte in `config.js`**, an einer Stelle, kommentiert. Keine Zahlen im Code verstreut.
- Spielstand in `localStorage` (try/catch drumherum), plus Export/Import als JSON-String. Der Spielstand muss später für Teil 2 übernehmbar sein.
- Debug-Modus per URL-Parameter `?debug=1`: Zeitraffer (x10), aktuelle Werte (A, q, E, S, R) als Overlay.
- Optik: minimal, dunkel, Monospace, wie das Vorbild. Die Oberfläche wächst mit dem Spiel; Elemente erscheinen erst, wenn sie freigeschaltet sind.

## Designregeln

- Die Mechanik trägt die Aussage. Erklärung ist erlaubt, wo sie etwas beiträgt, aber **eingebettet in die Story, nie als Exposition**. Sie kommt nach dem Erlebnis, als Deutung, nicht davor.
- Ereignistexte: eine Zeile pro Ereignis, karger Ton.
- Der Boss-Weg muss anfangs **verlockend** sein. Sonst ist der Sieg des Kollektivs nur behauptet.
- Die Konzernstation läuft als Gegenprobe mit, ihre Zahlen sind ab Phase 5 sichtbar.
- Am Ende gibt die Oberfläche Kontrolle ab.

Wo Erklärung sitzen kann:
- Nach der Wand: eine ältere Arbeiterin sagt beim Essen einen Satz dazu, was gerade passiert ist.
- Im Rat: kurze Streitgespräche zwischen zwei Positionen, mit Haltung.
- In den Logs: nüchterne Konzernmemos darüber, wie Gewinne kalkuliert und Leute verbucht wurden.
- Im Gürtel: die streikende Station erzählt in eigenen Worten, warum sie streikt.
- Im Finale: der Konzern begründet seine Forderung, der Rat antwortet.

## Ressourcen und Werte

| Wert | Art | Woher | Wofür |
| --- | --- | --- | --- |
| Energie | Material | Reaktor, später Solarsegel | Grundtakt, hält alles am Laufen |
| Schrott | Material | Ausschlachten, Bergbau | Bauen, Reparieren |
| Algen | Material | Algentanks | Ernährung, Wachstum der Kolonie |
| Arbeitskraft (A) | Zustand | Zahl der Leute | Multipliziert jede Produktion |
| Erschöpfung (E) | Zustand | hohe Schichtquote, fehlende Versorgung | senkt Ertrag, löst Unfälle aus |
| Solidarität (S) | Zustand | Rat, Kantine, Krankenstation, Ausbildung | multipliziert Ertrag, später Verteidigung |

Ertrag ist kein eigener Wert, sondern die Materialproduktion pro Tick. Er wird trotzdem groß angezeigt.

## Die Ausbeutungskurve (Kernmechanik)

```
Ertrag = A · q · (1 − E) · (1 + S)
ΔE     = k · (q − R)        // E geklemmt auf 0…1
```

- q = Schichtquote, Regler 0,5 bis 1,5
- R = Regeneration aus Versorgung (Kantine, Krankenstation, Ruhezeiten)
- Ab E = 0,5 Unfälle, ab E = 0,7 verlassen Leute die Station (A sinkt)
- Jede Einrichtung hebt R **und** S zugleich. Ausbildung erhöht zusätzlich A.
- Hohe Quote bindet die Leute, also bleibt kein Raum für Einrichtungen → R klein, S bei 0.

Zielwerte für die Balance (Ertrag pro Tick, nicht Messung):

| Spielzeit | Boss-Weg | Kollektiv-Weg |
| --- | --- | --- |
| 5 min | 10 | 6 |
| 15 min | 22 | 18 |
| 30 min | 14 | 45 |
| 60 min | 8 | 140 |

Kipppunkt: etwa 20 Minuten. Schreib eine kleine Simulationsfunktion (Debug), die beide Strategien automatisch durchspielt und diese Tabelle ausgibt, damit die Balance prüfbar ist.

## Phasen

1. **Kälte** (0–3 min): Knopf „Reaktor anwerfen“, Energie fällt langsam. Schrott sammeln, Algentank reparieren.
2. **Die Zurückgelassenen** (3–10 min): Auslöser Energie > 50 → Notsignal. Leute kommen nacheinander, Jobverteilung, Schichtregler erscheint.
3. **Die Wand** (10–20 min): Auslöser E > 0,3. Unfälle, Abgänge, einzeilige Meldungen. Kantine und Krankenstation werden baubar. Danach die erste eingebettete Deutung beim Essen.
4. **Der Rat** (20–35 min): Auslöser zwei Einrichtungen oder zehn Leute. Befehle werden Vorschläge, der Rat stimmt ab und lehnt manche ab. Der Rat baut eigenständig. S steigt.
5. **Der Gürtel** (35–60 min): Auslöser Schlepper repariert. Karte mit Stationen (im Streik, unter Konzernsicherheit, schon kollektiv). Ressourcen werden abgegeben statt gehortet; jede befreite Station hebt S im ganzen Netz. Logs enthüllen: Der Spieler war der Schichtleiter, der die Shuttle-Liste geschrieben hat.

## Ende

- Auslöser: Netzertrag über Schwellwert. Konzernschiff erscheint mit Rechtstiteln und Söldnern, fordert Übergabe und Rückkehr zum Schichtsystem.
- Der Rat entscheidet, nicht der Spieler, und lehnt ab.
- Letzte Wahl des Spielers, beides führt zum Sieg der Arbeiter:
  - Fliehen: eine Zeile, der Schichtleiter verschwindet, die Kolonie macht weiter.
  - Bleiben: Steuerelemente werden einzeln an den Rat abgegeben, bis kein Knopf mehr bleibt.
- Schlussbild: zwei Zahlen, Netz und Konzern. Die eine steigt ohne Zutun, die andere fällt.
- Das Konzernschiff bleibt im Orbit (Übergang zu Teil 2).

## Haken für Teil 2 (jetzt im Spielstand anlegen)

| Haken | In Teil 1 | In Teil 2 |
| --- | --- | --- |
| Miliz | Solidarität S | Kampfkraft = Leute × S, nicht Geld |
| Bündnisse | befreite Stationen | Nachschub, Rückzugsräume, zweite Front |
| Umrüstbare Industrie | Bergbaulaser, Schlepper, Schrottlager | Waffen und Schiffe ohne neue Baupläne |
| Wankende Söldner | Gerüchte über unbezahlten Sold in den Logs | Söldner laufen über, wenn S hoch genug |
| Konzernschiff im Orbit | Schlussbild | Startlage |

Offene Frage: Spielstand übernehmen oder Teil 2 mit festen Werten starten? Bis zur Klärung: Spielstand vollständig exportierbar halten.

## Blöcke

- [x] **Block 1 – Tick und Kälte:** Spielschleife, Energie, Schrott, Algen, wachsende Oberfläche, Speichern/Laden. *Ergebnis:* Phase 1 spielbar. *Abbruchpunkt:* fühlt sich der Takt gut an?
- [x] **Block 2 – Leute und Regler:** Ankünfte, Jobverteilung, Schichtquote. *Ergebnis:* Boss-Weg spielbar. *Abbruchpunkt:* bringt der Regler auf 1,5 spürbar mehr?
- [x] **Block 3 – Erschöpfung und Wand:** Formeln, Unfälle, Abgänge, Einrichtungen, Simulationsfunktion. *Ergebnis:* Kipppunkt nach rund 20 Minuten. *Abbruchpunkt:* versteht ein Testspieler den Zusammenhang selbst?
- [x] **Block 4 – Rat:** Vorschläge, Abstimmungen, eigenständige Bauten, Streitgespräche. *Ergebnis:* Kollektiv überholt sichtbar. *Abbruchpunkt:* fühlt sich Kontrollverlust gut an statt frustrierend?
- [x] **Block 5 – Gürtel und Twist:** Karte, Stationen, Netz-Solidarität, Logs. *Ergebnis:* Netz wächst, Twist sitzt. *Abbruchpunkt:* trägt der Twist ohne Erklärtext?
- [x] **Block 6 – Ende:** Konzernschiff, Ratsentscheid, beide Enden, Steuerelemente abgeben, Schlussbild.

Start mit Block 1.
