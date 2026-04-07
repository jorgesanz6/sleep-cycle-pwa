let currentMode = 'wake'; // 'wake' (Cuándo despertar), 'sleep' (Cuándo dormir), 'nap' (Siesta)

// --- Initialization ---
window.onload = () => {
    setCurrentTime();
    setupEventListeners();
};

function setupEventListeners() {
    // Basic event setup if needed
}

// --- Mode Switching ---
function setMode(mode) {
    currentMode = mode;
    
    // UI Updates
    document.getElementById('tab-wake').classList.toggle('active', mode === 'wake');
    document.getElementById('tab-sleep').classList.toggle('active', mode === 'sleep');
    document.getElementById('tab-nap').classList.toggle('active', mode === 'nap');

    const standardInputs = document.getElementById('standard-inputs');
    const napInputs = document.getElementById('nap-inputs');
    const timeLabel = document.getElementById('time-label');
    const calcBtn = document.getElementById('calc-btn');

    // Reset results visibility
    document.getElementById('results').style.display = 'none';

    if (mode === 'wake') {
        standardInputs.style.display = 'block';
        napInputs.style.display = 'none';
        timeLabel.innerText = '¿A qué hora te vas a la cama?';
        calcBtn.innerText = 'Calcular Despertares';
    } else if (mode === 'sleep') {
        standardInputs.style.display = 'block';
        napInputs.style.display = 'none';
        timeLabel.innerText = '¿A qué hora debes despertar?';
        calcBtn.innerText = 'Calcular Hora de Dormir';
    } else if (mode === 'nap') {
        standardInputs.style.display = 'none';
        napInputs.style.display = 'block';
        calcBtn.innerText = 'Ver Planes de Siesta';
    }
    
    hapticFeedback();
}

// --- Helpers ---
function setCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('mainTime').value = `${hours}:${minutes}`;
}

function setLatency(val) {
    document.getElementById('latency').value = val;
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.innerText) === val);
    });
    hapticFeedback(10);
}

function hapticFeedback(ms = 30) {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(ms);
    }
}

function formatTime(date) {
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
}

// --- Core Calculation Logic ---
function calculate() {
    const timeValue = document.getElementById('mainTime').value;
    const latency = parseInt(document.getElementById('latency').value) || 0;
    const resultsList = document.getElementById('results-list');
    const resultsContainer = document.getElementById('results');
    const resultsTitle = document.getElementById('results-title');

    resultsList.innerHTML = '';
    hapticFeedback(50);

    let cycles = [];
    
    if (currentMode === 'nap') {
        resultsTitle.innerText = "Plan de siesta (desde ahora):";
        cycles = [
            { label: "Power Nap", duration: 20, desc: "Alerta máxima, sin somnolencia.", type: 'nap-short' },
            { label: "NASA Nap", duration: 30, desc: "Mejora del desempeño cognitivo.", type: 'nap-med' },
            { label: "Full Cycle", duration: 90, desc: "Ciclo completo, creatividad.", type: 'nap-full' }
        ];
    } else {
        if (!timeValue) {
            alert("Por favor selecciona una hora");
            return;
        }
        
        resultsTitle.innerText = currentMode === 'wake' ? "Horas óptimas de despertar:" : "Horas óptimas para acostarte:";
        
        // standard 90 min cycles
        cycles = [
            { count: 3, mins: 270, label: "4.5h", rec: false },
            { count: 4, mins: 360, label: "6.0h", rec: false },
            { count: 5, mins: 450, label: "7.5h", rec: true },
            { count: 6, mins: 540, label: "9.0h", rec: false }
        ];
    }

    const [h, m] = timeValue.split(':').map(Number);
    const baseDate = new Date();
    baseDate.setHours(h, m, 0, 0);

    cycles.forEach((cycle, index) => {
        let displayTime, subText, mainText;

        if (currentMode === 'nap') {
            const now = new Date();
            const target = new Date(now.getTime() + cycle.duration * 60000);
            displayTime = formatTime(target);
            mainText = cycle.label;
            subText = cycle.desc;
        } else if (currentMode === 'wake') {
            // Forward: Start + Latency + Cycles
            const sleepStart = new Date(baseDate.getTime() + latency * 60000);
            const wakeTime = new Date(sleepStart.getTime() + cycle.mins * 60000);
            displayTime = formatTime(wakeTime);
            mainText = cycle.label;
            subText = `${cycle.count} ciclos completos`;
        } else {
            // Reverse: Wake - (Cycles + Latency)
            const sleepStart = new Date(baseDate.getTime() - cycle.mins * 60000);
            const bedTime = new Date(sleepStart.getTime() - latency * 60000);
            displayTime = formatTime(bedTime);
            mainText = cycle.label;
            subText = `${cycle.count} ciclos completos`;
        }

        const item = document.createElement('div');
        item.className = `result-item ${cycle.rec ? 'recommended' : ''}`;
        item.style.animationDelay = `${index * 0.1}s`;
        
        item.innerHTML = `
            <div class="time-box">
                <div class="time-main">
                    ${displayTime}
                    ${cycle.rec ? '<span class="badge-rec">RECOMENDADO</span>' : ''}
                </div>
                <div class="time-sub">${subText}</div>
            </div>
            <div class="cycle-meta">
                <div class="cycle-count">${mainText}</div>
                <div class="cycle-hours">de sueño</div>
            </div>
        `;
        resultsList.appendChild(item);
    });

    resultsContainer.style.display = 'block';
    
    // Smooth scroll for mobile
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}
