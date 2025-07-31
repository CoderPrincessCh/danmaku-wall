firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const container = document.getElementById('dm-container');
const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

let danmuList = [];
let currentIndex = 0;

// 🚀 1. 历史弹幕加载
db.ref('danmu').orderByChild('time').startAt(cutoff).once('value', snapshot => {
  snapshot.forEach(child => {
    const data = child.val();
    if (!data.nickname) data.nickname = '匿名';
    danmuList.push(data);
  });
  startLoop();
});

// 🚀 2. 弹幕循环播放
function startLoop() {
  if (danmuList.length === 0) return;
  setInterval(() => {
    showDanmu(danmuList[currentIndex]);
    currentIndex = (currentIndex + 1) % danmuList.length;
  }, 1500);
}

// 🚀 3. 实时新弹幕监听
db.ref('danmu').limitToLast(1).on('child_added', snap => {
  const data = snap.val();
  if (!data.nickname) data.nickname = '匿名';
  danmuList.push(data);
  showDanmu(data, true);
});

// 🎨 4. 展示弹幕
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
  bubble.style.color = isNew ? '#ff3b81' : getRandomColor();
  bubble.innerHTML = escapeHtml(text);

  wrapper.appendChild(nick);
  wrapper.appendChild(bubble);
  dm.appendChild(wrapper);

  dm.style.top = Math.random() * (window.innerHeight - 60) + 'px';
  container.appendChild(dm);

  setTimeout(() => container.removeChild(dm), 10000);
}

// ✅ 5. 防XSS转义
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function getRandomColor() {
  const colors = ['#ff3b81', '#f9f871', '#8affff', '#a082ff', '#ff8b8b'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ✨ 6. 发送弹幕逻辑
const input = document.getElementById('dm-input');
const nicknameInput = document.getElementById('dm-nickname');
const btn = document.getElementById('send-btn');
const status = document.getElementById('status');

btn.onclick = () => {
  const text = input.value.trim();
  const nickname = nicknameInput.value.trim() || '匿名';

  if (!text) {
    status.textContent = '弹幕不能为空';
    return;
  }

  if (text.length > 30) {
    status.textContent = '弹幕不能超过30个字';
    return;
  }

  if (nickname.length > 8) {
    status.textContent = '昵称不能超过8个字';
    return;
  }

  btn.disabled = true;
  db.ref('danmu').push({ text, nickname, time: Date.now() })
    .then(() => {
      input.value = '';
      nicknameInput.value = '';
      status.textContent = '发送成功！';
    })
    .catch(() => {
      status.textContent = '发送失败，请重试';
    })
    .finally(() => {
      btn.disabled = false;
    });
};
