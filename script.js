// DOM Elements
const ANIMATION_CANVAS = document.getElementById('animationCanvas');
const TIME_COMPLEXITY_SPAN = document.getElementById('timeComplexity');
const SPACE_COMPLEXITY_SPAN = document.getElementById('spaceComplexity');
const SPEED_RANGE = document.getElementById('speedRange');
const ARRAY_INPUT = document.getElementById('arrayInput');
const START_BTN = document.getElementById('startBtn');
const RANDOM_BTN = document.getElementById('randomArrayBtn');
const ALGO_BUTTONS = document.querySelectorAll('.algo-btn');

const PREV_BTN = document.querySelectorAll('#animationControls button')[0];
const PAUSE_BTN = document.querySelectorAll('#animationControls button')[1];
const NEXT_BTN = document.querySelectorAll('#animationControls button')[2];

let arrayData = [];
let animationSpeed = 400; // default speed in ms
let selectedAlgorithm = 'counting';

let animationSteps = [];
let currentStep = 0;
let isPaused = false;
let autoplayInterval = null;

// --- Event Listeners ---
SPEED_RANGE.addEventListener('input', () => {
    animationSpeed = parseInt(SPEED_RANGE.value);
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        startAutoplay();
    }
});

RANDOM_BTN.addEventListener('click', () => {
    arrayData = generateRandomArray(8, 20);
    ARRAY_INPUT.value = arrayData.join(', ');
    resetVisualization();
});

ALGO_BUTTONS.forEach(btn => {
    btn.addEventListener('click', () => {
        ALGO_BUTTONS.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAlgorithm = btn.dataset.algo;
    });
});

START_BTN.addEventListener('click', async () => {
    arrayData = parseArray(ARRAY_INPUT.value);
    if (!arrayData.length) return alert("Enter valid numbers!");

    animationSteps = [];
    currentStep = 0;
    isPaused = false;
    PAUSE_BTN.textContent = 'Pause';
    clearInterval(autoplayInterval);

    if (selectedAlgorithm === 'counting') {
        await countingSort(arrayData, true); // store steps
        renderStep(animationSteps[currentStep]);
        startAutoplay();
    } else {
        alert("Selected algorithm not implemented yet!");
    }
});

// --- Step Control Buttons ---
PREV_BTN.addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        renderStep(animationSteps[currentStep]);
    }
});

NEXT_BTN.addEventListener('click', () => {
    if (currentStep < animationSteps.length - 1) {
        currentStep++;
        renderStep(animationSteps[currentStep]);
        if (!isPaused) startAutoplay();
    }
});

PAUSE_BTN.addEventListener('click', () => {
    isPaused = !isPaused;
    PAUSE_BTN.textContent = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) startAutoplay();
});

// --- Autoplay Function ---
function startAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = setInterval(() => {
        if (isPaused || currentStep >= animationSteps.length - 1) {
            clearInterval(autoplayInterval);
            return;
        }
        currentStep++;
        renderStep(animationSteps[currentStep]);
    }, animationSpeed);
}

// --- Utilities ---
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseArray(input) {
    return input.split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 0);
}

function generateRandomArray(size, maxVal = 40) {
    return Array.from({ length: size }, () => Math.floor(Math.random() * maxVal));
}

function resetVisualization(time = '-', space = '-') {
    ANIMATION_CANVAS.innerHTML = '';
    TIME_COMPLEXITY_SPAN.textContent = time;
    SPACE_COMPLEXITY_SPAN.textContent = space;
    ARRAY_INPUT.value = arrayData.join(', ');
}

// --- Counting Sort (stores steps instead of animating directly) ---
async function countingSort(arr, storeSteps = false) {
    const maxVal = Math.max(...arr, 0);
    const countArr = new Array(maxVal + 1).fill(0);
    const outputArr = new Array(arr.length).fill(0);

    resetVisualization('O(n+k)', 'O(k)');
    storeStep(arr, countArr, outputArr);

    // Step 1: Count frequency
    for (let i = 0; i < arr.length; i++) {
        countArr[arr[i]]++;
        storeStep(arr, countArr, outputArr, { input: i });
    }

    // Step 2: Cumulative count
    for (let i = 1; i <= maxVal; i++) {
        countArr[i] += countArr[i - 1];
        storeStep(arr, countArr, outputArr, { count: i });
    }

    // Step 3: Build output array (stable)
    for (let i = arr.length - 1; i >= 0; i--) {
        const val = arr[i];
        const pos = countArr[val] - 1;
        outputArr[pos] = val;
        countArr[val]--;
        storeStep(arr, countArr, outputArr, { input: i, output: pos });
    }

    storeStep(arr, countArr, outputArr, {}, true);

    function storeStep(inputArr, countArr, outputArr, highlight = {}, final = false) {
        animationSteps.push({
            inputArr: [...inputArr],
            countArr: [...countArr],
            outputArr: [...outputArr],
            highlight: { ...highlight },
            final
        });
    }
}

// --- Render Step ---
function renderStep(step) {
    const { inputArr, countArr, outputArr, highlight, final } = step;
    ANIMATION_CANVAS.innerHTML = '';

    function createArraySection(title, arr, highlightIdx, colorMap = {}) {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '24px';
        wrapper.style.textAlign = 'center';

        const heading = document.createElement('div');
        heading.textContent = title;
        heading.style.fontWeight = '700';
        heading.style.color = '#004745';
        heading.style.marginBottom = '6px';
        wrapper.appendChild(heading);

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '6px';
        container.style.justifyContent = 'center';

        arr.forEach((val, idx) => {
            const box = document.createElement('div');
            box.style.display = 'flex';
            box.style.flexDirection = 'column';
            box.style.alignItems = 'center';
            box.style.justifyContent = 'center';
            box.style.width = '36px';
            box.style.height = '36px';
            box.style.border = '2px solid #007b78';
            box.style.borderRadius = '6px';
            box.style.fontWeight = '600';
            box.style.fontSize = '0.9rem';
            box.style.backgroundColor = colorMap(idx);

            const valSpan = document.createElement('span');
            valSpan.textContent = val !== undefined ? val : '';
            box.appendChild(valSpan);

            const idxSpan = document.createElement('span');
            idxSpan.textContent = idx;
            idxSpan.style.fontSize = '0.7rem';
            idxSpan.style.color = '#001413';
            box.appendChild(idxSpan);

            container.appendChild(box);
        });

        wrapper.appendChild(container);
        ANIMATION_CANVAS.appendChild(wrapper);
    }

    createArraySection('Input Array', inputArr, highlight.input, idx =>
        highlight.input === idx ? '#00cec8' : '#00faf3'
    );

    createArraySection('Count Array', countArr, highlight.count, idx =>
        highlight.count === idx ? '#00cec8' : '#a0f0f0'
    );

    createArraySection('Output Array', outputArr, highlight.output, idx =>
        highlight.output === idx ? '#00cec8' : (final ? '#00a49f' : '#a0f0f0')
    );
}
