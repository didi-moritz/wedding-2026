/**
 * AUTO-GENERIERT — nicht von Hand editieren.
 * Quelle: data/puzzle.source.js
 * Erzeugen: node scripts/build-puzzle.mjs
 *
 * Enthält KEINE Antworten, nur length + Fragen + solutionPath.
 */
window.PUZZLE = {
  "title": "Hochzeit-Rätsel",
  "subtitle": "Füllt die Wörter — die markierten Kästchen ergeben das Lösungswort.",
  "clues": [
    {
      "id": 1,
      "direction": "across",
      "row": 0,
      "col": 0,
      "length": 5,
      "clue": "Sie trägt heute Weiß."
    },
    {
      "id": 2,
      "direction": "across",
      "row": 2,
      "col": 2,
      "length": 5,
      "clue": "Was die beiden verbindet."
    },
    {
      "id": 3,
      "direction": "down",
      "row": 0,
      "col": 4,
      "length": 5,
      "clue": "Versprechen fürs Leben."
    }
  ],
  "solutionPath": [
    {
      "r": 0,
      "c": 4
    },
    {
      "r": 1,
      "c": 4
    },
    {
      "r": 2,
      "c": 4
    },
    {
      "r": 3,
      "c": 4
    },
    {
      "r": 4,
      "c": 4
    }
  ],
  "instruction": {
    "title": "Anleitung",
    "body": [
      "Habt ihr das Lösungswort gefunden?",
      "Sagt es dem Trauzeugen — er weiß, was als Nächstes passiert.",
      "(Text in data/puzzle.source.js unter instruction anpassen, dann Build laufen lassen.)"
    ]
  }
};
