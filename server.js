// Deutsch Lernen server
// Serves the web page from /public and sends the built-in flashcard decks.

const express = require("express");
const path = require("path");

const app = express();

// Render (and most hosts) tell us which port to use through the PORT variable.
const PORT = process.env.PORT || 3000;

// Built-in decks for complete beginners. Each card has a German side (de)
// and an English side (en). German nouns include der/die/das so learners pick up the gender.
const decks = [
  {
    id: "greetings",
    name: "Greetings",
    emoji: "👋",
    cards: [
      { de: "hallo", en: "hello" },
      { de: "tschüss", en: "bye" },
      { de: "guten Morgen", en: "good morning" },
      { de: "guten Tag", en: "good day" },
      { de: "guten Abend", en: "good evening" },
      { de: "gute Nacht", en: "good night" },
      { de: "bitte", en: "please" },
      { de: "danke", en: "thank you" },
      { de: "gern geschehen", en: "you're welcome" },
      { de: "Wie geht's?", en: "How are you?" },
      { de: "gut", en: "good / fine" },
      { de: "freut mich", en: "nice to meet you" },
      { de: "Entschuldigung", en: "excuse me / sorry" },
      { de: "auf Wiedersehen", en: "goodbye" },
      { de: "Wie heißt du?", en: "What's your name?" }
    ]
  },
  {
    id: "food",
    name: "Food",
    emoji: "🥨",
    cards: [
      { de: "das Wasser", en: "water" },
      { de: "das Brot", en: "bread" },
      { de: "die Milch", en: "milk" },
      { de: "der Käse", en: "cheese" },
      { de: "der Apfel", en: "apple" },
      { de: "das Ei", en: "egg" },
      { de: "das Hähnchen", en: "chicken" },
      { de: "der Reis", en: "rice" },
      { de: "das Obst", en: "fruit" },
      { de: "der Kaffee", en: "coffee" },
      { de: "der Fisch", en: "fish" },
      { de: "die Suppe", en: "soup" },
      { de: "die Orange", en: "orange (fruit)" },
      { de: "das Fleisch", en: "meat" },
      { de: "der Zucker", en: "sugar" }
    ]
  },
  {
    id: "colors",
    name: "Colors",
    emoji: "🎨",
    cards: [
      { de: "rot", en: "red" },
      { de: "blau", en: "blue" },
      { de: "gelb", en: "yellow" },
      { de: "grün", en: "green" },
      { de: "schwarz", en: "black" },
      { de: "weiß", en: "white" },
      { de: "orange", en: "orange (color)" },
      { de: "lila", en: "purple" },
      { de: "rosa", en: "pink" },
      { de: "grau", en: "gray" },
      { de: "braun", en: "brown" },
      { de: "golden", en: "gold" },
      { de: "silbern", en: "silver" },
      { de: "hell", en: "light (color)" },
      { de: "dunkel", en: "dark (color)" }
    ]
  },
  {
    id: "numbers",
    name: "Numbers",
    emoji: "🔢",
    cards: [
      { de: "eins", en: "one (1)" },
      { de: "zwei", en: "two (2)" },
      { de: "drei", en: "three (3)" },
      { de: "vier", en: "four (4)" },
      { de: "fünf", en: "five (5)" },
      { de: "sechs", en: "six (6)" },
      { de: "sieben", en: "seven (7)" },
      { de: "acht", en: "eight (8)" },
      { de: "neun", en: "nine (9)" },
      { de: "zehn", en: "ten (10)" },
      { de: "elf", en: "eleven (11)" },
      { de: "zwölf", en: "twelve (12)" },
      { de: "zwanzig", en: "twenty (20)" },
      { de: "fünfzig", en: "fifty (50)" },
      { de: "hundert", en: "one hundred (100)" }
    ]
  },
  {
    id: "animals",
    name: "Animals",
    emoji: "🐶",
    cards: [
      { de: "der Hund", en: "the dog" },
      { de: "die Katze", en: "the cat" },
      { de: "der Vogel", en: "the bird" },
      { de: "der Fisch", en: "the fish" },
      { de: "das Pferd", en: "the horse" },
      { de: "die Kuh", en: "the cow" },
      { de: "das Schwein", en: "the pig" },
      { de: "das Schaf", en: "the sheep" },
      { de: "die Maus", en: "the mouse" },
      { de: "das Kaninchen", en: "the rabbit" },
      { de: "der Löwe", en: "the lion" },
      { de: "der Bär", en: "the bear" },
      { de: "der Affe", en: "the monkey" },
      { de: "die Schildkröte", en: "the turtle" },
      { de: "der Schmetterling", en: "the butterfly" }
    ]
  },
  {
    id: "family",
    name: "Family",
    emoji: "👨‍👩‍👧",
    cards: [
      { de: "die Familie", en: "the family" },
      { de: "die Mutter", en: "the mother" },
      { de: "der Vater", en: "the father" },
      { de: "die Schwester", en: "the sister" },
      { de: "der Bruder", en: "the brother" },
      { de: "die Tochter", en: "the daughter" },
      { de: "der Sohn", en: "the son" },
      { de: "die Großmutter", en: "the grandmother" },
      { de: "der Großvater", en: "the grandfather" },
      { de: "die Tante", en: "the aunt" },
      { de: "der Onkel", en: "the uncle" },
      { de: "die Cousine", en: "the cousin (female)" },
      { de: "der Cousin", en: "the cousin (male)" },
      { de: "die Frau", en: "the wife / woman" },
      { de: "der Mann", en: "the husband / man" }
    ]
  }
];

// Serve index.html, style.css and script.js from the public folder.
app.use(express.static(path.join(__dirname, "public")));

// The page calls this when it loads to get the built-in decks.
app.get("/api/decks", (req, res) => {
  res.json(decks);
});

app.listen(PORT, () => {
  console.log(`Deutsch Lernen is running at http://localhost:${PORT}`);
});
