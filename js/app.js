firebase.initializeApp(firebaseConfig);

const container = document.getElementById('dm-container');
const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 最近7天弹幕

let danmuList = [];
let currentIndex = 0;

const db = firebase.database();

// 1. 加载历史弹幕
db.ref('danmu').orderByChild('time').startAt(cutoff).once('value', snapshot => {
  danmuList = [];
  snapshot.forEach(child => {
    const data = child.val();
    if (!data.nickname) data.nickname = '匿名';
    danmuList.push(data);
  });
  startLoop();
});

// 2. 循环播放历史弹幕
function startLoop() {
  if (danmuList.length === 0) return;
  setInterval(() => {
    showDanmu(danmuList[currentIndex]);
    currentIndex = (currentIndex + 1) % danmuList.length;
  }, 1500);
}

// 3. 实时监听新弹幕
db.ref('danmu').limitToLast(1).on('child_added', snap => {
  const data = snap.val();
  if (!data.nickname) data.nickname = '匿名';
  danmuList.push(data);
  showDanmu(data, true);
});

// 4. 显示弹幕
function showDanmu({ text = '', nickname = '匿名' }, isNew = false) {
  const dm = document.createElement('div');
  dm.className = 'dm';

  const wrapper = document.createElement('div');
  wrapper.className = 'dm-wrapper';

  const nick = document.createElement('div');
  nick.className = 'dm-nick';
  nick.textContent = nickname;

  const bubble = document.createElement('div');
  bubble.className = 'dm-bubble';
  bubble.style.color = isNew ? '#ff3b81' : getRandomColor();  // ✅ 把颜色放在文字内容部分

  bubble.innerHTML = escapeHtml(text);

  wrapper.appendChild(nick);
  wrapper.appendChild(bubble);
  dm.appendChild(wrapper);

  dm.style.top = Math.random() * (window.innerHeight - 60) + 'px';
  container.appendChild(dm);

  setTimeout(() => container.removeChild(dm), 10000);
}


// 防XSS简单转义
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function getRandomColor() {
  const colors = ['#ff3b81', '#f9f871', '#8affff', '#a082ff', '#ff8b8b'];
  return colors[Math.floor(Math.random() * colors.length)];
}
