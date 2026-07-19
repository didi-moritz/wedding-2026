#!/usr/bin/env node
/**
 * Liest data/puzzle.source.js (mit Antworten),
 * prüft Kreuzungen, schreibt data/puzzle.js ohne Antworten.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "data", "puzzle.source.js");
const outPath = path.join(root, "data", "puzzle.js");

const dirDelta = {
  across: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
};

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
  const cells = new Map();
  const errors = [];

  for (const clue of puzzle.clues || []) {
    const delta = dirDelta[clue.direction];
    if (!delta) {
      errors.push(`Frage ${clue.id}: unbekannte direction „${clue.direction}“`);
      continue;
    }
    const answer = String(clue.answer || "")
      .toUpperCase()
      .replace(/\s+/g, "");
    if (!answer) {
      errors.push(`Frage ${clue.id}: answer fehlt`);
      continue;
    }

    for (let i = 0; i < answer.length; i++) {
      const r = clue.row + delta.dr * i;
      const c = clue.col + delta.dc * i;
      const key = `${r},${c}`;
      const letter = answer[i];
      if (cells.has(key) && cells.get(key) !== letter) {
        errors.push(
          `Konflikt (${r},${c}): „${cells.get(key)}“ vs „${letter}“ (Frage ${clue.id})`
        );
      }
      cells.set(key, letter);
    }
  }

  for (const { r, c } of puzzle.solutionPath || []) {
    if (!cells.has(`${r},${c}`)) {
      errors.push(`solutionPath trifft leere Zelle: (${r},${c})`);
    }
  }

  return { cells, errors };
}

function toPublic(puzzle) {
  return {
    title: puzzle.title,
    subtitle: puzzle.subtitle,
    clues: (puzzle.clues || []).map((clue) => {
      const answer = String(clue.answer || "")
        .toUpperCase()
        .replace(/\s+/g, "");
      return {
        id: clue.id,
        direction: clue.direction,
        row: clue.row,
        col: clue.col,
        length: answer.length || Number(clue.length) || 0,
        clue: clue.clue,
      };
    }),
    solutionPath: puzzle.solutionPath || [],
    instruction: puzzle.instruction || { title: "Anleitung", body: [] },
  };
}

function writePuzzleJs(publicPuzzle) {
  const body = JSON.stringify(publicPuzzle, null, 2);
  const file = `/**
 * AUTO-GENERIERT — nicht von Hand editieren.
 * Quelle: data/puzzle.source.js
 * Erzeugen: node scripts/build-puzzle.mjs
 *
 * Enthält KEINE Antworten, nur length + Fragen + solutionPath.
 */
window.PUZZLE = ${body};
`;
  fs.writeFileSync(outPath, file, "utf8");
}

const puzzle = loadSource();
const { cells, errors } = validate(puzzle);

if (errors.length) {
  console.error("Build fehlgeschlagen:\n- " + errors.join("\n- "));
  process.exit(1);
}

const solution = (puzzle.solutionPath || [])
  .map(({ r, c }) => cells.get(`${r},${c}`))
  .join("");

writePuzzleJs(toPublic(puzzle));
console.log(`OK → data/puzzle.js (${cells.size} Zellen, Lösungswort-Länge ${solution.length})`);
