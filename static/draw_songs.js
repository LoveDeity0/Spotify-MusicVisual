window.addEventListener("DOMContentLoaded", () => {
  const songs = document.querySelectorAll('.song');
  const audio = document.getElementById('audio-player');

  // 初始化背景图
  songs.forEach(song => {
    const cover = song.getAttribute('data-cover');
    song.style.backgroundImage = `url(${cover})`;
    song.style.animationDelay = `${Math.random() * 2}s`;
  });

  songs.forEach(song => {
    song.addEventListener('click', () => {
      const isPlaying = song.classList.contains('playing');
      const src = song.getAttribute('data-src');
      const label = song.querySelector('.label');

      if (isPlaying) {
        song.classList.remove('playing');
        audio.pause();
        label.textContent = `▶️ ${label.textContent.replace(/^[▶️⏸️] /, '')}`;
      } else {
        songs.forEach(s => {
          s.classList.remove('playing');
          s.querySelector('.label').textContent = `▶️ ${s.querySelector('.label').textContent.replace(/^[▶️⏸️] /, '')}`;
        });

        song.classList.add('playing');
        label.textContent = `⏸️ ${label.textContent.replace(/^[▶️⏸️] /, '')}`;
        audio.src = src;
        audio.play();
      }
    });
  });

  audio.addEventListener("ended", () => {
    songs.forEach(song => {
      song.classList.remove("playing");
      const label = song.querySelector('.label');
      label.textContent = `▶️ ${label.textContent.replace(/^[▶️⏸️] /, '')}`;
    });
  });
});