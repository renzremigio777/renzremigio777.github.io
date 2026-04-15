
window.addEventListener("load", () => {
  const loadingOverlay = document.getElementById("loading-overlay");
  const progress = document.getElementById("progress");
  const progressText = document.getElementById("progress-text");
  const box = progress.getBBox();
  let progressValue = 10//box.width;

  let poll = null;

  function startVideo() {
    const video = document.getElementById('video');
    const videoSrc = 'http://playertest.longtailvideo.com/adaptive/wowzaid3/playlist.m3u8';

    if(video) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari
        video.src = videoSrc;
      } else if (Hls.isSupported()) {
        // Other browsers
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
      console.log(game)
      const a = `<a href="pages/baccarat.html" class="grid-item">
        <div class="grid-item-media">
          <img class="grid-item-thumbnail" src="${game.link}" alt="">
          <img class="grid-item-road" src="assets/images/game-road.png" alt="">
        </div>
        <div>
          <p class="grid-title">Speed Baccarat Live T1<img src="assets/images/flags/ph.svg" alt=""></p>
          <div class="grid-summary">
            <p><i class="icon-user"></i>100</p>
            <p><i class="icon-casino"></i>100</p>
          </div>
        </div>
      </a>`

      const gridItem = document.createElement('a');
      gridItem.setAttribute('href', game.link);
      gridItem.className = 'grid-item';

     
           
    });
  } 

  function startProgress() {
    poll = setInterval(async () => {
      progressValue += 1;
      progress.setAttribute("width", progressValue);
      progressText.innerHTML = progressValue + '%'
      if (progressValue === 48 || progressValue === 93) {
        clearInterval(poll);
        setTimeout(() => {
          startProgress(); // resume after 5s
        }, 300);
      }
      else if (progressValue >= 100) {
        clearInterval(poll);
        console.log('Complete');
        loadingOverlay.classList.add('fading');
        setTimeout(() => { loadingOverlay.remove() }, 900);
        startVideo();
        initGames();

      }
    }, 2);
  }

 

  startProgress();

  
});
