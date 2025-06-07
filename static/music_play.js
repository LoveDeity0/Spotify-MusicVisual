const songs = [
  {
    cover: 'static/fig/4.png',
    title: 'Suave',
    artist: 'Nayer',
    audio: 'static/music/4.mp3',
  },
  {
    cover: 'static/fig/5.png',
    title: 'Good Vibes',
    artist: 'Regard',
    audio: 'static/music/5.mp3',
  },
  {
    cover: 'static/fig/6.png',
    title: 'rises the moon',
    artist: 'Liana Flores',
    audio: 'static/music/6.mp3',
  }
];

const audio = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const progressBar = document.getElementById('progress-bar');
const timeLabel = document.getElementById('time-label');

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 播放按钮
playBtn.addEventListener('click', () => {
  audio.play();
});

// 暂停按钮
pauseBtn.addEventListener('click', () => {
  audio.pause();
});

// 更新进度条与时间
audio.addEventListener('timeupdate', () => {
  const current = audio.currentTime;
  const total = audio.duration || 0;
  progressBar.value = total ? (current / total) * 100 : 0;
  timeLabel.textContent = `${formatTime(current)} / ${formatTime(total)}`;
});

// 拖动进度条
progressBar.addEventListener('input', () => {
  const percent = progressBar.value / 100;
  audio.currentTime = audio.duration * percent;
});

// 切换歌曲
document.querySelectorAll('.singer-bottom .list').forEach(item => {
  item.addEventListener('click', () => {
    const index = item.getAttribute('data-index');
    const song = songs[index];

    document.querySelector('#cover img').src = song.cover;
    document.getElementById('song-title').textContent = song.title;
    document.getElementById('song-artist').textContent = song.artist;
    audio.src = song.audio;
    audio.play(); // 自动播放新切换的歌曲
  });
});