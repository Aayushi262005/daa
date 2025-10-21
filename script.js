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
    const minSpeed = 50; 
    const maxSpeed = 1000; 
    const sliderVal = parseInt(SPEED_RANGE.value); 
    const maxVal = parseInt(SPEED_RANGE.max); 
    const minVal = parseInt(SPEED_RANGE.min);  
    animationSpeed = maxSpeed - ((sliderVal - minVal) / (maxVal - minVal)) * (maxSpeed - minSpeed);
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
        // Reset animation area
        resetVisualization();

        ALGO_BUTTONS.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAlgorithm = btn.dataset.algo;

        const explanationDiv = document.getElementById('algoExplanation');

        if (selectedAlgorithm === 'counting') {
            TIME_COMPLEXITY_SPAN.textContent = 'O(n + k)';
            SPACE_COMPLEXITY_SPAN.textContent = 'O(k)';
            explanationDiv.innerHTML = `
                <strong>Counting Sort:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
                    <li>Sorts integers by counting the frequency of each value.</li>
                    <li>Uses a cumulative count array to determine positions.</li>
                    <li>Places each element in the output array (stable sort).</li>
                    <li>Best for numbers in a small range.</li>
                    <li><strong>Steps:</strong> Count → Cumulative Count → Build Output.</li>
                    <li><strong>Time:</strong> O(n + k), <strong>Space:</strong> O(k)</li>
                </ul>
            `;
        } else if (selectedAlgorithm === 'radix') {
            TIME_COMPLEXITY_SPAN.textContent = 'O(d * (n + k))';
            SPACE_COMPLEXITY_SPAN.textContent = 'O(n + k)';
            explanationDiv.innerHTML = `
                <strong>Radix Sort:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
                    <li>Sorts numbers digit by digit using Counting Sort as a subroutine.</li>
                    <li>Starts from least significant digit (LSD) to most significant (MSD).</li>
                    <li>Each pass sorts based on one digit place.</li>
                    <li>Stable and efficient for fixed-length integers.</li>
                    <li><strong>Time:</strong> O(d*(n+k)), <strong>Space:</strong> O(n+k)</li>
                </ul>
            `;
        }
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

    resetVisualization(); // Clear previous animation

    if (selectedAlgorithm === 'counting') {
        await countingSort(arrayData, true);
        renderStep(animationSteps[currentStep]);
        startAutoplay();
    } else if (selectedAlgorithm === 'radix') {
        await radixSort(arrayData, true);
        renderStep(animationSteps[currentStep]);
        startAutoplay();
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

// --- Counting Sort ---
async function countingSort(arr, storeSteps = false) {
    const maxVal = Math.max(...arr, 0);
    const countArr = new Array(maxVal + 1).fill(0);
    const outputArr = new Array(arr.length).fill(0);

    storeStep(arr, countArr, outputArr);

    for (let i = 0; i < arr.length; i++) {
        countArr[arr[i]]++;
        storeStep(arr, countArr, outputArr, { input: i });
    }

    for (let i = 1; i <= maxVal; i++) {
        countArr[i] += countArr[i - 1];
        storeStep(arr, countArr, outputArr, { count: i });
    }

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

// --- Radix Sort ---
//--- Radix Sort Implementation ---
async function radixSort(arr) {
    const maxNum = Math.max(...arr, 0);
    const numDigits = maxNum.toString().length;
    const outputArr = new Array(arr.length).fill(0);
    let workingArr = [...arr];

    resetVisualization(`O(d*(n+k))`, `O(n+k)`);

    // Store padded strings for digit highlighting
    let paddedArr = workingArr.map(n => n.toString().padStart(numDigits, '0'));

    for (let digitPos = 0; digitPos < numDigits; digitPos++) {
        const countArr = new Array(10).fill(0);

        // Step 1: Count frequency for this digit (LSB first)
        for (let i = 0; i < workingArr.length; i++) {
            const digit = parseInt(paddedArr[i][numDigits - 1 - digitPos]);
            countArr[digit]++;
            storeStep(workingArr, countArr, outputArr, { input: i, digitIdx: digitPos });
        }

        // Step 2: Cumulative count
        for (let i = 1; i <= 9; i++) {
            countArr[i] += countArr[i - 1];
            storeStep(workingArr, countArr, outputArr, { count: i });
        }

        // Step 3: Build output array (stable)
        for (let i = workingArr.length - 1; i >= 0; i--) {
            const digit = parseInt(paddedArr[i][numDigits - 1 - digitPos]);
            const pos = countArr[digit] - 1;
            outputArr[pos] = workingArr[i];
            countArr[digit]--;
            storeStep(workingArr, countArr, outputArr, { output: pos });
        }

        // Step 4: Copy back for next digit
        workingArr = [...outputArr];
        paddedArr = workingArr.map(n => n.toString().padStart(numDigits, '0'));

        // Small pause after each digit pass
        storeStep(workingArr, new Array(10).fill(0), outputArr, {}, false, true);
    }

    // Final step
    storeStep(workingArr, new Array(10).fill(0), outputArr, {}, true);

    // --- Store step for animation ---
    function storeStep(inputArr, countArr, outputArr, highlight = {}, final = false, pause = false) {
        animationSteps.push({
            inputArr: [...inputArr],
            countArr: [...countArr],
            outputArr: [...outputArr],
            highlight: { ...highlight },
            final,
            pause
        });
    }
}

// --- Updated renderStep (Radix digit-level underline with dynamic padding) ---
function renderStep(step) {
    const { inputArr, countArr, outputArr, highlight, final } = step;
    ANIMATION_CANVAS.innerHTML = '';

    function createArraySection(title, arr, highlightIdx, bigger = false, countBucket = false) {
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

        const maxDigits = Math.max(...arr).toString().length;

        arr.forEach((val, idx) => {
            const boxWrapper = document.createElement('div');
            boxWrapper.style.display = 'flex';
            boxWrapper.style.flexDirection = 'column';
            boxWrapper.style.alignItems = 'center';
            boxWrapper.style.gap = '4px';

            const idxSpan = document.createElement('span');
            idxSpan.textContent = idx;
            idxSpan.style.fontSize = bigger ? '0.9rem' : '0.75rem';
            idxSpan.style.color = '#001413';

            const box = document.createElement('div');
            box.style.display = 'flex';
            box.style.alignItems = 'center';
            box.style.justifyContent = 'center';
            box.style.width = countBucket ? '55px' : bigger ? '45px' : '36px';
            box.style.height = countBucket ? '55px' : bigger ? '45px' : '36px';
            box.style.border = '2px solid #007b78';
            box.style.borderRadius = '6px';
            box.style.fontWeight = '600';
            box.style.fontSize = bigger ? '0.95rem' : '0.9rem';
            box.style.backgroundColor = countBucket
                ? highlight.count === idx ? '#00cec8' : '#a0f0f0'
                : highlight.input === idx || highlight.output === idx ? '#00cec8' : '#00faf3';

            // Radix Sort digit-level underline (LSB → MSB)
            if (selectedAlgorithm === 'radix' && highlight.digitIdx !== undefined && highlight.input === idx && !countBucket) {
                const digits = val.toString().padStart(maxDigits, '0').split('');
                digits.forEach((digit, dIdx) => {
                    const digitSpan = document.createElement('span');
                    digitSpan.textContent = digit;
                    if (dIdx === digits.length - 1 - highlight.digitIdx) {
                        digitSpan.style.textDecoration = 'underline';
                        digitSpan.style.color = '#e74c3c';
                    }
                    box.appendChild(digitSpan);
                });
            } else {
                const valSpan = document.createElement('span');
                valSpan.textContent = val !== undefined ? val : '';
                box.appendChild(valSpan);
            }

            boxWrapper.appendChild(idxSpan);
            boxWrapper.appendChild(box);
            container.appendChild(boxWrapper);
        });

        wrapper.appendChild(container);
        ANIMATION_CANVAS.appendChild(wrapper);
    }

    createArraySection('Input Array', inputArr, highlight.input, true);
    createArraySection('Count Array', countArr, highlight.count, true, true);
    createArraySection('Output Array', outputArr, highlight.output, true);
}
