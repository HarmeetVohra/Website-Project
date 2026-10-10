// Deutsch Lernen app logic
// Everything happens in the browser. Nothing is saved, so custom words reset on refresh.

// ---------- App state ----------
let decks = [];         // built-in decks loaded from the server
let customWords = [];   // words the learner adds this visit
let mode = "flip";      // "flip" for flip cards, "quiz" for multiple choice
let direction = "de";   // "de" shows German first, "en" shows English first
let currentDeck = null; // the deck being studied: { name, cards }
let queue = [];         // cards in this round, in shuffled order
let position = 0;       // index of the current card in the queue
let missed = [];        // cards the learner didn't know this round
let answered = false;   // true once the current card has been revealed or answered

// ---------- Page elements ----------
const $ = (id) => document.getElementById(id);

const screens = {
  home: $("home-screen"),
  study: $("study-screen"),
  results: $("results-screen")
};

const deckGrid = $("deck-grid");
const customForm = $("custom-form");
const customDe = $("custom-de");
const customEn = $("custom-en");
const customList = $("custom-list");
const studyCustomBtn = $("study-custom");

const progressText = $("progress-text");
const progressFill = $("progress-fill");
const studyTitle = $("study-title");
const listenBtn = $("listen");

const flipMode = $("flip-mode");
const flashcard = $("flashcard");
const answerButtons = $("answer-buttons");
const flipHint = $("flip-hint");

const quizMode = $("quiz-mode");
const quizChoices = $("quiz-choices");
const quizFeedback = $("quiz-feedback");
const quizNext = $("quiz-next");

// ---------- Helpers ----------
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
  if (name !== "study") stopSpeaking();
  window.scrollTo(0, 0);
}

// Returns a shuffled copy so each round feels fresh (Fisher-Yates shuffle).
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The side shown first (the question) and the side to recall (the answer).
const questionSide = (card) => (direction === "de" ? card.de : card.en);
const answerSide = (card) => (direction === "de" ? card.en : card.de);
const questionLabel = () => (direction === "de" ? "German" : "English");
const answerLabel = () => (direction === "de" ? "English" : "German");

// ---------- Pronunciation (browser's built-in speech, no extra library) ----------
const canSpeak = "speechSynthesis" in window;
let germanVoice = null;

function pickGermanVoice() {
  const voices = window.speechSynthesis.getVoices();
  germanVoice =
    voices.find((v) => v.lang === "de-DE") ||
    voices.find((v) => v.lang.toLowerCase().startsWith("de")) ||
    null;
}

if (canSpeak) {
  pickGermanVoice();
  // Some browsers load their voices a moment after the page opens.
  window.speechSynthesis.addEventListener("voiceschanged", pickGermanVoice);
}

function speakGerman(text) {
  if (!canSpeak) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.85; // a little slower for beginners
  if (germanVoice) utterance.voice = germanVoice;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if (canSpeak) window.speechSynthesis.cancel();
}

// Only offer Listen when the German word is on screen, so it never gives away the answer.
function updateListenButton() {
  listenBtn.hidden = !canSpeak || (direction === "en" && !answered);
}

listenBtn.addEventListener("click", () => speakGerman(queue[position].de));

// ---------- Home screen ----------
async function loadDecks() {
  try {
    const response = await fetch("/api/decks");
    if (!response.ok) throw new Error("Server error " + response.status);
    decks = await response.json();

    // If the cards have no German side, an older version of server.js is still running.
    if (!decks.length || !decks[0].cards[0].de) {
      throw new Error("Server is running an old version. Stop it with Ctrl+C and run npm start again.");
    }
    renderDecks();
  } catch (error) {
    deckGrid.innerHTML = "";
    const message = document.createElement("p");
    message.className = "status-message";
    message.textContent = "Sorry, the decks couldn't load. " + error.message;
    deckGrid.appendChild(message);
    console.error(error);
  }
}

function createDeckTile(emojiText, nameText, cards, extraClass) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "deck-tile" + (extraClass ? " " + extraClass : "");

  const emoji = document.createElement("span");
  emoji.className = "deck-emoji";
  emoji.textContent = emojiText;

  const name = document.createElement("span");
  name.className = "deck-name";
  name.textContent = nameText;

  const count = document.createElement("span");
  count.className = "deck-count";
  count.textContent = cards.length + " words";

  tile.append(emoji, name, count);
  tile.addEventListener("click", () => startDeck(nameText, cards));
  return tile;
}

function renderDecks() {
  deckGrid.innerHTML = "";
  decks.forEach((deck) => {
    deckGrid.appendChild(createDeckTile(deck.emoji, deck.name, deck.cards));
  });

  // "Mix all decks" combines every built-in word into one big deck.
  const allCards = decks.flatMap((deck) => deck.cards);
  deckGrid.appendChild(createDeckTile("🎲", "Mix all decks", allCards, "mix"));
}

// Mode and direction switches (two small button groups on the home screen).
document.querySelectorAll(".seg-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const isMode = "mode" in button.dataset;
    if (isMode) mode = button.dataset.mode;
    else direction = button.dataset.direction;

    button.parentElement.querySelectorAll(".seg-btn").forEach((b) => {
      b.classList.toggle("active", b === button);
      b.setAttribute("aria-pressed", b === button);
    });
  });
});

function renderCustomWords() {
  customList.innerHTML = "";
  customWords.forEach((word, index) => {
    const item = document.createElement("li");
    // textContent keeps whatever the learner types from being treated as HTML.
    const label = document.createElement("span");
    label.textContent = word.de + " = " + word.en;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-word";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Remove " + word.de);
    remove.addEventListener("click", () => {
      customWords.splice(index, 1);
      renderCustomWords();
    });

    item.append(label, remove);
    customList.appendChild(item);
  });

  const count = customWords.length;
  studyCustomBtn.disabled = count === 0;
  studyCustomBtn.textContent = count === 0
    ? "Study my words"
    : "Study my words (" + count + ")";
}

customForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const de = customDe.value.trim();
  const en = customEn.value.trim();
  if (!de || !en) return;

  customWords.push({ de, en });
  renderCustomWords();
  customForm.reset();
  customDe.focus();
});

studyCustomBtn.addEventListener("click", () => {
  startDeck("My words", [...customWords]);
});

// ---------- Study screen (shared by both modes) ----------
function startDeck(name, cards) {
  currentDeck = { name, cards };
  startRound(cards);
}

function startRound(cards) {
  queue = shuffle(cards);
  position = 0;
  missed = [];
  studyTitle.textContent = currentDeck.name + (mode === "quiz" ? " · Quiz" : "");
  flipMode.hidden = mode !== "flip";
  quizMode.hidden = mode !== "quiz";
  showScreen("study");
  showCurrent();
}

function showCurrent() {
  answered = false;
  progressText.textContent = "Card " + (position + 1) + " of " + queue.length;
  progressFill.style.width = (position / queue.length) * 100 + "%";

  if (mode === "flip") showFlipCard();
  else showQuizQuestion();

  updateListenButton();
}

function nextCard(knewIt) {
  if (!knewIt) missed.push(queue[position]);
  position++;
  stopSpeaking();

  if (position < queue.length) {
    showCurrent();
  } else {
    progressFill.style.width = "100%";
    showResults();
  }
}

$("back-home").addEventListener("click", () => showScreen("home"));

// ---------- Flip card mode ----------
function showFlipCard() {
  const card = queue[position];

  // Turn the card back to the front instantly (no animation),
  // so the next answer never peeks through during the flip.
  const inner = flashcard.querySelector(".card-inner");
  inner.style.transition = "none";
  flashcard.classList.remove("flipped");
  void inner.offsetWidth; // forces the browser to apply the change now
  inner.style.transition = "";

  $("front-label").textContent = questionLabel();
  $("front-word").textContent = questionSide(card);
  $("back-label").textContent = answerLabel();
  $("back-word").textContent = answerSide(card);
  answerButtons.hidden = true;
  flipHint.hidden = false;
}

function flipCard() {
  const isFlipped = flashcard.classList.toggle("flipped");
  // The answer buttons appear once the learner has seen the other side.
  if (isFlipped) {
    answered = true;
    answerButtons.hidden = false;
    flipHint.hidden = true;
    updateListenButton();
  }
}

flashcard.addEventListener("click", flipCard);
$("knew-it").addEventListener("click", () => nextCard(true));
$("still-learning").addEventListener("click", () => nextCard(false));

// ---------- Quiz mode ----------
// Builds 4 choices: the right answer plus 3 others from the same deck.
// Small decks (like a short custom list) borrow extra choices from all built-in words.
function buildChoices(card) {
  const correct = answerSide(card);
  const pool = [...currentDeck.cards, ...decks.flatMap((d) => d.cards)]
    .map(answerSide)
    .filter((text) => text !== correct);
  const unique = [...new Set(pool)];

  // Prefer wrong answers from the current deck, then fill from the rest.
  const fromDeck = shuffle(unique.filter((t) => currentDeck.cards.some((c) => answerSide(c) === t)));
  const others = shuffle(unique.filter((t) => !fromDeck.includes(t)));
  const wrong = [...fromDeck, ...others].slice(0, 3);

  return shuffle([correct, ...wrong]);
}

function showQuizQuestion() {
  const card = queue[position];
  $("quiz-label").textContent = questionLabel() + " · pick the " + answerLabel() + " meaning";
  $("quiz-word").textContent = questionSide(card);
  quizFeedback.textContent = "";
  quizNext.hidden = true;

  quizChoices.innerHTML = "";
  buildChoices(card).forEach((text, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";

    const key = document.createElement("span");
    key.className = "choice-key";
    key.textContent = index + 1;

    const label = document.createElement("span");
    label.textContent = text;

    button.append(key, label);
    button.dataset.answer = text;
    button.addEventListener("click", () => chooseAnswer(button));
    quizChoices.appendChild(button);
  });
}

function chooseAnswer(chosen) {
  if (answered) return;
  answered = true;

  const card = queue[position];
  const correct = answerSide(card);
  const isRight = chosen.dataset.answer === correct;

  quizChoices.querySelectorAll(".choice").forEach((button) => {
    button.disabled = true;
    if (button.dataset.answer === correct) button.classList.add("correct");
  });

  if (isRight) {
    quizFeedback.textContent = "✅ Richtig!";
  } else {
    chosen.classList.add("wrong");
    quizFeedback.textContent = "Not quite: " + card.de + " = " + card.en;
    missed.push(card);
  }

  quizNext.hidden = false;
  quizNext.focus();
  updateListenButton();
}

// Missed quiz words were already recorded in chooseAnswer, so count this as "known" here.
quizNext.addEventListener("click", () => nextCard(true));

// ---------- Keyboard shortcuts ----------
// Flip cards: Space flips, → = I knew it, ← = Still learning.
// Quiz: 1–4 picks an answer, Enter goes to the next word.
document.addEventListener("keydown", (event) => {
  if (screens.study.hidden) return;

  if (mode === "flip") {
    if (event.key === " " && document.activeElement !== flashcard) {
      event.preventDefault();
      flipCard();
    } else if (!answerButtons.hidden && event.key === "ArrowRight") {
      nextCard(true);
    } else if (!answerButtons.hidden && event.key === "ArrowLeft") {
      nextCard(false);
    }
  } else {
    const choice = quizChoices.querySelectorAll(".choice")[Number(event.key) - 1];
    if (!answered && choice) {
      chooseAnswer(choice);
    } else if (answered && event.key === "Enter" && document.activeElement !== quizNext) {
      nextCard(true);
    }
  }
});

// ---------- Results screen ----------
function showResults() {
  const total = queue.length;
  const known = total - missed.length;
  const percent = Math.round((known / total) * 100);

  let emoji, title;
  if (percent === 100) {
    emoji = "🎉";
    title = "Perfekt!";
  } else if (percent >= 70) {
    emoji = "🌟";
    title = "Sehr gut!";
  } else if (percent >= 40) {
    emoji = "💪";
    title = "Gute Arbeit!";
  } else {
    emoji = "🌱";
    title = "Weiter so!";
  }

  $("results-emoji").textContent = emoji;
  $("results-title").textContent = title;
  $("results-score").textContent = "You knew " + known + " of " + total + " words (" + percent + "%).";

  const missedList = $("missed-list");
  missedList.innerHTML = "";
  missed.forEach((card) => {
    const item = document.createElement("li");
    item.textContent = card.de + " = " + card.en;
    missedList.appendChild(item);
  });
  $("missed-heading").hidden = missed.length === 0;

  const retryBtn = $("retry-missed");
  retryBtn.hidden = missed.length === 0;
  retryBtn.textContent = "Retry missed words (" + missed.length + ")";

  showScreen("results");
}

$("retry-missed").addEventListener("click", () => startRound(missed));
$("study-again").addEventListener("click", () => startRound(currentDeck.cards));
$("results-home").addEventListener("click", () => showScreen("home"));
$("logo").addEventListener("click", () => showScreen("home"));

// ---------- Start ----------
renderCustomWords();
loadDecks();
