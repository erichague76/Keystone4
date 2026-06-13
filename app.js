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
  manualOffsetY: 50
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

  el.currentLetters.textContent = `Current letters: ${letters}`;
}

function getPossibleWordsForLetters(letters) {
  const normalized = normalizeWord(letters);
  if (normalized.length !== 3) return [];
  return state.words.filter(w => orderedMatch(w, normalized));
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

  refreshSubmitted();
  el.wordInput.value = '';
}

function showAnswers() {
  const letters = state.letters;
  const possible = getPossibleWordsForLetters(letters);

  el.resultsText.innerHTML = possible.join(' ');
}

function generateLetters() {
  const letters = generateRandomLetters();
  state.letters = letters;
  renderPlateWithLetters(letters);
}

function clearApp() {
  state.submittedWords = [];
  el.resultsText.innerHTML = '';
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

document.getElementById('submitBtn').onclick = submitWord;
document.getElementById('answerBtn').onclick = showAnswers;
document.getElementById('randomBtn').onclick = generateLetters;
document.getElementById('clearBtn').onclick = clearApp;

loadAssets();
