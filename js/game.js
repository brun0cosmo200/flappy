(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const installBtn = document.getElementById("install");

  const W = 400, H = 600;
  const Gravity = 1500, FlapVel = -450;
  const PipeW = 70, NPipes = 4, PipeDist = 220;
  const BirdX = 100, BirdR = 14, GroundH = 40;
  const CapH = 28, CapOver = 5;
  const DeadLockout = 0.5, ShakeTime = 0.35;
  const ContinueCost = 25, MissionScore = 10, MissionReward = 30;
  const MedalBronze = 10, MedalSilver = 20, MedalGold = 30, MedalPlatinum = 40;
  const DailyTries = 3;
  const ItemW = 300, ItemH = 46, ItemStep = 64, MenuTop = 252;
  const CellW = 40, CellH = 46, CellY = 412, CellCols = 8;
  const SAVE_KEY = "flappy-c-save";

  const State = {
    Menu: "Menu", Daily: "Daily", Customize: "Customize", Options: "Options",
    Achievements: "Achievements", Ready: "Ready", Playing: "Playing",
    Paused: "Paused", Dead: "Dead",
  };
  const Feat = { None: "None", Score: "Score", PipesTotal: "PipesTotal", NightPipes: "NightPipes", CoinsTotal: "CoinsTotal", Runs: "Runs" };
  const Style = { Classic: "Classic", Zombie: "Zombie", Robot: "Robot", Ninja: "Ninja", Ghost: "Ghost", Dragon: "Dragon", Phoenix: "Phoenix", Alien: "Alien", Legendary: "Legendary" };
  const DisplayNames = ["Janela", "Grande", "Tela cheia"];

  const rgb = (r, g, b, a = 255) => `rgba(${r|0},${g|0},${b|0},${a / 255})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const col = (c, a = 255) => rgb(c[0], c[1], c[2], a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cycle = (value, dir, count) => (value + dir + count) % count;

  const Birds = [
    { name: "Amarelo", color: [255, 215, 0], price: 0, style: Style.Classic, feat: Feat.None, goal: 0 },
    { name: "Vermelho", color: [255, 69, 0], price: 30, style: Style.Classic, feat: Feat.None, goal: 0 },
    { name: "Azul", color: [30, 144, 255], price: 60, style: Style.Classic, feat: Feat.None, goal: 0 },
    { name: "Verde", color: [60, 179, 113], price: 90, style: Style.Classic, feat: Feat.None, goal: 0 },
    { name: "Rosa", color: [255, 105, 180], price: 120, style: Style.Classic, feat: Feat.None, goal: 0 },
    { name: "Roxo", color: [147, 112, 219], price: 180, style: Style.Classic, feat: Feat.None, goal: 0 },
    { name: "Preto", color: [40, 40, 52], price: 250, style: Style.Classic, feat: Feat.None, goal: 0 },
    { name: "Prata", color: [200, 205, 218], price: 400, style: Style.Classic, feat: Feat.None, goal: 0 },
    { name: "Zumbi", color: [126, 172, 82], price: 0, style: Style.Zombie, feat: Feat.Score, goal: 10 },
    { name: "Robô", color: [156, 176, 198], price: 0, style: Style.Robot, feat: Feat.Score, goal: 25 },
    { name: "Ninja", color: [62, 64, 80], price: 0, style: Style.Ninja, feat: Feat.PipesTotal, goal: 100 },
    { name: "Fantasma", color: [198, 238, 255], price: 0, style: Style.Ghost, feat: Feat.NightPipes, goal: 15 },
    { name: "Dragão", color: [46, 158, 94], price: 0, style: Style.Dragon, feat: Feat.Score, goal: 35 },
    { name: "Fênix", color: [255, 146, 54], price: 0, style: Style.Phoenix, feat: Feat.CoinsTotal, goal: 1000 },
    { name: "Alien", color: [150, 226, 96], price: 0, style: Style.Alien, feat: Feat.Runs, goal: 30 },
    { name: "Lendário", color: [255, 208, 70], price: 0, style: Style.Legendary, feat: Feat.Score, goal: 50 },
  ];
  const SpecialCount = Birds.filter((b) => b.feat !== Feat.None).length;
  const Backgrounds = [
    { name: "Dia", top: [56, 168, 232], bottom: [214, 242, 255], hillFar: [126, 198, 186], hillNear: [78, 168, 96], body: "Sun", dark: false },
    { name: "Entardecer", top: [255, 92, 72], bottom: [255, 206, 128], hillFar: [214, 110, 92], hillNear: [148, 70, 68], body: "Sunset", dark: false },
    { name: "Noite", top: [8, 8, 28], bottom: [78, 52, 128], hillFar: [42, 38, 92], hillNear: [22, 22, 58], body: "Moon", dark: true },
  ];
  const Levels = [
    { name: "Fácil", gap: 190, speed: 140, coinMult: 0.5 },
    { name: "Normal", gap: 160, speed: 160, coinMult: 1.0 },
    { name: "Difícil", gap: 130, speed: 190, coinMult: 1.5 },
  ];

  function featName(feat) {
    return {
      [Feat.Score]: "Canos em uma partida",
      [Feat.PipesTotal]: "Canos no total",
      [Feat.NightPipes]: "Canos à noite",
      [Feat.CoinsTotal]: "Moedas ganhas",
      [Feat.Runs]: "Partidas jogadas",
    }[feat] || "";
  }
  function trailColor(skin) {
    return {
      [Style.Zombie]: [132, 158, 70],
      [Style.Robot]: [140, 238, 255],
      [Style.Ninja]: [150, 120, 130],
      [Style.Ghost]: [205, 238, 255],
      [Style.Dragon]: [255, 140, 40],
      [Style.Phoenix]: [255, 186, 60],
      [Style.Alien]: [175, 242, 110],
      [Style.Legendary]: [255, 228, 120],
    }[skin.style] || mix(skin.color, [255, 255, 255], 0.55);
  }
  const tier = (n) => Math.min(1 + Math.floor(n / 10), 5);
  const medalFor = (score) => {
    if (score >= MedalPlatinum) return { color: [196, 238, 255], name: "PLATINA" };
    if (score >= MedalGold) return { color: [255, 201, 46], name: "OURO" };
    if (score >= MedalSilver) return { color: [208, 216, 230], name: "PRATA" };
    if (score >= MedalBronze) return { color: [208, 131, 66], name: "BRONZE" };
    return null;
  };

  class Seeded {
    constructor(seed) { this.s = seed >>> 0; }
    next() {
      this.s += 0x6D2B79F5;
      let t = this.s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    nextInt(min, maxEx) { return min + Math.floor(this.next() * (maxEx - min)); }
  }

  const pipes = Array.from({ length: NPipes }, () => ({ x: 0, gapY: 0, scored: false }));
  let pipeRng = new Seeded(Date.now());
  const particles = [];
  const floats = [];
  const unlockQueue = [];
  const owned = new Set([Birds[0].name]);
  const bests = [0, 0, 0];
  const starX = [], starY = [], starPh = [];
  const cloudX = [40, 190, 330], cloudY = [70, 150, 40], cloudS = [1, 0.7, 0.9];

  let dailyRun = false, dailyAttempts = 0, dailyBest = 0, dailyDate = "", dailyHistory = [];
  let birdY = H / 2, birdVy = 0, deadTime = 0, wingPhase = 0, flapTimer = 0;
  let groundX = 0, hillFar = 0, hillNear = 0, shake = 0, fade = 0, trailTimer = 0;
  let runCoins = 0, coins = 0, lastEarned = 0, score = 0, selected = 0;
  let birdSkin = 0, viewSkin = 0, bgSkin = 0, level = 1;
  let totalPipes = 0, nightPipes = 0, totalRuns = 0, totalCoins = 0;
  let state = State.Menu, spaceDown = false, display = 0, muteMemory = 100;
  let mission10 = false, usedContinue = false, runSettled = true, newRecord = false;
  let unlockMessage = "", unlockTimer = 0, deadRows = [];
  let time = 0, last = performance.now() / 1000;
  let deferredPrompt = null;
  let cssW = W, cssH = H;

  const gap = () => (dailyRun ? Levels[1].gap : Levels[level].gap);
  const pipeSpeed = () => (dailyRun ? Levels[1].speed : Levels[level].speed);
  const coinMult = () => (dailyRun ? Levels[1].coinMult : Levels[level].coinMult);
  const dailyLeft = () => Math.max(0, DailyTries - dailyAttempts);
  const isOwned = (i) => owned.has(Birds[i].name);
  const bestOverall = () => Math.max(0, ...bests);
  const featValue = (skin) => ({
    [Feat.Score]: Math.max(score, bestOverall()),
    [Feat.PipesTotal]: totalPipes,
    [Feat.NightPipes]: nightPipes,
    [Feat.CoinsTotal]: totalCoins,
    [Feat.Runs]: totalRuns,
  }[skin.feat] || 0);
  const specialOwned = () => Birds.filter((b) => b.feat !== Feat.None && owned.has(b.name)).length;

  const sr = new Seeded(7);
  for (let i = 0; i < 40; i++) {
    starX.push(sr.nextInt(0, W));
    starY.push(sr.nextInt(0, (H * 0.55) | 0));
    starPh.push(sr.next() * Math.PI * 2);
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function dailySeed(key) {
    const n = parseInt(key.replaceAll("-", ""), 10);
    return Number.isFinite(n) ? n : 1;
  }
  function shortDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return y && m && d ? `${d}/${m}` : iso;
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        Version: 3, Coins: coins, Owned: [...owned], Equipped: Birds[birdSkin].name,
        Background: bgSkin, Level: level, Bests: bests, Mission10: mission10, Display: display,
        TotalPipes: totalPipes, NightPipes: nightPipes, TotalRuns: totalRuns, TotalCoins: totalCoins,
        DailyDate: dailyDate, DailyAttempts: dailyAttempts, DailyBest: dailyBest,
        DailyHistory: dailyHistory, Volume: Sfx.Volume,
      }));
    } catch { /* storage blocked */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      coins = Math.max(0, data.Coins || 0);
      owned.clear();
      owned.add(Birds[0].name);
      for (const name of data.Owned || []) if (Birds.some((b) => b.name === name)) owned.add(name);
      const idx = Birds.findIndex((b) => b.name === data.Equipped);
      if (idx >= 0 && owned.has(Birds[idx].name)) birdSkin = idx;
      if (data.Background >= 0 && data.Background < Backgrounds.length) bgSkin = data.Background;
      if (data.Level >= 0 && data.Level < Levels.length) level = data.Level;
      if (data.Bests) for (let i = 0; i < bests.length && i < data.Bests.length; i++) bests[i] = Math.max(0, data.Bests[i]);
      mission10 = !!data.Mission10;
      if (data.Display >= 0 && data.Display <= 2) display = data.Display;
      totalPipes = Math.max(0, data.TotalPipes || 0);
      nightPipes = Math.max(0, data.NightPipes || 0);
      totalRuns = Math.max(0, data.TotalRuns || 0);
      totalCoins = Math.max(0, data.TotalCoins || 0);
      dailyDate = data.DailyDate || "";
      dailyAttempts = clamp(data.DailyAttempts || 0, 0, DailyTries);
      dailyBest = Math.max(0, data.DailyBest || 0);
      dailyHistory = data.DailyHistory || [];
      const volume = data.Volume ?? (data.Sound === false ? 0 : 100);
      Sfx.setVolume(clamp(volume, 0, 100));
      muteMemory = Sfx.Volume > 0 ? Sfx.Volume : 100;
      if (checkUnlocks()) save();
    } catch { /* ignore */ }
  }

  function ensureDaily() {
    const today = todayKey();
    if (dailyDate === today) return;
    dailyDate = today;
    dailyAttempts = 0;
    dailyBest = 0;
    save();
  }

  function checkUnlocks() {
    let any = false;
    for (const skin of Birds) {
      if (skin.feat === Feat.None || owned.has(skin.name)) continue;
      if (featValue(skin) < skin.goal) continue;
      owned.add(skin.name);
      unlockQueue.push(skin);
      any = true;
    }
    return any;
  }

  function bankRun() {
    if (runSettled) return;
    runSettled = true;
    lastEarned = runCoins | 0;
    coins += lastEarned;
    runCoins = 0;
    if (dailyRun) {
      dailyBest = Math.max(dailyBest, score);
      let rec = dailyHistory.find((r) => r.Date === dailyDate);
      if (!rec) { rec = { Date: dailyDate, Score: 0 }; dailyHistory.push(rec); }
      rec.Score = Math.max(rec.Score, score);
      dailyHistory = dailyHistory.sort((a, b) => a.Date.localeCompare(b.Date)).slice(-7);
    } else {
      bests[level] = Math.max(bests[level], score);
    }
    totalCoins += Math.max(0, lastEarned);
    checkUnlocks();
    save();
  }

  function randGapY() { return pipeRng.nextInt(80, H - GroundH - 80 - gap() + 1); }

  function reset() {
    birdY = H / 2; birdVy = 0; score = 0; runCoins = 0;
    particles.length = 0; floats.length = 0;
    for (let i = 0; i < NPipes; i++) {
      pipes[i].x = W + 8 + i * PipeDist;
      pipes[i].gapY = randGapY();
      pipes[i].scored = false;
    }
  }

  function startGame() {
    bankRun();
    dailyRun = false;
    pipeRng = new Seeded((Math.random() * 1e9) | 0);
    reset();
    usedContinue = false; newRecord = false; runSettled = true; fade = 1;
    state = State.Ready; trailTimer = 0;
  }

  function startDaily() {
    ensureDaily();
    if (dailyLeft() <= 0) { Sfx.Pause(); return; }
    bankRun();
    dailyRun = true;
    pipeRng = new Seeded(dailySeed(dailyDate));
    reset();
    usedContinue = false; newRecord = false; runSettled = true; fade = 1;
    state = State.Ready; trailTimer = 0;
  }

  function beginPlay() {
    if (state !== State.Ready) return;
    if (dailyRun) dailyAttempts = Math.min(DailyTries, dailyAttempts + 1);
    totalRuns++;
    runSettled = false;
    checkUnlocks();
    save();
    state = State.Playing;
    flap();
  }

  function go(s) {
    if (s === State.Daily) ensureDaily();
    if (s === State.Menu) dailyRun = false;
    selected = (s === State.Menu && state === State.Daily) ? 1
      : (s === State.Menu && state === State.Customize) ? 2
      : (s === State.Menu && state === State.Options) ? 3
      : (s === State.Options && state === State.Achievements) ? 3 : 0;
    viewSkin = birdSkin;
    if (s !== state) fade = 1;
    state = s;
  }

  function goToMenu() {
    if ([State.Playing, State.Paused, State.Ready, State.Dead].includes(state)) bankRun();
    go(State.Menu);
  }

  function cycleSkin(dir) {
    viewSkin = cycle(viewSkin, dir, Birds.length);
    if (isOwned(viewSkin)) { birdSkin = viewSkin; save(); }
  }

  function tryBuy() {
    const skin = Birds[viewSkin];
    if (skin.feat !== Feat.None || isOwned(viewSkin) || coins < skin.price) return;
    coins -= skin.price;
    owned.add(skin.name);
    birdSkin = viewSkin;
    save();
    Sfx.Buy();
  }

  function cycleVolume(dir) {
    const step = (Math.floor(Sfx.Volume / 10) + dir + 11) % 11;
    Sfx.setVolume(step * 10);
    if (Sfx.Volume > 0) muteMemory = Sfx.Volume;
    save();
    Sfx.Click();
  }

  function toggleMute() {
    if (Sfx.Volume > 0) { muteMemory = Sfx.Volume; Sfx.setVolume(0); }
    else Sfx.setVolume(muteMemory > 0 ? muteMemory : 100);
    save();
    Sfx.Click();
  }

  async function applyDisplay() {
    if (display === 2) {
      try { if (!document.fullscreenElement) await canvas.requestFullscreen(); } catch { /* ignore */ }
    } else if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* ignore */ }
    }
    layout();
  }

  function cycleDisplay(dir) {
    display = cycle(display, dir, 3);
    applyDisplay();
    save();
    Sfx.Click();
  }

  function flap() {
    birdVy = FlapVel;
    flapTimer = 0.25;
    if (state === State.Playing) { spawnPuff(3); Sfx.Flap(); }
  }

  function spawnPuff(n) {
    const c = mix(Birds[birdSkin].color, [255, 255, 255], 0.6);
    for (let i = 0; i < n; i++) particles.push({
      x: BirdX - 14, y: birdY + 6, vx: -40 - Math.random() * 60, vy: Math.random() * 60 - 10,
      max: 0.45, life: 0.45, size: 4 + Math.random() * 4, color: c,
    });
  }
  function spawnBurst() {
    const c = Birds[birdSkin].color;
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 160;
      particles.push({
        x: BirdX, y: birdY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        max: 0.8, life: 0.8, size: 4 + Math.random() * 5, color: i % 3 === 0 ? [255, 255, 255] : c,
      });
    }
  }
  function spawnUnlockBurst(c) {
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 150;
      particles.push({
        x: W / 2, y: 516, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120,
        max: 1.1, life: 1.1, size: 3 + Math.random() * 4, color: i % 4 === 0 ? [255, 255, 255] : c,
      });
    }
  }

  function rowsTop() {
    return { Daily: 344, Customize: 228, Options: 198, Achievements: 456, Paused: 268, Dead: 310 }[state] ?? MenuTop;
  }
  function rowStep() { return state === State.Menu ? 58 : ItemStep; }
  function itemRect(i) { return { x: (W - ItemW) / 2, y: rowsTop() + i * rowStep(), w: ItemW, h: ItemH }; }
  function cellRect(i) {
    return { x: (W - CellCols * CellW) / 2 + (i % CellCols) * CellW, y: CellY + Math.floor(i / CellCols) * CellH, w: CellW, h: CellH };
  }
  function hit(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }

  const mainRows = [
    { text: () => "Jogar", choose: () => startGame() },
    { text: () => `Desafio diário  (${dailyLeft()}/${DailyTries})`, choose: () => { Sfx.Click(); go(State.Daily); } },
    { text: () => "Personalizar", choose: () => { Sfx.Click(); go(State.Customize); } },
    { text: () => "Opções", choose: () => { Sfx.Click(); go(State.Options); } },
  ];
  const dailyRows = [
    { text: () => dailyLeft() > 0 ? `Jogar desafio  (${dailyLeft()}/${DailyTries})` : "Volte amanhã",
      choose: () => { if (dailyLeft() > 0) startDaily(); else go(State.Menu); } },
    { text: () => "Voltar", choose: () => go(State.Menu) },
  ];
  const customRows = [
    { text: () => `Pássaro:  <  ${Birds[viewSkin].name}  >`, cycles: true,
      activate: (d) => cycleSkin(d),
      choose: () => { if (isOwned(viewSkin)) cycleSkin(1); else tryBuy(); } },
    { text: () => `Fundo:  <  ${Backgrounds[bgSkin].name}  >`, cycles: true,
      activate: (d) => { bgSkin = cycle(bgSkin, d, Backgrounds.length); save(); Sfx.Click(); },
      choose: () => { bgSkin = cycle(bgSkin, 1, Backgrounds.length); save(); Sfx.Click(); } },
    { text: () => "Voltar", choose: () => go(State.Menu) },
  ];
  const optionRows = [
    { text: () => `Dificuldade:  <  ${Levels[level].name}  >`, cycles: true,
      activate: (d) => { level = cycle(level, d, Levels.length); save(); Sfx.Click(); },
      choose: () => { level = cycle(level, 1, Levels.length); save(); Sfx.Click(); } },
    { text: () => `Tela:  <  ${DisplayNames[display]}  >`, cycles: true,
      activate: (d) => cycleDisplay(d), choose: () => cycleDisplay(1) },
    { text: () => `Volume:  <  ${Sfx.Volume}%  >`, cycles: true,
      activate: (d) => cycleVolume(d), choose: () => cycleVolume(1) },
    { text: () => "Conquistas", choose: () => { Sfx.Click(); go(State.Achievements); } },
    { text: () => "Voltar", choose: () => go(State.Menu) },
  ];
  const achievementRows = [{ text: () => "Voltar", choose: () => go(State.Options) }];
  const pauseRows = [
    { text: () => "Continuar", choose: () => { state = State.Playing; Sfx.Click(); } },
    { text: () => "Menu", choose: () => goToMenu() },
  ];

  function rebuildDeadRows() {
    const list = [];
    if (!dailyRun && !usedContinue && coins >= ContinueCost)
      list.push({ text: () => `Continuar  (${ContinueCost} moedas)`, choose: tryContinue });
    const restartIndex = list.length;
    if (dailyRun) {
      if (dailyLeft() > 0) list.push({ text: () => `Tentar de novo  (${dailyLeft()}/${DailyTries})`, choose: startDaily });
      else list.push({ text: () => "Voltar ao desafio", choose: () => go(State.Daily) });
    } else list.push({ text: () => "Jogar de novo", choose: startGame });
    list.push({ text: () => "Menu", choose: goToMenu });
    deadRows = list;
    selected = restartIndex;
  }

  function tryContinue() {
    if (dailyRun || usedContinue || coins < ContinueCost || deadTime < DeadLockout) return;
    coins -= ContinueCost;
    usedContinue = true;
    runSettled = false;
    birdY = H / 2; birdVy = 0;
    for (const p of pipes) if (p.x < BirdX + 80 && p.x + PipeW > BirdX - 40) p.x = W + 30;
    state = State.Playing;
    save();
    Sfx.Revive();
    flap();
  }

  function currentRows() {
    if (state === State.Menu) return mainRows;
    if (state === State.Daily) return dailyRows;
    if (state === State.Customize) return customRows;
    if (state === State.Options) return optionRows;
    if (state === State.Achievements) return achievementRows;
    if (state === State.Paused) return pauseRows;
    if (state === State.Dead && deadTime > DeadLockout) return deadRows;
    return null;
  }

  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw), ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }
  function collides() {
    if (birdY + BirdR > H - GroundH || birdY - BirdR < 0) return true;
    for (const p of pipes) {
      if (circleRect(BirdX, birdY, BirdR, p.x, 0, PipeW, p.gapY)) return true;
      if (circleRect(BirdX, birdY, BirdR, p.x, p.gapY + gap(), PipeW, H - p.gapY - gap())) return true;
    }
    return false;
  }

  function update(dt) {
    for (let i = 0; i < cloudX.length; i++) {
      cloudX[i] -= (6 + 4 * i) * dt;
      if (cloudX[i] < -90) cloudX[i] = W + 20;
    }
    if (state !== State.Dead && state !== State.Paused) {
      if (state !== State.Ready) {
        groundX += pipeSpeed() * dt;
        hillFar += pipeSpeed() * 0.06 * dt;
        hillNear += pipeSpeed() * 0.18 * dt;
      }
      wingPhase += dt * (flapTimer > 0 ? 34 : 14);
    } else if (state === State.Paused) wingPhase += dt * 8;
    flapTimer = Math.max(0, flapTimer - dt);
    shake = Math.max(0, shake - dt);
    fade = Math.max(0, fade - dt * 3.4);

    if (unlockTimer > 0) unlockTimer -= dt;
    else if (unlockQueue.length) {
      const unlocked = unlockQueue.shift();
      unlockMessage = unlocked.name;
      unlockTimer = 2.8;
      Sfx.Unlock();
      spawnUnlockBurst(unlocked.color);
    }

    if (state === State.Playing) {
      trailTimer -= dt;
      if (trailTimer <= 0) {
        trailTimer = 0.045;
        particles.push({
          x: BirdX - 20, y: birdY + 6, vx: -30 - Math.random() * 35, vy: 8 - Math.random() * 30,
          max: 0.4, life: 0.4, size: 2 + Math.random() * 3, color: trailColor(Birds[birdSkin]),
        });
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += 400 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt;
      if (f.life <= 0) { floats.splice(i, 1); continue; }
      f.y -= 36 * dt;
    }

    if (state === State.Dead) {
      deadTime += dt;
      birdVy += Gravity * dt;
      birdY = Math.min(birdY + birdVy * dt, H - GroundH - BirdR);
      return;
    }
    if (state !== State.Playing) return;

    birdVy += Gravity * dt;
    birdY += birdVy * dt;
    for (const p of pipes) {
      p.x -= pipeSpeed() * dt;
      if (!p.scored && p.x + PipeW < BirdX) {
        p.scored = true;
        score++;
        totalPipes++;
        if (Backgrounds[bgSkin].dark) nightPipes++;
        Sfx.Score();
        const gain = tier(score) * coinMult();
        runCoins += gain;
        floats.push({ x: BirdX + 42, y: birdY - 30, life: 0.9, text: "+" + gain.toFixed(gain % 1 ? 1 : 0) });
        if (!mission10 && score >= MissionScore) {
          mission10 = true;
          runCoins += MissionReward;
          floats.push({ x: BirdX + 36, y: birdY - 58, life: 1.4, text: `Missão +${MissionReward}` });
          Sfx.Mission();
          save();
        }
        if (checkUnlocks()) save();
      }
      if (p.x + PipeW < 0) {
        p.x += NPipes * PipeDist;
        p.gapY = randGapY();
        p.scored = false;
      }
    }
    if (collides()) {
      state = State.Dead;
      deadTime = 0;
      shake = ShakeTime;
      spawnBurst();
      Sfx.Death();
      newRecord = dailyRun ? score > dailyBest : score > bests[level];
      bankRun();
      rebuildDeadRows();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fillRound(x, y, w, h, r, fill, stroke, lw = 1.4) {
    roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function outlined(text, size, x, y, fill, alpha = 255, outline = 4, weight = "700") {
    ctx.save();
    ctx.globalAlpha = alpha / 255;
    ctx.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineJoin = "round";
    ctx.lineWidth = outline;
    ctx.strokeStyle = "rgb(45,30,25)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
  function glow(cx, cy, r, c, a = 160) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col(c, a));
    g.addColorStop(1, col(c, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function starPath(cx, cy, outer, inner) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 === 0 ? outer : inner;
      ctx[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  }
  function fillStar(cx, cy, outer, inner, fill, edge) {
    starPath(cx, cy, outer, inner);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke();
  }
  function padlock(cx, cy, s) {
    ctx.strokeStyle = "rgb(70,70,85)"; ctx.lineWidth = 6.5 * s; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy - 9 * s, 7 * s, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = "rgb(215,215,225)"; ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.arc(cx, cy - 9 * s, 7 * s, Math.PI, 0); ctx.stroke();
    fillRound(cx - 11 * s, cy - 4 * s, 22 * s, 18 * s, 4 * s, "rgb(240,192,48)", "rgb(120,80,10)", 2 * s);
    ctx.fillStyle = "rgb(70,45,10)";
    ctx.beginPath(); ctx.arc(cx, cy + 4.5 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - 1.2 * s, cy + 5 * s, 2.4 * s, 5 * s);
  }
  function drawCloud(x, y, s, dark) {
    ctx.save();
    ctx.fillStyle = "rgba(40,55,80,0.18)";
    cloudBlob(x + 2.5 * s, y + 4 * s, s);
    ctx.fillStyle = dark ? "rgba(150,150,205,0.43)" : "rgba(255,255,255,0.75)";
    cloudBlob(x, y, s);
    ctx.fillStyle = "rgba(255,255,255,0.27)";
    ctx.beginPath(); ctx.ellipse(x + 27 * s, y + 7 * s, 11 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function cloudBlob(x, y, s) {
    ctx.beginPath();
    ctx.ellipse(x + 39 * s, y + 24 * s, 39 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 30 * s, y + 13 * s, 20 * s, 17 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 54 * s, y + 17 * s, 18 * s, 15 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function hillY(offset, baseY, amp, wave, x) {
    const u = ((x + offset) / wave) * Math.PI * 2;
    return baseY - amp * (0.62 * Math.sin(u) + 0.38 * Math.sin(u * 2.35 + 1.15));
  }
  function drawHills(brush, offset, baseY, amp, wave, trees) {
    ctx.beginPath();
    ctx.moveTo(-12, H);
    for (let x = -12; x <= W + 24; x += 6) ctx.lineTo(x, hillY(offset, baseY, amp, wave, x));
    ctx.lineTo(W + 24, H);
    ctx.closePath();
    ctx.fillStyle = brush;
    ctx.fill();
    if (!trees) return;
    for (let i = 0; i < 9; i++) {
      let x = ((i * 97 - offset * 0.35) % (W + 80) + (W + 80)) % (W + 80) - 20;
      if (x < -30 || x > W + 20) continue;
      const y = hillY(offset, baseY, amp, wave, x);
      ctx.fillStyle = "rgba(30,22,18,0.27)";
      ctx.fillRect(x - 2.2, y - 18, 4.4, 18);
      ctx.fillStyle = "rgba(18,48,22,0.43)";
      ctx.beginPath(); ctx.ellipse(x, y - 23, 12, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y - 34, 8, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawCelestial(sky, t) {
    if (sky.body === "Sun") {
      glow(318, 88, 110, [255, 236, 150], 90);
      glow(318, 88, 58, [255, 250, 210], 180);
      ctx.strokeStyle = "rgba(255,245,180,0.11)"; ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const a = t * 0.15 + i * Math.PI * 2 / 10;
        ctx.beginPath();
        ctx.moveTo(318 + Math.cos(a) * 34, 88 + Math.sin(a) * 34);
        ctx.lineTo(318 + Math.cos(a) * 72, 88 + Math.sin(a) * 72);
        ctx.stroke();
      }
      const g = ctx.createLinearGradient(292, 62, 344, 114);
      g.addColorStop(0, "rgb(255,255,245)"); g.addColorStop(1, "rgb(255,210,90)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(318, 88, 26, 0, Math.PI * 2); ctx.fill();
    } else if (sky.body === "Sunset") {
      glow(210, 430, 170, [255, 90, 40], 70);
      glow(290, 400, 140, [255, 170, 60], 130);
      const g = ctx.createLinearGradient(244, 354, 336, 446);
      g.addColorStop(0, "rgb(255,230,140)"); g.addColorStop(1, "rgb(255,96,40)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(290, 400, 46, 0, Math.PI * 2); ctx.fill();
    } else {
      for (let i = 0; i < starX.length; i++) {
        const a = clamp(90 + 140 * Math.sin(t * 1.6 + starPh[i]), 0, 255);
        const r = 1.1 + (i % 5) * 0.35;
        ctx.fillStyle = `rgba(255,250,220,${a / 255})`;
        ctx.beginPath(); ctx.arc(starX[i], starY[i], r, 0, Math.PI * 2); ctx.fill();
      }
      glow(312, 86, 86, [180, 200, 255], 120);
      const g = ctx.createLinearGradient(286, 60, 338, 112);
      g.addColorStop(0, "rgb(250,252,255)"); g.addColorStop(1, "rgb(186,192,210)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(312, 86, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(90,95,120,0.16)";
      ctx.beginPath(); ctx.ellipse(307, 80, 5.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(322, 97, 4, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawCoin(cx, cy, r) {
    glow(cx, cy, r * 1.8, [255, 210, 40], 70);
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, "rgb(255,236,110)"); g.addColorStop(1, "rgb(210,140,10)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgb(255,248,190)"; ctx.beginPath(); ctx.arc(cx, cy - r * 0.08, r * 0.52, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgb(150,90,10)"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  function drawPipe(p) {
    const gy = p.gapY, bot = gy + gap(), capW = PipeW + 2 * CapOver;
    ctx.save(); ctx.translate(p.x, 0);
    pipeBody(0, -8, PipeW, gy - CapH + 8);
    ctx.fillStyle = "rgba(0,20,0,0.35)"; ctx.fillRect(0, gy - CapH - 10, PipeW, 10);
    pipeCap(-CapOver, gy - CapH, capW, CapH);
    ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(-2, gy - 6, PipeW + 4, 6);
    pipeBody(0, bot + CapH, PipeW, H - bot - CapH + 8);
    ctx.fillStyle = "rgba(0,20,0,0.35)"; ctx.fillRect(0, bot + CapH, PipeW, 10);
    pipeCap(-CapOver, bot, capW, CapH);
    ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(-2, bot, PipeW + 4, 6);
    ctx.restore();
  }
  function pipeGrad(x, w) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "rgb(42,92,14)");
    g.addColorStop(0.12, "rgb(96,168,28)");
    g.addColorStop(0.28, "rgb(186,236,78)");
    g.addColorStop(0.52, "rgb(118,198,42)");
    g.addColorStop(0.82, "rgb(58,118,18)");
    g.addColorStop(1, "rgb(28,72,8)");
    return g;
  }
  function pipeBody(x, y, w, h) {
    if (h <= 1) return;
    ctx.fillStyle = pipeGrad(x, w); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,200,0.35)"; ctx.fillRect(x + 8, y, 7, h);
    ctx.fillStyle = "rgba(0,20,0,0.35)"; ctx.fillRect(x + w - 14, y, 14, h);
    ctx.strokeStyle = "rgb(36,58,12)"; ctx.lineWidth = 2.2; ctx.strokeRect(x, y, w, h);
  }
  function pipeCap(x, y, w, h) {
    ctx.fillStyle = pipeGrad(x, w);
    roundRect(x, y, w, h, 6); ctx.fill();
    ctx.fillStyle = "rgba(255,255,200,0.35)"; ctx.fillRect(x + 10, y + 4, 8, h - 8);
    ctx.fillStyle = "rgba(0,20,0,0.35)"; ctx.fillRect(x + w - 16, y + 3, 12, h - 6);
    ctx.strokeStyle = "rgb(36,58,12)"; ctx.lineWidth = 2.2; roundRect(x, y, w, h, 6); ctx.stroke();
  }
  function drawGround() {
    const top = H - GroundH;
    ctx.fillStyle = "rgb(196,168,98)"; ctx.fillRect(-10, top, W + 20, GroundH);
    ctx.fillStyle = "rgb(168,132,72)"; ctx.fillRect(-10, top + 16, W + 20, GroundH - 16);
    ctx.fillStyle = "rgb(92,176,42)"; ctx.fillRect(-10, top, W + 20, 12);
    const off = groundX % 26;
    ctx.fillStyle = "rgb(168,228,72)";
    for (let x = -off - 26; x < W + 26; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x + 9, top); ctx.lineTo(x + 22, top); ctx.lineTo(x + 13, top + 12); ctx.lineTo(x, top + 12);
      ctx.fill();
    }
    ctx.strokeStyle = "rgb(48,92,18)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, top); ctx.lineTo(W + 10, top); ctx.stroke();
  }

  function poly(pts, fill, stroke, lw = 1.25) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function ellipse(x, y, w, h, fill, stroke) {
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.25; ctx.stroke(); }
  }

  function drawBird(cx, cy, scale, angle, wing, skin) {
    const style = skin.style, body = skin.color;
    const robot = style === Style.Robot, zombie = style === Style.Zombie, ninja = style === Style.Ninja;
    const ghost = style === Style.Ghost, dragon = style === Style.Dragon, phoenix = style === Style.Phoenix;
    const alien = style === Style.Alien, legend = style === Style.Legendary;
    const darkCol = mix(body, [0, 0, 0], robot ? 0.45 : 0.38);
    const lightCol = mix(body, [255, 255, 255], ghost ? 0.8 : legend ? 0.68 : 0.62);
    const wingCol = mix(body, [0, 0, 0], robot ? 0.28 : 0.08);
    const wingTip = mix(body, [0, 0, 0], robot ? 0.5 : 0.28);
    const outline = mix(body, [20, 16, 28], robot ? 0.8 : 0.72);
    const beakA = {
      [Style.Robot]: [214, 224, 236], [Style.Zombie]: [170, 180, 88], [Style.Ninja]: [222, 172, 66],
      [Style.Ghost]: [212, 242, 252], [Style.Dragon]: [255, 124, 62], [Style.Phoenix]: [255, 192, 62],
      [Style.Alien]: [196, 146, 232], [Style.Legendary]: [255, 210, 84],
    }[style] || [255, 176, 28];
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(angle * Math.PI / 180); ctx.scale(scale, scale);
    if (ghost || legend || phoenix) glow(0, 0, 28, mix(body, [255, 255, 255], 0.3), ghost ? 90 : 75);
    ctx.fillStyle = "rgba(0,0,0,0.27)"; ellipse(-12, 12, 26, 8);
    if (ghost) {
      ctx.fillStyle = col(lightCol, 170);
      ellipse(-21, 5, 17, 18); ellipse(-7, 7, 17, 19); ellipse(7, 4, 16, 18);
    }
    if (robot) {
      ctx.strokeStyle = col(mix(body, [0, 0, 0], 0.4)); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(2, -14); ctx.lineTo(4, -27); ctx.stroke();
      ctx.fillStyle = "rgb(140,240,255)"; ellipse(0, -31, 8, 8);
    } else if (alien) {
      ctx.strokeStyle = col(mix(body, [0, 0, 0], 0.45)); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-13, -26); ctx.moveTo(6, -14); ctx.lineTo(14, -25); ctx.stroke();
      ctx.fillStyle = col(mix(body, [255, 255, 255], 0.3)); ellipse(-16, -30, 7, 7); ellipse(12, -29, 6, 6);
    } else if (dragon) {
      poly([[-8, -14], [-15, -30], [-2, -18]], "rgb(238,226,190)", col(outline));
      poly([[2, -16], [4, -29], [9, -15]], "rgb(238,226,190)", col(outline));
    } else if (legend) {
      poly([[-10, -14], [-12, -27], [-4, -20], [1, -31], [6, -20], [13, -27], [11, -14]], "rgb(255,220,80)", col(outline));
      ctx.fillStyle = "rgb(120,200,255)"; ellipse(-2, -24, 5, 5);
    } else if (phoenix) {
      poly([[-8, -14], [-12, -28], [-2, -19], [3, -31], [7, -19], [13, -26], [9, -13]], "rgb(255,120,30)", col(outline));
    } else if (ninja) {
      poly([[-12, -12], [-26, -19], [-22, -11], [-12, -9]], "rgb(208,46,62)", col(outline));
    }
    if (phoenix) poly([[-12, -2], [-40, -13], [-25, -1], [-42, 7], [-24, 7], [-11, 6]], "rgb(255,130,40)", col(outline));
    else if (dragon) poly([[-13, -2], [-32, -10], [-25, -1], [-36, 6], [-22, 6], [-12, 6]], col(darkCol), col(outline));
    else if (robot) poly([[-13, -3], [-29, -8], [-23, -1], [-29, 4], [-13, 6]], col(mix(body, [0, 0, 0], 0.15)), col(outline));
    else if (!ghost) poly([[-13, -2], [-30, -11], [-24, -2], [-32, 3], [-24, 6], [-13, 6]], col(darkCol), col(outline));
    if (style === Style.Classic || zombie) {
      poly(zombie ? [[-5, -12], [-10, -22], [-3, -15], [1, -20], [4, -12]] : [[-4, -13], [-2, -24], [1, -15], [5, -23], [8, -12]], col(darkCol), col(outline));
    }
    const bodyG = ctx.createRadialGradient(-5, -8, 2, 0, 0, 24);
    bodyG.addColorStop(0, col(mix(body, [255, 255, 255], ghost ? 0.75 : legend ? 0.55 : 0.42)));
    bodyG.addColorStop(1, col(mix(body, [0, 0, 0], 0.16)));
    ellipse(-20, -16, 40, 32, bodyG, col(outline));
    ellipse(-17, 3, 42, 22, col(lightCol, ghost ? 150 : 220));
    if (ninja) fillRound(-14, -18, 27, 7, 3, "rgb(208,46,62)", col(outline), 1.1);
    if (style === Style.Classic || phoenix || legend) ellipse(8, 1.5, 8, 5, "rgba(255,120,140,0.55)");
    ctx.save();
    ctx.translate(-2, 2); ctx.rotate(Math.sin(wing) * ((robot ? 24 : 34) * Math.PI / 180) - 10 * Math.PI / 180);
    if (robot) fillRound(-26, -8, 28, 16, 5, col(wingCol), col(outline), 1.2);
    else if (dragon) poly([[-4, -6], [-30, -14], [-26, -2], [-30, 8], [-8, 8]], col(wingTip), col(outline));
    else if (phoenix) poly([[-4, -7], [-28, -16], [-22, -2], [-30, 9], [-6, 8]], "rgb(255,120,30)", col(outline));
    else if (ghost) ellipse(-19, -7, 24, 15, col(lightCol, 150), col(outline, 160));
    else {
      poly([[-4, -6], [-22, -9], [-28, -1], [-22, 7], [-4, 7]], col(wingTip), col(outline));
      ellipse(-18, -6, 22, 13, col(wingCol), col(outline));
    }
    ctx.restore();
    if (robot) {
      fillRound(2, -14, 16, 14, 3, "rgb(18,28,38)", col(outline), 1.1);
      ellipse(8, -9, 6, 6, "rgb(130,242,255)");
    } else if (ghost) {
      ellipse(2, -11, 9, 11, "rgb(30,50,70)"); ellipse(12, -10, 7, 9, "rgb(30,50,70)");
    } else if (alien) {
      ellipse(5, -13, 8, 10, "rgb(18,16,38)"); ellipse(13, -8, 5, 6, "rgb(18,16,38)");
    } else if (ninja) {
      ellipse(4, -10, 12, 7, "rgb(250,250,242)", col(outline));
      ellipse(9, -8.5, 5, 4.5, "#000");
    } else {
      ellipse(3.5, -13, 13.5, 13.5, "#fff", col(outline));
      ctx.fillStyle = zombie ? "rgb(160,30,30)" : phoenix ? "rgb(255,140,30)" : "#000";
      ellipse(9.2, -8.8, 6.2, 6.2);
      if (!zombie && !phoenix) { ctx.fillStyle = "#000"; ellipse(9.2, -8.8, 6.2, 6.2); }
      ctx.fillStyle = "#fff"; ellipse(12.2, -8.4, 2.3, 2.3);
    }
    poly([[15, -4], [31, 1.5], [15, 3.2]], col(beakA), col(outline));
    poly([[15, 3.2], [26, 3.6], [16, 8.5]], col(mix(beakA, [0, 0, 0], 0.3)), col(outline));
    ctx.restore();
  }

  function drawRows(rows) {
    for (let i = 0; i < rows.length; i++) {
      const r = itemRect(i), sel = i === selected;
      fillRound(r.x, r.y + 4, r.w, r.h, 12, "rgba(0,0,0,0.35)");
      if (sel) {
        const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
        g.addColorStop(0, "rgb(255,248,220)"); g.addColorStop(1, "rgb(255,214,110)");
        fillRound(r.x, r.y, r.w, r.h, 12, g, "rgb(255,196,48)", 2.6);
      } else fillRound(r.x, r.y, r.w, r.h, 12, "rgba(12,18,36,0.59)", "rgba(255,255,255,0.27)", 1.4);
      ctx.font = '700 18.67px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = sel ? "#000" : "#fff";
      ctx.fillText(rows[i].text(), r.x + r.w / 2, r.y + r.h / 2);
    }
  }

  function drawSkinStrip() {
    for (let i = 0; i < Birds.length; i++) {
      const r = cellRect(i), owns = isOwned(i);
      const cell = { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: r.h - 4 };
      if (i === viewSkin) fillRound(cell.x, cell.y, cell.w, cell.h, 8, "rgba(255,248,220,0.63)", "#fff", 2);
      if (i === birdSkin) { ctx.strokeStyle = "rgb(255,205,40)"; ctx.lineWidth = 2.5; roundRect(cell.x, cell.y, cell.w, cell.h, 8); ctx.stroke(); }
      const shown = owns ? Birds[i] : { ...Birds[i], color: mix(Birds[i].color, [0, 0, 0], Birds[i].feat !== Feat.None ? 0.35 : 0.6) };
      drawBird(r.x + 20, r.y + 24, 0.56, 0, 0, shown);
      if (Birds[i].feat !== Feat.None)
        fillStar(r.x + r.w - 8, r.y + 8, 4.6, 2.1, owns ? "rgb(255,230,110)" : "rgba(255,220,120,0.47)", "rgb(70,45,10)");
      if (!owns) padlock(r.x + r.w - 10, r.y + r.h - 12, 0.5);
    }
  }

  function drawMedal(cx, cy, r, sc) {
    const medal = medalFor(sc);
    const c = medal ? medal.color : [96, 100, 116];
    glow(cx, cy, r * 1.55, c, medal ? 95 : 35);
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 2, cx, cy, r);
    g.addColorStop(0, col(mix(c, [255, 255, 255], medal ? 0.62 : 0.22)));
    g.addColorStop(1, col(mix(c, [0, 0, 0], medal ? 0.18 : 0.35)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col(mix(c, [0, 0, 0], 0.5)); ctx.lineWidth = 2.4; ctx.stroke();
    fillStar(cx, cy, r * 0.6, r * 0.26, col(mix(c, [0, 0, 0], 0.3)), col(mix(c, [255, 255, 255], 0.45)));
  }

  function drawDailyHistory(baseline) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = [];
    let maxScore = 1;
    for (let i = 0; i < 7; i++) {
      const day = new Date(today); day.setDate(today.getDate() + i - 6);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      const rec = dailyHistory.find((r) => r.Date === key);
      days.push({ day, score: rec?.Score || 0, has: !!rec, today: i === 6 });
      if (rec) maxScore = Math.max(maxScore, rec.Score);
    }
    const barW = 24, gapW = 8, maxH = 34;
    const x0 = W / 2 - (7 * barW + 6 * gapW) / 2;
    ctx.strokeStyle = "rgba(200,220,240,0.43)"; ctx.beginPath(); ctx.moveTo(x0 - 6, baseline); ctx.lineTo(x0 + 7 * barW + 6 * gapW + 6, baseline); ctx.stroke();
    days.forEach((d, i) => {
      const x = x0 + i * (barW + gapW);
      if (d.has) {
        const h = Math.max(3, maxH * d.score / maxScore);
        ctx.fillStyle = d.today ? "rgb(255,214,80)" : "rgba(150,210,235,0.59)";
        ctx.fillRect(x, baseline - h, barW, h);
        outlined(String(d.score), 9.5, x + barW / 2, baseline - h - 13, d.today ? "rgb(255,236,150)" : "#fff", 255, 2.4, "400");
      } else {
        ctx.fillStyle = "rgba(30,42,60,0.27)"; ctx.fillRect(x, baseline - 3, barW, 3);
      }
      const label = `${String(d.day.getDate()).padStart(2, "0")}/${String(d.day.getMonth() + 1).padStart(2, "0")}`;
      outlined(label, 9.5, x + barW / 2, baseline + 5, d.today ? "rgb(255,232,160)" : "rgb(220,232,245)", 255, 2.4, "400");
    });
  }

  function drawAchievements() {
    let row = 0;
    for (let i = 0; i < Birds.length; i++) {
      const skin = Birds[i];
      if (skin.feat === Feat.None) continue;
      const y = 108 + row * 42, done = isOwned(i);
      const p = Math.min(featValue(skin), skin.goal);
      const progress = skin.goal > 0 ? clamp(p / skin.goal, 0, 1) : 0;
      fillRound(24, y, W - 48, 40, 10, "rgba(8,12,28,0.96)", done ? "rgb(255,206,70)" : "rgba(200,215,235,0.31)", done ? 1.8 : 1);
      const shown = done ? skin : { ...skin, color: mix(skin.color, [0, 0, 0], 0.35) };
      drawBird(49, y + 20, 0.5, 0, 0, shown);
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.font = '700 16px "Segoe UI", system-ui'; ctx.fillStyle = "#fff"; ctx.fillText(skin.name, 75, y + 3);
      ctx.font = '400 12px "Segoe UI", system-ui'; ctx.fillStyle = "#ccc"; ctx.fillText(featName(skin.feat), 75, y + 20);
      ctx.fillStyle = "rgba(8,12,28,0.59)"; ctx.fillRect(300, y + 23, 70, 3);
      ctx.fillStyle = "rgb(255,208,72)"; ctx.fillRect(300, y + 23, 70 * progress, 3);
      outlined(done ? "OK" : `${p}/${skin.goal}`, 13, 344, y + 2, done ? "rgb(255,236,150)" : "#fff", 255, 2.5, "400");
      row++;
    }
  }

  function drawMenuScreen() {
    const t = time, hintY = H - GroundH - 30;
    if (state === State.Menu) {
      outlined("FLAPPY", 58.67, W / 2, 86, "rgb(255,248,220)", 255, 8);
      outlined("C", 32, W / 2, 142, "rgb(255,210,70)", 255, 4.5);
      drawBird(W / 2, 226 + Math.sin(t * 3) * 4, 1.5, Math.sin(t * 1.4) * 4, wingPhase, Birds[birdSkin]);
      drawRows(mainRows);
      outlined(`Recorde (${Levels[level].name}): ${bests[level]}`, 18.67, W / 2, hintY - 48, "#fff", 255, 3.5, "400");
      outlined(mission10 ? "Missão: 10 canos concluída" : "Missão: passe 10 canos (+30)", 18.67, W / 2, hintY - 24, "rgb(255,230,160)", 255, 3.5, "400");
      outlined("Toque para jogar  •  pode instalar o app", 13.33, W / 2, hintY, "#fff", 255, 3, "400");
    } else if (state === State.Daily) {
      const now = new Date();
      outlined("DESAFIO DIÁRIO", 32, W / 2, 48, "rgb(255,226,140)", 255, 5);
      outlined(`${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}  •  Normal`, 13.33, W / 2, 88, "#fff", 255, 3, "400");
      fillRound(36, 108, W - 72, 220, 18, "rgba(8,12,28,0.96)", "rgb(255,206,70)", 2);
      outlined(`TENTATIVAS  ${dailyLeft()}/${DailyTries}`, 13.33, W / 2, 124, "rgb(255,232,160)", 255, 3, "400");
      for (let i = 0; i < DailyTries; i++) {
        const available = i < dailyLeft();
        const px = W / 2 - 31 + i * 31;
        ctx.fillStyle = available ? "rgb(255,214,80)" : "rgba(60,70,95,0.35)";
        ctx.beginPath(); ctx.arc(px, 150, 7, 0, Math.PI * 2); ctx.fill();
      }
      outlined(`Recorde de hoje: ${dailyBest}`, 18.67, W / 2, 168, "#fff", 255, 3.5, "400");
      const lastH = dailyHistory.filter((r) => r.Date !== dailyDate && r.Date).sort((a, b) => b.Date.localeCompare(a.Date))[0];
      outlined(lastH ? `Último: ${lastH.Score}  •  ${shortDate(lastH.Date)}` : "Primeiro desafio hoje", 13.33, W / 2, 194, "rgb(225,232,245)", 255, 3, "400");
      outlined("ÚLTIMOS 7 DIAS", 13.33, W / 2, 220, "rgb(210,220,235)", 255, 3, "400");
      drawDailyHistory(290);
      drawRows(dailyRows);
      outlined("Canos iguais nas 3 tentativas  •  Esc voltar", 13.33, W / 2, hintY, "#fff", 255, 3, "400");
    } else if (state === State.Customize) {
      outlined("PERSONALIZAR", 32, W / 2, 48, "#fff", 255, 5);
      outlined(`Coleção ${owned.size}/${Birds.length}  •  Especiais ${specialOwned()}/${SpecialCount}`, 13.33, W / 2, 86, "rgb(255,232,160)", 255, 3, "400");
      const view = Birds[viewSkin], own = isOwned(viewSkin), special = view.feat !== Feat.None;
      const shown = own ? view : { ...view, color: mix(view.color, [0, 0, 0], special ? 0.35 : 0.6) };
      const by = 150 + Math.sin(t * 3) * 5;
      drawBird(W / 2, by, 1.45, 0, wingPhase, shown);
      if (!own) padlock(W / 2, by + 8, 0.95);
      let status, statusColor = "#fff";
      if (own) { status = special ? "Especial equipado" : "Equipado"; if (special) statusColor = "rgb(255,232,150)"; }
      else if (special) { status = `${featName(view.feat)}: ${Math.min(featValue(view), view.goal)}/${view.goal}`; statusColor = "rgb(255,226,140)"; }
      else status = coins >= view.price ? `Toque: comprar por ${view.price}` : `Bloqueado - faltam ${view.price - coins} moedas`;
      outlined(status, 18.67, W / 2, 188, statusColor, 255, 3.5, "400");
      if (special && !own) {
        const progress = clamp(featValue(view) / view.goal, 0, 1);
        fillRound(W / 2 - 110, 214, 220, 6, 2.8, "rgba(12,18,36,0.59)", "rgb(255,210,70)", 1.2);
        if (progress > 0) { ctx.fillStyle = "rgb(255,208,72)"; roundRect(W / 2 - 110, 214, 220 * progress, 6, 2.8); ctx.fill(); }
      }
      drawRows(customRows);
      drawSkinStrip();
      outlined("Toque nas skins  •  Esc voltar", 13.33, W / 2, hintY, "#fff", 255, 3, "400");
    } else if (state === State.Options) {
      outlined("OPÇÕES", 32, W / 2, 52, "#fff", 255, 5);
      outlined(`Moedas por cano: x${Levels[level].coinMult.toFixed(1)}`, 18.67, W / 2, 168, "#fff", 255, 3.5, "400");
      drawRows(optionRows);
      outlined("Toque para alterar  •  Esc voltar", 13.33, W / 2, hintY, "#fff", 255, 3, "400");
    } else if (state === State.Achievements) {
      outlined("CONQUISTAS", 32, W / 2, 48, "rgb(255,226,140)", 255, 5);
      outlined(`Especiais ${specialOwned()}/${SpecialCount}  •  Canos ${totalPipes}  •  Partidas ${totalRuns}`, 13.33, W / 2, 88, "rgb(255,232,160)", 255, 3, "400");
      drawAchievements();
      drawRows(achievementRows);
      outlined("Feitos do diário também contam  •  Esc voltar", 13.33, W / 2, hintY, "#fff", 255, 3, "400");
    }
  }

  function drawWorld() {
    for (const p of pipes) drawPipe(p);
    drawGround();
    for (const p of particles) {
      const k = clamp(p.life / p.max, 0, 1);
      const sz = p.size * (0.45 + 0.7 * k);
      ctx.fillStyle = col(p.color, 255 * k);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, sz / 2, sz * 0.39, 0, 0, Math.PI * 2); ctx.fill();
    }
    const bob = state === State.Ready ? Math.sin(time * 3) * 6 : 0;
    const angle = state === State.Dead ? 80 : state === State.Ready ? 0 : clamp(birdVy / 10, -25, 70);
    drawBird(BirdX, birdY + bob, 1.04, angle, wingPhase, Birds[birdSkin]);
    for (const f of floats) outlined(f.text, 18.67, f.x, f.y, "rgb(255,222,70)", 255 * clamp(f.life / 0.35, 0, 1), 3);
    const scoreText = String(score);
    ctx.font = '700 48px "Segoe UI", system-ui';
    const badgeW = Math.max(76, 22 + ctx.measureText(scoreText).width);
    fillRound(W / 2 - badgeW / 2, 18, badgeW, 52, 14, "rgba(8,12,28,0.59)", "rgb(255,210,70)", 1.8);
    outlined(scoreText, 48, W / 2, 22, "#fff", 255, 5);
    if (!mission10 && (state === State.Playing || state === State.Paused))
      outlined(`Missão ${Math.min(score, MissionScore)}/${MissionScore}`, 13.33, W / 2, 74, "rgb(255,230,180)", 255, 3, "400");
  }

  function paint() {
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cssW, cssH);
    const s = Math.min(cssW / W, cssH / H);
    const ox = (cssW - W * s) / 2, oy = (cssH - H * s) / 2;
    ctx.save();
    ctx.translate(ox, oy); ctx.scale(s, s);
    if (shake > 0) {
      const amp = (shake / ShakeTime) * 7;
      ctx.translate((Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp);
    }
    const sky = Backgrounds[bgSkin];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, col(sky.top)); g.addColorStop(1, col(sky.bottom));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawCelestial(sky, time);
    for (let i = 0; i < cloudX.length; i++) drawCloud(cloudX[i], cloudY[i], cloudS[i], sky.dark);
    drawHills(col(mix(sky.hillFar, sky.hillNear, 0.45)), hillFar * 1.6, H - GroundH - 118, 34, 320, false);
    drawHills(col(sky.hillFar), hillFar, H - GroundH - 78, 42, 250, true);
    drawHills(col(sky.hillNear), hillNear, H - GroundH - 26, 24, 160, false);

    const playing = [State.Playing, State.Dead, State.Paused, State.Ready].includes(state);
    if (playing) {
      drawWorld();
      if (state === State.Ready) {
        outlined(dailyRun ? "DESAFIO DIÁRIO" : "PREPARE-SE", 32, W / 2, 150, dailyRun ? "rgb(255,226,140)" : "#fff", 255, 5);
        outlined(dailyRun ? `Tentativa ${Math.min(DailyTries, dailyAttempts + 1)}/${DailyTries} • Normal` : "Toque ou Espaço para começar", 18.67, W / 2, 196, "rgb(255,238,190)", 255, 3.5, "400");
      } else if (state === State.Dead) {
        ctx.fillStyle = "rgba(8,10,22,0.59)"; ctx.fillRect(0, 0, W, H);
        const cardH = 226 + deadRows.length * ItemStep;
        fillRound(24, 76, W - 48, cardH, 18, "rgba(8,12,28,0.96)", "rgb(255,206,70)", 2.2);
        outlined(dailyRun ? "DESAFIO ENCERRADO" : "FIM DE JOGO", 32, W / 2, 90, "rgb(255,110,78)", 255, 5);
        drawMedal(W / 2, 188, 34, score);
        const medal = medalFor(score);
        outlined(medal?.name || "Faça 10 canos para o bronze", 13.33, W / 2, 228, medal ? col(medal.color) : "rgb(196,210,190)", 255, 3, "400");
        outlined(`+${lastEarned} ${lastEarned === 1 ? "moeda" : "moedas"}`, 18.67, W / 2, 252, "rgb(255,222,70)", 255, 3.5, "400");
        const rec = dailyRun
          ? (newRecord ? `NOVO RECORDE DO DIA: ${dailyBest}` : `Recorde do dia: ${dailyBest}`)
          : (newRecord ? `NOVO RECORDE: ${bests[level]}` : `Recorde: ${bests[level]}`);
        outlined(rec, 18.67, W / 2, 280, newRecord ? "rgb(255,236,120)" : "#fff", 255, 3.5, "400");
        if (deadTime > DeadLockout) drawRows(deadRows);
      } else if (state === State.Paused) {
        ctx.fillStyle = "rgba(8,10,22,0.59)"; ctx.fillRect(0, 0, W, H);
        fillRound(38, 178, W - 76, 230, 18, "rgba(8,12,28,0.96)", "rgb(255,206,70)", 2.2);
        outlined("PAUSA", 32, W / 2, 196, "#fff", 255, 5);
        drawRows(pauseRows);
      }
    } else {
      drawGround();
      drawMenuScreen();
      for (const p of particles) {
        const k = clamp(p.life / p.max, 0, 1);
        ctx.fillStyle = col(p.color, 255 * k);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2); ctx.fill();
      }
    }

    const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.85);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    const txt = (state === State.Playing || state === State.Paused) ? `+${runCoins | 0}` : String(coins);
    ctx.font = '700 18.67px "Segoe UI"';
    const pillW = Math.max(86, 48 + ctx.measureText(txt).width);
    fillRound(8, 10, pillW, 34, 16, "rgba(8,12,28,0.59)", "rgb(255,210,70)", 1.4);
    drawCoin(26, 27, 11);
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText(txt, 43, 27);

    if (unlockTimer > 0 && unlockMessage) {
      const alpha = clamp(unlockTimer / 0.35, 0, 1);
      const text = "NOVA SKIN: " + unlockMessage.toUpperCase();
      ctx.font = '700 18.67px "Segoe UI"';
      const tw = ctx.measureText(text).width;
      const w = Math.min(W - 36, Math.max(230, tw + 64));
      ctx.globalAlpha = alpha;
      fillRound(W / 2 - w / 2, 506, w, 34, 17, "rgba(10,14,30,0.95)", "rgb(255,208,70)", 1.8);
      fillStar(W / 2 - w / 2 + 20, 523, 7, 3.2, "rgb(255,224,110)", "rgb(120,70,10)");
      ctx.globalAlpha = 1;
      outlined(text, 16, W / 2 + 8, 513, "rgb(255,240,170)", 255 * alpha, 3);
    }
    if (fade > 0) {
      ctx.fillStyle = `rgba(6,8,18,${clamp(fade, 0, 1)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const fit = Math.min(vw / W, vh / H);
    const scale = display === 0 ? Math.min(1, fit) : fit;
    cssW = Math.max(1, W * scale);
    cssH = Math.max(1, H * scale);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
  }

  function gamePoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const s = Math.min(rect.width / W, rect.height / H);
    const ox = (rect.width - W * s) / 2, oy = (rect.height - H * s) / 2;
    return { x: (clientX - rect.left - ox) / s, y: (clientY - rect.top - oy) / s };
  }

  function onPointer(x, y, right = false) {
    Sfx.resume();
    const p = { x, y };
    if (state === State.Customize) {
      for (let i = 0; i < Birds.length; i++) if (hit(p, cellRect(i))) {
        viewSkin = i;
        if (isOwned(i)) { birdSkin = i; save(); }
        return;
      }
    }
    const rows = currentRows();
    if (rows) {
      for (let i = 0; i < rows.length; i++) if (hit(p, itemRect(i))) {
        selected = i;
        if (right && rows[i].cycles && rows[i].activate) rows[i].activate(-1);
        else if (rows[i].choose) rows[i].choose();
        else if (rows[i].activate) rows[i].activate(1);
        return;
      }
      return;
    }
    if (state === State.Playing) flap();
    else if (state === State.Ready) beginPlay();
  }

  window.addEventListener("keydown", (e) => {
    Sfx.resume();
    if (e.key === "F11") { e.preventDefault(); cycleDisplay(1); return; }
    if (e.key === "m" || e.key === "M") { toggleMute(); return; }
    if (e.key === "r" || e.key === "R") {
      if ([State.Playing, State.Paused, State.Dead].includes(state)) {
        if (dailyRun) startDaily(); else startGame();
      }
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if (spaceDown) return;
      spaceDown = true;
    }
    const rows = currentRows();
    if (rows) {
      if (e.key === "ArrowUp" || e.key === "w") selected = (selected + rows.length - 1) % rows.length;
      else if (e.key === "ArrowDown" || e.key === "s") selected = (selected + 1) % rows.length;
      else if (e.key === "ArrowLeft" || e.key === "a") { if (rows[selected].cycles) rows[selected].activate(-1); }
      else if (e.key === "ArrowRight" || e.key === "d") { if (rows[selected].cycles) rows[selected].activate(1); }
      else if (e.key === "Enter" || e.code === "Space") { if (rows[selected].choose) rows[selected].choose(); else rows[selected].activate?.(1); }
      else if (e.key === "Escape") {
        if (state === State.Paused || state === State.Dead) goToMenu();
        else if (state === State.Achievements) go(State.Options);
        else if (state !== State.Menu) go(State.Menu);
      }
      return;
    }
    if (state === State.Ready && (e.code === "Space" || e.key === "Enter")) beginPlay();
    else if (state === State.Ready && e.key === "Escape") goToMenu();
    else if (state === State.Playing && e.code === "Space") flap();
    else if (state === State.Playing && e.key === "Escape") { state = State.Paused; selected = 0; Sfx.Pause(); }
    else if (state === State.Dead && e.key === "Escape") goToMenu();
  });
  window.addEventListener("keyup", (e) => { if (e.code === "Space") spaceDown = false; });
  canvas.addEventListener("pointerdown", (e) => {
    const p = gamePoint(e.clientX, e.clientY);
    onPointer(p.x, p.y, e.button === 2);
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("pointermove", (e) => {
    const p = gamePoint(e.clientX, e.clientY);
    const rows = currentRows();
    if (rows) for (let i = 0; i < rows.length; i++) if (hit(p, itemRect(i))) selected = i;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === State.Playing) { state = State.Paused; selected = 0; Sfx.Pause(); }
  });
  window.addEventListener("beforeunload", () => {
    if ([State.Playing, State.Paused, State.Ready, State.Dead].includes(state)) bankRun();
    save();
  });
  window.addEventListener("resize", layout);
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && display === 2) display = 1;
    layout();
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.add("show");
  });
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.remove("show");
  });
  window.addEventListener("appinstalled", () => installBtn.classList.remove("show"));

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }

  load();
  ensureDaily();
  viewSkin = birdSkin;
  reset();
  layout();
  applyDisplay();

  function frame(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min(now - last, 0.033);
    last = now;
    time = now;
    update(dt);
    paint();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
