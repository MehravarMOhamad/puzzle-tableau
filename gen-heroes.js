// Generates 10 original superheroes: assets/heroes/<id>.svg (puzzle picture, kept private on the server)
// and public/icons/<id>.svg (small portrait used in the answer list). Replace these files with your own
// images any time (png/jpg/webp/svg) and edit assets/heroes.json to match.
const fs = require('fs');
const H = [
  { id:'voltra',   name:'Voltra',     bg:['#1b2a6b','#6a8dff'], suit:'#2457ff', accent:'#ffd23f', cape:'#f5b800', glow:'#fff3a0', e:'bolt'  },
  { id:'emberhawk',name:'Emberhawk',  bg:['#4a0e0e','#ff8a3d'], suit:'#c62828', accent:'#ffb300', cape:'#7a1010', glow:'#ffe0a0', e:'flame' },
  { id:'tidecaller',name:'Tidecaller',bg:['#04334a','#31c7c0'], suit:'#0e7c86', accent:'#e0fbff', cape:'#08475a', glow:'#c9fffa', e:'wave'  },
  { id:'verdant',  name:'Verdant',    bg:['#0f3d1e','#8bd34f'], suit:'#2e9d3f', accent:'#f3e34b', cape:'#1c6b2a', glow:'#eaffb5', e:'leaf'  },
  { id:'umbra',    name:'Umbra',      bg:['#120a2e','#6b3fa8'], suit:'#2b1b4d', accent:'#c9a6ff', cape:'#0b0620', glow:'#e9dcff', e:'moon'  },
  { id:'glacia',   name:'Glacia',     bg:['#143a63','#bfe6ff'], suit:'#5ab8f2', accent:'#ffffff', cape:'#2e7fbf', glow:'#ffffff', e:'snow'  },
  { id:'ironclad', name:'Ironclad',   bg:['#22272e','#8a96a3'], suit:'#6b7785', accent:'#ff4d3d', cape:'#3a424c', glow:'#ffd9d4', e:'hex'   },
  { id:'solara',   name:'Solara',     bg:['#7a2d00','#ffc93c'], suit:'#f28c00', accent:'#fff1b8', cape:'#c25a00', glow:'#fff7d1', e:'sun'   },
  { id:'quake',    name:'Quake',      bg:['#3b2415','#c49a6c'], suit:'#7a4b2a', accent:'#f2c14e', cape:'#4a2c17', glow:'#ffe8c7', e:'peak'  },
  { id:'zephyr',   name:'Zephyr',     bg:['#2d6fa8','#e8f6ff'], suit:'#f4f9ff', accent:'#3da5e8', cape:'#8cc9f0', glow:'#ffffff', e:'swirl' },
];
const emb = (k, c) => ({
  bolt:  `<polygon points="4,-22 -12,2 -1,2 -5,22 13,-4 2,-4" fill="${c}"/>`,
  flame: `<path d="M0-24C10-10 18-2 12 12 8 22-8 22-12 12-16 4-6 0-4-10-2-4 2-8 0-24Z" fill="${c}"/>`,
  wave:  `<path d="M-22 2Q-11-16 0 2T22 2M-22 16Q-11-2 0 16T22 16" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  leaf:  `<path d="M-18 18C-18-14 4-22 20-20 22-2 14 18-18 18Z" fill="${c}"/>`,
  moon:  `<path d="M8-22A22 22 0 1 0 8 22A17 17 0 1 1 8-22Z" fill="${c}"/>`,
  snow:  `<path d="M0-22V22M-19-11L19 11M-19 11L19-11" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
  hex:   `<polygon points="0,-23 20,-11.5 20,11.5 0,23 -20,11.5 -20,-11.5" fill="none" stroke="${c}" stroke-width="6"/><circle r="7" fill="${c}"/>`,
  sun:   `<circle r="11" fill="${c}"/><g stroke="${c}" stroke-width="4" stroke-linecap="round">${[0,1,2,3,4,5,6,7].map(i=>`<path transform="rotate(${i*45})" d="M0-16V-24"/>`).join('')}</g>`,
  peak:  `<polygon points="-24,20 -6,-12 4,2 12,-20 24,20" fill="${c}"/>`,
  swirl: `<path d="M-3 0a3 3 0 1 1 6 0a7 7 0 1 1-14 0a12 12 0 1 1 24 0a17 17 0 1 1-34 0" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
}[k]);

const big = (h, n) => {
  const tower = Array.from({length:10},(_,i)=>{ const ht = 140 + ((i*53 + n*37) % 190); return `<rect x="${i*80}" y="${800-ht}" width="76" height="${ht}" fill="#000" opacity=".28"/>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${h.bg[0]}"/><stop offset="1" stop-color="${h.bg[1]}"/></linearGradient></defs>
<rect width="800" height="800" fill="url(#g)"/>
<circle cx="${n%2?170:630}" cy="150" r="95" fill="${h.glow}" opacity=".85"/>
${tower}
<path d="M400 320 L150 730 Q400 660 650 730Z" fill="${h.cape}"/>
<rect x="330" y="540" width="62" height="200" rx="26" fill="${h.suit}"/><rect x="408" y="540" width="62" height="200" rx="26" fill="${h.suit}"/>
<rect x="322" y="705" width="78" height="55" rx="16" fill="${h.accent}"/><rect x="400" y="705" width="78" height="55" rx="16" fill="${h.accent}"/>
<path d="M318 300 H482 L508 560 H292Z" fill="${h.suit}"/>
<rect x="292" y="520" width="216" height="26" fill="${h.accent}"/>
<path d="M322 330 L225 215" stroke="${h.suit}" stroke-width="54" stroke-linecap="round"/><circle cx="218" cy="205" r="36" fill="${h.accent}"/>
<path d="M478 330 L575 440 L520 505" stroke="${h.suit}" stroke-width="54" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="515" cy="510" r="34" fill="${h.accent}"/>
<g transform="translate(400 405) scale(2.3)">${emb(h.e, h.accent)}</g>
<circle cx="400" cy="235" r="64" fill="#f0c9a0"/>
<path d="M336 240 A64 64 0 0 1 464 240 Q400 190 336 240Z" fill="${h.suit}"/>
<path d="M336 212 Q400 190 464 212 L460 256 Q400 240 340 256Z" fill="${h.accent}"/>
<ellipse cx="372" cy="232" rx="14" ry="8" fill="#fff"/><ellipse cx="428" cy="232" rx="14" ry="8" fill="#fff"/>
</svg>`;
};
const icon = (h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${h.bg[0]}"/><stop offset="1" stop-color="${h.bg[1]}"/></linearGradient><clipPath id="c"><circle cx="60" cy="60" r="58"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="120" height="120" fill="url(#g)"/>
<ellipse cx="60" cy="122" rx="44" ry="34" fill="${h.suit}"/><g transform="translate(60 106) scale(.6)">${emb(h.e,h.accent)}</g>
<circle cx="60" cy="56" r="30" fill="#f0c9a0"/><path d="M30 58 A30 30 0 0 1 90 58 Q60 36 30 58Z" fill="${h.suit}"/>
<path d="M30 46 Q60 34 90 46 L88 66 Q60 58 32 66Z" fill="${h.accent}"/>
<ellipse cx="48" cy="55" rx="7" ry="4" fill="#fff"/><ellipse cx="72" cy="55" rx="7" ry="4" fill="#fff"/></g>
<circle cx="60" cy="60" r="57" fill="none" stroke="#14213d" stroke-width="4"/></svg>`;

H.forEach((h, n) => {
  fs.writeFileSync(`assets/heroes/${h.id}.svg`, big(h, n));
});
console.log('Generated', H.length, 'heroes');
