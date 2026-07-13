// Speed Baccarat 2 — gold/rose theme, higher limits
window.GAME_CONFIG = {
  gameId:   'baccarat2',
  title:    'Speed Baccarat 2',
  limits:   '₱100–50,000',
  videoSrc: 'https://studio.jrta.online/play?stream=baccarat2',
  videoEnabled: true,
  colors: {
    // Player side → gold
    PLAYERBLUE:  '#c8a832',
    STROKEBLUE:  '#d4b84a',
    NEONBLUE:    '#ffd700',
    FILLBLUE:    '#3a2a00',
    // Banker side → rose/pink
    BANKERRED:   '#e0509a',
    STROKERED:   '#e870b0',
    NEONRED:     '#ff88cc',
    FILLRED:     '#3a0020',
    // Tie → emerald (unchanged)
  },
};

const _s = document.createElement('script');
_s.src = '../assets/js/hudv5.js';
document.head.appendChild(_s);
