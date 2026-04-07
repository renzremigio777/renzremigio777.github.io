
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
      }
    }, 2);
  }

  startProgress();

  
});
