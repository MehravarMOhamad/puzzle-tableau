// Question depository. Each category is a generator returning { text, answer }.
// To add a category (e.g. 'geography'), register one more entry in CATEGORIES.
// The answer never leaves the server.
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const CATEGORIES = {
  math: {
    label: '2-digit multiplication / exact division',
    generate() {
      const a = rnd(11, 99), b = rnd(11, 99), p = a * b; // always build the multiplication first
      if (Math.random() < 0.5) return { text: `${a} \u00d7 ${b}`, answer: p };
      // ...then sometimes express it backwards as a division, so it always divides with no remainder
      return Math.random() < 0.5 ? { text: `${p} \u00f7 ${a}`, answer: b } : { text: `${p} \u00f7 ${b}`, answer: a };
    },
  },
};

function generate(category = 'math') {
  return (CATEGORIES[category] || CATEGORIES.math).generate();
}
function check(q, input) {
  return String(q.answer).trim().toLowerCase() === String(input).trim().toLowerCase();
}
module.exports = { generate, check, CATEGORIES };
