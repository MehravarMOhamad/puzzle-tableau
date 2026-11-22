// Question depository. Each category is a generator returning { text, answer, hint, match(input) }.
// To add a category (e.g. 'geography'), register one more entry in CATEGORIES.
// The answer never leaves the server.
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// ---- fractions: add / subtract two PROPER fractions (one-digit numerator and denominator)
const proper = () => { const d = rnd(2, 9); return [rnd(1, d - 1), d]; }; // always < 1
function fractionQuestion(num, den, text) {
  const g = gcd(num, den);
  return {
    text, answer: `${num / g}/${den / g}`,
    hint: 'Answer as a fraction like 5/6. Any equal fraction is accepted (10/12 = 5/6).',
    match(input) {
      const m = String(input).trim().match(/^(\d+)\s*\/\s*(\d+)$/);
      return !!m && +m[2] > 0 && +m[1] * den === num * +m[2];
    },
  };
}
function fractions() {
  const add = Math.random() < 0.5;
  for (;;) {
    const [a, b] = proper(), [c, d] = proper();
    if (add) {
      const num = a * d + c * b, den = b * d;
      if (num < den) return fractionQuestion(num, den, `${a}/${b} + ${c}/${d}`); // sum stays below 1
    } else {
      if (a * d === c * b) continue; // equal fractions would give 0
      const [l, r] = a * d > c * b ? [[a, b], [c, d]] : [[c, d], [a, b]]; // bigger fraction first -> positive result
      return fractionQuestion(l[0] * r[1] - r[0] * l[1], l[1] * r[1], `${l[0]}/${l[1]} \u2212 ${r[0]}/${r[1]}`);
    }
  }
}

// ---- arithmetic (kept for later use): 2-digit x 2-digit, or the exact division made from it
function arithmetic() {
  const a = rnd(11, 99), b = rnd(11, 99), p = a * b;
  if (Math.random() < 0.5) return { text: `${a} \u00d7 ${b}`, answer: p };
  return Math.random() < 0.5 ? { text: `${p} \u00f7 ${a}`, answer: b } : { text: `${p} \u00f7 ${b}`, answer: a };
}

const CATEGORIES = {
  fractions: { label: 'Adding / subtracting proper fractions', generate: fractions },
  arithmetic: { label: '2-digit multiplication / exact division', generate: arithmetic },
};

function generate(category = 'fractions') {
  return (CATEGORIES[category] || CATEGORIES.fractions).generate();
}
function check(q, input) {
  return q.match ? q.match(input) : String(q.answer).trim().toLowerCase() === String(input).trim().toLowerCase();
}
module.exports = { generate, check, CATEGORIES };
