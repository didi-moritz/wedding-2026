#!/usr/bin/env python3
import re
import json
import hashlib
import os

def sha256(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source_path = os.path.join(root, 'data', 'puzzle.source.js')
    out_path = os.path.join(root, 'data', 'puzzle.js')

    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract title
    title_match = re.search(r'title:\s*["\'](.*?)["\']', content)
    title = title_match.group(1) if title_match else "Hochzeit-Rätsel"
    
    # Extract subtitle
    subtitle_match = re.search(r'subtitle:\s*["\'](.*?)["\']', content)
    subtitle = subtitle_match.group(1) if subtitle_match else ""
    
    # Extract clues section
    clues_section_match = re.search(r'clues:\s*\[(.*?)\]\s*,\s*\n\s*(?:instruction|title|)', content, re.DOTALL)
    if not clues_section_match:
        clues_section_match = re.search(r'clues:\s*\[(.*?)\]\s*,', content, re.DOTALL)
        
    clues_content = clues_section_match.group(1) if clues_section_match else ""
    
    # Find all clue blocks
    clue_blocks = re.findall(r'\{\s*(.*?)\s*\}', clues_content, re.DOTALL)
    
    clues = []
    for block in clue_blocks:
        id_match = re.search(r'id:\s*(\d+)', block)
        answer_match = re.search(r'answer:\s*["\'](.*?)["\']', block)
        clue_text_match = re.search(r'clue:\s*["\'](.*?)["\']', block)
        
        if id_match and answer_match and clue_text_match:
            clues.append({
                "id": int(id_match.group(1)),
                "answer": answer_match.group(1),
                "clue": clue_text_match.group(1)
            })
            
    # Extract instruction
    instruction_match = re.search(r'instruction:\s*\{(.*?)\}', content, re.DOTALL)
    instruction = {"title": "Anleitung", "body": []}
    if instruction_match:
        inst_content = instruction_match.group(1)
        inst_title_match = re.search(r'title:\s*["\'](.*?)["\']', inst_content)
        if inst_title_match:
            instruction["title"] = inst_title_match.group(1)
        
        body_match = re.search(r'body:\s*\[(.*?)\]', inst_content, re.DOTALL)
        if body_match:
            body_content = body_match.group(1)
            paragraphs = re.findall(r'["\'](.*?)["\']', body_content)
            instruction["body"] = paragraphs
            
    # Build public puzzle
    public_clues = []
    for c in clues:
        raw_answer = c["answer"].upper()
        clean_answer = re.sub(r'\s+', '', raw_answer)
        pattern = "".join(" " if char == " " else "o" for char in raw_answer)
        public_clues.append({
            "id": c["id"],
            "length": len(clean_answer),
            "pattern": pattern,
            "clue": c["clue"],
            "hash": sha256(clean_answer)
        })
        
    public_puzzle = {
        "title": title,
        "subtitle": subtitle,
        "clues": public_clues,
        "instruction": instruction
    }
    
    body = json.dumps(public_puzzle, indent=2, ensure_ascii=False)
    file_content = f"""/**
 * AUTO-GENERIERT — nicht von Hand editieren.
 * Quelle: data/puzzle.source.js (lokal, nicht im Repo)
 * Erzeugen: ./scripts/build-puzzle.sh
 *
 * Enthält KEINE Klartext-Antworten, sondern deren Längen und SHA-256 Hashes.
 */
window.PUZZLE = {body};
"""
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(file_content)
    
    print(f"OK → data/puzzle.js ({len(public_clues)} Fragen erfolgreich verarbeitet und gehasht)")

if __name__ == '__main__':
    main()
