// 留言板脚本（外部文件）
/*
    - 功能：处理留言板的加载、提交、删除和本地持久化
    - 说明：避免使用 innerHTML，使用 textContent/创建元素来防止 XSS
*/

const STORAGE_KEY = 'fzu_messages_v2';
const form = document.getElementById('messageForm');
const nicknameInput = document.getElementById('nicknameInput');
const messageContent = document.getElementById('messageContent');
const messagesList = document.getElementById('messagesList');
const clearAllBtn = document.getElementById('clearAllBtn');
const exportBtn = document.getElementById('exportBtn');

let messagesArray = [];

function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : null; }
    catch (e) { console.warn('localStorage parse error', e); return null; }
}

function loadMessagesFromLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);
    if (parsed && Array.isArray(parsed)) messagesArray = parsed;
    else if (raw === null) {
        messagesArray = [
            {nickname:'旗山追梦人',content:'在福大读书四年，图书馆的灯光陪我走过无数夜晚，祝母校越来越好！',time:'2025-03-15 10:23'},
            {nickname:'榕城学子',content:'明德至诚，博学远志。今年刚成为福大研究生，热爱这里的科研氛围！',time:'2025-03-18 16:10'}
        ];
        persist();
    } else messagesArray = [];
    renderMessages();
}

function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesArray)); }
    catch (e) { console.error('保存留言失败', e); }
}

function formatNow() { return new Date().toLocaleString(); }

function createMessageCard(msg, index) {
    const card = document.createElement('div');
    card.className = 'message-card';

    const left = document.createElement('div');
    left.style.flex = '1';

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    const nameEl = document.createElement('strong');
    nameEl.textContent = msg.nickname || '匿名福大人';
    const timeEl = document.createElement('span');
    timeEl.className = 'msg-time';
    timeEl.textContent = msg.time || '';
    meta.appendChild(nameEl);
    meta.appendChild(timeEl);

    const para = document.createElement('p');
    para.textContent = msg.content;
    left.appendChild(meta);
    left.appendChild(para);

    const controls = document.createElement('div');
    controls.className = 'msg-controls';
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-small';
    delBtn.textContent = '删除';
    delBtn.title = '删除此条留言';
    delBtn.addEventListener('click', () => { deleteMessage(index); });

    controls.appendChild(delBtn);

    card.appendChild(left);
    card.appendChild(controls);
    return card;
}

function renderMessages() {
    messagesList.innerHTML = '';
    if (!messagesArray || messagesArray.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-msg';
        empty.textContent = '🍃 暂时没有留言，快来写下你对福大的祝福吧 🍃';
        messagesList.appendChild(empty);
        return;
    }
    messagesArray.forEach((m, idx) => {
        const card = createMessageCard(m, idx);
        messagesList.appendChild(card);
    });
    messagesList.scrollTop = messagesList.scrollHeight;
}

function addMessage(nickname, content) {
    const msg = { nickname: nickname || '有福之人', content: content, time: formatNow() };
    messagesArray.push(msg);
    persist();
    renderMessages();
}

function deleteMessage(index) {
    if (index >=0 && index < messagesArray.length) {
        messagesArray.splice(index,1);
        persist();
        renderMessages();
    }
}

function clearAllMessages() {
    if (!confirm('确定要清空所有留言吗？该操作不可撤销。')) return;
    messagesArray = [];
    persist();
    renderMessages();
}

// 导出留言为 JSON 并触发下载
function exportMessages() {
    if (!messagesArray || messagesArray.length === 0) {
        alert('当前没有留言可导出。');
        return;
    }
    try {
        const data = JSON.stringify(messagesArray, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fzu_messages.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('导出留言失败', e);
        alert('导出失败，请检查控制台错误信息。');
    }
}

if (form) {
    form.addEventListener('submit', function(e){
        e.preventDefault();
        const nick = nicknameInput.value.trim();
        const content = messageContent.value.trim();
        if (!content) { alert('请输入留言内容'); return; }
        addMessage(nick, content);
        messageContent.value = '';
        nicknameInput.value = '';
        const btn = document.getElementById('submitMessageBtn');
        const old = btn.textContent;
        btn.textContent = '✓ 已提交';
        setTimeout(()=> btn.textContent = old, 1000);
    });
}

if (messageContent) {
    messageContent.addEventListener('keydown', (e)=>{
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit', {cancelable:true}));
        }
    });
}

if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllMessages);
if (exportBtn) exportBtn.addEventListener('click', exportMessages);

loadMessagesFromLocal();
