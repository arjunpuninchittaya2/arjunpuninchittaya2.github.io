/* ── Vocab Study — main.js ── */

// The snippet the user runs in the Flippity page console
const SNIPPET =
`(function scrapeFlippityClean() {
    const table = document.querySelector("#list");
    if (!table) { console.error("Table #list not found."); return; }
    const rows = Array.from(table.querySelectorAll("tr")).slice(1);
    const vocabData = rows
        .map(row => ({ word: row.cells[1]?.innerText.trim(), definition: row.cells[2]?.innerText.trim() }))
        .filter(item => item.word && item.definition);
    const jsonOutput = JSON.stringify(vocabData, null, 2);
    console.log(\`✅ Scraped \${vocabData.length} clean items.\`);
    console.log(jsonOutput);
    copy(jsonOutput);
    console.log("📋 Clean JSON copied to clipboard!");
})();`;

// ── DOM refs ──
const startScreen  = document.getElementById('start-screen');
const studyScreen  = document.getElementById('study-screen');
const urlInput     = document.getElementById('url-input');
const generateBtn  = document.getElementById('generate-btn');
const step2Card    = document.getElementById('step2-card');
const step3Card    = document.getElementById('step3-card');
const flippityLink = document.getElementById('flippity-link');
const snippetCode  = document.getElementById('snippet-code');
const copySnippet  = document.getElementById('copy-snippet-btn');
const jsonPaste    = document.getElementById('json-paste');
const startBtn     = document.getElementById('start-btn');
const errorMsg     = document.getElementById('error-msg');
const backBtn      = document.getElementById('back-btn');
const orderBtns    = document.querySelectorAll('.order-btn');
const progressText = document.getElementById('progress-text');
const progressBar  = document.getElementById('progress-bar');
const wordDisplay  = document.getElementById('word-display');
const userAnswer   = document.getElementById('user-answer');
const revealBtn    = document.getElementById('reveal-btn');
const trueAnswer   = document.getElementById('true-answer');
const answerText   = document.getElementById('answer-text');
const prevBtn      = document.getElementById('prev-btn');
const nextBtn      = document.getElementById('next-btn');

// ── App state ──
let words   = [];   // [{word, def}, ...]
let index   = 0;
let order   = 'original';
let revealed = false;

// ── Step 1 → Step 2: generate snippet ──
generateBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) {
    showError('Please enter a Flippity URL.');
    return;
  }
  // Ensure only http/https protocols are allowed (prevents javascript: XSS)
  let parsed;
  try { parsed = new URL(url); } catch (_) { parsed = null; }
  if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
    showError('URL must start with https:// or http://');
    return;
  }
  hideError();
  flippityLink.href = parsed.href;
  snippetCode.textContent = SNIPPET;
  step2Card.classList.remove('hidden');
  step3Card.classList.remove('hidden');
  step2Card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Allow pressing Enter in URL input to generate
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generateBtn.click();
});

// ── Copy snippet button ──
copySnippet.addEventListener('click', () => {
  navigator.clipboard.writeText(SNIPPET).then(() => {
    copySnippet.textContent = 'Copied!';
    copySnippet.classList.add('copied');
    setTimeout(() => {
      copySnippet.textContent = 'Copy';
      copySnippet.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // fallback for browsers without clipboard API
    const ta = document.createElement('textarea');
    ta.value = SNIPPET;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copySnippet.textContent = 'Copied!';
    copySnippet.classList.add('copied');
    setTimeout(() => {
      copySnippet.textContent = 'Copy';
      copySnippet.classList.remove('copied');
    }, 2000);
  });
});

// ── Order toggle ──
orderBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    orderBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    order = btn.dataset.order;
  });
});

// ── Step 3 → Start studying ──
startBtn.addEventListener('click', () => {
  const raw = jsonPaste.value.trim();
  if (!raw) {
    showError('Please paste the JSON output from the console.');
    return;
  }

  let parsed;
  try {
    // The console may print the JSON wrapped in quotes if it was logged as a
    // string — strip outer quotes if present
    let json = raw;
    if ((json.startsWith('"') && json.endsWith('"')) ||
        (json.startsWith("'") && json.endsWith("'"))) {
      json = JSON.parse(json); // un-escape the string
    }
    parsed = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (err) {
    showError('Could not parse the pasted text. Make sure you copied the full console output (it should start with [ and end with ]).');
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    showError('The pasted data appears empty. Try running the snippet again on the Flippity page.');
    return;
  }

  // Validate shape
  const valid = parsed.filter(x => x && typeof x.word === 'string' && typeof x.def === 'string' && x.word && x.def);
  if (valid.length === 0) {
    showError('No valid word/definition pairs found. Make sure the Flippity page fully loaded before running the snippet.');
    return;
  }

  hideError();
  words = order === 'random' ? shuffle(valid.slice()) : valid;
  startStudy();
});

// ── Back to menu ──
backBtn.addEventListener('click', goToStart);

// ── Start the study session ──
function startStudy() {
  index = 0;
  studyScreen.classList.remove('hidden');
  startScreen.classList.add('hidden');
  renderCard();
  userAnswer.focus();
}

// ── Render current card ──
function renderCard() {
  const item = words[index];
  wordDisplay.textContent = item.word;
  userAnswer.value = '';
  hideReveal();
  updateProgress();
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === words.length - 1;
  userAnswer.focus();
}

function updateProgress() {
  const total = words.length;
  progressText.textContent = `${index + 1} / ${total}`;
  progressBar.style.width = `${((index + 1) / total) * 100}%`;
}

// ── Show / hide answer ──
revealBtn.addEventListener('click', revealAnswer);

function revealAnswer() {
  if (revealed) return;
  revealed = true;
  answerText.textContent = words[index].def;
  trueAnswer.classList.remove('hidden');
  revealBtn.textContent = '✓ Answer shown';
  revealBtn.disabled = true;
}

function hideReveal() {
  revealed = false;
  trueAnswer.classList.add('hidden');
  revealBtn.textContent = 'Show Answer';
  revealBtn.disabled = false;
}

// ── Navigation ──
function goNext() {
  if (index < words.length - 1) { index++; renderCard(); }
}
function goPrev() {
  if (index > 0) { index--; renderCard(); }
}

nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);

// ── Keyboard shortcuts ──
document.addEventListener('keydown', (e) => {
  // Don't fire shortcuts when typing in inputs (except specific ones)
  const tag = document.activeElement.tagName;
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

  if (studyScreen.classList.contains('hidden')) return;

  if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); return; }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev(); return; }

  if (inInput) return; // block Space/Enter/R when typing in textarea

  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); revealAnswer(); return; }
  if (e.key === 'r' || e.key === 'R')     { e.preventDefault(); goToStart(); return; }
});

function goToStart() {
  studyScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
}

// ── Error helpers ──
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}
function hideError() {
  errorMsg.classList.add('hidden');
}

// ── Fisher-Yates shuffle ──
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
