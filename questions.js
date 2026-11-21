// Question depository. Each category is a generator returning { text, answer }.
// To add a category (e.g. 'geography'), register one more entry in CATEGORIES.
// The answer is always compared as a string/number on the server, never sent to clients.
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const CATEGORIES = {
  math: {
    label: '2-digit multiplication / division',
    generate() {
      if (Math.random() < 0.5) {
        const a = rnd(11, 99), b = rnd(11, 99);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      // divisible: 2-digit dividend ÷ 2-digit divisor (quotient 2..9)
      const d = rnd(10, 49), q = rnd(2, Math.floor(99 / d));
      return { text: `${d * q} ÷ ${d}`, answer: q };
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
