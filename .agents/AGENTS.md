# Hochzeit-Rätsel 2026 - Projekt-Kontext & Regeln

Dieses Dokument dient als Kontext für KI-Assistenten (wie Antigravity), um die Architektur des Hochzeit-Rätsel-Projekts zu verstehen und die Entwicklungsrichtlinien einzuhalten.

---

## 🏗️ Projekt-Architektur und Aufbau

Das Projekt stellt ein interaktives Kreuzworträtsel bereit, das statisch über **GitHub Pages** gehostet wird. 

### Verzeichnisstruktur
- [index.html](file:///home/didi/Development/wedding-2026/index.html): Startseite, begrüßt die Spieler und leitet sie (mit automatischem Vollbild-Wechsel) zum Rätsel oder zur Anleitung weiter.
- [raetsel.html](file:///home/didi/Development/wedding-2026/raetsel.html): Die Haupt-Spielseite. Lädt das automatisch generierte [puzzle.js](file:///home/didi/Development/wedding-2026/data/puzzle.js) sowie die Spiel-Logik [crossword.js](file:///home/didi/Development/wedding-2026/js/crossword.js).
- [anleitung.html](file:///home/didi/Development/wedding-2026/anleitung.html): Hilfeseite mit Anweisungen zum Spiel.
- [css/app.css](file:///home/didi/Development/wedding-2026/css/app.css): Das gesamte Stylesheet für das Layout, die Zellen, das Lösungswort und Responsive Design.
- [js/crossword.js](file:///home/didi/Development/wedding-2026/js/crossword.js): Steuert die Grid-Generierung, Event-Handling (Keydown, Input, Focus), das Eintragen der Buchstaben, Validierung der Pfade und die Aktualisierung des Lösungsworts.
- [js/fullscreen.js](file:///home/didi/Development/wedding-2026/js/fullscreen.js): Verwaltet den Standard-Vollbildmodus (Fullscreen API) und bietet Fallbacks (immersive Klassen) bei iOS-Geräten, persistiert via `sessionStorage`.

---

## 🔒 Daten-Workflow (Wichtig für Sicherheit & Antworten)

Um zu verhindern, dass Spieler das Lösungswort oder die Antworten im Browser-Quellcode (z.B. über DevTools) auslesen, sind die Daten strikt getrennt:

1. **`data/puzzle.source.js` (LOKAL & GITIGNORED):**
   - Enthält die vollständigen Rätsel-Fragen **inklusive aller Antworten** (`answer`), den Pfad zum Lösungswort (`solutionPath`) und die Texte für die Anleitung.
   - **Niemals committen!** (Eingetragen in [.gitignore](file:///home/didi/Development/wedding-2026/.gitignore)).
   - Vorlage unter [data/puzzle.source.example.js](file:///home/didi/Development/wedding-2026/data/puzzle.source.example.js).

2. **`data/puzzle.js` (GENERIERT & COMMITTET):**
   - Enthält die bereinigte Version des Rätsels für den Browser.
   - **Keine Antworten!** Die Antworten werden entfernt und stattdessen wird nur deren Länge (`length`) beibehalten.
   - Wird automatisch aus der `puzzle.source.js` generiert.

---

## ⚙️ Build-Prozess

Wenn Änderungen am Rätsel (Fragen, Antworten, Lösungswort, Anleitung) vorgenommen werden:

1. Editiere [data/puzzle.source.js](file:///home/didi/Development/wedding-2026/data/puzzle.source.js) (falls nicht vorhanden, kopiere es aus [data/puzzle.source.example.js](file:///home/didi/Development/wedding-2026/data/puzzle.source.example.js)).
2. Führe das Build-Skript aus:
   ```bash
   ./scripts/build-puzzle.sh
   ```
3. Das Skript ruft intern [scripts/build-puzzle.mjs](file:///home/didi/Development/wedding-2026/scripts/build-puzzle.mjs) auf, welches:
   - Die Fragen und Antworten liest.
   - **Validierungen durchführt:** Überprüft Richtungen, Koordinaten-Überschneidungen (Konflikte, wenn kreuzende Wörter unterschiedliche Buchstaben an derselben Stelle haben) und stellt sicher, dass der `solutionPath` auf befüllte Zellen zeigt.
   - Das Lösungswort zur Validierung im Terminal ausgibt.
   - Die bereinigte [data/puzzle.js](file:///home/didi/Development/wedding-2026/data/puzzle.js) schreibt.

---

## 💡 Richtlinien für zukünftige Änderungen

- **Änderungen an Fragen/Antworten:** Ausschließlich in `data/puzzle.source.js` durchführen, niemals direkt in `data/puzzle.js`. Nach Änderungen immer `./scripts/build-puzzle.sh` ausführen, um die öffentliche Rätseldatei zu aktualisieren.
- **Git-Sicherheit:** Darauf achten, dass `data/puzzle.source.js` niemals in Commits landet.
- **Intersektionen:** Beim Hinzufügen neuer Clues in `data/puzzle.source.js` darauf achten, dass die Buchstaben an Kreuzungspunkten identisch sind. Das Build-Skript schlägt andernfalls fehl.
- **Buchstaben-Formatierung:** Alle Eingaben werden in [crossword.js](file:///home/didi/Development/wedding-2026/js/crossword.js) in Großbuchstaben umgewandelt (inklusive Umlauten Ä, Ö, Ü; ß wird zu S konvertiert).
