# Bauplan: Incremental-Spiel „Kalte Station“

Oct 21, 2026 · @alvin

## Grundgerüst

Der Spieler startet als Boss und lernt mechanisch, dass das Kollektiv besser wirtschaftet. Am Ende gewinnen die Arbeiter, eindeutig und in Zahlen sichtbar.

**Prämisse:** Bergbaustation „Kalte Station“ im Asteroidengürtel. Der Konzern hat sie aufgegeben, der letzte Shuttle ist weg. Du wachst allein in einer kalten Kabine auf.

**Wo Erklärung sitzen kann**

- Nach der Wand: eine ältere Arbeiterin sagt beim Essen einen Satz dazu, was hier gerade passiert ist.
- Im Rat: Streitgespräche zwischen zwei Positionen, kurz und mit Haltung, der Spieler hört zu.
- In den Logs: Konzernmemos, die nüchtern sagen, wie Gewinne kalkuliert und Leute verbucht wurden.
- Im Gürtel: die streikende Station erzählt, warum sie streikt, in ihren eigenen Worten.
- Im Finale: der Konzern begründet seine Forderung, der Rat antwortet.

**Designregeln**

- Die Mechanik trägt die Aussage. Erklärung ist erlaubt, wo sie etwas beiträgt, aber eingebettet in die Story, nie als Exposition. Sie kommt nach dem Erlebnis, als Deutung, nicht davor.
- Ein Ereignis, eine Zeile. Karger Ton wie im Vorbild.
- Der Boss-Weg muss anfangs verlockend sein. Sonst ist der Sieg nur behauptet.
- Die Oberfläche wächst mit dem Spiel. Am Ende gibt sie Kontrolle ab.
- Die Konzernstation läuft als Gegenprobe mit, ihre Zahlen sind sichtbar.

## Ressourcen und Werte

Sechs Werte reichen. Drei sind Material, drei messen den Zustand der Kolonie.

| Wert | Art | Woher | Wofür |
| --- | --- | --- | --- |
| Energie | Material | Reaktor, später Solarsegel | Hält alles am Laufen, Grundtakt |
| Schrott | Material | Ausschlachten, Bergbau | Bauen, Reparieren |
| Algen | Material | Algentanks | Ernährung, Wachstum der Kolonie |
| Arbeitskraft | Zustand | Zahl der Leute | Multipliziert jede Produktion |
| Erschöpfung | Zustand | Hohe Schichtquote, fehlende Versorgung | Senkt Ertrag, löst Unfälle aus |
| Solidarität | Zustand | Rat, Kantine, Kranken­station, Ausbildung | Multipliziert Ertrag, später Verteidigung |

Ertrag ist kein eigener Wert, sondern die Summe der Materialproduktion pro Tick. Die Anzeige zeigt ihn trotzdem groß, weil der Spieler darauf schaut.

## Die Ausbeutungskurve

Der Boss-Weg wächst linear und frisst sich dann selbst. Der Kollektiv-Weg startet langsamer und wächst multiplikativ. Kipppunkt nach etwa 20 Minuten Spielzeit.

Ertrag pro Tick:

```latex
Ertrag = A \cdot q \cdot (1 - E) \cdot (1 + S)
```

- A = Arbeitskraft (Zahl der Leute)
- q = Schichtquote, vom Spieler per Regler gesetzt (0,5 bis 1,5)
- E = Erschöpfung (0 bis 1)
- S = Solidarität (0 bis offen, wächst durch Einrichtungen)

Erschöpfung pro Tick:

```latex
\Delta E = k \cdot (q - R)
```

R ist die Regeneration aus Versorgung (Kantine, Krankenstation, Ruhezeiten). Liegt q über R, steigt E. Ab E = 0,5 gibt es Unfälle, ab E = 0,7 verlassen Leute die Station.

**Warum der Boss scheitert:** Hohe Quote bringt früh schnell Ertrag. Sie lässt aber keinen Raum für Einrichtungen, also bleibt R klein und S bei null. E läuft hoch, A schrumpft.

**Warum das Kollektiv gewinnt:** Jede Einrichtung hebt R und S zugleich. S wirkt als Faktor auf alles, Ausbildung erhöht zusätzlich A. Das ergibt Zinseszins statt Verschleiß.

| Spielzeit | Ertrag Boss-Weg | Ertrag Kollektiv-Weg |
| --- | --- | --- |
| 5 min | 10 | 6 |
| 15 min | 22 | 18 |
| 30 min | 14 | 45 |
| 60 min | 8 | 140 |

Die Zahlen sind Zielwerte für die Balance, keine Messung. Sie werden im Prototyp eingestellt.

## Freischaltreihenfolge

Fünf Phasen, jede mit einem Auslöser und einem sichtbaren Ergebnis. Jede Phase ist für sich spielbar und testbar.

1. **Kälte** (Minute 0–3)
   - Start: ein Knopf „Reaktor anwerfen“, Energie fällt langsam.
   - Freischaltung: Schrott sammeln, dann Algentank reparieren.
   - Ergebnis: drei Materialien laufen, die Kabine ist warm.
   - Abbruchpunkt: fühlt sich das Klicken gut an? Wenn nicht, Takt anpassen, bevor es weitergeht.
2. **Die Zurückgelassenen** (Minute 3–10)
   - Auslöser: Energie über 50, Notsignal wird gesendet.
   - Leute kommen nacheinander. Du verteilst sie auf Jobs, Schichtregler erscheint.
   - Ergebnis: der Boss-Weg ist voll spielbar und verlockend.
   - Abbruchpunkt: lohnt der Regler auf 1,5 sich spürbar? Er muss.
3. **Die Wand** (Minute 10–20)
   - Auslöser: Erschöpfung über 0,3.
   - Unfälle, erste Leute gehen. Einzeilige Meldungen, keine Erklärung.
   - Freischaltung: Kantine und Krankenstation als Bauoption.
   - Ergebnis: der Spieler spürt den Einbruch, bevor er ihn versteht.
   - Abbruchpunkt: merkt ein Testspieler den Zusammenhang selbst?
4. **Der Rat** (Minute 20–35)
   - Auslöser: zwei Einrichtungen gebaut oder zehn Leute an Bord.
   - Deine Befehle werden Vorschläge, der Rat stimmt ab. Manche lehnt er ab.
   - Der Rat baut Dinge, die du nicht angeordnet hast. Solidarität steigt.
   - Ergebnis: Kollektiv-Ertrag überholt den Boss-Weg sichtbar.
   - Abbruchpunkt: fühlt sich der Kontrollverlust gut an statt frustrierend?
5. **Der Gürtel** (Minute 35–60)
   - Auslöser: Schlepper repariert.
   - Karte mit anderen Stationen: eine im Streik, eine unter Konzernsicherheit, eine schon kollektiv.
   - Ressourcen werden abgegeben statt gehortet. Jede befreite Station hebt S im ganzen Netz.
   - Die Logs zeigen dich als Schichtleiter, der die Shuttle-Liste geschrieben hat.
   - Ergebnis: das Netz wächst, die Konzernstation verfällt in Zahlen.
   - Abbruchpunkt: trägt der Twist auch ohne Erklärtext?

## Endphase und Sieg der Arbeiter

Der Konzern kehrt zurück, weil die Station wieder Gewinn abwirft. Er verliert, weil niemand mehr für ihn arbeiten will.

- **Auslöser:** Gesamtertrag des Netzes über einem Schwellwert. Ein Konzernschiff erscheint mit Rechtstiteln und Söldnern.
- **Forderung:** Übergabe der Station, Rückkehr zum Schichtsystem.
- **Der Rat entscheidet**, nicht du. Er lehnt ab.
- **Deine letzte Wahl:** fliehen oder bleiben. Beides führt zum Sieg der Arbeiter.
  - Fliehen: eine Zeile, der Schichtleiter verschwindet. Die Kolonie macht ohne ihn weiter.
  - Bleiben: du gibst deine Steuerelemente einzeln an den Rat ab. Am Schluss bleibt kein Knopf.
- **Schlussbild:** zwei Zahlen nebeneinander, Netz und Konzern. Die eine steigt ohne dein Zutun, die andere fällt.

Das Konzernschiff bleibt im Orbit. Die offene Bedrohung leitet in Teil 2 über.

## Haken für Teil 2: Verteidigung

Teil 1 legt die Werte an, die in Teil 2 über die Verteidigung entscheiden. Was der Spieler jetzt aufbaut, ist später seine Abwehr.

| Haken | In Teil 1 angelegt als | In Teil 2 wirksam als |
| --- | --- | --- |
| Miliz | Solidarität S | Kampfkraft = Leute × S, nicht Geld |
| Bündnisse | Befreite Stationen im Gürtel | Nachschub, Rückzugsräume, zweite Front |
| Umrüstbare Industrie | Bergbaulaser, Schlepper, Schrottlager | Waffen und Schiffe ohne neue Baupläne |
| Wankende Söldner | Gerüchte in den Logs über unbezahlten Sold | Söldner laufen über, wenn S hoch genug ist |
| Konzernschiff im Orbit | Schlussbild von Teil 1 | Startlage von Teil 2 |

Offene Frage: Wird der Spielstand übernommen oder startet Teil 2 mit festen Werten?

## Umsetzungs-Blöcke für den Prototyp

Browser-Prototyp, eine HTML-Datei, kein Framework. Jeder Block endet mit etwas Spielbarem.

- [ ] **Block 1 – Tick und Kälte:** Spielschleife, Energie, Schrott, Algen, wachsende Oberfläche. Ergebnis: Phase 1 spielbar. Abbruch: Takt fühlt sich falsch an.
- [ ] **Block 2 – Leute und Regler:** Ankünfte, Jobverteilung, Schichtquote. Ergebnis: Boss-Weg spielbar. Abbruch: Regler bringt keinen spürbaren Vorteil.
- [ ] **Block 3 – Erschöpfung und Wand:** Formeln aus der Ausbeutungskurve, Unfälle, Abgänge, Einrichtungen. Ergebnis: Kipppunkt nach rund 20 Minuten. Abbruch: Testspieler versteht den Zusammenhang nicht.
- [ ] **Block 4 – Rat:** Vorschläge, Abstimmungen, eigenständige Bauten. Ergebnis: Kollektiv überholt sichtbar. Abbruch: Kontrollverlust frustriert.
- [ ] **Block 5 – Gürtel und Twist:** Karte, Stationen, Logs. Ergebnis: Netz wächst, Twist sitzt.
- [ ] **Block 6 – Ende:** Konzernschiff, Ratsentscheid, Steuerelemente abgeben, Schlussbild.
