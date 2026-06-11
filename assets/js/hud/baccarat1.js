// Speed Baccarat 1 — standard table
window.GAME_CONFIG = {
  gameId:   'baccarat1',
  title:    'Speed Baccarat 1',
  limits:   '₱50–10,000',
  videoSrc: '/assets/videos/bacarrat-stream.mp4',
  // No color overrides — uses hudv5 defaults
};

const _s = document.createElement('script');
_s.src = '/assets/js/hudv5.js';
document.head.appendChild(_s);
