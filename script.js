const HF_TOKEN = "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"
const PROVIDER = "together"
const MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.1"
const API_URL = ` https://router.huggingface.co/${PROVIDER}/v1/chat/completions`
const MAX_HISTORY = 10

const messages = [
    {
        role: "system",
        content: "You are a helpful assistant that can answer questions and help with tasks."
    }
]

const chatBox = document.getElementById('chat');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('errorBox');
const clearBtn = document.getElementById('clearBtn');
const themeToggle = document.getElementById('themeToggle');

function renderMessages() {
    chatBox.innerHTML = '';
    messages.slice(1).forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.role === 'user' ? 'user' : 'assistant'}`;
        div.innerHTML = `<span class=\"fw-bold\">${msg.role === 'user' ? 'You' : 'Assistant'}:</span> <span>${msg.content.replace(/\n/g, '<br>')}</span>`;
        chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoading(show) {
    loading.classList.toggle('d-none', !show);
    loading.textContent = show ? 'Loading...' : '';
}

function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('d-none');
}

function hideError() {
    errorBox.classList.add('d-none');
}

async function getResponse(prompt) {
    const history = messages.slice(-MAX_HISTORY);
    const body = {
        model: MODEL_ID,
        messages: [...history, { role: 'user', content: prompt }],
        max_tokens: 512,
        temperature: 0.7
    };
    try {
        showLoading(true);
        hideError();
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'An error occurred while connecting to the server');
        }
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'No response received.';
        return reply;
    } catch (e) {
        showError(e.message);
        return null;
    } finally {
        showLoading(false);
    }
}

function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = dark ? '☀️' : '🌙';
}

function loadTheme() {
    const dark = localStorage.getItem('theme') === 'dark';
    setTheme(dark);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark');
        setTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

loadTheme();

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = userInput.value.trim();
    if (!prompt) return;
    messages.push({ role: 'user', content: prompt });
    renderMessages();
    userInput.value = '';
    const reply = await getResponse(prompt);
    if (reply) {
        messages.push({ role: 'assistant', content: reply });
        if (messages.length > MAX_HISTORY + 1) messages.splice(1, messages.length - MAX_HISTORY - 1);
        renderMessages();
    }
});

userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.requestSubmit();
    }
});

clearBtn.addEventListener('click', function() {
    messages.splice(1);
    renderMessages();
    hideError();
});

renderMessages();