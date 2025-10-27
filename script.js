// script.js

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
    animationSpeed = maxSpeed - ((sliderVal - minVal) / (maxVal - minVal)) * (maxVal - minVal);
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        startAutoplay();
    }
});

RANDOM_BTN.addEventListener('click', () => {
    const mode = (selectedAlgorithm === 'bucket') ? 'float' : 'int';
    arrayData = generateRandomArray(8, 20, mode); 
    ARRAY_INPUT.value = arrayData.join(', ');
    resetVisualization();
});

ALGO_BUTTONS.forEach(btn => {
    btn.addEventListener('click', () => {
        resetVisualization('-', '-');

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
                </ul>
            `;
        } else if (selectedAlgorithm === 'bucket') {
            TIME_COMPLEXITY_SPAN.textContent = 'O(n + k)';
            SPACE_COMPLEXITY_SPAN.textContent = 'O(n + k)';
            explanationDiv.innerHTML = `
                <strong>Bucket Sort:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
                    <li>Distributes elements into several buckets based on range.</li>
                    <li>Each bucket is sorted individually (we use Insertion Sort here).</li>
                    <li>Finally, all buckets are concatenated into a sorted array.</li>
                    <li>Visualization shows three phases: distribution → sorting inside each bucket → merging.</li>
                </ul>
            `;
        }
    });
});

START_BTN.addEventListener('click', async () => {
    const mode = (selectedAlgorithm === 'bucket') ? 'float' : 'int';
    arrayData = parseArray(ARRAY_INPUT.value, mode); 
    if (!arrayData.length) return alert("Enter valid numbers!");

    animationSteps = [];
    currentStep = 0;
    isPaused = false;
    PAUSE_BTN.textContent = 'Pause';
    clearInterval(autoplayInterval);

    if (selectedAlgorithm === 'counting') {
        await countingSort(arrayData, true);
        renderStep(animationSteps[currentStep]);
        startAutoplay();
    } else if (selectedAlgorithm === 'radix') {
        await radixSort(arrayData, true);
        renderStep(animationSteps[currentStep]);
        startAutoplay();
    } else if (selectedAlgorithm === 'bucket') {
        await bucketSort(arrayData, true);
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

function parseArray(input, mode = 'int') {
    const parser = (mode === 'float') ? parseFloat : parseInt;
    return input.split(',')
    .map(s => parser(s.trim()))
    .filter(n => !isNaN(n) && n >= 0);
}

function generateRandomArray(size, maxVal = 40, mode = 'int') {
    if (mode === 'float') {
        return Array.from({ length: size }, () => parseFloat((Math.random() * maxVal).toFixed(2)));
    }
    return Array.from({ length: size }, () => Math.floor(Math.random() * maxVal));
}

function resetVisualization(time = '-', space = '-') {
    ANIMATION_CANVAS.innerHTML = '';
    if (time !== '-') TIME_COMPLEXITY_SPAN.textContent = time; 
    if (space !== '-') SPACE_COMPLEXITY_SPAN.textContent = space;
    ARRAY_INPUT.value = arrayData.join(', ');
}

// --- Counting Sort (FIXED: Strict Sequential Output Placement) ---
async function countingSort(arr, storeSteps = false) {
    const maxVal = Math.max(...arr, 0);
    const countArr = new Array(maxVal + 1).fill(0);
    const outputArr = new Array(arr.length).fill(null); 

    storeStep(arr, countArr, outputArr);

    // Step 1: Count frequency 
    for (let i = 0; i < arr.length; i++) {
        // Step A: Highlight Input element being read
        storeStep(arr, countArr, outputArr, { input: i }); 
        
        countArr[arr[i]]++;
        
        // Step B: Highlight Count array being updated
        storeStep(arr, countArr, outputArr, { count: arr[i] }); 
    }

    // Step 2: Cumulative count 
    for (let i = 1; i <= maxVal; i++) {
        countArr[i] += countArr[i - 1];
        storeStep(arr, countArr, outputArr, { count: i }); 
    }

    // Step 3: Build output array (STRICT Sequential Placement)
    for (let i = arr.length - 1; i >= 0; i--) {
        const val = arr[i];
        const pos = countArr[val] - 1;
        
        // --- Sequential Step A: Highlight element being READ (Input ONLY) ---
        // Highlight input array cell being read, but clear any previous output highlight
        storeStep(arr, countArr, outputArr, { input: i }); 

        // Perform the write (updates internal state)
        outputArr[pos] = val;
        countArr[val]--;
        
        // --- Sequential Step B: Highlight position being WRITTEN to (Output ONLY) ---
        // Highlight output array cell being written, and the count array cell that was just decremented.
        // NOTE: We pass count: val to highlight the *value* index in the count array (where the decrement occurred)
        // By NOT passing {input: ...} we ensure the input highlight is removed in this step.
        storeStep(arr, countArr, outputArr, { output: pos, count: val }); 
    }

    // Final state step
    storeStep(outputArr, new Array(maxVal + 1).fill(0), outputArr, {}, true);

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

//--- Radix Sort Implementation (FIXED: Strict Sequential Highlight) ---
async function radixSort(arr) {
    const maxNum = Math.max(...arr, 0);
    const numDigits = maxNum.toString().length;
    const outputArr = new Array(arr.length).fill(null); 
    let workingArr = [...arr];

    let paddedArr = workingArr.map(n => n.toString().padStart(numDigits, '0'));

    for (let digitPos = 0; digitPos < numDigits; digitPos++) {
        const countArr = new Array(10).fill(0);

        // Step 1: Count frequency for this digit 
        for (let i = 0; i < workingArr.length; i++) {
            const digit = parseInt(paddedArr[i][numDigits - 1 - digitPos]);
            
            // Step A: Highlight Input element being read
            storeStep(workingArr, countArr, outputArr, { input: i, digitIdx: digitPos });
            
            countArr[digit]++;
            
            // Step B: Highlight the Count array being updated
            storeStep(workingArr, countArr, outputArr, { count: digit, digitIdx: digitPos });
        }

        // Step 2: Cumulative count
        for (let i = 1; i <= 9; i++) {
            countArr[i] += countArr[i - 1];
            storeStep(workingArr, countArr, outputArr, { count: i, digitIdx: digitPos });
        }

        // Step 3: Build output array (STRICT Sequential Placement)
        for (let i = workingArr.length - 1; i >= 0; i--) {
            const digit = parseInt(paddedArr[i][numDigits - 1 - digitPos]);
            const pos = countArr[digit] - 1;
            
            // --- Sequential Step A: Highlight element being READ (Input ONLY) ---
            storeStep(workingArr, countArr, outputArr, { input: i, digitIdx: digitPos });
            
            // --- PERFORM WRITE ACTION ---
            outputArr[pos] = workingArr[i];
            countArr[digit]--;
            // ---------------------------
            
            // --- Sequential Step B: Highlight position being WRITTEN to (Output ONLY) ---
            // Clear input highlight and focus on output index and count change.
            storeStep(workingArr, countArr, outputArr, { output: pos, count: digit, digitIdx: digitPos });
        }

        // Step 4: Copy back for next digit
        let outputForNextStep = outputArr.filter(n => n !== null); 
        workingArr = [...outputForNextStep];
        paddedArr = workingArr.map(n => n.toString().padStart(numDigits, '0'));

        // Pause after each digit pass, resetting count array for next pass
        storeStep(workingArr, new Array(10).fill(0), outputForNextStep, { digitIdx: digitPos }, false, true);
    }

    // Final step
    storeStep(workingArr, new Array(10).fill(0), workingArr, {}, true);

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

// --- Enhanced Bucket Sort (FIXED: Strict Sequential Merge) ---
async function bucketSort(arr, storeSteps = false) {
    const n = arr.length;
    if (n <= 0) return;

    const maxVal = Math.max(...arr);
    const minVal = Math.min(...arr);
    const bucketCount = Math.floor(Math.sqrt(n)) || 1;
    const buckets = Array.from({ length: bucketCount }, () => []);
    const outputArr = new Array(n).fill(null);

    const range = maxVal - minVal || 1;

    // Initial setup
    storeStep(arr, buckets, outputArr, { phase: 'init' });

    // --- Phase 1: Distribute elements into buckets ---
    for (let i = 0; i < n; i++) {
        let index = Math.floor(((arr[i] - minVal) / range) * bucketCount);

        if (arr[i] === maxVal && maxVal !== minVal) {
            index = bucketCount - 1;
        } 
        else if (index >= bucketCount) {
             index = bucketCount - 1;
        }

        buckets[index].push(arr[i]);
        storeStep(arr, buckets, outputArr, { phase: 'distribution', input: i, bucket: index });
    }

    // --- Phase 2: Sort each bucket (Insertion Sort) ---
    for (let b = 0; b < bucketCount; b++) {
        if (buckets[b].length === 0) continue;
        for (let i = 1; i < buckets[b].length; i++) {
            let key = buckets[b][i];
            let j = i - 1;
            // Step A: Highlight the element being compared (key)
            storeStep(arr, buckets, outputArr, { phase: 'sorting', bucket: b, sortIdx: i });
            
            while (j >= 0 && buckets[b][j] > key) {
                buckets[b][j + 1] = buckets[b][j];
                j--;
                // Step B: Highlight the swap/shift operation
                storeStep(arr, buckets, outputArr, { phase: 'sorting', bucket: b, sortIdx: i, innerIdx: j + 1 });
            }
            buckets[b][j + 1] = key;
            // Step C: Highlight where the key is placed
            storeStep(arr, buckets, outputArr, { phase: 'sorting', bucket: b, sortIdx: i, innerIdx: j + 1 });
        }
    }

    // --- Phase 3: Concatenate all buckets into output array (STRICT Sequential Placement) ---
    let idx = 0;
    for (let b = 0; b < bucketCount; b++) {
        for (let val of buckets[b]) {
            // --- Sequential Step A: Highlight element being READ from the bucket (ElementVal) ---
             storeStep(arr, buckets, outputArr, { phase: 'merging', bucket: b, elementVal: val });
             
            // --- PERFORM WRITE ACTION ---
            outputArr[idx++] = val;
            // ---------------------------
            
            // --- Sequential Step B: Highlight position being WRITTEN to (Output ONLY) ---
            // Clear bucket read highlight and focus on output index.
            storeStep(arr, buckets, outputArr, { phase: 'merging', output: idx - 1 });
        }
    }

    // Final snapshot
    storeStep(arr, buckets, outputArr, { phase: 'complete' }, true);

    function storeStep(inputArr, buckets, outputArr, highlight = {}, final = false) {
        animationSteps.push({
            inputArr: [...inputArr],
            buckets: buckets.map(bucket => [...bucket]),
            outputArr: [...outputArr],
            highlight: { ...highlight },
            final
        });
    }
}

// --- Unified renderStep (Crucial Highlight Logic Adjustment) ---
function renderStep(step) {
    const { inputArr, countArr, buckets, outputArr, highlight = {}, final } = step || {};
    ANIMATION_CANVAS.innerHTML = '';

    // --- Phase title ---
    const phaseTitle = document.createElement('h3');
    phaseTitle.style.textAlign = 'center';
    phaseTitle.style.color = '#004745';
    phaseTitle.style.marginBottom = '12px';
    phaseTitle.style.fontWeight = '700';
    
    // Set Phase Title based on selected algorithm and current step highlight
    if (selectedAlgorithm === 'bucket') {
        phaseTitle.textContent =
            highlight.phase === 'distribution' ? 'Phase 1: Distributing Elements into Buckets'
            : highlight.phase === 'sorting' ? 'Phase 2: Sorting Inside Bucket'
            : highlight.phase === 'merging' ? 'Phase 3: Merging Buckets into Final Output'
            : highlight.phase === 'complete' ? 'Sorting Complete! 🎉'
            : 'Initialization';
    } else if (selectedAlgorithm === 'radix' && highlight.digitIdx !== undefined) {
        const maxNum = Math.max(...arrayData, 0);
        const numDigits = maxNum.toString().length;
        const currentDigitName = ['LSD (Units)', 'Tens', 'Hundreds', 'Thousands'][highlight.digitIdx] || `${highlight.digitIdx + 1}${['st', 'nd', 'rd', 'th'][highlight.digitIdx % 10 - 1] || 'th'}`;
        
        if (highlight.input !== undefined) {
             phaseTitle.textContent = `Radix Pass: Reading element ${highlight.input} for its ${currentDigitName} Digit (Input Array)`;
        } else if (highlight.count !== undefined) {
             phaseTitle.textContent = `Radix Pass: Updating Count for ${currentDigitName} Digit (Count Array)`;
        } else if (highlight.output !== undefined) {
             phaseTitle.textContent = `Radix Pass: Placing element to Output index ${highlight.output}`;
        } else {
             phaseTitle.textContent = `Radix Pass: Sorting by the ${currentDigitName} Digit (Pass ${highlight.digitIdx + 1} of ${numDigits})`;
        }
    } else if (selectedAlgorithm === 'counting') {
        if (highlight.input !== undefined) {
             phaseTitle.textContent = `Counting Sort: Reading element ${highlight.input} from Input Array`;
        } else if (highlight.count !== undefined) {
             phaseTitle.textContent = `Counting Sort: Updating/Accumulating Count at index ${highlight.count} (Count Array)`;
        } else if (highlight.output !== undefined) {
             phaseTitle.textContent = `Counting Sort: Placing element to Output index ${highlight.output}`;
        } else {
             phaseTitle.textContent = final ? 'Sorting Complete! 🎉' : 'Initialization/Processing Array';
        }
    } else {
         phaseTitle.textContent = final ? 'Sorting Complete! 🎉' : 'Initialization/Processing Array';
    }
    
    ANIMATION_CANVAS.appendChild(phaseTitle);

    // --- Helper to create array displays ---
    function createArraySection(title, arr, hlight, bigger = false, countBucket = false) {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '18px';
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

        const maxArr = (inputArr || []).concat(outputArr || []).filter(n => n !== null);
        const maxVal = maxArr.length ? Math.max(...maxArr) : 0;
        const maxDigits = Math.max(1, maxVal).toString().length;

        (arr || []).forEach((val, idx) => {
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

            // --- HIGHLIGHTING LOGIC ---
            let isHighlighted = false;
            
            if (countBucket) {
                // Count Array highlight only if count is the active step focus
                box.style.backgroundColor = hlight.count === idx ? '#00cec8' : '#a0f0f0';
                isHighlighted = hlight.count === idx;
            } else if (title.includes('Output Array') && val !== undefined && val !== null) {
                // Output array highlight only if output is the active step focus
                 if (hlight.output === idx) {
                    box.style.backgroundColor = '#b6f0d5'; // Write (Greenish)
                    isHighlighted = true;
                }
            } else if (title.includes('Input Array') && val !== undefined && val !== null) {
                // Input array highlight only if input is the active step focus
                if (hlight.input === idx) {
                    box.style.backgroundColor = '#ffd966'; // Read (Yellowish)
                    isHighlighted = true;
                }
            }
            
            // Fallback for non-highlighted cells (including empty cells)
            if (!isHighlighted) {
                 box.style.backgroundColor = final ? '#d9f5ff' : '#ffffff';
            }
            
            // --- Radix Digit Highlighting Logic ---
            if (selectedAlgorithm === 'radix' && hlight.digitIdx !== undefined && !countBucket) { 
                const valString = (val !== undefined && val !== null) ? String(val) : '';
                const paddedValue = valString.padStart(maxDigits, '0');
                const digits = paddedValue.split('');
                
                const focusedDigitIndex = digits.length - 1 - hlight.digitIdx; 

                digits.forEach((digit, dIdx) => {
                    const digitSpan = document.createElement('span');
                    digitSpan.textContent = digit;
                    digitSpan.style.margin = '0 0.5px'; 
                    digitSpan.style.color = '#001413'; 

                    if (dIdx === focusedDigitIndex) {
                        // Apply the red focus to the specific digit
                        digitSpan.style.textDecoration = 'underline';
                        digitSpan.style.textDecorationColor = '#e74c3c';
                        digitSpan.style.color = '#e74c3c'; // Ensure it's red
                        digitSpan.style.fontWeight = '700';
                    }
                    box.appendChild(digitSpan);
                });
            } else {
                // Regular rendering for Counting/Bucket Sort
                const valSpan = document.createElement('span');
                valSpan.textContent = (val !== undefined && val !== null) ? val : '';
                box.appendChild(valSpan);
            }

            boxWrapper.appendChild(idxSpan);
            boxWrapper.appendChild(box);
            container.appendChild(boxWrapper);
        });

        wrapper.appendChild(container);
        ANIMATION_CANVAS.appendChild(wrapper);
    }

    // --- Input Array ---
    if (inputArr) createArraySection(final ? 'Sorted Array' : 'Input Array', inputArr, highlight, true);

    // --- Count Array (Counting/Radix only) ---
    if (countArr && !buckets) createArraySection('Count Array (Value/Digit → Count)', countArr, highlight, true, true);

// --- Buckets (Bucket Sort only) ---
if (buckets) {
    const wrapper = document.createElement('div');
    wrapper.style.margin = '18px 0';
    wrapper.style.textAlign = 'center';

    const heading = document.createElement('div');
    heading.textContent = 'Buckets';
    heading.style.fontWeight = '700';
    heading.style.color = '#004745';
    heading.style.marginBottom = '8px';
    wrapper.appendChild(heading);

    const phaseDesc = document.createElement('div');
    phaseDesc.style.marginBottom = '10px';
    phaseDesc.style.fontSize = '0.95rem';
    phaseDesc.style.color = '#333';
    phaseDesc.textContent =
        highlight.phase === 'distribution' ? 'Distributing elements into buckets (each added one-by-one).'
        : highlight.phase === 'sorting' ? `Sorting bucket ${highlight.bucket} (Insertion Sort steps shown).`
        : highlight.phase === 'merging' ? 'Merging buckets into the output array.'
        : '';
    wrapper.appendChild(phaseDesc);

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.justifyContent = 'center';
    container.style.gap = '12px';

    const minVal = Math.min(...arrayData.filter(n => n !== null), 0);
    const maxVal = Math.max(...arrayData.filter(n => n !== null), 0);
    const bucketCount = buckets.length;
    const range = (maxVal - minVal) / bucketCount;

    buckets.forEach((bucket, bIdx) => {
        const bucketDiv = document.createElement('div');
        bucketDiv.style.border = '2px solid #007b78';
        bucketDiv.style.borderRadius = '8px';
        bucketDiv.style.padding = '8px';
        bucketDiv.style.minWidth = '90px';
        
        // --- RESTORED BUCKET COLOR LOGIC ---
        bucketDiv.style.background =
            highlight.bucket === bIdx
                ? highlight.phase === 'distribution' ? '#fff0d9' // Light yellow for distribution
                : highlight.phase === 'sorting' ? '#e6fff2'      // Light green for sorting
                : '#f2fcfb'                                       // Default light blue/cyan for merging
                : '#f7fbfb'; // Very light gray for inactive buckets
        // --- END RESTORED BUCKET COLOR LOGIC ---
                
        bucketDiv.style.display = 'flex';
        bucketDiv.style.flexDirection = 'column';
        bucketDiv.style.alignItems = 'center';
        bucketDiv.style.gap = '8px';

        const label = document.createElement('div');
        const bucketMin = (minVal + bIdx * range);
        const bucketMax = (bIdx === bucketCount - 1) ? maxVal : (minVal + (bIdx + 1) * range);
        const hasDecimals = arrayData.some(n => n % 1 !== 0);
        const precision = hasDecimals ? 2 : 0;
        
        const endLabel = (bIdx === bucketCount - 1) ? ` ≤ ${bucketMax.toFixed(precision)}` : ` < ${bucketMax.toFixed(precision)}`;
        
        label.textContent = `Bucket ${bIdx}: ${bucketMin.toFixed(precision)}${endLabel}`;
        
        label.style.fontWeight = '600';
        label.style.marginBottom = '4px';
        label.style.fontSize = '0.8rem';
        bucketDiv.appendChild(label);

        const elements = document.createElement('div');
        elements.style.display = 'flex';
        elements.style.gap = '6px';
        elements.style.flexWrap = 'wrap';
        elements.style.justifyContent = 'center';

        bucket.forEach((val, idx) => {
            const el = document.createElement('div');
            el.textContent = val;
            el.style.padding = '6px 8px';
            el.style.borderRadius = '6px';
            el.style.border = '1.5px solid #007b78';
            el.style.minWidth = '28px';
            el.style.textAlign = 'center';
            el.style.fontSize = '0.9rem';

            if (highlight.bucket === bIdx) {
                if (highlight.phase === 'sorting' && highlight.innerIdx === idx) {
                    el.style.background = '#00cec8'; // Current insertion position
                } else if (highlight.phase === 'sorting' && highlight.sortIdx === idx) {
                    el.style.background = '#aaf3e6'; // Element being inserted (key)
                } else if (highlight.phase === 'merging' && val === highlight.elementVal && highlight.output === undefined) {
                    // Highlight when being READ from bucket
                    el.style.background = '#ffd966'; 
                } else {
                    el.style.background = '#ffffff';
                }
            } else {
                 el.style.background = '#ffffff';
            }

            elements.appendChild(el);
        });

        bucketDiv.appendChild(elements);
        container.appendChild(bucketDiv);
    });

    wrapper.appendChild(container);
    ANIMATION_CANVAS.appendChild(wrapper);
}


    // --- Output Array ---
    if (outputArr) createArraySection('Output Array', outputArr, highlight, true);
}