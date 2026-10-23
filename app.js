const WORDLIST_FILE = 'SpellFinder.txt';
const PLATE_IMAGE_FILE = 'Plate.png';

const state = {
  words: [],
  letters: '',
  submittedWords: [],
  currentPossibleWords: [],
  plateImageLoaded: false,
  plateImage: null,
  plateTextColor: '#14377D',
  manualFontSize: 135,
  manualLetterSpacingPx: -15,
  manualOffsetX: 20,
  manualOffsetY: 60
};

const el = {
  wordInput: document.getElementById('wordInput'),
  lookupInput: document.getElementById('lookupInput'),
  currentLetters: document.getElementById('currentLetters'),
  summary: document.getElementById('summary'),
  status: document.getElementById('status'),
  lookupResult: document.getElementById('lookupResult'),
  submittedWords: document.getElementById('submittedWords'),
  resultsText: document.getElementById('resultsText'),
  plateCanvas: document.getElementById('plateCanvas')
};

const ctx = el.plateCanvas.getContext('2d');

function normalizeWord(word) {
  return (word || '').toLowerCase().replace(/[^a-z]/g, '');
}

function orderedMatch(word, letters) {
  let pos = 0;
  for (const ch of letters) {
    pos = word.indexOf(ch, pos);
    if (pos === -1) return false;
    pos += 1;
  }
  return true;
}

function generateRandomLetters() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 3 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join('');
}

function renderPlateWithLetters(letters) {
  if (!state.plateImageLoaded) return;

  const img = state.plateImage;

  el.plateCanvas.width = img.width;
  el.plateCanvas.height = img.height;

  ctx.clearRect(0, 0, img.width, img.height);
  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = state.plateTextColor;
  ctx.font = `${state.manualFontSize}px Arial Narrow, Arial, sans-serif`;
  ctx.textBaseline = 'top';

  let x = state.manualOffsetX;
  const y = state.manualOffsetY;

  for (const ch of letters) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + state.manualLetterSpacingPx;
  }

  if (el.currentLetters) {
    el.currentLetters.textContent = `Current letters: ${letters}`;
  }
}

function getPossibleWordsForLetters(letters) {
  const normalized = normalizeWord(letters);
  if (normalized.length !== 3) return [];
  return state.words.filter(w => orderedMatch(w, normalized));
}

// New helper: count words of specific lengths (6,7,8) and return a message
function count6to8Message(letters) {
  const possible = getPossibleWordsForLetters(letters);
  const counts = {6: 0, 7: 0, 8: 0};
  possible.forEach(w => {
    if (w.length === 6) counts[6] += 1;
    if (w.length === 7) counts[7] += 1;
    if (w.length === 8) counts[8] += 1;
  });
  const total = counts[6] + counts[7] + counts[8];
  return { counts, total, possible };
}

function lookupPlate() {
  const letters = normalizeWord(el.lookupInput.value);
  if (letters.length !== 3) {
    el.lookupResult.textContent = "Enter exactly 3 letters.";
    return;
  }

  const possible = getPossibleWordsForLetters(letters);

  if (possible.length === 0) {
    el.lookupResult.textContent = `No words can be formed from "${letters.toUpperCase()}".`;
    el.status.textContent = '';
    return;
  }

  // Build counts message for 6/7/8 letter words
  const { counts, total } = count6to8Message(letters);
  const msg = `Words CAN be formed from "${letters.toUpperCase()}". 6-letter: ${counts[6]}, 7-letter: ${counts[7]}, 8-letter: ${counts[8]} (Total: ${total}, All lengths found: ${possible.length})`;

  el.lookupResult.textContent = msg;
  el.status.textContent = msg;

  // Update state + draw plate
  state.letters = letters.toUpperCase();
  renderPlateWithLetters(state.letters);
}

function refreshSubmitted() {
  el.submittedWords.innerHTML = '';
  state.submittedWords.forEach(w => {
    const div = document.createElement('div');
    div.textContent = w;
    el.submittedWords.appendChild(div);
  });
}

function submitWord() {
  const word = normalizeWord(el.wordInput.value);
  const letters = state.letters.toLowerCase();

  const possible = getPossibleWordsForLetters(letters);

  if (!possible.includes(word)) {
    el.summary.textContent = `"${word}" is NOT valid`;
    return;
  }

  if (!state.submittedWords.includes(word)) {
    state.submittedWords.push(word);
    state.submittedWords.sort();
  }

  el.summary.textContent = `"${word}" is valid`;
  refreshSubmitted();
  el.wordInput.value = '';
}

function showAnswers() {
  const letters = state.letters;

  const possible = getPossibleWordsForLetters(letters);

  if (possible.length === 0) {
    el.resultsText.innerHTML = '';
    return;
  }

  const sixToEight = possible.filter(w => w.length >= 6 && w.length <= 8);
  const longestLength = Math.max(...possible.map(w => w.length));
  const longestWords = possible.filter(w => w.length === longestLength);

  const groups = {
    6: [],
    7: [],
    8: []
  };

  sixToEight.forEach(word => {
    const len = word.length;
    if (groups[len]) groups[len].push(word);
  });

  let output = '';

  Object.keys(groups)
    .sort((a, b) => a - b)
    .forEach(len => {
      output += `\n${len} LETTER WORDS (${groups[len].length})\n`;
      output += `${groups[len].join(' ')}\n`;
    });

  if (longestWords.length > 0) {
    output += `\nLONGEST WORDS (${longestLength} LETTERS)\n`;
    output += `${longestWords.join(' ')}\n`;
  }

  el.resultsText.innerHTML = output;
}

function generateLetters() {
  const letters = generateRandomLetters();
  state.letters = letters;
  if (el.lookupInput) {
    el.lookupInput.value = letters;
  }
  renderPlateWithLetters(letters);

  // After generating letters, show counts for 6/7/8 letter words
  const { counts, total } = count6to8Message(letters);
  const msg = `Letters "${letters}" Forms: "${counts[6]}" 6 Letter words,  "${counts[7]}" 7 Letter words, and "${counts[8]}" 8 Letter words (Total words: ${total}).`;
  el.status.textContent = msg;
  el.lookupResult.textContent = msg;
}

function clearApp() {
  state.submittedWords = [];
  state.letters = '';
  state.currentPossibleWords = [];
  el.wordInput.value = '';
  el.lookupInput.value = '';
  el.summary.textContent = 'Ready.';
  el.lookupResult.textContent = 'Enter 3 letters to check whether words can be formed.';
  el.status.textContent = '';
  el.resultsText.innerHTML = '';
  if (el.currentLetters) {
    el.currentLetters.textContent = 'Generate Random Plate';
  }
  refreshSubmitted();
}

async function loadAssets() {
  // Load words
  try {
    const res = await fetch(WORDLIST_FILE);
    const text = await res.text();
    state.words = text.split('\n').map(normalizeWord).filter(Boolean);
  } catch {
    state.words = [];
  }

  // Load image
  const img = new Image();
  img.src = PLATE_IMAGE_FILE;
  img.onload = () => {
    state.plateImage = img;
    state.plateImageLoaded = true;
    generateLetters();
  };
}

const randomBtn = document.getElementById('randomBtn') || document.getElementById('currentLetters');
if (randomBtn) {
  randomBtn.onclick = generateLetters;
}

document.getElementById('submitBtn').onclick = submitWord;
document.getElementById('answerBtn').onclick = showAnswers;
document.getElementById('clearBtn').onclick = clearApp;
document.getElementById('lookupBtn').onclick = lookupPlate;

loadAssets();
