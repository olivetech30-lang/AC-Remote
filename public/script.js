// ============================================
// AC REMOTE - CONNECTED VIA VERCEL
// ============================================

// YOUR VERCEL API URL
const API_URL = 'https://ac-remote-controller.vercel.app/api';

// State management
let currentTemp = parseInt(localStorage.getItem('currentTemp')) || 24;
let isPowerOn = localStorage.getItem('isPowerOn') === 'true';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    updatePowerButton();
    checkStatus();
    setInterval(checkStatus, 10000); // Check every 10 seconds
});

// Power Toggle
async function togglePower() {
    const command = isPowerOn ? 'off' : 'on';
    
    try {
        const response = await fetch(`${API_URL}/power?state=${command}`);
        const data = await response.json();

        if (data.status === 'success') {
            isPowerOn = !isPowerOn;
            localStorage.setItem('isPowerOn', isPowerOn);
            updatePowerButton();
            showToast(`✅ Power ${isPowerOn ? 'ON' : 'OFF'}`, 'success');
        } else {
            showToast('⚠️ Command not learned yet!', 'warning');
        }
    } catch (error) {
        showToast('❌ Connection failed', 'error');
        console.error('Error:', error);
    }
}

function updatePowerButton() {
    const btn = document.getElementById('powerBtn');
    const text = document.getElementById('powerText');
    
    if (isPowerOn) {
        btn.classList.add('on');
        text.textContent = 'ON';
    } else {
        btn.classList.remove('on');
        text.textContent = 'OFF';
    }
}

// Temperature Controls
async function increaseTemp() {
    if (currentTemp < 30) {
        currentTemp++;
        updateDisplay();
        await sendTemp();
    } else {
        showToast('⚠️ Max 30°C', 'warning');
    }
}

async function decreaseTemp() {
    if (currentTemp > 16) {
        currentTemp--;
        updateDisplay();
        await sendTemp();
    } else {
        showToast('⚠️ Min 16°C', 'warning');
    }
}

async function sendTemp() {
    try {
        const response = await fetch(`${API_URL}/temp?temp=${currentTemp}`);
        const data = await response.json();

        if (data.status === 'success') {
            showToast(`✅ ${currentTemp}°C`, 'success');
        } else {
            showToast(`⚠️ Temp ${currentTemp}°C not learned!`, 'warning');
        }
    } catch (error) {
        showToast('❌ Connection failed', 'error');
        console.error('Error:', error);
    }
}

function updateDisplay() {
    document.getElementById('tempValue').textContent = currentTemp;
    localStorage.setItem('currentTemp', currentTemp);
}

// Learning Mode
function toggleLearning() {
    const panel = document.getElementById('learningPanel');
    const btn = document.getElementById('learningBtn');
    
    panel.classList.toggle('active');
    btn.classList.toggle('active');
}

async function startLearning() {
    const command = document.getElementById('learnCommand').value;
    const status = document.getElementById('learnStatus');
    
    if (!command) {
        showToast('⚠️ Select a command first', 'warning');
        return;
    }

    status.classList.add('active');
    status.textContent = `📡 Learning ${command}... Press AC remote button NOW!`;

    try {
        const response = await fetch(`${API_URL}/learn?cmd=${command}`);
        const data = await response.json();

        if (data.status === 'learning') {
            showToast(`📡 Learning ${command}...`, 'warning');
            
            setTimeout(() => {
                status.textContent = `✅ ${command} learned!`;
                setTimeout(() => {
                    status.classList.remove('active');
                }, 2000);
            }, 3000);
        }
    } catch (error) {
        status.textContent = '❌ Learning failed';
        showToast('❌ Connection failed', 'error');
        console.error('Error:', error);
    }
}

// Status Check
async function checkStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();
        document.getElementById('status').textContent = `🟢 Online`;
        document.getElementById('status').classList.add('online');
    } catch (error) {
        document.getElementById('status').textContent = '🔴 Offline';
        document.getElementById('status').classList.remove('online');
    }
}

// Toast Notifications
function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === '+') {
        e.preventDefault();
        increaseTemp();
    } else if (e.key === 'ArrowDown' || e.key === '-') {
        e.preventDefault();
        decreaseTemp();
    } else if (e.key === ' ' || e.key === 'p') {
        e.preventDefault();
        togglePower();
    }
});