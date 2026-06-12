// betzone.js — game router
// Reads ?game= query param and loads the matching HUD from /assets/js/hud/
(function () {
  const GAMES = {
    baccarat1: { src: '/assets/js/hud/baccarat1.js' },
    baccarat2: { src: '/assets/js/hud/baccarat2.js' },
    baccarat3: { src: '/assets/js/hud/baccarat3.js' },
    gostop:    { src: '/assets/js/hud/gostop.js'    },
    oddeven:   { src: '/assets/js/hud/oddeven.js'   },
    colorgame: { src: '/assets/js/hud/colorgame.js' },
  };

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('game') || 'baccarat1';
  const entry  = GAMES[gameId] || GAMES['baccarat1'];

  const s = document.createElement('script');
  s.src = entry.src;
  document.head.appendChild(s);
})();
