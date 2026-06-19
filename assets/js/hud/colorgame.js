// Color Game — Philippine peryahan carnival game: 6 color tiles, 3 dice
window.GAME_CONFIG = {
  gameId:   'colorgame',
  gameType: 'colorgame',
  title:    'Color Game Live',
  limits:   '₱50–10,000',
  videoSrc: 'https://platform.jrta.online/play?stream=testiligan',
};

const _s = document.createElement('script');
_s.src = '/assets/js/hudv5.js';
document.head.appendChild(_s);
