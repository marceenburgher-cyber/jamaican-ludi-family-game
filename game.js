// ============================================================
// Jamaican Ludi — hotseat / solo-vs-AI prototype
// Board model: 15x15 cross, 56-cell shared ring, 6-cell private
// home stretch per color, exact roll required to reach Home.
// ============================================================

const COLORS = ["Red", "Green", "Yellow", "Blue"];
const COLOR_CODE = { Red: "R", Green: "G", Yellow: "Y", Blue: "B" };
const CAP_FLAVOR = { Red: "kola", Green: "citrus", Yellow: "cream soda", Blue: "ginger beer" };

const THEMES = {
  family: {
    title: "Jamaican Ludi",
    names: { Red: "Auntie Crew", Green: "Grandparents", Yellow: "Cousin Link-Up", Blue: "Pickney Crew" },
  },
  dishes: {
    title: "Extreme Jamaican Ludi",
    names: { Red: "Auntie Crew", Green: "Grandparents", Yellow: "Cousin Link-Up", Blue: "Pickney Crew" },
  },
};

const EXPERIENCES = [
  { key: "coolout", name: "Coolout: Coconut Water & Sugarcane", cost: 0, image: "worlds/coolout-coconut-sugarcane.png", description: "Fresh coconut water, sugarcane and family laughter in the Jamaican sunshine." },
  { key: "boston", name: "Boston Jerk Pit Stop", cost: 200, image: "worlds/boston-jerk-pit-stop.png", description: "Pimento smoke, jerk chicken, festival and a proper Portland food stop." },
  { key: "bath", name: "Bath Fountain Soothing", cost: 400, image: "worlds/bath-fountain-soothing.png", description: "Slow down beside the warm mineral waters and the green hills of St. Thomas." },
  { key: "hellshire", name: "Hellshire Beach Getaway", cost: 650, image: "worlds/hellshire-beach-getaway.png", description: "Beach breeze, fishing boats and fresh food shared beside the Caribbean Sea." },
  { key: "blue-mountain", name: "Blue Mountain Adventure", cost: 900, image: "worlds/blue-mountain-adventure.png", description: "A cool sunrise, mountain mist and a family climb above the coffee plants." },
  { key: "portland", name: "Portland Lagoon Rafting", cost: 1200, image: "worlds/portland-lagoon-rafting.png", description: "Glide across clear turquoise water on handmade bamboo rafts." },
  { key: "negril", name: "Negril Sunset & Cliff Diving", cost: 1550, image: "worlds/negril-sunset-cliff-diving.png", description: "Golden sunset, calm sea and a daring leap from the Negril cliffs." },
  { key: "dunns-river", name: "Climb Dunn’s River Falls", cost: 1900, image: "worlds/dunns-river-falls.png", description: "Join hands and climb the sparkling waterfall together." },
  { key: "luminous", name: "Trelawny Luminous Lagoon", cost: 2300, image: "worlds/trelawny-luminous-lagoon.png", description: "Watch the lagoon glow blue beneath a star-filled Jamaican sky." },
  { key: "rose-hall", name: "Rose Hall Great House", cost: 2750, image: "worlds/rose-hall-great-house.png", description: "An elegant evening heritage visit beneath warm lantern light." },
  { key: "kingston", name: "Kingston Dancehall Night", cost: 3300, image: "worlds/kingston-dancehall-night.png", description: "Dress up, step out and enjoy a grown-up Kingston dancehall celebration." },
];

// Unadvertised owner review mode. It unlocks scene viewing only and never
// changes the points or selected experience saved by the public game.
const scenePreviewMode = new URLSearchParams(window.location.search).get("preview") === "scenes";
let experiencePoints = Math.max(0, Number.parseInt(localStorage.getItem("jl_experiencePoints") || "0", 10) || 0);
let selectedExperienceKey = localStorage.getItem("jl_selectedExperience") || "coolout";
let pointsToastTimer = null;

function selectedExperience() {
  const requested = EXPERIENCES.find((experience) => experience.key === selectedExperienceKey);
  if (requested && (scenePreviewMode || experiencePoints >= requested.cost)) return requested;
  selectedExperienceKey = "coolout";
  return EXPERIENCES[0];
}

function showPointsToast(message) {
  const toast = document.getElementById("pointsToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(pointsToastTimer);
  pointsToastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function awardExperiencePoints(color, amount, reason) {
  if (scenePreviewMode || state.themeKey !== "dishes") return;
  if (state.controllers[color] !== "human" || amount <= 0) return;
  const previousPoints = experiencePoints;
  experiencePoints += amount;
  localStorage.setItem("jl_experiencePoints", String(experiencePoints));
  const newlyUnlocked = EXPERIENCES.filter((experience) => experience.cost > previousPoints && experience.cost <= experiencePoints);
  showPointsToast(newlyUnlocked.length
    ? `+${amount} points · ${newlyUnlocked.at(-1).name} unlocked!`
    : `+${amount} points · ${reason}`);
  renderExperiences();
}

function renderExperiences() {
  const grid = document.getElementById("experienceGrid");
  if (!grid) return;
  const experiencesButton = document.getElementById("experiencesBtn");
  const experiencesSection = document.getElementById("experiences");
  const extremeMode = state.themeKey === "dishes";
  experiencesButton.hidden = !extremeMode;
  experiencesSection.hidden = !extremeMode;
  document.body.classList.toggle("world-active", extremeMode);
  if (!extremeMode) {
    document.body.style.removeProperty("--world-image");
    return;
  }
  const active = selectedExperience();
  document.body.style.setProperty("--world-image", `url("${active.image}")`);

  const passportLabel = document.querySelector(".points-passport span");
  passportLabel.textContent = scenePreviewMode ? "OWNER PREVIEW" : "Family Points";
  document.getElementById("experiencePoints").textContent = scenePreviewMode ? "ALL SCENES" : experiencePoints.toLocaleString();
  document.getElementById("headerPoints").textContent = scenePreviewMode ? "PREVIEW" : `${experiencePoints.toLocaleString()} PTS`;
  document.getElementById("experienceHeroImage").src = active.image;
  document.getElementById("experienceHeroImage").alt = active.name;
  document.getElementById("experienceHeroTitle").textContent = active.name;
  document.getElementById("experienceHeroDescription").textContent = active.description;

  const next = EXPERIENCES.find((experience) => experience.cost > experiencePoints);
  document.getElementById("nextExperienceText").textContent = scenePreviewMode
    ? "Scene review only - game points remain unchanged"
    : next
      ? `${next.cost - experiencePoints} points to ${next.name}`
      : "Every Jamaican experience unlocked";

  grid.replaceChildren();
  EXPERIENCES.forEach((experience) => {
    const unlocked = scenePreviewMode || experiencePoints >= experience.cost;
    const selected = experience.key === active.key;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `experience-card${unlocked ? " unlocked" : " locked"}${selected ? " selected" : ""}`;
    card.setAttribute("aria-label", unlocked
      ? `${experience.name}, ${selected ? "currently selected" : "unlocked"}`
      : `${experience.name}, locked until ${experience.cost} points`);
    card.innerHTML = `
      <img src="${experience.image}" alt="" loading="lazy">
      <span class="experience-card-shade" aria-hidden="true"></span>
      <span class="experience-card-copy">
        <strong>${experience.name}</strong>
        <small>${selected ? (scenePreviewMode ? "PREVIEWING" : "NOW VISITING") : unlocked ? (scenePreviewMode ? "TAP TO PREVIEW" : "UNLOCKED · TAP TO VISIT") : `🔒 ${experience.cost.toLocaleString()} POINTS`}</small>
      </span>`;
    card.addEventListener("click", () => {
      if (!unlocked) {
        showPointsToast(`${experience.cost - experiencePoints} more points to unlock ${experience.name}`);
        return;
      }
      selectedExperienceKey = experience.key;
      if (!scenePreviewMode) localStorage.setItem("jl_selectedExperience", selectedExperienceKey);
      renderExperiences();
      document.getElementById("experienceFeature").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    grid.appendChild(card);
  });
}

// Board TERRITORY names (the yard you're born in + the home stretch you run
// for) — these label fixed regions on the board itself, not the players.
function regionName(color) {
  return THEMES[state.themeKey].names[color];
}

// PLAYER identity — who's actually sitting at the table (or the AI standing
// in for them). Freely renamed by whoever signs up; defaults to Player N.
function playerName(color) {
  return state.playerNames[color] || `Player ${COLORS.indexOf(color) + 1}`;
}

// Keep "Blue" as the internal key so the verified board math stays untouched,
// while presenting the fourth seat as Black in the Jamaican palette.
function displayColorName(color) {
  return color === "Blue" ? "Black" : color;
}

function loadPlayerNames() {
  const defaults = { Red: "Player 1", Green: "Player 2", Yellow: "Player 3", Blue: "Player 4" };
  try {
    const saved = JSON.parse(localStorage.getItem("jl_playerNames") || "{}");
    return { ...defaults, ...saved };
  } catch {
    return defaults;
  }
}

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const HOP_MS = 150;
const BIRTH_MS = 260;
const KILL_FLASH_MS = 300;

// ---- Verified ring path (56 cells), clockwise, [row, col] ----
const RING = (() => {
  const ring = [];
  const add = (r, c) => ring.push([r, c]);
  for (let c = 0; c <= 5; c++) add(6, c);
  add(6, 6);
  for (let r = 5; r >= 0; r--) add(r, 6);
  add(0, 7);
  for (let r = 0; r <= 5; r++) add(r, 8);
  add(6, 8);
  for (let c = 9; c <= 14; c++) add(6, c);
  add(7, 14);
  for (let c = 14; c >= 9; c--) add(8, c);
  add(8, 8);
  for (let r = 9; r <= 14; r++) add(r, 8);
  add(14, 7);
  for (let r = 14; r >= 9; r--) add(r, 6);
  add(8, 6);
  for (let c = 5; c >= 0; c--) add(8, c);
  add(7, 0);
  return ring;
})();

const OFFSET = { Red: 1, Green: 15, Yellow: 29, Blue: 43 };

const HOME_STRETCH = {
  Red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  Green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  Yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  Blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

const YARD_SLOTS = {
  // Waiting lines point toward each crew's matching Born Space.
  // These are presentation coordinates only; movement still begins at OFFSET.
  Red: [[1, 1], [2, 1], [3, 1], [4, 1]],
  Green: [[1, 13], [1, 12], [1, 11], [1, 10]],
  Yellow: [[13, 13], [12, 13], [11, 13], [10, 13]],
  Blue: [[13, 1], [13, 2], [13, 3], [13, 4]],
};

// Visual board proportions only. The enlarged middle row and column create
// an authentic broad home road and a large center court without hiding any
// logical cells or changing the verified movement arrays above.
const BOARD_MIDDLE_WEIGHT = 4.8626;
const BOARD_VISUAL_UNITS = 14 + BOARD_MIDDLE_WEIGHT;
function boardBoundary(index) {
  const units = index <= 7
    ? index
    : 7 + BOARD_MIDDLE_WEIGHT + (index - 8);
  return (units / BOARD_VISUAL_UNITS) * 100;
}
function boardCellCenter(index) {
  return (boardBoundary(index) + boardBoundary(index + 1)) / 2;
}

const RING_TRAVEL = 52; // r = 0..52 walks 53 ring cells
const HOME_LEN = 6;     // r = 53..58 walks the private stretch
const FINISH_R = RING_TRAVEL + HOME_LEN + 1; // 59 = home

function globalCellForR(color, r) {
  if (r <= RING_TRAVEL) return RING[(OFFSET[color] + r) % 56];
  if (r <= RING_TRAVEL + HOME_LEN) return HOME_STRETCH[color][r - RING_TRAVEL - 1];
  return null;
}

const SAFE_RING_IDX = new Set(Object.values(OFFSET));

const EXTREME_ACTIONS = [
  { key: "back-born", label: "BACK TO BORN", mark: "BACK\nTO\nBORN", symbol: "↩", className: "extreme-back-born" },
  { key: "back-10", label: "BACK 10", mark: "BACK\n10", symbol: "−10", className: "extreme-back-10" },
  { key: "forward-10", label: "FORWARD 10", mark: "FORWARD\n10", symbol: "+10", className: "extreme-forward-10" },
  { key: "safe-home", label: "SAFE HOME", mark: "SAFE\nHOME", symbol: "⌂", className: "extreme-safe-home" },
];

function createExtremeSpaces() {
  const quadrants = [
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41],
    [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
  ];
  const positions = quadrants.map((indices) => indices[Math.floor(Math.random() * indices.length)]);
  const actions = [...EXTREME_ACTIONS].sort(() => Math.random() - 0.5);
  return actions.map((action, index) => ({ ...action, idx: positions[index] }));
}

// ============================================================
// Sound (procedural — no external audio assets)
// ============================================================

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, { type = "sine", gain = 0.16, delay = 0, glideTo = null } = {}) {
  if (!state.soundOn) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const sfx = {
  roll: () => { for (let i = 0; i < 4; i++) tone(180 + Math.random() * 260, 0.06, { type: "square", gain: 0.09, delay: i * 0.06 }); },
  settle: () => tone(520, 0.12, { type: "triangle", gain: 0.14 }),
  hop: () => tone(660, 0.07, { type: "triangle", gain: 0.1 }),
  birth: () => { tone(523, 0.12, { type: "sine", gain: 0.18 }); tone(784, 0.16, { type: "sine", gain: 0.16, delay: 0.09 }); },
  kill: () => { tone(300, 0.22, { type: "sawtooth", gain: 0.18, glideTo: 80 }); },
  home: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.16, { type: "sine", gain: 0.17, delay: i * 0.1 })); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, { type: "sine", gain: 0.2, delay: i * 0.14 })); },
  blocked: () => tone(140, 0.12, { type: "square", gain: 0.12 }),
};

// Original procedural reggae-inspired groove. It uses synthesized tones only:
// no recording, sample, melody, artist imitation, or copyrighted song.
let musicTimer = null;
let musicStep = 0;

function musicTone(freq, dur, { type = "triangle", gain = 0.025, delay = 0 } = {}) {
  if (!state.musicOn) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function playReggaeStep() {
  const bass = [98, 98, 110, 110, 130.81, 130.81, 110, 110];
  if (musicStep % 2 === 0) musicTone(bass[musicStep], .2, { type: "sine", gain: .04 });
  if (musicStep % 2 === 1) {
    [261.63, 329.63, 392].forEach((freq) => musicTone(freq, .075, { type: "triangle", gain: .012 }));
  }
  if (musicStep === 3 || musicStep === 7) musicTone(740, .025, { type: "square", gain: .009 });
  musicStep = (musicStep + 1) % 8;
}

function startMusic() {
  if (musicTimer || !state.musicOn) return;
  ensureAudio();
  playReggaeStep();
  musicTimer = window.setInterval(playReggaeStep, 240);
}

function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = null;
  musicStep = 0;
}

// ============================================================
// Game state
// ============================================================

function freshState() {
  const players = {};
  COLORS.forEach((color) => {
    players[color] = {
      color,
      pieces: [
        { status: "yard", r: -1 }, { status: "yard", r: -1 },
        { status: "yard", r: -1 }, { status: "yard", r: -1 },
      ],
      finished: 0,
      rank: null,
    };
  });
  return {
    players,
    order: [...COLORS],
    turnIdx: 0,
    dice: [null, null],
    diceUsed: [false, false],
    armedDie: null,
    doublesStreak: 0,
    rolled: false,
    finishOrder: [],
    gameOver: false,
    animating: false,
    aiRunning: false,
    awardedBlocks: [],
    extremeSpaces: createExtremeSpaces(),
    controllers: { Red: "human", Green: "ai", Yellow: "ai", Blue: "ai" },
    themeKey: "family",
    soundOn: localStorage.getItem("jl_sound") !== "off",
    musicOn: localStorage.getItem("jl_music") === "on",
    playerNames: loadPlayerNames(),
  };
}

let state = freshState();
if (scenePreviewMode) state.themeKey = "dishes";

function currentColor() {
  return state.order[state.turnIdx];
}

// ============================================================
// Move legality
// ============================================================

function ringOccupancy(idx) {
  const occ = {};
  COLORS.forEach((color) => {
    state.players[color].pieces.forEach((piece) => {
      if (piece.status === "active" && piece.r <= RING_TRAVEL) {
        if ((OFFSET[color] + piece.r) % 56 === idx) occ[color] = (occ[color] || 0) + 1;
      }
    });
  });
  return occ;
}

function isBlockedForOthers(idx, movingColor) {
  const occ = ringOccupancy(idx);
  return COLORS.some((color) => color !== movingColor && (occ[color] || 0) >= 2);
}

function canMove(color, pieceIdx, v) {
  const piece = state.players[color].pieces[pieceIdx];
  if (piece.status === "home") return false;
  if (piece.status === "yard") {
    if (v !== 6) return false;
    return !isBlockedForOthers(OFFSET[color], color);
  }
  const newR = piece.r + v;
  if (newR > FINISH_R) return false;
  if (newR === FINISH_R) return true;
  for (let r = piece.r + 1; r <= newR && r <= RING_TRAVEL; r++) {
    if (isBlockedForOthers((OFFSET[color] + r) % 56, color)) return false;
  }
  return true;
}

function legalDiceForColor(color) {
  const legal = { 0: [], 1: [] };
  [0, 1].forEach((slot) => {
    if (state.diceUsed[slot] || state.dice[slot] == null) return;
    const v = state.dice[slot];
    state.players[color].pieces.forEach((piece, pieceIdx) => {
      if (canMove(color, pieceIdx, v)) legal[slot].push(pieceIdx);
    });
  });
  return legal;
}

// ============================================================
// Applying a move (animated) — returns true if the turn should end
// ============================================================

async function completePieceHome(color, pieceIdx) {
  const player = state.players[color];
  const piece = player.pieces[pieceIdx];
  if (piece.status === "home") return;
  piece.status = "home";
  piece.r = FINISH_R;
  player.finished += 1;
  awardExperiencePoints(color, 50, "Piece reached home");
  sfx.home();
  chat(`${playerName(color)} reach ${player.finished === 4 ? "di last one" : "home"} safe! Big up! 🙌`);
  if (player.finished === 4 && player.rank === null) {
    player.rank = state.finishOrder.length + 1;
    state.finishOrder.push(color);
    awardExperiencePoints(color, 100, "All four pieces home");
    if (player.rank === 1) awardExperiencePoints(color, 200, "Game won");
  }
  positionPiecesOnly();
  burstConfetti(cellIndex["7,7"], 22);
  await wait(200);
}

async function animateApplyMove(color, pieceIdx, dieSlot) {
  state.animating = true;
  render();

  const v = state.dice[dieSlot];
  const player = state.players[color];
  const piece = player.pieces[pieceIdx];

  if (piece.status === "yard") {
    piece.status = "active";
    piece.r = 0;
    positionPiecesOnly();
    flashBirth(color, pieceIdx);
    sfx.birth();
    chat(`${playerName(color)} bring a piece a road! Six a di magic number! 🎲`);
    awardExperiencePoints(color, 10, "Piece born");
    await wait(BIRTH_MS);
    await resolveLandingAnimated(color, pieceIdx);
  } else {
    const fromR = piece.r;
    const toR = fromR + v;
    for (let r = fromR + 1; r <= toR; r++) {
      piece.r = r;
      positionPiecesOnly();
      sfx.hop();
      await wait(HOP_MS);
    }
    if (piece.r === FINISH_R) {
      await completePieceHome(color, pieceIdx);
    } else {
      await resolveLandingAnimated(color, pieceIdx);
    }
  }

  awardBlockPoints(color, pieceIdx);

  state.diceUsed[dieSlot] = true;
  state.animating = false;

  // A six brings a piece out, but it does not spend the other die. Arm the
  // next usable die automatically so a 6 + 2 can birth a piece and then move
  // it (or another eligible piece) two spaces without appearing to end early.
  const remainingLegal = legalDiceForColor(color);
  const nextUsableDie = [0, 1].find(
    (slot) => !state.diceUsed[slot] && remainingLegal[slot].length > 0,
  );
  state.armedDie = nextUsableDie ?? null;

  checkGameOver();
  render();
  if (state.gameOver) return false;

  const bothUsed = state.diceUsed[0] && state.diceUsed[1];
  const noMoreLegal = !bothUsed && nextUsableDie == null;
  return bothUsed || noMoreLegal;
}

function awardBlockPoints(color, pieceIdx) {
  if (state.controllers[color] !== "human") return;
  const piece = state.players[color].pieces[pieceIdx];
  if (piece.status !== "active" || piece.r > RING_TRAVEL) return;
  const idx = (OFFSET[color] + piece.r) % 56;
  const ownPieces = state.players[color].pieces.filter((otherPiece) =>
    otherPiece.status === "active"
    && otherPiece.r <= RING_TRAVEL
    && (OFFSET[color] + otherPiece.r) % 56 === idx
  ).length;
  const blockKey = `${color}:${idx}`;
  if (ownPieces === 2 && !state.awardedBlocks.includes(blockKey)) {
    state.awardedBlocks.push(blockKey);
    awardExperiencePoints(color, 20, "Block formed");
  }
}

function extremeActionForPiece(color, piece) {
  if (state.themeKey !== "dishes" || piece.status !== "active" || piece.r > RING_TRAVEL) return null;
  const idx = (OFFSET[color] + piece.r) % 56;
  return state.extremeSpaces.find((space) => space.idx === idx) || null;
}

async function applyExtremeActionAnimated(color, pieceIdx, action) {
  const piece = state.players[color].pieces[pieceIdx];
  showPointsToast(action.label);

  if (action.key === "back-born") {
    chat(`↩ ${playerName(color)} land pon BACK TO BORN — straight back a yard!`);
    sfx.kill();
    piece.status = "yard";
    piece.r = -1;
    positionPiecesOnly();
    await wait(KILL_FLASH_MS);
    return;
  }

  if (action.key === "safe-home") {
    chat(`⌂ ${playerName(color)} find SAFE HOME — straight into home!`);
    await completePieceHome(color, pieceIdx);
    return;
  }

  const direction = action.key === "back-10" ? -1 : 1;
  const target = direction < 0
    ? Math.max(0, piece.r - 10)
    : Math.min(FINISH_R, piece.r + 10);
  chat(`${direction < 0 ? "−" : "+"} ${playerName(color)} hit ${action.label}!`);
  for (let r = piece.r + direction; direction < 0 ? r >= target : r <= target; r += direction) {
    piece.r = r;
    positionPiecesOnly();
    sfx.hop();
    await wait(Math.max(45, Math.floor(HOP_MS * 0.55)));
  }
  if (piece.r === FINISH_R) await completePieceHome(color, pieceIdx);
}

async function resolveLandingAnimated(color, pieceIdx) {
  const piece = state.players[color].pieces[pieceIdx];
  if (piece.r > RING_TRAVEL) return;
  const extremeAction = extremeActionForPiece(color, piece);
  if (extremeAction) {
    await applyExtremeActionAnimated(color, pieceIdx, extremeAction);
    if (piece.status !== "active" || piece.r > RING_TRAVEL) return;
  }
  const idx = (OFFSET[color] + piece.r) % 56;
  if (SAFE_RING_IDX.has(idx)) return;

  const kills = [];
  COLORS.forEach((other) => {
    if (other === color) return;
    state.players[other].pieces.forEach((op, opIdx) => {
      if (op.status === "active" && op.r <= RING_TRAVEL && (OFFSET[other] + op.r) % 56 === idx) {
        kills.push({ color: other, pieceIdx: opIdx });
      }
    });
  });
  if (kills.length === 0) return;

  awardExperiencePoints(color, kills.length * 25, kills.length === 1 ? "Rival captured" : `${kills.length} rivals captured`);

  kills.forEach(({ color: c, pieceIdx: pi }) => flashKill(c, pi));
  sfx.kill();
  await wait(KILL_FLASH_MS);

  const byColor = {};
  kills.forEach(({ color: c, pieceIdx: pi }) => {
    state.players[c].pieces[pi] = { status: "yard", r: -1 };
    byColor[c] = (byColor[c] || 0) + 1;
  });
  positionPiecesOnly();
  Object.entries(byColor).forEach(([c, n]) => {
    chat(`💥 ${playerName(color)} kill ${n === 1 ? "a piece" : n + " piece"} belong to ${playerName(c)}! Bwoy get sent back a yard!`);
  });
  await wait(150);
}

function checkGameOver() {
  const stillPlaying = COLORS.filter((c) => state.players[c].finished < 4);
  if (stillPlaying.length <= 1) {
    state.gameOver = true;
    if (stillPlaying.length === 1) {
      const c = stillPlaying[0];
      state.players[c].rank = state.finishOrder.length + 1;
      state.finishOrder.push(c);
    }
    showFinalStandings();
  }
}

// ============================================================
// Dice roll (shared by human button + AI)
// ============================================================

async function performRoll() {
  const color = currentColor();
  state.animating = true;
  render();

  const d1El = document.getElementById("die1");
  const d2El = document.getElementById("die2");
  d1El.disabled = true;
  d2El.disabled = true;
  d1El.classList.add("rolling");
  d2El.classList.add("rolling");
  sfx.roll();
  for (let i = 0; i < 8; i++) {
    d1El.textContent = 1 + Math.floor(Math.random() * 6);
    d2El.textContent = 1 + Math.floor(Math.random() * 6);
    await wait(55);
  }
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  d1El.classList.remove("rolling");
  d2El.classList.remove("rolling");
  const runawayDie = Math.random() < 0.08 ? (Math.random() < 0.5 ? d1El : d2El) : null;
  if (runawayDie) {
    runawayDie.classList.add("off-table");
    sfx.blocked();
    chat("😂 Watch di dice! It nearly roll clean off di table!");
    await wait(760);
    runawayDie.classList.remove("off-table");
  }
  d1El.classList.add("settle");
  d2El.classList.add("settle");
  sfx.settle();
  setTimeout(() => { d1El.classList.remove("settle"); d2El.classList.remove("settle"); }, 260);

  state.dice = [d1, d2];
  state.diceUsed = [false, false];
  state.armedDie = null;
  state.rolled = true;
  state.animating = false;

  if (d1 === 6 && d2 === 6) chat(`🔥 ${playerName(color)} roll double six! Big tings a gwaan!`);
  else if (d1 === d2) chat(`${playerName(color)} roll a double ${d1}! One more turn deh so!`);
  else chat(`${playerName(color)} roll ${d1} and ${d2}.`);

  const legal = legalDiceForColor(color);
  const anyLegal = legal[0].length > 0 || legal[1].length > 0;
  render();
  return { legal, anyLegal };
}

async function handleNoLegalRoll(color) {
  chat(`${playerName(color)} cyaa move nuh piece dis time — turn done!`);
  await wait(650);
  finishTurnSequence(false);
}

async function rollDice() {
  if (state.gameOver || state.animating || state.controllers[currentColor()] !== "human") return;
  const color = currentColor();
  if (state.players[color].finished === 4) { advanceTurn(); return; }
  const { anyLegal } = await performRoll();
  if (!anyLegal) handleNoLegalRoll(color);
}

function armDie(slot) {
  if (state.animating || !state.rolled || state.diceUsed[slot] || state.dice[slot] == null) return;
  if (state.controllers[currentColor()] !== "human") return;
  const legal = legalDiceForColor(currentColor());
  if (legal[slot].length === 0) return;
  state.armedDie = state.armedDie === slot ? null : slot;
  render();
}

async function pieceClicked(color, pieceIdx) {
  if (state.animating) return;
  if (state.armedDie == null) return;
  if (color !== currentColor()) return;
  if (state.controllers[color] !== "human") return;
  const legal = legalDiceForColor(color);
  if (!legal[state.armedDie].includes(pieceIdx)) return;
  const wasDouble = state.dice[0] === state.dice[1];
  const shouldEnd = await animateApplyMove(color, pieceIdx, state.armedDie);
  if (!state.gameOver && shouldEnd) setTimeout(() => finishTurnSequence(wasDouble), 450);
}

function finishTurnSequence(wasDouble) {
  if (state.gameOver) return;
  const color = currentColor();
  const rolledSix = state.dice.includes(6);
  if (rolledSix) {
    state.doublesStreak = 0;
    state.rolled = false;
    state.dice = [null, null];
    state.diceUsed = [false, false];
    state.armedDie = null;
    chat(`${playerName(color)} roll a six — roll again!`);
    render();
    maybeStartAITurn();
    return;
  }
  if (wasDouble && state.doublesStreak < 2) {
    state.doublesStreak++;
    state.rolled = false;
    state.dice = [null, null];
    state.diceUsed = [false, false];
    chat(`${playerName(color)} get one more roll fi di double!`);
    render();
    maybeStartAITurn();
    return;
  }
  if (wasDouble) chat(`Three doubles straight — dat a greedy! Turn pass now.`);
  state.doublesStreak = 0;
  advanceTurn();
}

function advanceTurn() {
  state.rolled = false;
  state.dice = [null, null];
  state.diceUsed = [false, false];
  state.armedDie = null;
  do {
    state.turnIdx = (state.turnIdx + 1) % state.order.length;
  } while (state.players[currentColor()].finished === 4 && !state.gameOver);
  render();
  maybeStartAITurn();
}

// ============================================================
// AI opponent
// ============================================================

function scoreMove(color, pieceIdx, slot) {
  const v = state.dice[slot];
  const piece = state.players[color].pieces[pieceIdx];
  if (piece.status === "yard") return 55;
  const newR = piece.r + v;
  let score = newR * 0.3;
  if (newR === FINISH_R) return score + 100;
  if (newR <= RING_TRAVEL) {
    const idx = (OFFSET[color] + newR) % 56;
    if (!SAFE_RING_IDX.has(idx)) {
      const occ = ringOccupancy(idx);
      COLORS.forEach((other) => { if (other !== color && (occ[other] || 0) === 1) score += 80; });
    } else {
      score += 15;
    }
  }
  return score;
}

function bestAIMove(color) {
  const legal = legalDiceForColor(color);
  let best = null;
  let bestScore = -Infinity;
  [0, 1].forEach((slot) => {
    legal[slot].forEach((pieceIdx) => {
      const s = scoreMove(color, pieceIdx, slot);
      if (s > bestScore) { bestScore = s; best = { slot, pieceIdx }; }
    });
  });
  return best;
}

function maybeStartAITurn() {
  if (state.gameOver || state.aiRunning) return;
  if (state.controllers[currentColor()] !== "ai") return;
  aiTakeTurn();
}

async function aiTakeTurn() {
  state.aiRunning = true;
  try {
    while (!state.gameOver && state.controllers[currentColor()] === "ai") {
      const color = currentColor();
      if (state.players[color].finished === 4) { advanceTurn(); continue; }
      await wait(550);
      const { anyLegal } = await performRoll();
      if (state.gameOver) break;
      if (!anyLegal) {
        chat(`${playerName(color)} cyaa move nuh piece dis time — turn done!`);
        await wait(600);
        finishTurnSequence(false);
        continue;
      }

      const wasDouble = state.dice[0] === state.dice[1];
      while (!state.gameOver && (!state.diceUsed[0] || !state.diceUsed[1])) {
        const move = bestAIMove(color);
        if (!move) break; // remaining die(s) have no legal piece — fall through and end the turn below
        await wait(450);
        const shouldEnd = await animateApplyMove(color, move.pieceIdx, move.slot);
        if (state.gameOver || shouldEnd) break;
      }
      // Always resolve the turn exactly once here, whether it ended via a
      // completed/blocked move or via a die with no legal piece to use.
      if (!state.gameOver) {
        await wait(300);
        finishTurnSequence(wasDouble);
      }
    }
  } finally {
    state.aiRunning = false;
  }
}

// ============================================================
// Chatter
// ============================================================

const chatterLines = [];
function chat(msg) {
  chatterLines.unshift(msg);
  if (chatterLines.length > 40) chatterLines.pop();
  renderChatter();
}

function renderChatter() {
  const el = document.getElementById("chatterLog");
  el.replaceChildren();
  chatterLines.forEach((line, index) => {
    const item = document.createElement("div");
    item.className = `chatter-line${index === 0 ? " new" : ""}`;
    item.textContent = line;
    el.appendChild(item);
  });
}

// ============================================================
// Board DOM (static cells) + persistent piece layer
// ============================================================

const boardEl = document.getElementById("board");
const cellIndex = {};
const pieceEls = {};
const centerHomeZoneEls = {};
let pieceLayer;

function buildBoardDOM() {
  boardEl.innerHTML = "";
  Object.keys(cellIndex).forEach((k) => delete cellIndex[k]);

  const meta = Array.from({ length: 15 }, () => Array(15).fill(null));
  const yardBlocks = [
    { r0: 0, c0: 0, r1: 5, c1: 5, cls: "yard-r" },
    { r0: 0, c0: 9, r1: 5, c1: 14, cls: "yard-g" },
    { r0: 9, c0: 9, r1: 14, c1: 14, cls: "yard-y" },
    { r0: 9, c0: 0, r1: 14, c1: 5, cls: "yard-b" },
  ];
  yardBlocks.forEach(({ r0, c0, r1, c1, cls }) => {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) meta[r][c] = { type: "yard", cls };
  });
  const armBlocks = {
    Red: { r0: 6, c0: 0, r1: 8, c1: 5 },     // left arm
    Green: { r0: 0, c0: 6, r1: 5, c1: 8 },   // top arm
    Yellow: { r0: 6, c0: 9, r1: 8, c1: 14 }, // right arm
    Blue: { r0: 9, c0: 6, r1: 14, c1: 8 },   // bottom arm
  };

  RING.forEach(([r, c], idx) => { meta[r][c] = { type: "ring", idx, safe: SAFE_RING_IDX.has(idx) }; });
  Object.entries(HOME_STRETCH).forEach(([color, cells]) => {
    cells.forEach(([r, c], step) => { meta[r][c] = { type: "home", color, step }; });
  });
  meta[7][7] = { type: "center" };

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.style.gridRow = r + 1;
      cell.style.gridColumn = c + 1;
      const m = meta[r][c];
      if (m) {
        if (m.type === "yard") cell.classList.add("yard-block", m.cls);
        if (m.type === "ring") {
          cell.classList.add("ring");
          if (m.safe) cell.classList.add("safe");
          const bornColor = COLORS.find((color) => OFFSET[color] === m.idx);
          if (bornColor) {
            cell.classList.add("born-space", `born-${COLOR_CODE[bornColor].toLowerCase()}`);
            cell.dataset.born = COLOR_CODE[bornColor];
            cell.title = `${displayColorName(bornColor)} Born Space`;
            cell.setAttribute("aria-label", `${displayColorName(bornColor)} Born Space`);
          }
        }
        if (m.type === "home") {
          cell.classList.add(`home-${COLOR_CODE[m.color]}`.toLowerCase());
          if (m.step === 0 || m.step === HOME_STRETCH[m.color].length - 1) {
            const laughLine = document.createElement("span");
            laughLine.className = "home-laugh-line";
            laughLine.textContent = m.step === 0
              ? "Yuh Caan Kill Me Again!"
              : "Lawd, Mi No Reach Een Yet?!";
            cell.appendChild(laughLine);
          }
        }
        if (m.type === "center") cell.classList.add("center");
      }
      boardEl.appendChild(cell);
      cellIndex[`${r},${c}`] = cell;
    }
  }

  Object.entries(YARD_SLOTS).forEach(([color, slots]) => {
    slots.forEach(([r, c]) => {
      const el = document.createElement("div");
      el.className = "yard-slot";
      cellIndex[`${r},${c}`].appendChild(el);
    });
  });

  const addWash = (cls, box) => {
    const el = document.createElement("div");
    el.className = cls;
    el.style.gridColumn = `${box.c0 + 1} / ${box.c1 + 2}`;
    el.style.gridRow = `${box.r0 + 1} / ${box.r1 + 2}`;
    boardEl.appendChild(el);
  };
  yardBlocks.forEach(({ r0, c0, r1, c1, cls }) => {
    const code = cls.split("-")[1].toUpperCase();
    addWash(`yard-wash yw${code}`, { r0, c0, r1, c1 });
  });
  Object.entries(armBlocks).forEach(([color, box]) => {
    addWash(`arm-wash aw${COLOR_CODE[color]}`, box);
  });

  const medallion = document.createElement("div");
  medallion.className = "center-medallion";
  medallion.innerHTML = `
    <span class="center-home-zone center-zone-r" data-color="red"><b></b><i></i><i></i><i></i><i></i></span>
    <span class="center-home-zone center-zone-g" data-color="green"><b></b><i></i><i></i><i></i><i></i></span>
    <span class="center-home-zone center-zone-y" data-color="yellow"><b></b><i></i><i></i><i></i><i></i></span>
    <span class="center-home-zone center-zone-b" data-color="blue"><b></b><i></i><i></i><i></i><i></i></span>
  `;
  boardEl.appendChild(medallion);
  COLORS.forEach((color) => {
    centerHomeZoneEls[color] = medallion.querySelector(`.center-zone-${COLOR_CODE[color].toLowerCase()}`);
  });

  buildRegionLabels();

  pieceLayer = document.createElement("div");
  pieceLayer.className = "piece-layer";
  boardEl.appendChild(pieceLayer);

  COLORS.forEach((color) => {
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("div");
      el.className = `piece p${COLOR_CODE[color]}`;
      el.setAttribute("role", "button");
      el.tabIndex = -1;
      el.addEventListener("click", (e) => { e.stopPropagation(); pieceClicked(color, i); });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pieceClicked(color, i);
        }
      });
      pieceLayer.appendChild(el);
      pieceEls[`${color}-${i}`] = el;
    }
  });
}

// ---- Region labels: the yard (born here) and home stretch (run for this)
// are named territories on the board itself, independent of who's playing.
const regionLabelEls = {}; // "Color-yard" / "Color-home" -> element

const YARD_LABEL_POS = {
  Red: { left: 15.9, top: 28.5 },
  Green: { left: 84.1, top: 28.5 },
  Yellow: { left: 84.1, top: 97 },
  Blue: { left: 15.9, top: 97 },
};
// Placed just outside the board edge, centered on that color's home-stretch arm.
const HOME_LABEL_POS = {
  Red: { left: 0, top: 50, transform: "translate(-100%, -50%)" },
  Green: { left: 50, top: 0, transform: "translate(-50%, -100%)" },
  Yellow: { left: 100, top: 50, transform: "translate(0, -50%)" },
  Blue: { left: 50, top: 100, transform: "translate(-50%, 0)" },
};

function buildRegionLabels() {
  COLORS.forEach((color) => {
    const yard = document.createElement("div");
    yard.className = `region-label yard-label rl${COLOR_CODE[color]}`;
    yard.style.left = `${YARD_LABEL_POS[color].left}%`;
    yard.style.top = `${YARD_LABEL_POS[color].top}%`;
    yard.style.transform = "translate(-50%, -50%)";
    boardEl.appendChild(yard);
    regionLabelEls[`${color}-yard`] = yard;

    const home = document.createElement("div");
    home.className = `region-label home-label rl${COLOR_CODE[color]}`;
    home.style.left = `${HOME_LABEL_POS[color].left}%`;
    home.style.top = `${HOME_LABEL_POS[color].top}%`;
    home.style.transform = HOME_LABEL_POS[color].transform;
    boardEl.appendChild(home);
    regionLabelEls[`${color}-home`] = home;
  });
  updateRegionLabels();
}

function updateRegionLabels() {
  boardEl.dataset.theme = state.themeKey;
  COLORS.forEach((color) => {
    const name = regionName(color);
    const monogram = name.split(/\s|&/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
    const yard = regionLabelEls[`${color}-yard`];
    const home = regionLabelEls[`${color}-home`];
    yard.dataset.color = color.toLowerCase();
    home.dataset.color = color.toLowerCase();
    yard.innerHTML = `
      <span class="territory-crest" aria-hidden="true">${monogram}</span>
      <span class="territory-copy"><small>Waiting to be born</small><strong>${name}</strong><em>ROLL 6 TO ENTER</em></span>
    `;
    home.innerHTML = `
      <span class="home-route-mark" aria-hidden="true"></span>
      <span class="territory-copy"><small>Home run</small><strong>${name}</strong></span>
    `;
    yard.setAttribute("aria-label", `${name} born yard. Roll a six to enter the road.`);
    home.setAttribute("aria-label", `${name} home run.`);
    const centerZone = centerHomeZoneEls[color];
    if (centerZone) {
      centerZone.querySelector("b").textContent = monogram;
      centerZone.title = `${name} home yard`;
      centerZone.setAttribute("aria-label", `${name} center home yard`);
    }
    const bornSpace = boardEl.querySelector(`.born-${COLOR_CODE[color].toLowerCase()}`);
    if (bornSpace) {
      bornSpace.dataset.born = monogram;
      bornSpace.title = `${name} Born Space`;
      bornSpace.setAttribute("aria-label", `${name} Born Space`);
    }
  });
  updateExtremeBoardMode();
}

function updateExtremeBoardMode() {
  boardEl.querySelectorAll(".cell.extreme-action").forEach((cell) => {
    cell.classList.remove("extreme-action", ...EXTREME_ACTIONS.map((action) => action.className));
    delete cell.dataset.extremeLabel;
    delete cell.dataset.extremeSymbol;
    cell.removeAttribute("title");
    cell.removeAttribute("aria-label");
  });
  if (state.themeKey !== "dishes") return;

  state.extremeSpaces.forEach((action) => {
    const [row, col] = RING[action.idx];
    const cell = cellIndex[`${row},${col}`];
    if (!cell) return;
    cell.classList.add("extreme-action", action.className);
    cell.dataset.extremeLabel = action.mark;
    cell.dataset.extremeSymbol = action.symbol;
    cell.title = `Extreme Jamaican Ludi: ${action.label}`;
    cell.setAttribute("aria-label", `Extreme Ludi action space: ${action.label}`);
  });
}

// Pieces sharing a road square form one clear vertical pile. The offsets are
// centered on the square so blocks of two, three, or four remain countable.
const STACK_GAP = 1.15;
function verticalStackOffset(slot, count) {
  return [0, (slot - (count - 1) / 2) * STACK_GAP];
}
// Finished pieces stay visible in the enlarged center home court. These are
// display positions only; the verified ring and home-stretch math is unchanged.
const HOME_DISPLAY_SLOTS = {
  Red: [[42.6, 50], [44.65, 50], [46.7, 50], [48.7, 50]],
  Green: [[50, 42.6], [50, 44.65], [50, 46.7], [50, 48.7]],
  Yellow: [[57.4, 50], [55.35, 50], [53.3, 50], [51.3, 50]],
  Blue: [[50, 57.4], [50, 55.35], [50, 53.3], [50, 51.3]],
};

function cellCoordFor(color, piece, slotIdx) {
  if (piece.status === "yard") return YARD_SLOTS[color][slotIdx];
  if (piece.status === "home") return [7, 7];
  return globalCellForR(color, piece.r);
}

function positionPiecesOnly() {
  const color = currentColor();
  const legal =
    state.rolled && !state.animating && state.controllers[color] === "human"
      ? legalDiceForColor(color)
      : { 0: [], 1: [] };

  const groups = {};
  COLORS.forEach((c) => {
    state.players[c].pieces.forEach((piece, idx) => {
      if (piece.status === "home") return;
      const [r, col] = cellCoordFor(c, piece, idx);
      const key = `${r},${col}`;
      groups[key] = groups[key] || [];
      groups[key].push({ color: c, idx });
    });
  });

  document.querySelectorAll(".cell.blocked").forEach((el) => el.classList.remove("blocked"));
  Object.entries(groups).forEach(([key, list]) => {
    const cellEl = cellIndex[key];
    if (!cellEl || !cellEl.classList.contains("ring")) return;
    const byColor = {};
    list.forEach((p) => (byColor[p.color] = (byColor[p.color] || 0) + 1));
    if (Object.values(byColor).some((n) => n >= 2)) cellEl.classList.add("blocked");
  });

  COLORS.forEach((c) => {
    state.players[c].pieces.forEach((piece, idx) => {
      const el = pieceEls[`${c}-${idx}`];
      el.title = `${playerName(c)} — ${CAP_FLAVOR[c]} bottle-cap piece ${idx + 1}`;
      el.setAttribute("aria-label", `${playerName(c)}, ${CAP_FLAVOR[c]} bottle-cap piece ${idx + 1}`);
      if (piece.status === "home") {
        const [homeLeft, homeTop] = HOME_DISPLAY_SLOTS[c][idx];
        el.classList.remove("finished-hide", "stacked", "movable");
        el.classList.add("home-finished");
        el.style.left = `${homeLeft}%`;
        el.style.top = `${homeTop}%`;
        el.style.pointerEvents = "none";
        el.style.zIndex = "";
        el.tabIndex = -1;
        el.setAttribute("aria-disabled", "true");
        return;
      }
      el.classList.remove("finished-hide");
      el.classList.remove("home-finished");

      const [r, col] = cellCoordFor(c, piece, idx);
      const key = `${r},${col}`;
      const stack = groups[key] || [{ color: c, idx }];
      const slot = stack.findIndex((p) => p.color === c && p.idx === idx);
      const [dx, dy] = verticalStackOffset(slot, stack.length);

      el.style.left = `${boardCellCenter(col) + dx}%`;
      el.style.top = `${boardCellCenter(r) + dy}%`;
      el.style.zIndex = stack.length > 1 ? `${12 + slot}` : "";
      el.classList.toggle("stacked", stack.length > 1);

      const movableNow = c === color && state.armedDie != null && legal[state.armedDie].includes(idx);
      el.classList.toggle("movable", movableNow);
      el.style.pointerEvents = movableNow ? "auto" : "none";
      el.tabIndex = movableNow ? 0 : -1;
      el.setAttribute("aria-disabled", movableNow ? "false" : "true");
    });
  });
}

// ============================================================
// Effects
// ============================================================

function flashBirth(color, idx) {
  const el = pieceEls[`${color}-${idx}`];
  el.classList.remove("birthing");
  void el.offsetWidth;
  el.classList.add("birthing");
  setTimeout(() => el.classList.remove("birthing"), BIRTH_MS + 150);
}

function flashKill(color, idx) {
  const el = pieceEls[`${color}-${idx}`];
  el.classList.add("kill-flash");
  setTimeout(() => el.classList.remove("kill-flash"), KILL_FLASH_MS + 50);
}

function burstConfetti(anchorEl, count) {
  if (!anchorEl) return;
  const boardRect = boardEl.getBoundingClientRect();
  const anchorRect = anchorEl.getBoundingClientRect();
  const left = ((anchorRect.left + anchorRect.width / 2 - boardRect.left) / boardRect.width) * 100;
  const top = ((anchorRect.top + anchorRect.height / 2 - boardRect.top) / boardRect.height) * 100;
  const colors = ["#e0263d", "#1c8c4a", "#f2b705", "#1a6fd4", "#d9ad5e", "#fff"];
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("div");
    dot.className = "confetti";
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 90;
    dot.style.left = `${left}%`;
    dot.style.top = `${top}%`;
    dot.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    dot.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    dot.style.setProperty("--rot", `${(Math.random() - 0.5) * 720}deg`);
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    boardEl.appendChild(dot);
    setTimeout(() => dot.remove(), 950);
  }
}

// ============================================================
// Sidebar rendering
// ============================================================

function render() {
  positionPiecesOnly();
  renderSidebar(
    state.rolled && !state.animating && state.controllers[currentColor()] === "human"
      ? legalDiceForColor(currentColor())
      : { 0: [], 1: [] }
  );
}

function renderSidebar(legal) {
  const color = currentColor();
  const isHuman = state.controllers[color] === "human";
  document.getElementById("turnSwatch").style.background = cssColor(color);
  document.getElementById("turnIndicator").style.setProperty("--glow", cssColor(color));
  document.getElementById("turnName").textContent = `${playerName(color)} (${displayColorName(color)})${isHuman ? "" : " 🤖"}`;
  const turnBadge = document.querySelector(".turn-badge");
  turnBadge.textContent = isHuman ? "Your move" : "AI thinking";

  const d1El = document.getElementById("die1");
  const d2El = document.getElementById("die2");
  [d1El, d2El].forEach((el, slot) => {
    if (state.animating) return;
    const v = state.dice[slot];
    el.textContent = v == null ? "–" : v;
    el.disabled = v == null || state.diceUsed[slot] || legal[slot].length === 0 || !isHuman;
    el.classList.toggle("used", !!state.diceUsed[slot]);
    el.classList.toggle("armed", state.armedDie === slot);
    el.setAttribute("aria-label", v == null ? `${slot === 0 ? "First" : "Second"} die, not rolled` : `${slot === 0 ? "First" : "Second"} die, ${v}`);
    el.setAttribute("aria-pressed", state.armedDie === slot ? "true" : "false");
  });

  const rollBtn = document.getElementById("rollBtn");
  rollBtn.disabled =
    state.gameOver || state.animating || !isHuman || (state.rolled && !(state.diceUsed[0] && state.diceUsed[1]));
  rollBtn.textContent = state.gameOver ? "Game Over" : isHuman ? "Roll Dice" : "AI turn…";

  const hint = document.getElementById("hint");
  if (state.gameOver) hint.textContent = "Di game done — start a new one!";
  else if (!isHuman) hint.textContent = `${playerName(color)} (AI) a tek dem turn…`;
  else if (state.animating) hint.textContent = "Watch di move…";
  else if (!state.rolled) hint.textContent = `${playerName(color)}, Tap Roll Dice Fi Get Tings Movin'.`;
  else if (state.armedDie == null) hint.textContent = "Pick a die to use, den tap a glowing piece.";
  else hint.textContent = "Tap a highlighted piece fi move it.";

  renderProgress();
  updatePlayersPanel();
}

function renderProgress() {
  const list = document.getElementById("progressList");
  list.replaceChildren();
  COLORS.forEach((color) => {
    const p = state.players[color];
    const row = document.createElement("div");
    row.className = "progress-row";
    row.dataset.color = color.toLowerCase();
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = cssColor(color);
    swatch.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.textContent = playerName(color);
    const bar = document.createElement("span");
    bar.className = "bar";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", `${playerName(color)} pieces home`);
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "4");
    bar.setAttribute("aria-valuenow", String(p.finished));
    const fill = document.createElement("span");
    fill.className = "bar-fill";
    fill.style.width = `${(p.finished / 4) * 100}%`;
    fill.style.background = cssColor(color);
    bar.appendChild(fill);
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = `${p.finished}/4`;
    row.append(swatch, name, bar, count);
    list.appendChild(row);
  });
}

// Built once so the name <input> keeps focus/cursor while the player types —
// re-created inputs on every render() would blur mid-keystroke.
const playerRowEls = {};

function buildPlayersPanel() {
  const list = document.getElementById("playersList");
  list.innerHTML = "";
  COLORS.forEach((color) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.dataset.color = color.toLowerCase();
    row.innerHTML = `
      <span class="swatch" style="background:${cssColor(color)}"></span>
      <input class="pname-input" type="text" maxlength="18" />
      <button class="player-toggle" data-color="${color}"></button>
    `;
    list.appendChild(row);

    const input = row.querySelector(".pname-input");
    input.value = playerName(color);
    input.addEventListener("input", () => {
      state.playerNames[color] = input.value.trim() || `Player ${COLORS.indexOf(color) + 1}`;
      localStorage.setItem("jl_playerNames", JSON.stringify(state.playerNames));
      if (currentColor() === color) renderSidebarTextOnly();
    });

    const toggle = row.querySelector(".player-toggle");
    toggle.setAttribute("aria-label", `Change ${displayColorName(color)} player type`);
    toggle.addEventListener("click", () => {
      if (state.animating || state.aiRunning) return;
      state.controllers[color] = state.controllers[color] === "ai" ? "human" : "ai";
      render();
      maybeStartAITurn();
    });

    playerRowEls[color] = { input, toggle };
  });
}

function updatePlayersPanel() {
  COLORS.forEach((color) => {
    const { input, toggle } = playerRowEls[color];
    if (document.activeElement !== input && input.value !== playerName(color)) {
      input.value = playerName(color);
    }
    const isAI = state.controllers[color] === "ai";
    toggle.textContent = isAI ? "AI 🤖" : "HUMAN";
    toggle.classList.toggle("ai", isAI);
  });
}

// Cheap refresh for text that references the current player's name, without
// touching pieces/board — used while typing so we don't fight the input focus.
function renderSidebarTextOnly() {
  const color = currentColor();
  const isHuman = state.controllers[color] === "human";
  document.getElementById("turnName").textContent = `${playerName(color)} (${displayColorName(color)})${isHuman ? "" : " 🤖"}`;
  renderProgress();
}

function cssColor(color) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${color.toLowerCase()}`).trim();
}

function showFinalStandings() {
  const modal = document.getElementById("winModal");
  const title = document.getElementById("winTitle");
  const body = document.getElementById("winBody");
  const winnerColor = state.finishOrder[0];
  title.textContent = `${playerName(winnerColor)} wins! 🏆`;
  const ordinals = ["1st", "2nd", "3rd", "4th"];
  body.replaceChildren();
  state.finishOrder.forEach((c, i) => {
    if (i > 0) body.appendChild(document.createElement("br"));
    body.appendChild(document.createTextNode(`${ordinals[i]}: ${playerName(c)} (${displayColorName(c)})`));
  });
  modal.classList.remove("hidden");
  chat(`🏁 ${playerName(winnerColor)} reach home first — respect due!`);
  sfx.win();
  burstConfetti(cellIndex["7,7"], 40);
}

// ============================================================
// Wire up
// ============================================================

document.getElementById("rollBtn").addEventListener("click", () => { ensureAudio(); if (state.musicOn) startMusic(); rollDice(); });
document.getElementById("die1").addEventListener("click", () => armDie(0));
document.getElementById("die2").addEventListener("click", () => armDie(1));
document.getElementById("experiencesBtn").addEventListener("click", () => {
  document.getElementById("experiences").scrollIntoView({ behavior: "smooth", block: "start" });
});

function updateThemeButton() {
  const button = document.getElementById("themeToggleBtn");
  const extremeMode = state.themeKey === "dishes";
  const buttonLabel = extremeMode ? "PLAY JAMAICAN LUDI" : "PLAY EXTREME LUDI";
  const icon = extremeMode ? "♥" : "⚡";
  button.innerHTML = `<span class="theme-switch-icon" aria-hidden="true">${icon}</span><span>${buttonLabel}</span>`;
  document.getElementById("gameModeTitle").textContent = THEMES[state.themeKey].title;
  document.title = THEMES[state.themeKey].title;
  document.getElementById("rulesTitle").textContent = extremeMode
    ? "How To Play Extreme Jamaican Ludi"
    : "How To Play Jamaican Ludi";
  document.getElementById("classicRulesList").hidden = extremeMode;
  document.getElementById("extremeRulesList").hidden = !extremeMode;
  document.getElementById("extremeActionKey").hidden = !extremeMode;
  button.title = buttonLabel;
  button.setAttribute("aria-label", button.title);
}

document.getElementById("themeToggleBtn").addEventListener("click", () => {
  state.themeKey = state.themeKey === "family" ? "dishes" : "family";
  updateThemeButton();
  updateRegionLabels();
  renderExperiences();
});
updateThemeButton();

function updateSoundButton() {
  const button = document.getElementById("soundToggleBtn");
  button.innerHTML = state.soundOn
    ? `<svg class="sound-status-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
    : `<svg class="sound-status-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  button.title = state.soundOn ? "Turn sound off" : "Turn sound on";
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-pressed", state.soundOn ? "true" : "false");
}

document.getElementById("soundToggleBtn").addEventListener("click", () => {
  ensureAudio();
  state.soundOn = !state.soundOn;
  localStorage.setItem("jl_sound", state.soundOn ? "on" : "off");
  updateSoundButton();
  if (state.soundOn) sfx.settle();
});
updateSoundButton();

function updateMusicButton() {
  const button = document.getElementById("musicToggleBtn");
  button.textContent = state.musicOn ? "♫" : "♪";
  button.title = state.musicOn ? "Turn reggae instrumental off" : "Turn reggae instrumental on";
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-pressed", state.musicOn ? "true" : "false");
}

document.getElementById("musicToggleBtn").addEventListener("click", () => {
  ensureAudio();
  state.musicOn = !state.musicOn;
  localStorage.setItem("jl_music", state.musicOn ? "on" : "off");
  if (state.musicOn) startMusic(); else stopMusic();
  updateMusicButton();
});
updateMusicButton();

const rulesModal = document.getElementById("rulesModal");
const openRules = () => {
  rulesModal.classList.remove("hidden");
  document.getElementById("rulesCloseBtn").focus();
};
const closeRules = () => {
  rulesModal.classList.add("hidden");
  document.getElementById("rulesBtn").focus();
};
document.getElementById("rulesBtn").addEventListener("click", openRules);
document.getElementById("rulesCloseBtn").addEventListener("click", closeRules);
document.getElementById("rulesDoneBtn").addEventListener("click", closeRules);
rulesModal.addEventListener("click", (event) => {
  if (event.target === rulesModal) closeRules();
});

const aboutModal = document.getElementById("aboutModal");
const openAbout = () => {
  aboutModal.classList.remove("hidden");
  document.getElementById("aboutCloseBtn").focus();
};
const closeAbout = () => {
  aboutModal.classList.add("hidden");
  document.getElementById("aboutBtn").focus();
};
document.getElementById("aboutBtn").addEventListener("click", openAbout);
document.getElementById("aboutCloseBtn").addEventListener("click", closeAbout);
document.getElementById("aboutDoneBtn").addEventListener("click", closeAbout);
aboutModal.addEventListener("click", (event) => {
  if (event.target === aboutModal) closeAbout();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !rulesModal.classList.contains("hidden")) closeRules();
  if (event.key === "Escape" && !aboutModal.classList.contains("hidden")) closeAbout();
});

document.getElementById("newGameBtn").addEventListener("click", () => {
  const { controllers, themeKey, soundOn, musicOn, playerNames } = state;
  state = freshState();
  state.controllers = controllers;
  state.themeKey = themeKey;
  state.soundOn = soundOn;
  state.musicOn = musicOn;
  state.playerNames = playerNames;
  chatterLines.length = 0;
  document.getElementById("winModal").classList.add("hidden");
  chat("New game start — everybody line up a di yard!");
  updateThemeButton();
  updateRegionLabels();
  renderExperiences();
  render();
  maybeStartAITurn();
});
document.getElementById("winCloseBtn").addEventListener("click", () => {
  document.getElementById("winModal").classList.add("hidden");
});

buildBoardDOM();
buildPlayersPanel();
chat("Wah gwaan! Welcome to Jamaican Ludi — roll a six fi bring out yuh first piece!");
renderExperiences();
render();
maybeStartAITurn();
