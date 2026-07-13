// Odd / Even — number ball reveal: bet on ODD or EVEN outcome
window.GAME_CONFIG = {
  gameId:   'oddeven',
  gameType: 'oddeven',
  title:    'Odd / Even',
  limits:   '₱50–10,000',
  videoSrc: 'https://studio.jrta.online/play?stream=oddeven',
  videoEnabled: true,
  tileColors: {
    odd:  { fill: '#120430', stroke: '#b040ff', neon: '#cc77ff' },
    even: { fill: '#03180a', stroke: '#10c060', neon: '#30e880' },
  },
};

const _s = document.createElement('script');
_s.src = '../assets/js/hudv5.js';
document.head.appendChild(_s);
