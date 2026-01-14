// ============================================
// MQTT CONFIGURATION - REPLACE WITH YOUR DETAILS
// ============================================
const MQTT_BROKER = 'wss://80d05987fa4647e5977ef063b3937df0.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_OPTIONS = {
    username: 'vercel',
    password: 'Olive123',
    clientId: 'web_ac_remote_' + Math.random().toString(36).substr(2, 8),
    keepalive: 30,
    reconnectPeriod: 3000
};

const CMD_TOPIC = 'ac/esp32/cmd';
const STATUS_TOPIC = 'ac/esp32/status';

// State
let currentTemp = parseInt(localStorage.getItem('currentTemp')) || 24;
let isPowerOn = localStorage.getItem('isPowerOn') === 'true';
let mqttClient;

// Load MQTT library and initialize
async function initApp() {
    try {
        const { default: mqtt } = await import('https://unpkg.com/mqtt@5.0.0/dist/mqtt.min.js');
        
        mqttClient = mqtt.connect(MQTT_BROKER, MQTT_OPTIONS);

        mqttClient.on('connect', () => {
            console.log('✅ MQTT Connected!');
            document.getElementById('status').textContent = '🟢 Online (MQTT)';
            document.getElementById('status').classList.add('online');
            mqttClient.subscribe(STATUS_TOPIC);
        });

        mqttClient.on('error', (err) => {
            console.error('❌ MQTT Error:', err);
            showToast('❌ MQTT Connection Failed', 'error');
            document.getElementById('status').textContent = '🔴 MQTT Offline';
            document.getElementById('status').classList.remove('online');
        });

        mqttClient.on('message', (topic, message) => {
            if (topic === STATUS_TOPIC) {
                try {
                    const data = JSON.parse(message.toString());
                    if (data.status === 'executed') {
                        showToast(`✅ ${data.command}`, 'success');
                    }
                } catch (e) {
                    console.log('Raw status:', message.toString());
                }
            }
        });

        // Initialize UI
        loadSettings();
        updateDisplay();
    } catch (error) {
        console.error('Failed to load MQTT library:', error);
        showToast('❌ Failed to load MQTT', 'error');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initApp);

// ======================
// CONTROL FUNCTIONS
// ======================

function togglePower() {
    const command = isPowerOn ? 'POWER_OFF' : 'POWER_ON';
    sendMQTTCommand(command);
    isPowerOn = !isPowerOn;
    localStorage.setItem('isPowerOn', isPowerOn);
    updatePowerButton();
}

function increaseTemp() {
    if (currentTemp < 30) {
        currentTemp++;
        updateDisplay();
        sendMQTTCommand(`TEMP_${currentTemp}`);
    } else {
        showToast('⚠️ Max 30°C', 'warning');
    }
}

function decreaseTemp() {
    if (currentTemp > 16) {
        currentTemp--;
        updateDisplay();
        sendMQTTCommand(`TEMP_${currentTemp}`);
    } else {
        showToast('⚠️ Min 16°C', 'warning');
    }
}

function sendMQTTCommand(command) {
    if (!mqttClient || !mqttClient.connected) {
        showToast('❌ MQTT Not Connected', 'error');
        return;
    }
    mqttClient.publish(CMD_TOPIC, command);
    console.log('📤 Sent:', command);
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

function updateDisplay() {
    document.getElementById('tempValue').textContent = currentTemp;
    localStorage.setItem('currentTemp', currentTemp);
}

// ======================
// LEARNING MODE
// ======================
function toggleLearning() {
    const panel = document.getElementById('learningPanel');
    const btn = document.getElementById('learningBtn');
    panel.classList.toggle('active');
    btn.classList.toggle('active');
}

function startLearning() {
    showToast('⚠️ Learning must be triggered locally on ESP32', 'warning');
}

// ======================
// UTILITIES
// ======================
function loadSettings() {
    document.getElementById('tempValue').textContent = currentTemp;
    updatePowerButton();
}

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

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (mqttClient) mqttClient.end();
});