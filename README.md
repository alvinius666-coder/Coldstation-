# Kalte Station

Incremental-Spiel im Browser. Plan und Regeln: [CLAUDE.md](CLAUDE.md), [docs/bauplan.md](docs/bauplan.md).

## Spielen

Online: <https://alvinius666-coder.github.io/Coldstation-/>

## Lokal starten

Das Spiel nutzt ES-Module und braucht deshalb einen lokalen Server (Doppelklick auf `index.html` reicht nicht):

```
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen. Debug-Modus mit Zeitraffer und Werte-Overlay: <http://localhost:8000/?debug=1>.
