import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Info, X, Shield, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const ROWS = 4;
const COLS = 5;
const COINS_PER_UFC = 1000;
const BET_OPTIONS   = [10, 25, 50, 100, 250, 500];
const ADMIN_EMAIL   = 'yingsan1987@gmail.com';
const BONUS_SPINS   = 7;

// ─── 40 UFC fighter symbols ──────────────────────────────────────
const FIGHTERS = [
  // Tier 3 — Legends (weight 1, rarest)
  { id: 0,  name: 'Conor McGregor',        short: 'MAC',  color: '#fbbf24', bg: '#78350f', tier: 3, emoji: '🇮🇪', special: 'precision' },
  { id: 1,  name: 'Khabib Nurmagomedov',   short: 'KHB',  color: '#6ee7b7', bg: '#064e3b', tier: 3, emoji: '🦅', special: 'eagle' },
  { id: 2,  name: 'Jon Jones',             short: 'JBJ',  color: '#c4b5fd', bg: '#3b0764', tier: 3, emoji: '🦁', special: 'goat' },
  { id: 3,  name: 'Anderson Silva',        short: 'AND',  color: '#fbbf24', bg: '#713f12', tier: 3, emoji: '🕷️', special: null },
  { id: 4,  name: 'Georges St-Pierre',     short: 'GSP',  color: '#bef264', bg: '#1a2e05', tier: 3, emoji: '🇨🇦', special: null },
  // Tier 2 — Current Champions (weight 2)
  { id: 5,  name: 'Islam Makhachev',       short: 'ISL',  color: '#67e8f9', bg: '#0c4a6e', tier: 2, emoji: '🌊', special: 'bonus' },
  { id: 6,  name: 'Alex Pereira',          short: 'PET',  color: '#fda4af', bg: '#881337', tier: 2, emoji: '⚡', special: 'ko_bonus' },
  { id: 7,  name: 'Ilia Topuria',          short: 'TOP',  color: '#fde68a', bg: '#78350f', tier: 2, emoji: '🇬🇪', special: 'mini_jackpot' },
  { id: 8,  name: 'Kamaru Usman',          short: 'USM',  color: '#f9a8d4', bg: '#831843', tier: 2, emoji: '👑', special: null },
  { id: 9,  name: 'Leon Edwards',          short: 'LEO',  color: '#d8b4fe', bg: '#581c87', tier: 2, emoji: '🎯', special: null },
  { id: 10, name: 'Francis Ngannou',       short: 'NGN',  color: '#fdba74', bg: '#7c2d12', tier: 2, emoji: '💪', special: null },
  { id: 11, name: 'Israel Adesanya',       short: 'IZZ',  color: '#93c5fd', bg: '#1e3a5f', tier: 2, emoji: '💀', special: null },
  { id: 12, name: 'Alexander Volkanovski', short: 'VOL',  color: '#fca5a5', bg: '#7f1d1d', tier: 2, emoji: '🦈', special: null },
  { id: 13, name: 'Sean O\'Malley',        short: 'SUG',  color: '#fbcfe8', bg: '#831843', tier: 2, emoji: '🍭', special: null },
  { id: 14, name: 'Tom Aspinall',          short: 'ASP',  color: '#bfdbfe', bg: '#1e3a5f', tier: 2, emoji: '🇬🇧', special: null },
  { id: 15, name: 'Dricus du Plessis',     short: 'DDP',  color: '#bbf7d0', bg: '#14532d', tier: 2, emoji: '🇿🇦', special: null },
  // Tier 1 — Fan Favourites (weight 3)
  { id: 16, name: 'Charles Oliveira',      short: 'DOB',  color: '#a7f3d0', bg: '#065f46', tier: 1, emoji: '🌿', special: null },
  { id: 17, name: 'Dustin Poirier',        short: 'DIA',  color: '#93c5fd', bg: '#1e40af', tier: 1, emoji: '💎', special: null },
  { id: 18, name: 'Max Holloway',          short: 'BLH',  color: '#fde68a', bg: '#78350f', tier: 1, emoji: '🌺', special: null },
  { id: 19, name: 'Justin Gaethje',        short: 'HIG',  color: '#fed7aa', bg: '#7c2d12', tier: 1, emoji: '💥', special: null },
  { id: 20, name: 'Robert Whittaker',      short: 'BOB',  color: '#fca5a5', bg: '#7f1d1d', tier: 1, emoji: '🇦🇺', special: null },
  { id: 21, name: 'Colby Covington',       short: 'COV',  color: '#fbbf24', bg: '#92400e', tier: 1, emoji: '🇺🇸', special: null },
  { id: 22, name: 'Jorge Masvidal',        short: 'GNG',  color: '#fdba74', bg: '#7c2d12', tier: 1, emoji: '✈️', special: null },
  { id: 23, name: 'Belal Muhammad',        short: 'REM',  color: '#c4b5fd', bg: '#3b0764', tier: 1, emoji: '🕊️', special: null },
  { id: 24, name: 'Jan Blachowicz',        short: 'JAN',  color: '#bfdbfe', bg: '#1e3a5f', tier: 1, emoji: '🇵🇱', special: null },
  { id: 25, name: 'Jiri Prochazka',        short: 'JIR',  color: '#fda4af', bg: '#881337', tier: 1, emoji: '⚔️', special: null },
  { id: 26, name: 'Ciryl Gane',            short: 'BON',  color: '#d1fae5', bg: '#064e3b', tier: 1, emoji: '🇫🇷', special: null },
  { id: 27, name: 'Stipe Miocic',          short: 'STI',  color: '#e0f2fe', bg: '#0c4a6e', tier: 1, emoji: '🔨', special: null },
  { id: 28, name: 'Jamahal Hill',          short: 'SWT',  color: '#fbbf24', bg: '#78350f', tier: 1, emoji: '🌴', special: null },
  { id: 29, name: 'Sean Strickland',       short: 'STK',  color: '#e2e8f0', bg: '#1e293b', tier: 1, emoji: '🤠', special: null },
  { id: 30, name: 'Merab Dvalishvili',     short: 'MER',  color: '#99f6e4', bg: '#134e4a', tier: 1, emoji: '⚙️', special: null },
  { id: 31, name: 'Aljamain Sterling',     short: 'FUN',  color: '#fde68a', bg: '#78350f', tier: 1, emoji: '🥇', special: null },
  { id: 32, name: 'Brian Ortega',          short: 'TCH',  color: '#c084fc', bg: '#3b0764', tier: 1, emoji: '🐉', special: null },
  { id: 33, name: 'Paddy Pimblett',        short: 'BDG',  color: '#93c5fd', bg: '#1e3a5f', tier: 1, emoji: '🫐', special: null },
  { id: 34, name: 'Valentina Shevchenko',  short: 'BUL',  color: '#f0abfc', bg: '#581c87', tier: 1, emoji: '🎯', special: null },
  { id: 35, name: 'Zhang Weili',           short: 'MAG',  color: '#fca5a5', bg: '#7f1d1d', tier: 1, emoji: '🐉', special: null },
  { id: 36, name: 'Amanda Nunes',          short: 'LIO',  color: '#fbbf24', bg: '#78350f', tier: 1, emoji: '🦁', special: null },
  { id: 37, name: 'Nate Diaz',             short: 'NAT',  color: '#6ee7b7', bg: '#064e3b', tier: 1, emoji: '🌊', special: null },
  { id: 38, name: 'Michael Bisping',       short: 'CNT',  color: '#93c5fd', bg: '#1e3a5f', tier: 1, emoji: '🇬🇧', special: null },
  { id: 39, name: 'Tony Ferguson',         short: 'ELC',  color: '#fbbf24', bg: '#713f12', tier: 1, emoji: '🌮', special: null },
];
const WEIGHTS      = FIGHTERS.map(f => f.tier === 3 ? 1 : f.tier === 2 ? 2 : 3);
const TOTAL_WEIGHT = WEIGHTS.reduce((a, b) => a + b, 0);

// ─── Pure helpers ────────────────────────────────────────────────
function wr() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < FIGHTERS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return i; }
  return FIGHTERS.length - 1;
}
function rndRow() { return Array.from({ length: COLS }, wr); }
function rndGrid() { return Array.from({ length: ROWS }, rndRow); }
function diffFrom(id) { let d; do { d = wr(); } while (d === id); return d; }

// ─── Image map: fighter.id → imageUrl ───────────────────────────
function buildImageMap(apiData) {
  const map = {};
  const src = (apiData || []).filter(f => f?.imageUrl);
  FIGHTERS.forEach(sf => {
    let hit = src.find(f => f.name?.toLowerCase() === sf.name.toLowerCase());
    if (hit) { map[sf.id] = hit.imageUrl; return; }
    const last = sf.name.split(' ').pop().toLowerCase();
    hit = src.find(f => f.name?.toLowerCase().includes(last));
    if (hit) { map[sf.id] = hit.imageUrl; return; }
    const words = sf.name.toLowerCase().split(' ').filter(w => w.length > 3);
    hit = src.find(f => words.some(w => f.name?.toLowerCase().includes(w)));
    if (hit) map[sf.id] = hit.imageUrl;
  });
  return map;
}

// ═══════════════════════════════════════════════════════════════
// SOUND ENGINE  — pure Web Audio API, no external files
// ═══════════════════════════════════════════════════════════════
function useSlotSounds() {
  const ctxRef    = useRef(null);
  const masterRef = useRef(null);
  const musicRef  = useRef(null);
  const musicStarted = useRef(false);
  const [muted, setMuted] = useState(false);
  const mutedRef  = useRef(false);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterRef.current = ctxRef.current.createGain();
      masterRef.current.gain.value = 1;
      masterRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(next ? 0 : 1, ctxRef.current.currentTime, 0.05);
    }
  };

  // ── Low-level primitives ─────────────────────────────────────
  const tone = (freq, dur, type = 'sine', vol = 0.3, start = null) => {
    try {
      const ctx = getCtx(); const t = start ?? ctx.currentTime;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(masterRef.current);
      osc.start(t); osc.stop(t + dur + 0.02);
    } catch {}
  };

  const noiseBurst = (dur, vol = 0.2, loFreq = 200, hiFreq = 4000, start = null) => {
    try {
      const ctx = getCtx(); const t = start ?? ctx.currentTime;
      const sr = ctx.sampleRate;
      const buf = ctx.createBuffer(1, Math.ceil(sr * dur), sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const flt = ctx.createBiquadFilter();
      flt.type = 'bandpass'; flt.frequency.value = (loFreq + hiFreq) / 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(flt); flt.connect(g); g.connect(masterRef.current);
      src.start(t);
    } catch {}
  };

  // ── Sound effects ────────────────────────────────────────────

  const spinStart = () => {
    noiseBurst(0.35, 0.14, 300, 5000);
    tone(75, 0.18, 'sine', 0.18);
  };

  const colStop = (col) => {
    const freqs = [100, 88, 108, 94, 104];
    tone(freqs[col], 0.13, 'sine', 0.38);
    noiseBurst(0.04, 0.22, 150, 700);
  };

  const nearMissRise = () => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.9);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.15);
      osc.connect(g); g.connect(masterRef.current);
      osc.start(); osc.stop(ctx.currentTime + 1.2);
    } catch {}
  };

  const heartbreak = () => {
    try {
      const ctx = getCtx();
      [[370, 0], [270, 0.14], [190, 0.28], [130, 0.42]].forEach(([f, dt]) => {
        tone(f, 0.22, 'sawtooth', 0.11, ctx.currentTime + dt);
      });
    } catch {}
  };

  const smallWin = () => {
    try {
      const ctx = getCtx();
      [[523, 0], [659, 0.1], [784, 0.2]].forEach(([f, dt]) => tone(f, 0.3, 'sine', 0.22, ctx.currentTime + dt));
      noiseBurst(0.08, 0.12, 600, 2000, ctx.currentTime + 0.02);
    } catch {}
  };

  const bigWin = () => {
    try {
      const ctx = getCtx();
      [[523,0],[659,0.09],[784,0.18],[1047,0.3],[1319,0.5]].forEach(([f, dt]) => tone(f, 0.42, 'sine', 0.28, ctx.currentTime + dt));
      for (let i = 0; i < 5; i++) noiseBurst(0.06, 0.15, 600, 2500, ctx.currentTime + i * 0.1);
    } catch {}
  };

  const jackpotSound = () => {
    try {
      const ctx = getCtx();
      [[523,0],[659,0.09],[784,0.18],[1047,0.3],[784,0.5],[1047,0.62],[1319,0.76],[1047,0.9],[1319,1.06],[1568,1.22]]
        .forEach(([f, dt]) => tone(f, 0.48, 'sine', 0.32, ctx.currentTime + dt));
      for (let i = 0; i < 12; i++) noiseBurst(0.06, 0.18, 900, 3500, ctx.currentTime + i * 0.11);
    } catch {}
  };

  const megaWin = () => {
    try {
      const ctx = getCtx();
      [[392,0],[523,0.08],[659,0.16],[784,0.25],[1047,0.38],[1319,0.58]].forEach(([f,dt]) => tone(f, 0.45, 'sine', 0.3, ctx.currentTime + dt));
      for (let i = 0; i < 8; i++) noiseBurst(0.07, 0.16, 700, 3000, ctx.currentTime + i * 0.1);
    } catch {}
  };

  const bonusTrigger = () => {
    try {
      const ctx = getCtx();
      [392, 494, 587, 740, 988, 1175].forEach((f, i) => tone(f, 0.36, 'triangle', 0.26, ctx.currentTime + i * 0.07));
      noiseBurst(0.12, 0.1, 400, 2000, ctx.currentTime);
    } catch {}
  };

  const coinTick = () => {
    tone(1100 + Math.random() * 400, 0.045, 'sine', 0.09);
  };

  const claimChime = () => {
    try {
      const ctx = getCtx();
      [[784,0],[988,0.1],[1175,0.2],[1568,0.35]].forEach(([f,dt]) => tone(f, 0.5, 'sine', 0.28, ctx.currentTime + dt));
    } catch {}
  };

  // ── Background music (casino beat) ──────────────────────────
  const startMusic = () => {
    if (musicStarted.current) return;
    musicStarted.current = true;
    const ctx = getCtx();
    const bpm = 118;
    const beat = 60 / bpm;
    const eighth = beat / 2;
    let next = ctx.currentTime + 0.05;
    let step = 0;

    const kicks   = new Set([0, 8]);
    const snares  = new Set([4, 12]);
    const hihats  = new Set([0,2,4,6,8,10,12,14]);
    const bassMap = { 0: 65, 4: 49, 8: 65, 12: 43 };

    const schedStep = (t, s) => {
      const ss = s % 16;
      try {
        if (kicks.has(ss)) {
          const osc = ctx.createOscillator(); const g = ctx.createGain();
          osc.frequency.setValueAtTime(110, t);
          osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
          g.gain.setValueAtTime(0.55, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
          osc.connect(g); g.connect(masterRef.current);
          osc.start(t); osc.stop(t + 0.22);
        }
        if (snares.has(ss)) {
          const sr = ctx.sampleRate;
          const buf = ctx.createBuffer(1, Math.ceil(sr * 0.14), sr);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          const src = ctx.createBufferSource(); src.buffer = buf;
          const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
          src.connect(f); f.connect(g); g.connect(masterRef.current); src.start(t);
        }
        if (hihats.has(ss)) {
          const sr = ctx.sampleRate;
          const buf = ctx.createBuffer(1, Math.ceil(sr * 0.035), sr);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          const src = ctx.createBufferSource(); src.buffer = buf;
          const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 9000;
          const g = ctx.createGain();
          const vol = ss % 4 === 0 ? 0.07 : 0.035;
          g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
          src.connect(f); f.connect(g); g.connect(masterRef.current); src.start(t);
        }
        if (bassMap[ss] !== undefined) {
          const osc = ctx.createOscillator(); const g = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = bassMap[ss];
          g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 1.6);
          osc.connect(g); g.connect(masterRef.current);
          osc.start(t); osc.stop(t + beat * 1.7);
        }
        if (ss === 2 || ss === 6 || ss === 10 || ss === 14) {
          const melFreqs = [784, 659, 880, 740];
          const idx = Math.floor(ss / 4);
          tone(melFreqs[idx], 0.12, 'triangle', 0.04, t);
        }
      } catch {}
    };

    const loop = () => {
      const c = ctxRef.current;
      if (!c) return;
      while (next < c.currentTime + 0.28) {
        schedStep(next, step);
        next += eighth;
        step++;
      }
      musicRef.current = setTimeout(loop, 80);
    };
    loop();
  };

  const stopMusic = () => {
    clearTimeout(musicRef.current);
    musicStarted.current = false;
  };

  useEffect(() => {
    return () => {
      stopMusic();
      try { ctxRef.current?.close(); } catch {}
    };
  }, []);

  return {
    spinStart, colStop, nearMissRise, heartbreak,
    smallWin, bigWin, megaWin, jackpotSound,
    bonusTrigger, coinTick, claimChime,
    startMusic, stopMusic, muted, toggleMute,
  };
}

// ═══════════════════════════════════════════════════════════════
// OUTCOME ENGINE  — reduced win rates (~12% normal)
// ═══════════════════════════════════════════════════════════════
function determineOutcome(isBonusSpin = false) {
  const r = Math.random();
  if (isBonusSpin) {
    if (r < 0.001)  return 'jackpot';
    if (r < 0.01)   return 'megawin';
    if (r < 0.08)   return 'bigwin';
    if (r < 0.40)   return 'smallwin';
    if (r < 0.60)   return 'nearmiss';
    return 'loss';
  }
  // Normal: ~12% win rate
  if (r < 0.0002)  return 'jackpot';
  if (r < 0.002)   return 'megawin';
  if (r < 0.02)    return 'bigwin';
  if (r < 0.12)    return 'smallwin';
  if (r < 0.40)    return 'nearmiss';
  return 'loss';
}

function generateGrid(outcome) {
  let g = rndGrid();
  if (outcome === 'loss') {
    for (let attempt = 0; attempt < 12; attempt++) {
      g = rndGrid(); if (!hasAnyWin(g)) break;
    }
    return { grid: g, nearMissRow: -1 };
  }
  if (outcome === 'nearmiss') {
    const row = Math.floor(Math.random() * ROWS); const f = wr();
    g = rndGrid();
    g[row][0] = f; g[row][1] = f; g[row][2] = diffFrom(f); g[row][3] = f; g[row][4] = f;
    return { grid: g, nearMissRow: row };
  }
  if (outcome === 'smallwin') {
    const row = Math.floor(Math.random() * ROWS); const f = wr(); g = rndGrid();
    g[row][0] = f; g[row][1] = f; g[row][2] = f;
    g[row][3] = diffFrom(f); g[row][4] = diffFrom(f);
    return { grid: g, nearMissRow: -1 };
  }
  if (outcome === 'bigwin') {
    const row = Math.floor(Math.random() * ROWS);
    const f = FIGHTERS[Math.random() < 0.5 ? 5 : wr()].id; g = rndGrid();
    for (let c = 0; c < 4; c++) g[row][c] = f; g[row][4] = diffFrom(f);
    return { grid: g, nearMissRow: -1 };
  }
  if (outcome === 'megawin') {
    const row = Math.floor(Math.random() * ROWS);
    const f = FIGHTERS[Math.floor(Math.random() * 5)].id; g = rndGrid();
    for (let c = 0; c < COLS; c++) g[row][c] = f;
    return { grid: g, nearMissRow: -1 };
  }
  if (outcome === 'jackpot') {
    const f = FIGHTERS[Math.floor(Math.random() * 5)].id; g = rndGrid();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (Math.random() < 0.85) g[r][c] = f;
    return { grid: g, nearMissRow: -1 };
  }
  return { grid: g, nearMissRow: -1 };
}

function hasAnyWin(grid) {
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c < COLS; c++) {
      if (grid[r][c] === grid[r][c - 1]) { run++; if (run >= 3) return true; }
      else run = 1;
    }
  }
  const cnt = {};
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      cnt[grid[r][c]] = (cnt[grid[r][c]] || 0) + 1;
  return Object.values(cnt).some(n => n >= 5);
}

// ─── Full win evaluation ─────────────────────────────────────────
function evaluateWins(grid, bet, wildId, streakBonus) {
  const wins = []; const highlighted = new Set();
  const key = (r, c) => `${r},${c}`;
  const isMatch = (a, b) => wildId !== null && (a === wildId || b === wildId) ? true : a === b;
  const addWin = (type, cells, base, emoji, tier = 'normal') => {
    const mult = streakBonus ? Math.round(base * 1.5) : base;
    cells.forEach(([r, c]) => highlighted.add(key(r, c)));
    wins.push({ type, cells, multiplier: mult, payout: bet * mult, emoji, tier });
  };
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const base = grid[r][c]; let end = c + 1;
      while (end < COLS && isMatch(grid[r][end], base)) end++;
      const len = end - c;
      if (len >= 3) {
        const cells = Array.from({ length: len }, (_, i) => [r, c + i]);
        if      (len === 5) addWin('LINE JACKPOT!',   cells, 25, '🎰', 'jackpot');
        else if (len === 4) addWin('Four in a Row!',  cells,  8, '💥', 'high');
        else                addWin('Three in a Row!', cells,  2, '⚡', 'normal');
      }
      c = end;
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const base = grid[r][c]; let end = r + 1;
      while (end < ROWS && isMatch(grid[end][c], base)) end++;
      const len = end - r;
      if (len >= 3) {
        const cells = Array.from({ length: len }, (_, i) => [r + i, c]);
        if (len === 4) addWin('Full Column!',  cells, 12, '🔥', 'high');
        else           addWin('Column Three!', cells,  3, '👊', 'normal');
      }
      r = end;
    }
  }
  // Diagonals
  { const d = Array.from({ length: ROWS }, (_, i) => [i, i]);
    if (d.every(([r, c]) => isMatch(grid[r][c], grid[0][0])))
      addWin('Diagonal Strike!', d, 30, '↘️', 'high'); }
  { const d = Array.from({ length: ROWS }, (_, i) => [i, COLS - 1 - i]);
    if (d.every(([r, c]) => isMatch(grid[r][c], grid[0][COLS - 1])))
      addWin('Counter Diagonal!', d, 30, '↙️', 'high'); }
  // Double diagonal
  { const d1 = Array.from({ length: ROWS }, (_, i) => [i, i]);
    const d2 = Array.from({ length: ROWS }, (_, i) => [i, COLS - 1 - i]);
    if (d1.every(([r, c]) => isMatch(grid[r][c], grid[0][0])) &&
        d2.every(([r, c]) => isMatch(grid[r][c], grid[0][COLS - 1])) &&
        isMatch(grid[0][0], grid[0][COLS - 1])) {
      const seen = new Set();
      const cells = [...d1, ...d2].filter(([r, c]) => { const k = `${r},${c}`; if (seen.has(k)) return false; seen.add(k); return true; });
      addWin('DOUBLE DIAGONAL!', cells, 80, '✖️', 'jackpot');
    } }
  // Corner quad
  { const corners = [[0,0],[0,COLS-1],[ROWS-1,0],[ROWS-1,COLS-1]];
    if (corners.every(([r,c]) => isMatch(grid[r][c], grid[0][0])))
      addWin('Corner Quad!', corners, 25, '🔲', 'high'); }
  // Cross
  { const mR = 1, mC = 2, rF = grid[mR][0], cF = grid[0][mC];
    const rowOk = Array.from({length:COLS},(_,c)=>grid[mR][c]).every(f=>isMatch(f,rF));
    const colOk = Array.from({length:ROWS},(_,r)=>grid[r][mC]).every(f=>isMatch(f,cF));
    if (rowOk && colOk && isMatch(rF, cF)) {
      const cells = [...Array.from({length:COLS},(_,c)=>[mR,c]),
                     ...Array.from({length:ROWS},(_,r)=>[r,mC]).filter(([r])=>r!==mR)];
      addWin('Cross Pattern!', cells, 40, '✝️', 'high');
    } }
  // Full board
  { if (grid.every(row => row.every(f => isMatch(f, grid[0][0])))) {
      const cells = []; for (let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) cells.push([r,c]);
      addWin('GRAND JACKPOT!!!', cells, 1000, '🏆', 'jackpot');
    } }
  // Scatter
  const cnt = {};
  for (let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) { const f=grid[r][c]; (cnt[f]=cnt[f]||[]).push([r,c]); }
  for (const [,cells] of Object.entries(cnt)) {
    const n = cells.length;
    if      (n>=10) addWin('LEGENDARY SCATTER!', cells, 300, '👑', 'jackpot');
    else if (n>=8)  addWin('MEGA SCATTER!',       cells, 150, '🌟', 'jackpot');
    else if (n>=6)  addWin('Super Scatter!',      cells,  50, '✨', 'high');
    else if (n>=5)  addWin('Scatter Win!',         cells,  20, '💫', 'high');
    else if (n>=4)  addWin('Scatter Hit!',         cells,   8, '⭐', 'normal');
  }
  // Rivalry
  for (let r=0;r<ROWS;r++) {
    if (grid[r].includes(0) && grid[r].includes(1)) {
      const cells = grid[r].flatMap((f,c)=>f===0||f===1?[[r,c]]:[]);
      addWin('McGregor vs Khabib!', cells, 15, '🥊', 'high');
    }
  }
  for (let r=0;r<ROWS;r++) {
    if (grid[r].includes(0)&&grid[r].includes(1)&&grid[r].includes(2)) {
      const cells = grid[r].flatMap((f,c)=>[0,1,2].includes(f)?[[r,c]]:[]);
      addWin('TRIPLE CHAMPIONS!', cells, 60, '👑', 'jackpot');
    }
  }
  for (let r=0;r<ROWS;r++) {
    const freq={}; grid[r].forEach(f=>{freq[f]=(freq[f]||0)+1;});
    for(const [fId,n] of Object.entries(freq)) {
      if(n===4){const cells=grid[r].flatMap((f,c)=>f===+fId?[[r,c]]:[]);addWin('Near-Miss KO!',cells,5,'🎯','normal');}
    }
  }
  return { wins, highlighted };
}

// ─── Slot Cell ───────────────────────────────────────────────────
function SlotCell({ fighterId, isHighlighted, isSpinning, justStopped, isHeartbreaker, isAnticipating, spinFrame, fighterImages }) {
  const fighter = FIGHTERS[fighterId] ?? FIGHTERS[0];
  const imgSrc  = fighterImages?.[fighter.id];
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => { setImgOk(true); }, [fighterId]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-md select-none">
      <motion.div
        key={isSpinning ? `sp-${(spinFrame + fighterId) % 97}` : `st-${fighterId}`}
        className="absolute inset-0"
        initial={isSpinning ? { y: '-60%', opacity: 0.5 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.08, ease: 'easeOut' }}
      >
        {imgOk && imgSrc ? (
          <img src={imgSrc} alt={fighter.name}
            className="w-full h-full object-cover object-top"
            style={{ filter: isSpinning ? 'brightness(0.5) blur(1.5px)' : 'brightness(1)', transition: 'filter 0.08s' }}
            onError={() => setImgOk(false)} draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-0.5"
            style={{ backgroundColor: fighter.bg, filter: isSpinning ? 'brightness(0.5) blur(1px)' : 'brightness(1)', transition: 'filter 0.08s' }}>
            <span className="text-3xl leading-none">{fighter.emoji}</span>
            <span className="font-black text-[11px] leading-none mt-0.5" style={{ color: fighter.color }}>{fighter.short}</span>
            <span className="text-[9px] text-white/40 mt-0.5 w-full text-center px-1 truncate">{fighter.name.split(' ')[0]}</span>
          </div>
        )}
      </motion.div>

      {isSpinning && (
        <motion.div className="absolute inset-x-0 pointer-events-none z-10"
          style={{ height: '38%', background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)' }}
          animate={{ top: ['-38%', '138%'] }}
          transition={{ duration: 0.22, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {isAnticipating && (
        <motion.div className="absolute inset-0 rounded-md pointer-events-none z-20"
          animate={{ boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 20px 6px rgba(251,191,36,0.8)', '0 0 0px rgba(251,191,36,0)'] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ border: '3px solid #fbbf24' }}
        />
      )}

      <AnimatePresence>
        {justStopped && (
          <motion.div className="absolute inset-0 bg-white/40 pointer-events-none z-20 rounded-md"
            initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHeartbreaker && (
          <motion.div className="absolute inset-0 rounded-md pointer-events-none z-20"
            style={{ border: '3px solid #ef4444' }}
            initial={{ x: 0 }}
            animate={{ x: [-5, 5, -4, 4, -3, 3, 0] }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {isHighlighted && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-md">
          <motion.div className="absolute inset-y-0 w-2/3"
            style={{ background: 'linear-gradient(105deg, transparent 0%, rgba(251,191,36,0.55) 50%, transparent 100%)' }}
            animate={{ x: ['-100%', '260%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <motion.div className="absolute inset-0 rounded-md pointer-events-none z-30"
        animate={isHighlighted
          ? { boxShadow: ['0 0 6px 2px rgba(251,191,36,0.5)', '0 0 16px 5px rgba(251,191,36,1)', '0 0 6px 2px rgba(251,191,36,0.5)'], borderColor: '#fbbf24' }
          : { boxShadow: 'none', borderColor: '#1f2937' }}
        transition={isHighlighted ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
        style={{ border: '2px solid', borderRadius: '0.375rem' }}
      />
    </div>
  );
}

// ─── Bonus accumulator bar ───────────────────────────────────────
function BonusBar({ spinsDone, total }) {
  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 bg-purple-950 border-b border-purple-700/60 px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-black text-purple-200">✨ BONUS ROUND — collecting…</span>
        <span className="text-[11px] font-black text-purple-400">{spinsDone}/{BONUS_SPINS}</span>
      </div>
      <div className="h-2 bg-purple-900 rounded-full mb-1.5 overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          animate={{ width: `${(spinsDone / BONUS_SPINS) * 100}%` }}
          transition={{ duration: 0.3 }} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-purple-500">ACCUMULATED</span>
        <motion.span key={total} initial={{ scale: 1.35, color: '#a78bfa' }} animate={{ scale: 1, color: '#e9d5ff' }}
          className="font-black text-sm text-purple-100">
          🪙 {total.toLocaleString()}
        </motion.span>
      </div>
    </motion.div>
  );
}

// ─── Bonus reveal screen ─────────────────────────────────────────
function BonusReveal({ results, total, onClaim, onTick, onClaimSound }) {
  const [visible, setVisible]   = useState(0);
  const [counter, setCounter]   = useState(0);
  const [done, setDone]         = useState(false);
  const counterReady = visible >= results.length;

  useEffect(() => {
    if (visible >= results.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 320);
    return () => clearTimeout(t);
  }, [visible, results.length]);

  useEffect(() => {
    if (!counterReady || counter >= total) return;
    const step = Math.max(1, Math.ceil(total / 55));
    const t = setInterval(() => {
      setCounter(v => {
        const n = Math.min(v + step, total);
        if (n >= total) setDone(true);
        onTick?.();
        return n;
      });
    }, 18);
    return () => clearInterval(t);
  }, [counterReady, counter, total, onTick]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/97 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="text-center mb-5">
          <div className="text-5xl mb-2">✨</div>
          <h2 className="text-2xl font-black text-white">BONUS COMPLETE!</h2>
          <p className="text-purple-400 text-sm">{BONUS_SPINS} free spins played</p>
        </motion.div>

        <div className="space-y-1.5 mb-5 max-h-52 overflow-y-auto pr-1">
          {results.map((res, i) => (
            <AnimatePresence key={i}>
              {i < visible && (
                <motion.div initial={{ x: -28, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 ${res.total > 0 ? 'bg-purple-900/50 border border-purple-700/40' : 'bg-gray-900/60'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black text-purple-400 flex-shrink-0">#{i+1}</span>
                    {res.total > 0
                      ? <span className="text-xs text-purple-200 truncate">{res.wins[0]?.emoji} {res.wins[0]?.type}</span>
                      : <span className="text-xs text-gray-600">No win</span>}
                  </div>
                  <span className={`font-black text-sm flex-shrink-0 ml-2 ${res.total > 0 ? 'text-green-400' : 'text-gray-700'}`}>
                    {res.total > 0 ? `+${res.total.toLocaleString()}` : '--'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        <AnimatePresence>
          {counterReady && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-gradient-to-br from-yellow-600 via-amber-500 to-orange-600 rounded-2xl p-5 mb-4 relative overflow-hidden">
              <motion.div className="absolute inset-y-0 w-1/2 pointer-events-none"
                style={{ background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
                animate={{ x: ['-100%', '300%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }} />
              <p className="text-yellow-100 font-bold text-xs mb-1 uppercase tracking-wider">Total Bonus Payout</p>
              <motion.div key={counter} className="text-4xl font-black text-white leading-none">
                {counter.toLocaleString()}<span className="text-2xl ml-1">🪙</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {done && (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => { onClaimSound?.(); onClaim(); }}
            className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105">
            💰 CLAIM {total.toLocaleString()} COINS!
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Decorative light strip ──────────────────────────────────────
function LightStrip({ count = 11, colors = ['#ef4444', '#fbbf24'] }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {Array.from({ length: count }, (_, i) => (
        <motion.div key={i} className="w-2 h-2 rounded-full"
          style={{ backgroundColor: colors[i % colors.length] }}
          animate={{ opacity: [1, 0.2, 1], scale: [1, 0.65, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.09 }}
        />
      ))}
    </div>
  );
}

// ─── Brawl Overlay ───────────────────────────────────────────────
function BrawlOverlay({ wins, totalWin, winnerFighterId, fighterImages, bet, onDismiss }) {
  const winner = FIGHTERS[winnerFighterId] ?? FIGHTERS[0];
  const [oppId] = useState(() => {
    let id;
    do { id = Math.floor(Math.random() * FIGHTERS.length); } while (id === winnerFighterId);
    return id;
  });
  const opponent = FIGHTERS[oppId];
  const rounds = wins.slice(0, 3);

  const [phase, setPhase] = useState('intro');   // intro | fighting | result
  const [revealedRounds, setRevealedRounds] = useState(0);
  const [oppHp, setOppHp] = useState(100);
  const [punching, setPunching] = useState(false);
  const [roundPayouts, setRoundPayouts] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setPhase('fighting'), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'fighting') return;
    if (revealedRounds >= rounds.length) {
      const t = setTimeout(() => setPhase('result'), 600);
      return () => clearTimeout(t);
    }
    const win = rounds[revealedRounds];
    const t1 = setTimeout(() => setPunching(true), 150);
    const t2 = setTimeout(() => {
      setPunching(false);
      const dmg = Math.floor(22 + revealedRounds * 18);
      setOppHp(h => Math.max(5, h - dmg));
      setRoundPayouts(p => [...p, win.payout]);
    }, 450);
    const t3 = setTimeout(() => setRevealedRounds(r => r + 1), 1050);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [phase, revealedRounds, rounds.length]);

  const winnerImg = fighterImages?.[winner.id];
  const oppImg    = fighterImages?.[opponent.id];
  const isKO      = totalWin >= bet * 15;
  const isTKO     = totalWin >= bet * 8;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-black/93 flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* FIGHT! header */}
      <motion.div initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, type: 'spring', stiffness: 300 }}
        className="text-center mb-3">
        <div className="text-4xl font-black tracking-widest text-red-400"
          style={{ textShadow: '0 0 24px rgba(239,68,68,0.9), 0 0 48px rgba(239,68,68,0.4)' }}>
          ⚡ FIGHT! ⚡
        </div>
        <div className="text-xs text-gray-500 mt-0.5 font-bold tracking-wider">
          {winner.name} vs {opponent.name}
        </div>
      </motion.div>

      {/* Fighters */}
      <div className="flex items-end gap-6 mb-4">
        {/* Winner */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.div
            animate={punching ? { x: [0, 44, 0] } : {}}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-yellow-400 relative shadow-lg shadow-yellow-500/30">
            {winnerImg
              ? <img src={winnerImg} className="w-full h-full object-cover object-top" alt={winner.name} />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: winner.bg }}>
                  <span className="text-4xl">{winner.emoji}</span>
                  <span className="text-xs font-black" style={{ color: winner.color }}>{winner.short}</span>
                </div>
            }
            <div className="absolute inset-0 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 12px rgba(251,191,36,0.3)' }} />
          </motion.div>
          <span className="text-[11px] font-black text-yellow-400">{winner.short}</span>
          <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full w-full" />
          </div>
          <span className="text-[9px] text-green-400">100 HP</span>
        </div>

        {/* Centre */}
        <div className="flex flex-col items-center gap-1 pb-7">
          <span className="text-2xl font-black text-white">VS</span>
          <div className="text-[10px] text-gray-500 font-bold">
            Rd {Math.min(revealedRounds + 1, rounds.length)}/{rounds.length}
          </div>
        </div>

        {/* Opponent */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.div
            animate={punching ? { x: [0, -14, -5, 0] } : {}}
            transition={{ duration: 0.22 }}
            className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-red-600 relative shadow-lg shadow-red-500/20">
            {oppImg
              ? <img src={oppImg} className="w-full h-full object-cover object-top" alt={opponent.name} />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: opponent.bg }}>
                  <span className="text-4xl">{opponent.emoji}</span>
                  <span className="text-xs font-black" style={{ color: opponent.color }}>{opponent.short}</span>
                </div>
            }
            <AnimatePresence>
              {punching && (
                <motion.div className="absolute inset-0 bg-red-500/60 pointer-events-none"
                  initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.35 }} />
              )}
            </AnimatePresence>
          </motion.div>
          <span className="text-[11px] font-black text-red-400">{opponent.short}</span>
          <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-red-500 rounded-full"
              animate={{ width: `${oppHp}%` }} transition={{ duration: 0.4 }} />
          </div>
          <motion.span key={oppHp} initial={{ color: '#ef4444', scale: 1.3 }} animate={{ color: '#9ca3af', scale: 1 }}
            className="text-[9px] font-bold">{oppHp} HP</motion.span>
        </div>
      </div>

      {/* Round-by-round results */}
      <div className="w-full max-w-xs space-y-1.5 mb-4 min-h-[60px]">
        {rounds.map((win, i) => (
          <AnimatePresence key={i}>
            {i < revealedRounds && (
              <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className={`flex items-center justify-between rounded-xl px-3 py-2 border ${
                  win.tier === 'jackpot' ? 'bg-yellow-900/40 border-yellow-700/40' :
                  win.tier === 'high'    ? 'bg-purple-900/40 border-purple-700/40' :
                                          'bg-gray-900/70 border-gray-700/40'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{win.emoji}</span>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold">ROUND {i + 1}</p>
                    <p className="text-xs text-white font-semibold leading-tight">{win.type}</p>
                  </div>
                </div>
                <span className={`text-sm font-black ${win.tier === 'jackpot' ? 'text-yellow-400' : win.tier === 'high' ? 'text-purple-300' : 'text-green-400'}`}>
                  +{win.payout.toLocaleString()}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* Final result */}
      <AnimatePresence>
        {phase === 'result' && (
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="text-center">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className={`text-3xl font-black mb-1 ${isKO ? 'text-red-400' : isTKO ? 'text-orange-400' : 'text-white'}`}>
              {isKO ? '🥊 KO!!' : isTKO ? '⚡ TKO!' : '🏆 WIN!'}
            </motion.div>
            <div className="text-4xl font-black text-yellow-400 mb-4">
              +{totalWin.toLocaleString()} <span className="text-2xl">🪙</span>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onDismiss}
              className="px-8 py-3.5 rounded-2xl font-black text-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/30">
              💰 CLAIM WINNINGS!
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function UFCSlots() {
  const navigate = useNavigate();
  const { currentUser, getAuthToken } = useAuth();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const sounds  = useSlotSounds();

  // Wallet
  const [ufcCoins, setUfcCoins]       = useState(0);
  const [slotCoins, setSlotCoins]     = useState(0);
  const [exchangeAmt, setExchangeAmt] = useState(1);

  // Game state
  const [bet, setBet]                 = useState(50);
  const [grid, setGrid]               = useState(() => rndGrid());
  const [spinning, setSpinning]       = useState(false);
  const [stoppedCols, setStoppedCols] = useState([true,true,true,true,true]);
  const [justStopped, setJustStopped] = useState([false,false,false,false,false]);
  const [heartbreakerCol, setHeartbreakerCol] = useState(-1);
  const [anticipatingCol, setAnticipatingCol] = useState(-1);
  const [spinFrame, setSpinFrame]     = useState(0);
  const [wins, setWins]               = useState([]);
  const [highlighted, setHighlighted] = useState(new Set());
  const [totalWin, setTotalWin]       = useState(0);
  const [streak, setStreak]           = useState(0);
  const [sessionNet, setSessionNet]   = useState(0);
  const [recentWins, setRecentWins]   = useState([]);
  const [jackpotFlash, setJackpotFlash] = useState(false);
  const [nearMissMsg, setNearMissMsg] = useState(null);

  // Brawl overlay (replaces win overlay)
  const [showBrawl, setShowBrawl]         = useState(false);
  const [brawlWinnerId, setBrawlWinnerId] = useState(0);

  // Champion specials
  const [specialChampMsg, setSpecialChampMsg] = useState(null);

  // Bonus round
  const [bonusPhase, setBonusPhase]       = useState(null);
  const [bonusResults, setBonusResults]   = useState([]);
  const [bonusSpinsDone, setBonusSpinsDone] = useState(0);
  const [bonusTotal, setBonusTotal]       = useState(0);
  const [bonusMsg, setBonusMsg]           = useState(null);

  // UI
  const [loading, setLoading]             = useState(false);
  const [showExchange, setShowExchange]   = useState(false);
  const [showPaytable, setShowPaytable]   = useState(false);
  const [fighterImages, setFighterImages] = useState({});

  // Grid sizing
  const gridContainerRef = useRef(null);
  const [gridDim, setGridDim] = useState({ w: 320, h: 256 });

  useEffect(() => {
    const update = () => {
      const el = gridContainerRef.current; if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const avW = width * 0.97, avH = height * 0.97;
      const ratio = COLS / ROWS;
      let w = avW, h = w / ratio;
      if (h > avH) { h = avH; w = h * ratio; }
      setGridDim({ w: Math.floor(w), h: Math.floor(h) });
    };
    update();
    const ro = new ResizeObserver(update);
    if (gridContainerRef.current) ro.observe(gridContainerRef.current);
    return () => ro.disconnect();
  }, []);

  const finalGridRef = useRef(null);
  const nearMissRef  = useRef(-1);
  const spinInterval = useRef(null);
  const allTimeouts  = useRef([]);
  const bonusMsgTimeoutRef = useRef(null); // separate ref — NOT cleared on spin start
  const musicOn      = useRef(false);

  const addTimeout = (fn, ms) => {
    const t = setTimeout(fn, ms);
    allTimeouts.current.push(t);
    return t;
  };

  useEffect(() => {
    axios.get(`${API_URL}/fighters`)
      .then(res => setFighterImages(buildImageMap(res.data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const token = await getAuthToken();
        const res = await axios.get(`${API_URL}/fancoins/poker-status`, { headers: { Authorization: `Bearer ${token}` } });
        setUfcCoins(res.data.fanCoin ?? 0);
      } catch {}
    })();
  }, [currentUser, getAuthToken]);

  const displayGrid = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) =>
      stoppedCols[c]
        ? (finalGridRef.current?.[r][c] ?? grid[r][c])
        : (spinFrame + c * 5 + r * 3) % FIGHTERS.length
    )
  );

  const canSpin = !spinning && bonusPhase === null && (isAdmin || slotCoins >= bet);

  // ── Core spin logic ──────────────────────────────────────────
  const doSpin = (isBonusSpin = false) => {
    if (spinning) return;

    // Start music on first interaction
    if (!musicOn.current) { musicOn.current = true; sounds.startMusic(); }

    sounds.spinStart();

    if (!isAdmin && !isBonusSpin) setSlotCoins(p => p - bet);

    const wild    = Math.random() < 0.03 ? Math.floor(Math.random() * FIGHTERS.length) : null;
    const outcome = determineOutcome(isBonusSpin);
    const isNM    = outcome === 'nearmiss';
    const { grid: fg, nearMissRow } = generateGrid(outcome);
    finalGridRef.current = fg;
    nearMissRef.current  = nearMissRow;

    setSpinning(true);
    setStoppedCols([false,false,false,false,false]);
    setJustStopped([false,false,false,false,false]);
    setHeartbreakerCol(-1);
    setAnticipatingCol(-1);
    setWins([]);
    setHighlighted(new Set());
    setShowBrawl(false);
    setNearMissMsg(null);
    // NOTE: do NOT clear bonusMsgTimeoutRef here
    allTimeouts.current.forEach(clearTimeout);
    allTimeouts.current = [];

    spinInterval.current = setInterval(() => setSpinFrame(f => f + 1), 80);

    const stopOrder = isNM ? [0, 1, 3, 4, 2] : [0, 1, 2, 3, 4];
    const stopTimes = isNM ? [620, 840, 1060, 1280, 2200] : [620, 840, 1060, 1280, 1500];

    stopOrder.forEach((col, i) => {
      addTimeout(() => {
        sounds.colStop(col);
        setStoppedCols(prev => { const n = [...prev]; n[col] = true; return n; });
        setJustStopped(prev => { const n = [...prev]; n[col] = true; return n; });
        addTimeout(() => setJustStopped(prev => { const n=[...prev]; n[col]=false; return n; }), 480);
        if (isNM && i === stopOrder.length - 1) {
          setHeartbreakerCol(col);
          setNearMissMsg('heartbreak');
          sounds.heartbreak();
          addTimeout(() => { setHeartbreakerCol(-1); setNearMissMsg(null); }, 2200);
        }
      }, stopTimes[i]);
    });

    if (isNM) {
      addTimeout(() => { setAnticipatingCol(2); setNearMissMsg('hold'); sounds.nearMissRise(); }, 1380);
      addTimeout(() => setAnticipatingCol(-1), 2250);
    }

    if (outcome === 'bigwin') {
      addTimeout(() => setAnticipatingCol(4), 1200);
      addTimeout(() => setAnticipatingCol(-1), 1600);
    }

    const resolveMs = isNM ? 2500 : 1800;
    addTimeout(() => {
      clearInterval(spinInterval.current);
      setSpinning(false);
      setStoppedCols([true,true,true,true,true]);
      setGrid(fg.map(r => [...r]));

      const { wins: w, highlighted: h } = evaluateWins(fg, bet, wild, streak >= 3);
      let winTotal = w.reduce((s, x) => s + x.payout, 0);

      setWins(w);
      setHighlighted(h);
      setTotalWin(winTotal);

      // Find most common fighter in highlighted cells → brawl winner
      const hlFighters = [];
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (h.has(`${r},${c}`)) hlFighters.push(fg[r][c]);
      const freq = {};
      hlFighters.forEach(id => freq[id] = (freq[id] || 0) + 1);
      const wFid = hlFighters.length > 0
        ? Number(Object.entries(freq).sort((a,b) => b[1]-a[1])[0][0])
        : fg[0][0];
      setBrawlWinnerId(wFid);

      // Champion specials
      let adjWinTotal = winTotal;
      let specialMsg = null;
      if (hlFighters.includes(0) && winTotal > 0) { // McGregor precision
        adjWinTotal = Math.round(winTotal * 1.5);
        specialMsg = '☘️ McGregor Precision! ×1.5 bonus!';
      }
      if (hlFighters.includes(6) && winTotal > 0) { // Pereira KO bonus
        adjWinTotal = Math.round(adjWinTotal * 2);
        specialMsg = '⚡ Poatan KO Power! ×2 bonus!';
      }
      if (hlFighters.includes(7) && winTotal > 0) { // Topuria mini jackpot
        adjWinTotal += bet * 50;
        specialMsg = '🇬🇪 Topuria KO! Mini Jackpot +' + (bet * 50) + '!';
      }
      if (adjWinTotal !== winTotal) {
        setTotalWin(adjWinTotal);
        winTotal = adjWinTotal;
      }
      if (specialMsg) {
        setSpecialChampMsg(specialMsg);
        setTimeout(() => setSpecialChampMsg(null), 3000);
      }

      // Islam bonus trigger chance boost
      const islamBonus = hlFighters.includes(5) && winTotal > 0;
      const bonusTriggerChance = islamBonus ? 0.25 : 0.05;

      // Play appropriate win sound
      if (winTotal > 0) {
        const topTier = w.find(x => x.tier === 'jackpot')?.tier ?? w.find(x => x.tier === 'high')?.tier ?? 'normal';
        const mult    = w.reduce((m, x) => Math.max(m, x.multiplier), 0);
        if (mult >= 150 || topTier === 'jackpot') sounds.jackpotSound();
        else if (mult >= 25) sounds.megaWin();
        else if (mult >= 8)  sounds.bigWin();
        else                 sounds.smallWin();
      }

      if (isBonusSpin) {
        setBonusResults(prev => [...prev, { wins: w, total: winTotal }]);
        setBonusTotal(p => p + winTotal);
        setBonusSpinsDone(p => p + 1);
      } else {
        const net = winTotal - bet;
        setSessionNet(p => p + net);
        if (winTotal > 0) {
          setSlotCoins(p => p + winTotal);
          setStreak(p => p + 1);
          setRecentWins(p => [{ wins: w, total: winTotal, ts: Date.now() }, ...p.slice(0, 4)]);
          setShowBrawl(true);
          if (w.some(x => x.tier === 'jackpot')) {
            setJackpotFlash(true);
            addTimeout(() => setJackpotFlash(false), 900);
          }
        } else {
          setStreak(0);
        }

        // Bonus round trigger
        if (Math.random() < bonusTriggerChance) {
          addTimeout(() => {
            sounds.bonusTrigger();
            setBonusPhase('active');
            setBonusResults([]);
            setBonusSpinsDone(0);
            setBonusTotal(0);
            setBonusMsg('✨ BONUS ROUND! 7 Free Spins — collecting all wins…');
            // Use separate ref so this timeout is not wiped by the next spin
            clearTimeout(bonusMsgTimeoutRef.current);
            bonusMsgTimeoutRef.current = setTimeout(() => setBonusMsg(null), 3500);
          }, winTotal > 0 ? 2000 : 400);
        }
      }
    }, resolveMs);
  };

  // Auto-play bonus spins
  useEffect(() => {
    if (bonusPhase !== 'active' || spinning) return;
    if (bonusSpinsDone >= BONUS_SPINS) {
      const t = setTimeout(() => setBonusPhase('revealing'), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => doSpin(true), 1600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bonusPhase, spinning, bonusSpinsDone]);

  const handleClaimBonus = async () => {
    const earned = bonusTotal;
    setBonusPhase(null);
    setSlotCoins(p => p + earned);
    setSessionNet(p => p + earned);
    setShowBrawl(false);
    if (earned > 0 && currentUser && !isAdmin) {
      try {
        const token = await getAuthToken();
        await axios.post(`${API_URL}/fancoins/slots-result`, { coinDelta: 0 }, { headers: { Authorization: `Bearer ${token}` } });
      } catch {}
    }
  };

  const handleExchange = async () => {
    if (exchangeAmt < 1 || exchangeAmt > ufcCoins || loading) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      await axios.post(`${API_URL}/fancoins/slots-result`, { coinDelta: -exchangeAmt }, { headers: { Authorization: `Bearer ${token}` } });
      setUfcCoins(p => p - exchangeAmt);
      setSlotCoins(p => p + exchangeAmt * COINS_PER_UFC);
    } catch {}
    setLoading(false);
    setShowExchange(false);
  };

  const handleCashOut = async () => {
    const earned = Math.floor(slotCoins / COINS_PER_UFC);
    if (earned < 1 || loading) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await axios.post(`${API_URL}/fancoins/slots-result`, { coinDelta: earned }, { headers: { Authorization: `Bearer ${token}` } });
      setUfcCoins(res.data.fanCoin ?? (ufcCoins + earned));
      setSlotCoins(p => p % COINS_PER_UFC);
    } catch {}
    setLoading(false);
  };

  useEffect(() => () => {
    clearInterval(spinInterval.current);
    allTimeouts.current.forEach(clearTimeout);
    clearTimeout(bonusMsgTimeoutRef.current);
  }, []);

  if (!currentUser) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎰</div>
          <h2 className="text-2xl font-black text-white mb-2">UFC Slots</h2>
          <p className="text-gray-400 mb-6">Sign in to play!</p>
          <button onClick={() => navigate('/game')} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">Back</button>
        </div>
      </div>
    );
  }

  const topWin  = wins.find(w => w.tier === 'jackpot') ?? wins.find(w => w.tier === 'high') ?? wins[0];
  const cellGap = Math.max(2, Math.floor(gridDim.w / 80));
  const cellW   = Math.floor((gridDim.w - cellGap * (COLS - 1) - 8) / COLS);
  const cellH   = Math.floor((gridDim.h - cellGap * (ROWS - 1) - 8) / ROWS);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">

      {/* Jackpot flash */}
      <AnimatePresence>
        {jackpotFlash && (
          <motion.div className="fixed inset-0 z-50 pointer-events-none"
            style={{ background: 'rgba(251,191,36,0.35)' }}
            initial={{ opacity: 1 }} animate={{ opacity: [1, 0.6, 1, 0.3, 0] }}
            transition={{ duration: 0.9, times: [0,0.2,0.5,0.75,1] }}
          />
        )}
      </AnimatePresence>

      {/* Bonus reveal screen */}
      <AnimatePresence>
        {bonusPhase === 'revealing' && (
          <BonusReveal
            results={bonusResults}
            total={bonusTotal}
            onClaim={handleClaimBonus}
            onTick={sounds.coinTick}
            onClaimSound={sounds.claimChime}
          />
        )}
      </AnimatePresence>

      {/* Brawl overlay */}
      <AnimatePresence>
        {showBrawl && wins.length > 0 && bonusPhase === null && (
          <BrawlOverlay
            wins={wins}
            totalWin={totalWin}
            winnerFighterId={brawlWinnerId}
            fighterImages={fighterImages}
            bet={bet}
            onDismiss={() => setShowBrawl(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 via-red-950 to-gray-900 border-b border-red-900/50 px-3 py-2 flex items-center justify-between">
        <button onClick={() => navigate('/game')} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
        <div className="text-center">
          <h1 className="text-sm font-black tracking-widest text-red-400 uppercase leading-tight">🎰 UFC Slots 🎰</h1>
          <p className="text-[10px] text-gray-500">5×4 Grid • Casino Difficulty</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={sounds.toggleMute}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title={sounds.muted ? 'Unmute' : 'Mute'}
          >
            {sounds.muted ? <VolumeX size={20} className="text-gray-500" /> : <Volume2 size={20} className="text-gray-300" />}
          </button>
          <button onClick={() => setShowPaytable(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Info size={20} /></button>
        </div>
      </div>

      {/* Wallet bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[9px] text-gray-500 leading-none">UFC Coins</p>
            <p className="text-sm font-black text-yellow-400 leading-tight">🥊 {ufcCoins.toLocaleString()}</p>
          </div>
          {!isAdmin && (
            <button onClick={() => setShowExchange(true)}
              className="px-2 py-0.5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-[11px] rounded-md transition-colors">
              Exchange
            </button>
          )}
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-1.5 bg-purple-900/60 border border-purple-700 px-2 py-1 rounded-lg">
            <Shield size={12} className="text-purple-300" />
            <span className="text-[10px] font-black text-purple-200">ADMIN • FREE</span>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[9px] text-gray-500 leading-none">Slot Coins</p>
            <p className="text-sm font-black text-purple-400 leading-tight">🪙 {slotCoins.toLocaleString()}</p>
          </div>
        )}
        <div className="text-right">
          <p className="text-[9px] text-gray-500 leading-none">Session</p>
          <p className={`text-sm font-black leading-tight ${sessionNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sessionNet >= 0 ? '+' : ''}{sessionNet.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Bonus accumulator bar */}
      {bonusPhase === 'active' && <BonusBar spinsDone={bonusSpinsDone} total={bonusTotal} />}

      {/* Near-miss banners */}
      <AnimatePresence>
        {nearMissMsg === 'hold' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-shrink-0 bg-yellow-950/80 border-b border-yellow-700/50 px-3 py-1.5 text-center">
            <motion.p className="text-sm font-black text-yellow-300"
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>
              ⚡ HOLD YOUR BREATH… LAST REEL SPINNING…
            </motion.p>
          </motion.div>
        )}
        {nearMissMsg === 'heartbreak' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-shrink-0 bg-red-950/80 border-b border-red-700/50 px-3 py-1.5 text-center">
            <p className="text-sm font-black text-red-400">💔 SO CLOSE! THE MIDDLE REEL BROKE IT! 😫</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Champion special message */}
      <AnimatePresence>
        {specialChampMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex-shrink-0 bg-amber-950/80 border-b border-amber-700/50 px-3 py-1.5 text-center">
            <p className="text-sm font-black text-amber-300">{specialChampMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak badge */}
      {streak >= 3 && bonusPhase === null && (
        <div className="flex-shrink-0 flex items-center justify-center px-2 py-1 bg-orange-950/60 border-b border-orange-800/30">
          <span className="text-[10px] font-black text-orange-200">🔥 {streak}× WIN STREAK → +50% MULTIPLIER!</span>
        </div>
      )}

      {/* Machine + Grid */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-2 py-1">
        <div className="w-full max-w-lg">
          <div className="bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-t-2xl px-3 pt-1 pb-0.5 border-t-2 border-x-2 border-gray-600">
            <LightStrip count={11} colors={['#ef4444', '#fbbf24', '#ef4444']} />
          </div>
        </div>
        <div className="w-full max-w-lg bg-gradient-to-b from-gray-900 to-gray-950 border-x-2 border-gray-600 flex-1 min-h-0"
          style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)' }}>
          <div ref={gridContainerRef} className="w-full h-full flex items-center justify-center p-2">
            <div style={{
              width: gridDim.w, height: gridDim.h,
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, ${cellW}px)`,
              gridTemplateRows: `repeat(${ROWS}, ${cellH}px)`,
              gap: `${cellGap}px`,
              background: 'rgba(0,0,0,0.65)',
              borderRadius: 8, padding: 4,
              boxShadow: spinning
                ? '0 0 28px rgba(139,92,246,0.55), inset 0 0 16px rgba(0,0,0,0.8)'
                : bonusPhase === 'active'
                ? '0 0 28px rgba(168,85,247,0.7), inset 0 0 16px rgba(0,0,0,0.8)'
                : '0 0 12px rgba(0,0,0,0.6), inset 0 0 16px rgba(0,0,0,0.8)',
              transition: 'box-shadow 0.3s',
            }}>
              {displayGrid.map((row, r) =>
                row.map((fId, c) => {
                  const isSpin = !stoppedCols[c];
                  return (
                    <SlotCell key={`${r}-${c}`}
                      fighterId={fId}
                      isHighlighted={stoppedCols.every(Boolean) && highlighted.has(`${r},${c}`)}
                      isSpinning={isSpin}
                      justStopped={justStopped[c]}
                      isHeartbreaker={heartbreakerCol === c && nearMissRef.current === r}
                      isAnticipating={anticipatingCol === c}
                      spinFrame={spinFrame}
                      fighterImages={fighterImages}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="w-full max-w-lg">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-2xl px-3 pb-1 pt-0.5 border-b-2 border-x-2 border-gray-600">
            <LightStrip count={11} colors={['#fbbf24', '#ef4444', '#fbbf24']} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 px-3 pt-1 pb-2 space-y-1.5 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-2.5 py-1.5">
          <span className="text-[10px] text-gray-500 font-bold w-7 flex-shrink-0">BET</span>
          <div className="flex gap-1 flex-1">
            {BET_OPTIONS.map(b => (
              <button key={b} onClick={() => setBet(b)} disabled={spinning || bonusPhase !== null}
                className={`flex-1 py-1 rounded-lg text-[11px] font-black transition-all ${bet === b ? 'bg-red-600 text-white shadow' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.96 }} onClick={() => canSpin && doSpin(false)} disabled={!canSpin}
          className={`w-full py-4 rounded-2xl font-black text-xl tracking-wide transition-all duration-200 relative overflow-hidden ${
            bonusPhase === 'active'
              ? 'bg-gradient-to-r from-purple-700 to-pink-700 text-white cursor-not-allowed opacity-80'
              : canSpin
              ? 'bg-gradient-to-r from-red-600 to-red-800 text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          style={canSpin ? { boxShadow: '0 4px 20px rgba(220,38,38,0.5)' } : {}}>
          {canSpin && (
            <motion.div className="absolute inset-y-0 w-1/3 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '400%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }} />
          )}
          {spinning
            ? bonusPhase === 'active' ? '🎁 BONUS SPINNING…' : '🌀 SPINNING…'
            : bonusPhase === 'active' ? '🎁 BONUS IN PROGRESS…'
            : isAdmin ? '🛠 ADMIN SPIN (FREE)' : '🎰  SPIN'}
        </motion.button>

        <div className="flex items-center gap-2">
          {!isAdmin && slotCoins >= COINS_PER_UFC && (
            <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              onClick={handleCashOut} disabled={loading}
              className="flex-1 py-2 rounded-xl font-bold text-xs bg-green-800 hover:bg-green-700 text-green-100 transition-all">
              💰 Cash Out {Math.floor(slotCoins / COINS_PER_UFC)} UFC Coins
            </motion.button>
          )}
          {recentWins.length > 0 && (
            <div className={`${!isAdmin && slotCoins >= COINS_PER_UFC ? 'w-36 flex-shrink-0' : 'flex-1'} bg-gray-900 rounded-xl px-2 py-1.5`}>
              <p className="text-[9px] text-gray-600 leading-none">Last win</p>
              <p className="text-[11px] font-black text-green-400 truncate leading-tight">
                {recentWins[0].wins[0]?.emoji} +{recentWins[0].total.toLocaleString()}
              </p>
            </div>
          )}
          {!isAdmin && slotCoins < bet && bonusPhase === null && (
            <p className="flex-1 text-center text-[10px] text-gray-600">Exchange UFC Coins to play</p>
          )}
        </div>
      </div>

      {/* Bonus trigger flash */}
      <AnimatePresence>
        {bonusMsg && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-black px-8 py-5 rounded-3xl shadow-2xl text-center">
              {bonusMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exchange Modal */}
      <AnimatePresence>
        {showExchange && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowExchange(false)}>
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-5 w-full max-w-sm border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-white">💱 Exchange Coins</h3>
                <button onClick={() => setShowExchange(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18}/></button>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 mb-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-400">Rate</span><span className="text-white font-bold">1 UFC = 1,000 Slot Coins</span></div>
                <div className="flex justify-between"><span className="text-gray-400">UFC Coins</span><span className="text-yellow-400 font-bold">{ufcCoins.toLocaleString()}</span></div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">UFC Coins to exchange</label>
                <input type="number" min={1} max={ufcCoins} value={exchangeAmt}
                  onChange={e => setExchangeAmt(Math.max(1, Math.min(ufcCoins, parseInt(e.target.value)||1)))}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-500 outline-none"/>
                <p className="text-xs text-green-400 mt-1 font-semibold">→ {(exchangeAmt * COINS_PER_UFC).toLocaleString()} slot coins</p>
              </div>
              <div className="flex gap-1.5 mb-3">
                {[1,5,10,50].map(n => (
                  <button key={n} onClick={() => setExchangeAmt(Math.min(n, ufcCoins))} disabled={n > ufcCoins}
                    className="flex-1 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 disabled:opacity-30">{n}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowExchange(false)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-semibold text-sm">Cancel</button>
                <button onClick={handleExchange} disabled={loading || exchangeAmt < 1 || exchangeAmt > ufcCoins}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black font-black text-sm disabled:opacity-40 transition-colors">
                  {loading ? 'Processing…' : 'Exchange!'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paytable Modal */}
      <AnimatePresence>
        {showPaytable && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/85 overflow-y-auto p-4"
            onClick={() => setShowPaytable(false)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-5 w-full max-w-sm mx-auto my-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">📋 Paytable</h3>
                <button onClick={() => setShowPaytable(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18}/></button>
              </div>
              <div className="space-y-1 text-xs mb-4">
                {[
                  ['jackpot','🏆','GRAND JACKPOT (all 20 same)','1000×'],['jackpot','👑','LEGENDARY SCATTER (10+)','300×'],
                  ['jackpot','🌟','MEGA SCATTER (8+)','150×'],['jackpot','👑','TRIPLE CHAMPIONS','60×'],
                  ['jackpot','✖️','DOUBLE DIAGONAL','80×'],['high','✝️','CROSS PATTERN','40×'],
                  ['high','↘️','DIAGONAL STRIKE / COUNTER','30×'],['high','🔲','CORNER QUAD','25×'],
                  ['high','🎰','LINE JACKPOT (5 in a row)','25×'],['high','💫','SCATTER WIN (5 same)','20×'],
                  ['high','✨','SUPER SCATTER (6 same)','50×'],['high','🥊','McGregor vs Khabib','15×'],
                  ['high','🔥','FULL COLUMN (4)','12×'],['normal','⭐','SCATTER HIT (4 same)','8×'],
                  ['normal','💥','FOUR IN A ROW','8×'],['normal','🎯','NEAR-MISS KO','5×'],
                  ['normal','👊','COLUMN THREE','3×'],['normal','⚡','THREE IN A ROW','2×'],
                ].map(([tier, emoji, name, mult]) => (
                  <div key={name} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${tier==='jackpot'?'bg-yellow-900/40 border border-yellow-700/30':tier==='high'?'bg-purple-900/30':'bg-gray-800'}`}>
                    <span className="text-white/90">{emoji} {name}</span>
                    <span className={`font-black ml-2 whitespace-nowrap ${tier==='jackpot'?'text-yellow-400':tier==='high'?'text-purple-300':'text-gray-300'}`}>{mult}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800 rounded-xl p-3 space-y-1.5 text-xs text-gray-400 mb-3">
                <p>🎁 <strong className="text-white">Bonus Round (5%):</strong> 7 auto-spins accumulate silently → dramatic reveal at end</p>
                <p>💔 <strong className="text-white">Near-Miss:</strong> Middle reel stops LAST — false hope guaranteed</p>
                <p>🔥 <strong className="text-white">Win Streak (3+):</strong> +50% on all multipliers</p>
                <p>⚡ <strong className="text-white">Wild (3%):</strong> One random fighter substitutes for any</p>
                <p>☘️ <strong className="text-white">McGregor Precision:</strong> ×1.5 on any win</p>
                <p>⚡ <strong className="text-white">Poatan KO Power:</strong> ×2 on any win</p>
                <p>🇬🇪 <strong className="text-white">Topuria Mini Jackpot:</strong> +50× bet bonus</p>
                <p>🌊 <strong className="text-white">Islam Bonus Boost:</strong> 25% bonus trigger chance</p>
                <p>🔊 <strong className="text-white">Sound:</strong> Toggle with the speaker icon in the header</p>
                <p>🏠 <strong className="text-white">House edge:</strong> ~88% RTP. This is a casino — most spins lose</p>
              </div>
              <button onClick={() => setShowPaytable(false)}
                className="w-full py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">
                Let's Play!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
