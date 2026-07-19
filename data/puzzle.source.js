/**
 * EDITOR-DATEI — hier Rätsel anpassen (inkl. Antworten).
 *
 * Vor Deploy / lokal testen:
 *   node scripts/build-puzzle.mjs
 *
 * Erzeugt data/puzzle.js OHNE Antworten (nur length).
 * puzzle.source.js wird nicht auf GitHub Pages veröffentlicht.
 *
 * clues: id, direction ("across"|"down"), row, col, answer, clue
 * solutionPath: [{ r, c }, ...] → Lösungswort-Zellen
 * instruction: Text für anleitung.html
 *
 * Beispiel-Gitter:
 *   B R A U T
 *           R
 *       L I E B E
 *           U
 *           E
 */
window.PUZZLE = {
  title: "Hochzeit-Rätsel",
  subtitle: "Füllt die Wörter — die markierten Kästchen ergeben das Lösungswort.",

  clues: [
    {
      id: 1,
      direction: "across",
      row: 0,
      col: 0,
      answer: "BRAUT",
      clue: "Sie trägt heute Weiß.",
    },
    {
      id: 2,
      direction: "across",
      row: 2,
      col: 2,
      answer: "LIEBE",
      clue: "Was die beiden verbindet.",
    },
    {
      id: 3,
      direction: "down",
      row: 0,
      col: 4,
      answer: "TREUE",
      clue: "Versprechen fürs Leben.",
    },
  ],

  // Markierte Zellen → Lösungswort TREUE (nur Positionen landen im Deploy)
  solutionPath: [
    { r: 0, c: 4 },
    { r: 1, c: 4 },
    { r: 2, c: 4 },
    { r: 3, c: 4 },
    { r: 4, c: 4 },
  ],

  instruction: {
    title: "Anleitung",
    body: [
      "Habt ihr das Lösungswort gefunden?",
      "Sagt es dem Trauzeugen — er weiß, was als Nächstes passiert.",
      "(Text in data/puzzle.source.js unter instruction anpassen, dann Build laufen lassen.)",
    ],
  },
};
