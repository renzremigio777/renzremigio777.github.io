// VIP Baccarat — teal/amber luxury theme, high limits
window.GAME_CONFIG = {
  gameId:   'baccarat3',
  title:    'VIP Baccarat',
  limits:   '₱1,000–500,000',
  videoSrc: '/assets/videos/bacarrat-stream.mp4',
  colors: {
    // Player side → teal/cyan
    PLAYERBLUE:  '#00c8a8',
    STROKEBLUE:  '#00e5cc',
    NEONBLUE:    '#00ffe0',
    FILLBLUE:    '#002820',
    // Banker side → amber/orange
    BANKERRED:   '#e07020',
    STROKERED:   '#f09030',
    NEONRED:     '#ffb040',
    FILLRED:     '#2a1000',
    // Tie → violet
    TIEGREEN:    '#9060e0',
    STROKEGREEN: '#a878f8',
    NEONGREEN:   '#c8a8ff',
    FILLGREEN:   '#1a0840',
  },
};

const _s = document.createElement('script');
_s.src = '/assets/js/hudv5.js';
document.head.appendChild(_s);
