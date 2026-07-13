// Go-Stop — Korean flower-card casino game: GO or STOP bet tiles
window.GAME_CONFIG = {
  gameId:   'gostop',
  gameType: 'gostop',
  title:    'Go-Stop Live',
  limits:   '₱50–10,000',
  videoSrc: 'https://studio.jrta.online/play?stream=gostop',
  videoEnabled: true,
  tileColors: {
    go:   { fill: '#6b1a1a', stroke: '#ff4040', neon: '#ff7070' },
    stop: { fill: '#173f7a', stroke: '#4080ff', neon: '#6699ff' },
  },
};

const _s = document.createElement('script');
_s.src = '../assets/js/hudv5.js';
document.head.appendChild(_s);
