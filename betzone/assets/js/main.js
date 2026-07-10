
window.addEventListener("load", () => {
  const loadingOverlay = document.getElementById("loading-overlay");
  const loaderBarInner = document.getElementById("loader-bar-inner");
  const progressText   = document.getElementById("progress-text");
  const statusMsgEl    = document.getElementById("loader-status-msg");

  const LOAD_MSGS = [
    'Connecting to tables…',
    'Loading dealer feeds…',
    'Fetching game data…',
    'Syncing live results…',
    'Preparing your session…',
    'Almost ready…',
  ];
  let msgIdx = 0;
  const msgCycle = setInterval(() => {
    if (!statusMsgEl) return;
    statusMsgEl.style.opacity = '0';
    setTimeout(() => {
      msgIdx = (msgIdx + 1) % LOAD_MSGS.length;
      statusMsgEl.textContent = LOAD_MSGS[msgIdx];
      statusMsgEl.style.opacity = '1';
    }, 160);
  }, 750);

  let progressValue = 10;
  let poll = null;

  function startVideo() {
    const video = document.getElementById('video');
    const videoSrc = 'http://playertest.longtailvideo.com/adaptive/wowzaid3/playlist.m3u8';

    if (video) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
      } else if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
      }
    }
  }

  async function initGames() {
    const res = await fetch("assets/data/all-games.json");
    const allGames = await res.json();
    allGames.forEach(game => {
      console.log(game);
      const gridItem = document.createElement('a');
      gridItem.setAttribute('href', game.link);
      gridItem.className = 'grid-item';
    });
  }

  function startProgress() {
    poll = setInterval(() => {
      progressValue += 1;
      if (loaderBarInner) loaderBarInner.style.width = progressValue + '%';
      if (progressText)   progressText.textContent   = progressValue + '%';

      if (progressValue === 48 || progressValue === 93) {
        clearInterval(poll);
        setTimeout(() => startProgress(), 300);
      } else if (progressValue >= 100) {
        clearInterval(poll);
        clearInterval(msgCycle);
        if (statusMsgEl) {
          statusMsgEl.style.opacity = '0';
          setTimeout(() => {
            statusMsgEl.textContent = 'Ready to play!';
            statusMsgEl.style.opacity = '1';
          }, 160);
        }
        setTimeout(() => {
          loadingOverlay.classList.add('fading');
          setTimeout(() => loadingOverlay.remove(), 950);
        }, 280);
        startVideo();
        initGames();
      }
    }, 2);
  }

  startProgress();
});
