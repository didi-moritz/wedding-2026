#!/usr/bin/env node
/**
 * Intern von ./scripts/build-puzzle.sh aufgerufen.
 * Liest data/puzzle.source.js (mit Antworten),
 * validiert die Fragen und schreibt data/puzzle.js mit SHA-256 Hashes der Antworten.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "data", "puzzle.source.js");
const outPath = path.join(root, "data", "puzzle.js");

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function loadSource() {
  const code = fs.readFileSync(sourcePath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(code, context, { filename: "puzzle.source.js" });
  if (!context.window.PUZZLE) {
    throw new Error("window.PUZZLE fehlt in puzzle.source.js");
  }
  return context.window.PUZZLE;
}

function validate(puzzle) {
  const errors = [];
  const seenIds = new Set();

  for (const clue of puzzle.clues || []) {
    if (clue.id == null) {
      errors.push(`Eine Frage hat keine ID`);
      continue;
    }
    if (seenIds.has(clue.id)) {
      errors.push(`Doppelte ID gefunden: ${clue.id}`);
    }
    seenIds.add(clue.id);

    const answer = String(clue.answer || "")
      .toUpperCase()
      .replace(/\s+/g, "");
    if (!answer) {
      errors.push(`Frage ${clue.id}: answer fehlt`);
    }
    if (!clue.clue) {
      errors.push(`Frage ${clue.id}: clue fehlt`);
    }
  }

  return { errors };
}

function toPublic(puzzle) {
  return {
    title: puzzle.title,
    subtitle: puzzle.subtitle,
    clues: (puzzle.clues || []).map((clue) => {
      const rawAnswer = String(clue.answer || "").toUpperCase();
      const cleanAnswer = rawAnswer.replace(/\s+/g, "");
      const pattern = rawAnswer.split("").map(char => char === " " ? " " : "o").join("");
      return {
        id: clue.id,
        length: cleanAnswer.length,
        pattern: pattern,
        clue: clue.clue,
        hash: sha256(cleanAnswer),
      };
    }),
    instruction: puzzle.instruction || { title: "Anleitung", body: [] },
  };
}

function writePuzzleJs(publicPuzzle) {
  const body = JSON.stringify(publicPuzzle, null, 2);
  const file = `/**
 * AUTO-GENERIERT — nicht von Hand editieren.
 * Quelle: data/puzzle.source.js (lokal, nicht im Repo)
 * Erzeugen: ./scripts/build-puzzle.sh
 *
 * Enthält KEINE Klartext-Antworten, sondern deren Längen und SHA-256 Hashes.
 */
window.PUZZLE = ${body};
`;
  fs.writeFileSync(outPath, file, "utf8");
}

const puzzle = loadSource();
const { errors } = validate(puzzle);

if (errors.length) {
  console.error("Build fehlgeschlagen:\n- " + errors.join("\n- "));
  process.exit(1);
}

writePuzzleJs(toPublic(puzzle));
console.log(`OK → data/puzzle.js (${puzzle.clues.length} Fragen erfolgreich verarbeitet und gehasht)`);

