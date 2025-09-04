// 공통 BASE_URL 유틸 (루트 실행 스크립트용)
const path = require('path');
const fs = require('fs');
require('dotenv').config({
  path: fs.existsSync(path.join(__dirname, 'frontend', '.env'))
    ? path.join(__dirname, 'frontend', '.env')
    : path.join(__dirname, '.env')
});

const DEFAULT_BASE = 'http://localhost:5173';
const BASE_URL = (process.env.VITE_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');

function url(p = '') {
  if (!p) return BASE_URL;
  if (!p.startsWith('/')) return p;
  return BASE_URL + p;
}

function baseHost() {
  try { return new URL(BASE_URL).host; } catch { return 'localhost:5173'; }
}

module.exports = { BASE_URL, url, baseHost };

