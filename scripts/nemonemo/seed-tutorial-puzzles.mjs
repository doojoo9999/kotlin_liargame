#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NEMONEMO_API_BASE ?? 'https://zzirit.kr/api/v2/nemonemo';
const SUBJECT_KEY = process.env.NEMONEMO_SUBJECT_KEY ?? randomUUID();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = resolve(__dirname, '../../docs/nemonemo/tutorial_puzzles.json');

const { puzzles } = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));

const uploadPuzzle = async (payload) => {
  const response = await fetch(`${API_BASE}/puzzles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Subject-Key': SUBJECT_KEY
    },
    body: JSON.stringify(payload)
  });
  return response;
};

(async () => {
  for (const puzzle of puzzles) {
    const payload = {
      title: puzzle.title,
      description: puzzle.description,
      width: puzzle.grid[0]?.length ?? 0,
      height: puzzle.grid.length,
      grid: puzzle.grid,
      tags: puzzle.tags,
      seriesId: null,
      contentStyle: puzzle.contentStyle
    };

    try {
      const res = await uploadPuzzle(payload);
      if (res.status === 409) {
        console.log(`[skip] ${puzzle.slug ?? puzzle.title} 이미 존재합니다.`);
        continue;
      }
      if (!res.ok) {
        const body = await res.text();
        console.error(`[fail] ${puzzle.slug ?? puzzle.title} → ${res.status}`, body);
        continue;
      }
      const data = await res.json();
      console.log(`[ok] ${puzzle.slug ?? puzzle.title} 업로드 완료 → ${data.puzzleId}`);
    } catch (error) {
      console.error(`[error] ${puzzle.slug ?? puzzle.title}`, error);
    }
  }
})();
