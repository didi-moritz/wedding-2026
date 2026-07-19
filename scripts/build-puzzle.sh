#!/usr/bin/env bash
# Baut data/puzzle.js OHNE Antworten aus der lokalen Editor-Datei.
#
# Editieren:  data/puzzle.source.js   (gitignored)
# Vorlage:    data/puzzle.source.example.js
# Ausgabe:    data/puzzle.js          (committen)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SOURCE="data/puzzle.source.js"
EXAMPLE="data/puzzle.source.example.js"

if [[ ! -f "$SOURCE" ]]; then
  if [[ -f "$EXAMPLE" ]]; then
    echo "Hinweis: $SOURCE fehlt — kopiere Vorlage."
    cp "$EXAMPLE" "$SOURCE"
  else
    echo "Fehler: weder $SOURCE noch $EXAMPLE gefunden." >&2
    exit 1
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Fehler: node nicht gefunden. Bitte Node.js installieren." >&2
  exit 1
fi

node scripts/build-puzzle.mjs

echo
echo "Fertig. data/puzzle.js ist ohne Antworten — kann committed werden."
echo "data/puzzle.source.js bleibt lokal (steht in .gitignore)."
