const ANIMATION_CANVAS = document.getElementById('animationCanvas');
const TIME_COMPLEXITY_SPAN = document.getElementById('timeComplexity');
const SPACE_COMPLEXITY_SPAN = document.getElementById('spaceComplexity');
const ALGO_EXPLANATION_DIV = document.getElementById('algoExplanation');
const SPEED_RANGE = document.getElementById('speedRange');
const ARRAY_INPUT = document.getElementById('arrayInput');
const VISUALIZE_BTN = document.getElementById('visualizeBtn');
const RANDOM_BTN = document.getElementById('randomArrayBtn');
const ALGO_BUTTONS = document.querySelectorAll('.algo-btn');
const PREV_BTN = document.getElementById('prevBtn');
const PAUSE_BTN = document.getElementById('pauseBtn');
const NEXT_BTN = document.getElementById('nextBtn');
const BUCKET_INPUT_GROUP = document.getElementById('bucketInputGroup');
const BUCKET_COUNT_INPUT = document.getElementById('bucketCountInput');

// Global array used by Radix Sort visualization
const RADIX_DIGIT_NAMES = ['LSD (Units)', 'Tens', 'Hundreds', 'Thousands', 'Ten Thousands'];

let arrayData = [];
let animationSpeed = 400; // Default speed in ms (will be overwritten by range default)
let selectedAlgorithm = null; 

let animationSteps = [];
let currentStep = 0;
let isVisualizationActive = false; 
let autoplayInterval = null; // null means STOPPED/PAUSED (button shows 'Play')
let isPausedByUser = false; // Flag to track explicit user pause during an active step sequence

// --- Complexity and Explanation Data ---

const ALGORITHM_DETAILS = {
    'counting': {
        time: 'O(n + k)',
        space: 'O(k)',
        explanation: `
            <strong style="font-size: 1.05em;">Counting Sort — Linear Time, Non-Comparison</strong>
            <ul style="margin-top: 0.5rem; padding-left: 1.2rem; line-height: 1.5;">
                <li><strong>Count Frequencies:</strong>  
                    Count array stores how often each value appears.
                </li>
                <li><strong>Cumulative Sum:</strong>  
                    Convert counts to positions to keep the sort <strong>stable</strong>.
                </li>
                <li><strong>Build Output:</strong>  
                    Place elements in the output array (backward pass) using cumulative indices.
                </li>
                <li>
                <strong>Constraint:</strong>  
                    Efficient only when value range (<em>k</em>) is small compared to the number of elements (<em>n</em>).
                </li>
            </ul>
        `,
        mode: 'int'
    },
    'radix': {
        time: 'O(d * (n + k))',
        space: 'O(n + k)',
        explanation: `
            <strong style="font-size: 1.05em;">Radix Sort — Digit-by-Digit Stable Sorting</strong>
            <ul style="margin-top: 0.5rem; padding-left: 1.2rem; line-height: 1.5;">
                <li><strong>Process:</strong>  
                    Sorts numbers digit by digit, starting from the <strong>Least Significant Digit (LSD)</strong> to the <strong>Most Significant Digit (MSD)</strong>.
                </li>
                <li><strong>Inner Sort:</strong>  
                    Uses a <strong>stable sort</strong> (like Counting Sort) on each digit to maintain relative order.
                </li>
                <li><strong>Why LSD First:</strong>  
                    Ensures earlier digit order is preserved, resulting in a fully sorted array after the final pass.
                </li>
                <li>
                <strong>Complexity:</strong>  
                    <em>O(d*(n + k))</em>, where <em>d</em> is the number of digits.
                </li>
            </ul>
        `,
        mode: 'int'
    },
    'bucket': {
        time: 'O(n + k) / O(n\u00B2) ',
        space: 'O(n + k)',
        explanation: `
            <strong style="font-size: 1.05em;">Bucket Sort — Partitioning for Parallel Speed</strong>
            <ul style="margin-top: 0.5rem; padding-left: 1.2rem; line-height: 1.5;">
                <li><strong>Phase 1: Distribution:</strong>  
                    Elements are distributed into smaller <strong>buckets</strong> based on their value range using a mapping function.
                </li>
                <li><strong>Phase 2: Sub-Sorting:</strong>  
                    Each bucket is sorted individually (commonly with <strong>Insertion Sort</strong>) — fast because buckets are small.
                </li>
                <li><strong>Phase 3: Merging:</strong>  
                    Sorted buckets are concatenated to produce the final sorted array.
                </li>
                <li>
                <strong>Performance Note:</strong>  
                    Average time <em>O(n + k)</em> (when input is uniformly distributed); worst case <em>O(n\u00B2)</em>.
                </li>
            </ul>
        `,
        mode: 'float'
    }
};


// --- Utility Functions ---

function updateAlgorithmInfo(algo) {
    const details = ALGORITHM_DETAILS[algo] || {};
    if (algo === 'bucket') {
        BUCKET_INPUT_GROUP.style.display = 'block';
    } else {
        BUCKET_INPUT_GROUP.style.display = 'none';
    }
    
    TIME_COMPLEXITY_SPAN.innerHTML = details.time || '-';
    SPACE_COMPLEXITY_SPAN.innerHTML = details.space || '-';
    
    ALGO_EXPLANATION_DIV.innerHTML = details.explanation || '<p>Select an algorithm to see its details and complexity.</p>';
}

// 🐛 UPDATED: Ensure button text reflects autoplayInterval status ONLY when steps exist.
function toggleControls() {
    
    const stepsExist = animationSteps.length > 0;
    const isAnimationRunning = autoplayInterval !== null;

    // 1. Play/Pause Button Text
    if (stepsExist) {
        if (isAnimationRunning) {
            // Animation is running (autoplayInterval != null) -> Show 'Pause'
            PAUSE_BTN.textContent = 'Pause';
            PAUSE_BTN.setAttribute('data-state', 'pause');
        } else {
            // Animation is stopped/paused (autoplayInterval == null) -> Show 'Play'
            PAUSE_BTN.textContent = 'Play'; 
            PAUSE_BTN.setAttribute('data-state', 'play');
        }
    } 
    // If steps don't exist (on load), the button text is left as the HTML default.


    // 2. Visualize/Reset Button Text & Colors
    if (isVisualizationActive) {
        VISUALIZE_BTN.textContent = 'Reset';
        VISUALIZE_BTN.style.backgroundColor = '#e74c3c'; // Red for abort/reset
        
        RANDOM_BTN.disabled = true; 
        ALGO_BUTTONS.forEach(btn => btn.disabled = true);
        
    } else {
        VISUALIZE_BTN.textContent = 'Visualize Array';
        VISUALIZE_BTN.style.backgroundColor = '#02948f'; // Primary color
        
        RANDOM_BTN.disabled = false;
        ALGO_BUTTONS.forEach(btn => btn.disabled = false);
    }
    
    // 3. Control Disabling Logic
    VISUALIZE_BTN.disabled = !isVisualizationActive && (!ARRAY_INPUT.value || !selectedAlgorithm);
    
    PREV_BTN.disabled = isAnimationRunning || !stepsExist || currentStep === 0;
    NEXT_BTN.disabled = isAnimationRunning || !stepsExist || currentStep === animationSteps.length - 1; 
    
    // PAUSE_BTN should be disabled only if there are NO steps to play,
    // or if the animation is finished and not running (i.e., we are on the last step).
    PAUSE_BTN.disabled = !stepsExist || (currentStep === animationSteps.length - 1 && !isAnimationRunning); 
}

function resetVisualization() {
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = null;
    
    currentStep = 0;
    animationSteps = [];
    isVisualizationActive = false;
    isPausedByUser = false;
    
    // Reset canvas to placeholder state
    ANIMATION_CANVAS.style.display = 'flex';
    ANIMATION_CANVAS.style.flexDirection = 'column';
    ANIMATION_CANVAS.style.justifyContent = 'center'; 
    ANIMATION_CANVAS.style.alignItems = 'center'; 
    ANIMATION_CANVAS.style.padding = '0'; 

    ANIMATION_CANVAS.innerHTML = '<div style="font-size: 1.8rem; font-weight: 300; color: var(--color-text-light);">Visualize your input or generate a random array to start.</div>';
    
    toggleControls();
}

function parseArray(input, mode = 'int') {
    const parser = (mode === 'float') ? parseFloat : parseInt;
    return input.split(',')
    .map(s => {
        const trimmedS = s.trim();
        if (trimmedS === '') return NaN; 
        const parsed = parser(trimmedS);
        return mode === 'float' ? parseFloat(trimmedS) : parsed;
    })
    .filter(n => !isNaN(n) && n >= 0);
}

function generateRandomArray(size, maxVal = 20, mode = 'int') {
    if (mode === 'float') {
        return Array.from({ length: size }, () => parseFloat((Math.random() * 99).toFixed(2))); 
    }
    return Array.from({ length: size }, () => Math.floor(Math.random() * maxVal));
}

// 🐛 UPDATED: Ensure toggleControls is called *after* interval is set/cleared.
function startAutoplay() {
    // Clear any existing interval before starting a new one
    if (autoplayInterval) clearInterval(autoplayInterval);
    
    isPausedByUser = false;
    
    // Set the interval (autoplayInterval is now non-null)
    autoplayInterval = setInterval(() => {
        
        // Handle Delay steps (The phase-gap)
        if (animationSteps[currentStep] && animationSteps[currentStep].highlight.delay) {
            
            clearInterval(autoplayInterval);
            autoplayInterval = null;
            
            renderStep(animationSteps[currentStep]); 

            // Silent pause: restart autoplay after delay time
            setTimeout(() => {
                if (!isPausedByUser) { 
                    currentStep++; 
                    startAutoplay();
                } else {
                    toggleControls(); 
                }
            }, animationSpeed * 0.1); 
            
            return;
        }
        
        // Normal step logic
        if (currentStep >= animationSteps.length - 1) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
            isVisualizationActive = false;
            toggleControls(); // Sets to 'Play' (Finished)
            return;
        }
        
        currentStep++;
        renderStep(animationSteps[currentStep]);
    }, animationSpeed);
    
    // CRITICAL FIX: Ensure controls update *after* the interval is set.
    toggleControls(); 
}


// --- Algorithm Implementations (Kept the same) ---

async function countingSort(arr) {
    const originalArr = [...arr];
    const maxVal = Math.max(...arr, 0);
    const countArr = new Array(maxVal + 1).fill(0);
    const outputArr = new Array(arr.length).fill(null); 

    function storeStep(inputArr, countArr, outputArr, highlight = {}, final = false) {
        animationSteps.push({
            inputArr: [...inputArr],
            countArr: [...countArr],
            outputArr: [...outputArr],
            highlight: { ...highlight },
            final
        });
    }

    // Step 0: Input Array Visible (initStep: 1)
    storeStep(arr, new Array(0), new Array(0), { initStep: 1 });
    // Step 1: Delay/Pause Step (The 1-second gap - now silent)
    storeStep(arr, new Array(0), new Array(0), { initStep: 1, delay: true }); 
    // Step 2: Count Array Visible (initStep: 2)
    storeStep(arr, countArr, new Array(0), { initStep: 2 });

    // --- Phase 1: Counting ---
    for (let i = 0; i < arr.length; i++) {
        storeStep(arr, countArr, new Array(0), { phase: 'read_input', input: i, val: arr[i] }); 
        countArr[arr[i]]++;
        storeStep(arr, countArr, new Array(0), { phase: 'update_count', count: arr[i] }); 
    }

    // --- Phase 2: Accumulation (Cumulative Sum) ---
    for (let i = 1; i <= maxVal; i++) {
        storeStep(arr, countArr, new Array(0), { phase: 'read_count_accum', count: i }); 
        countArr[i] += countArr[i - 1];
        storeStep(arr, countArr, new Array(0), { phase: 'update_count_accum', count: i }); 
    }

    // Step 3: Output Array Visible (Transition to Phase 3 - initStep: 3)
    storeStep(arr, countArr, outputArr, { initStep: 3 }); 

    // --- Phase 3: Building Output (Backward Pass for Stability) ---
    for (let i = arr.length - 1; i >= 0; i--) {
        const val = arr[i];
        const pos = countArr[val] - 1;
        
        storeStep(arr, countArr, outputArr, { phase: 'read_input_output', input: i, val: val, count: val, outputPos: pos }); 

        outputArr[pos] = val;
        countArr[val]--;
        
        storeStep(arr, countArr, outputArr, { phase: 'place_output', output: pos, count: val }); 
    }

    // Final Step: Show Original Input Array and the Sorted Output Array
    storeStep(originalArr, new Array(0), outputArr, { finalStep: true }, true);
}


async function radixSort(arr) {
    const originalArr = [...arr];
    const maxNum = Math.max(...arr, 0);
    const numDigits = Math.max(1, maxNum.toString().length);
    const outputArr = new Array(arr.length).fill(null);
    let workingArr = [...arr];

    function padArr(a, d) {
        return a.map(n => String(n).padStart(d, '0'));
    }

    let paddedArr = padArr(workingArr, numDigits);

    function storeStepSafe(inputArr, countArr, outputArrLocal, highlight = {}, final = false) {
        const safeHighlight = {
            phase: (typeof highlight.phase === 'string') ? highlight.phase : '',
            digitIdx: (typeof highlight.digitIdx === 'number') ? highlight.digitIdx : -1,
            input: highlight.input,
            count: highlight.count,
            digit: highlight.digit,
            output: highlight.output,
            outputPos: highlight.outputPos,
            delay: !!highlight.delay,
            initStep: highlight.initStep === undefined ? undefined : highlight.initStep,
            finalStep: !!highlight.finalStep
        };

        animationSteps.push({
            inputArr: [...inputArr],
            countArr: Array.isArray(countArr) ? [...countArr] : [],
            outputArr: Array.isArray(outputArrLocal) ? [...outputArrLocal] : [],
            highlight: safeHighlight,
            final
        });
    }

    // Step 0: show initial input
    storeStepSafe(workingArr, new Array(0), new Array(0), { phase: '', digitIdx: -1, initStep: 1 });
    // Step 1: small pause (The 1-second gap - now silent)
    storeStepSafe(workingArr, new Array(0), new Array(0), { phase: '', digitIdx: -1, initStep: 1, delay: true });

    for (let digitPos = 0; digitPos < numDigits; digitPos++) {
        const countArr = new Array(10).fill(0);

        // Step: show count array (visible)
        storeStepSafe(workingArr, countArr, new Array(0), { phase: 'count_init', digitIdx: digitPos, initStep: 2 });

        // Phase 1: count digits
        for (let i = 0; i < workingArr.length; i++) {
            const digit = parseInt(paddedArr[i][numDigits - 1 - digitPos], 10);

            storeStepSafe(workingArr, countArr, new Array(0), { phase: 'radix_read_input', digitIdx: digitPos, input: i, digit });

            countArr[digit]++;
            storeStepSafe(workingArr, countArr, new Array(0), { phase: 'radix_update_count', digitIdx: digitPos, count: digit });
        }

        // Phase 2: accumulation (cumulative sums)
        for (let i = 1; i <= 9; i++) {
            storeStepSafe(workingArr, countArr, new Array(0), { phase: 'radix_read_accum', digitIdx: digitPos, count: i });
            countArr[i] += countArr[i - 1];
            storeStepSafe(workingArr, countArr, new Array(0), { phase: 'radix_update_accum', digitIdx: digitPos, count: i });
        }

        // Step: show transition to output array visible
        storeStepSafe(workingArr, countArr, outputArr, { phase: 'prepare_output', digitIdx: digitPos, initStep: 3 });

        // Phase 3: build output by placing elements (stable — iterate backward)
        for (let i = workingArr.length - 1; i >= 0; i--) {
            const digit = parseInt(paddedArr[i][numDigits - 1 - digitPos], 10);
            const pos = countArr[digit] - 1;

            storeStepSafe(workingArr, countArr, outputArr, { phase: 'radix_read_output', digitIdx: digitPos, input: i, count: digit, outputPos: pos });

            outputArr[pos] = workingArr[i];
            countArr[digit]--;
            storeStepSafe(workingArr, countArr, outputArr, { phase: 'radix_place_output', digitIdx: digitPos, output: pos, count: digit });
        }

        // Prepare for next pass
        const outputForNextStep = outputArr.filter(n => n !== null);
        workingArr = [...outputForNextStep];
        paddedArr = padArr(workingArr, numDigits);

        // Clear the outputArr slots
        for (let i = 0; i < outputArr.length; i++) outputArr[i] = null;

        if (digitPos < numDigits - 1) {
            // pass complete (show small delay)
            storeStepSafe(workingArr, new Array(10).fill(0), new Array(0), { phase: 'radix_pass_complete', digitIdx: digitPos + 1, delay: true }); // digitIdx is for the *next* pass
            // reset to input-visible for next pass (no highlighted digit)
            storeStepSafe(workingArr, new Array(0), new Array(0), { phase: '', digitIdx: -1, initStep: 1 });
        }
    }

    // Final: show original input and final sorted result
    storeStepSafe(originalArr, new Array(0), workingArr, { phase: 'final', digitIdx: -1, finalStep: true }, true);
}


async function bucketSort(arr) {
    const originalArr = [...arr];
    const n = arr.length;
    if (n <= 0) return;

    const maxVal = Math.max(...arr);
    const minVal = Math.min(...arr);
    const totalRange = maxVal - minVal;

    let bucketCount;
    const userInput = parseInt(BUCKET_COUNT_INPUT.value);

    if (userInput > 0) {
        // Use user-defined number of buckets
        bucketCount = userInput;
    } else {
        // Use default calculation (floor(sqrt(n)))
        bucketCount = Math.floor(Math.sqrt(n)) || 1;
    }
    const buckets = Array.from({ length: bucketCount }, () => []);
    const outputArr = new Array(n).fill(null);

    const actualRange = totalRange || 1; 

    function storeStep(inputArr, buckets, outputArr, highlight = {}, final = false) {
        animationSteps.push({
            inputArr: [...inputArr],
            buckets: buckets.map(bucket => [...bucket]),
            outputArr: [...outputArr],
            highlight: { ...highlight },
            final
        });
    }

    // Step 0: Input Array Visible
    storeStep(arr, Array.from({ length: 0 }, () => []), new Array(0), { initStep: 1 });
    // Step 1: Delay/Pause Step (The 1-second gap - now silent)
    storeStep(arr, Array.from({ length: 0 }, () => []), new Array(0), { initStep: 1, delay: true }); 
    // Step 2: Buckets Visible
    storeStep(arr, buckets, new Array(0), { initStep: 2 });

    // --- Phase 1: Distribution ---
    for (let i = 0; i < n; i++) {
        const val = arr[i];
        let index;
        if (totalRange === 0 || val === maxVal) {
             index = bucketCount - 1; 
        } else {
             // Calculate bucket index relative to the range [minVal, maxVal)
             index = Math.floor(((val - minVal) / actualRange) * bucketCount);
        }
        if (index < 0) index = 0; 
        
        buckets[index].push(val);
        storeStep(arr, buckets, new Array(0), { phase: 'bucket_distribution', input: i, bucket: index });
    }

    // --- Phase 2: Sub-Sorting (Insertion Sort) ---
    for (let b = 0; b < bucketCount; b++) {
        if (buckets[b].length === 0) continue;
        
        // This is insertion sort within the bucket:
        for (let i = 1; i < buckets[b].length; i++) {
            let key = buckets[b][i];
            let j = i - 1;
            storeStep(arr, buckets, new Array(0), { phase: 'bucket_sorting', bucket: b, sortIdx: i });
            
            while (j >= 0 && buckets[b][j] > key) {
                buckets[b][j + 1] = buckets[b][j];
                j--;
                storeStep(arr, buckets, new Array(0), { phase: 'bucket_sorting', bucket: b, sortIdx: i, innerIdx: j + 1 });
            }
            buckets[b][j + 1] = key;
            storeStep(arr, buckets, new Array(0), { phase: 'bucket_sorting', bucket: b, sortIdx: i, innerIdx: j + 1 });
        }
    }
    
    // Step 3: Output Array Visible (Transition to Phase 3)
    storeStep(arr, buckets, outputArr, { initStep: 3 });

    // --- Phase 3: Merging ---
    let idx = 0;
    for (let b = 0; b < bucketCount; b++) {
        for (let innerIdx = 0; innerIdx < buckets[b].length; innerIdx++) { 
            let val = buckets[b][innerIdx]; 
            storeStep(arr, buckets, outputArr, { phase: 'bucket_merging', bucket: b, innerIdx: innerIdx }); 

            outputArr[idx++] = val;

            storeStep(arr, buckets, outputArr, { phase: 'bucket_place_output', output: idx - 1 });
        }
    }

    // Final Step: Show Original Input Array and the Sorted Output Array
    storeStep(originalArr, buckets, outputArr, { finalStep: true }, true);
}


// Helper function for rendering visualization steps (Kept the same)

function renderBuckets(buckets, hlight, arrayData, contentWrapper, elementWidth, visibleStep) {
    const HLIGHT_COLOR_READ = 'var(--color-highlight-read)'; 
    const HLIGHT_COLOR_WRITE = 'var(--color-highlight-write)';
    
    const isVisible = hlight.finalStep || (hlight.initStep && hlight.initStep >= visibleStep) || (!hlight.initStep && !hlight.finalStep);
    if (!isVisible) return;
    
    const allVals = arrayData.map(n => String(n));
    const maxValLength = allVals.length ? Math.max(...allVals.map(s => s.length)) : 1;
    const bucketItemWidth = Math.min(40, Math.max(30, maxValLength * 6 + 10)); 

    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '10px'; 
    wrapper.style.textAlign = 'center';
    wrapper.style.width = '100%';
    
    const heading = document.createElement('div');
    heading.textContent = 'Buckets (Auxiliary Structure)';
    heading.style.fontWeight = '600';
    heading.style.color = 'var(--color-primary-dark)';
    heading.style.marginBottom = '8px';
    heading.style.fontSize = '0.9rem';
    wrapper.appendChild(heading);

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '15px'; 
    container.style.justifyContent = 'center';
    
    buckets.forEach((bucket, bIdx) => {
        const bucketContainer = document.createElement('div');
        bucketContainer.style.display = 'flex';
        bucketContainer.style.flexDirection = 'column';
        bucketContainer.style.alignItems = 'center';
        bucketContainer.style.border = '1px solid var(--color-border)';
        bucketContainer.style.borderRadius = '6px';
        bucketContainer.style.padding = '8px';
        bucketContainer.style.minWidth = '60px';
        bucketContainer.style.minHeight = '60px';
        bucketContainer.style.backgroundColor = (hlight.bucket === bIdx) ? 'rgba(2, 148, 143, 0.1)' : 'var(--color-background-light)';

        const bucketLabel = document.createElement('span');
        bucketLabel.textContent = `Bucket ${bIdx}`;
        bucketLabel.style.fontSize = '0.75rem';
        bucketLabel.style.fontWeight = '700';
        bucketLabel.style.marginBottom = '5px';
        bucketLabel.style.color = 'var(--color-primary-dark)';
        bucketContainer.appendChild(bucketLabel);

        const itemsContainer = document.createElement('div');
        itemsContainer.style.display = 'flex';
        itemsContainer.style.flexWrap = 'wrap';
        itemsContainer.style.gap = '4px';
        itemsContainer.style.justifyContent = 'center';

        bucket.forEach((val, innerIdx) => {
            const itemBox = document.createElement('div');
            itemBox.textContent = (val % 1 !== 0) ? val.toFixed(2) : val; 
            itemBox.style.width = `${bucketItemWidth}px`;
            itemBox.style.height = '25px';
            itemBox.style.display = 'flex';
            itemBox.style.alignItems = 'center';
            itemBox.style.justifyContent = 'center';
            itemBox.style.border = '1px solid var(--color-primary)';
            itemBox.style.borderRadius = '3px';
            itemBox.style.fontSize = '0.75rem';
            itemBox.style.fontWeight = '500';
            itemBox.style.backgroundColor = 'var(--color-main-bg)';

            if (hlight.bucket === bIdx) {
                if (hlight.phase === 'bucket_sorting' && (hlight.innerIdx === innerIdx || hlight.sortIdx === innerIdx)) {
                    itemBox.style.backgroundColor = HLIGHT_COLOR_READ; 
                } else if (hlight.phase.includes('merging') && hlight.innerIdx === innerIdx) {
                    itemBox.style.backgroundColor = HLIGHT_COLOR_WRITE; 
                }
            }
            itemsContainer.appendChild(itemBox);
        });
        
        bucketContainer.appendChild(itemsContainer);
        container.appendChild(bucketContainer);
    });

    wrapper.appendChild(container);
    contentWrapper.appendChild(wrapper);
}

function renderStep(step) {
    const { inputArr, countArr, buckets, outputArr, highlight = {}, final } = step || {};
    
    const HLIGHT_COLOR_READ = 'var(--color-highlight-read)'; 
    const HLIGHT_COLOR_WRITE = 'var(--color-highlight-write)';
    const HLIGHT_COLOR_COUNT = 'var(--color-highlight-count)';
    const HLIGHT_COLOR_COUNT_UPDATE = 'var(--color-highlight-count-update)';
    
    ANIMATION_CANVAS.style.display = 'block'; 
    ANIMATION_CANVAS.style.padding = '15px'; 
    ANIMATION_CANVAS.innerHTML = '';

    const allVals = (inputArr || []).concat(outputArr || []).filter(n => n !== null).map(n => String(n));
    const maxValLength = allVals.length ? Math.max(...allVals.map(s => s.length)) : 1;
    const elementWidth = Math.min(50, Math.max(30, maxValLength * 8 + 10)); 
    
    // 2. Phase Title
    const phaseTitle = document.createElement('h3');
    phaseTitle.style.textAlign = 'left'; 
    phaseTitle.style.color = 'var(--color-primary-dark)';
    phaseTitle.style.marginBottom = '15px'; 
    phaseTitle.style.fontWeight = '700';
    phaseTitle.style.fontSize = '1.1rem';

    // --- Phase Title Logic ---
    if (highlight.finalStep) {
        phaseTitle.textContent = 'Sorting Complete! 🎉 Final Sorted Array.';
    } else if (highlight.phase === 'radix_pass_complete' && highlight.delay) {
        // RADIX PASS COMPLETE TRANSITION
        const numDigits = arrayData.length ? Math.max(...arrayData, 0).toString().length : 1;
        const nextDigitName = RADIX_DIGIT_NAMES[highlight.digitIdx] || `Digit ${highlight.digitIdx + 1}`;
        const currentPass = highlight.digitIdx; 
        phaseTitle.textContent = `✅ Pass ${currentPass}/${numDigits} Complete! Starting Pass ${currentPass + 1} (${nextDigitName})...`;
    } else if (highlight.initStep) {
        if (highlight.initStep === 1 && !highlight.delay) phaseTitle.textContent = 'Step 1: Introducing the Input Array.';
        else if (highlight.initStep === 1 && highlight.delay) phaseTitle.textContent = '...'; 
        else if (highlight.initStep === 2) phaseTitle.textContent = 'Step 2: Initializing Auxiliary Structure (Count Array/Buckets).';
        else if (highlight.initStep === 3) phaseTitle.textContent = 'Step 3: Initializing Output Array.';
    } else if (selectedAlgorithm === 'counting') {
        if (highlight.phase === 'read_input') phaseTitle.textContent = `Phase 1: Reading Input ${highlight.input} (Value ${highlight.val}) for Counting`;
        else if (highlight.phase === 'update_count') phaseTitle.textContent = `Phase 1: Frequency count updated at index ${highlight.count}`;
        else if (highlight.phase === 'read_count_accum' || highlight.phase === 'update_count_accum') phaseTitle.textContent = `Phase 2: Calculating Cumulative Sum at index ${highlight.count}`;
        else if (highlight.phase === 'read_input_output' || highlight.phase === 'place_output') phaseTitle.textContent = `Phase 3: Placing Input ${highlight.input} to Output Index ${highlight.outputPos}`;
        else phaseTitle.textContent = 'Processing...';
    } else if (selectedAlgorithm === 'radix' && highlight.digitIdx !== undefined) {
        const numDigits = arrayData.length ? Math.max(...arrayData, 0).toString().length : 1;
        const currentPass = highlight.digitIdx + 1;
        const currentDigitName = RADIX_DIGIT_NAMES[highlight.digitIdx] || `Digit ${currentPass}`;
        
        if (highlight.phase.includes('read_input')) phaseTitle.textContent = `Pass ${currentPass}/${numDigits} (${currentDigitName}): Reading digit ${highlight.digit} from element ${highlight.input}`;
        else if (highlight.phase.includes('update_count')) phaseTitle.textContent = `Pass ${currentPass}/${numDigits} (${currentDigitName}): Count updated for digit ${highlight.count}`;
        else if (highlight.phase.includes('accum')) phaseTitle.textContent = `Pass ${currentPass}/${numDigits} (${currentDigitName}): Calculating Cumulative Sums`;
        else if (highlight.phase.includes('output')) phaseTitle.textContent = `Pass ${currentPass}/${numDigits} (${currentDigitName}): Placing element to Output Array`;
        else phaseTitle.textContent = `Processing Pass ${currentPass}/${numDigits}...`;
    } else if (selectedAlgorithm === 'bucket') {
        if (highlight.phase === 'bucket_distribution') phaseTitle.textContent = `Phase 1: Distributing Input ${highlight.input} into Bucket ${highlight.bucket}`;
        else if (highlight.phase.includes('sorting')) phaseTitle.textContent = `Phase 2: Insertion Sort in Bucket ${highlight.bucket}`;
        else if (highlight.phase.includes('merging') || highlight.phase.includes('place_output')) phaseTitle.textContent = `Phase 3: Merging from Bucket ${highlight.bucket}`;
        else phaseTitle.textContent = 'Processing...';
    } else {
        phaseTitle.textContent = 'Initialization/Processing Array';
    }
    
    ANIMATION_CANVAS.appendChild(phaseTitle);

    // 3. Main Content Wrapper (Centered)
    const centeringWrapper = document.createElement('div');
    centeringWrapper.style.display = 'flex';
    centeringWrapper.style.flexDirection = 'column';
    centeringWrapper.style.alignItems = 'center'; 
    centeringWrapper.style.width = '100%';
    centeringWrapper.style.flexGrow = '1'; 
    
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.alignItems = 'center'; 
    contentWrapper.style.width = '100%';
    centeringWrapper.appendChild(contentWrapper);
    ANIMATION_CANVAS.appendChild(centeringWrapper);
    
    // Helper function for creating array sections
    function createArraySection(title, arr, hlight, isPrimary = false, isCount = false, arrayId = 'input', visibleStep = 0) {
        if (!arr || arr.length === 0) return;
        
        const isVisible = hlight.finalStep || (hlight.initStep && hlight.initStep >= visibleStep) || (!hlight.initStep && !hlight.finalStep);
        if (!isVisible) return;
        
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = isCount ? '15px' : '10px'; 
        wrapper.style.textAlign = 'center';
        wrapper.style.width = '100%';
        
        const heading = document.createElement('div');
        heading.textContent = title;
        heading.style.fontWeight = '600';
        heading.style.color = 'var(--color-primary-dark)';
        heading.style.marginBottom = '4px';
        heading.style.fontSize = isPrimary ? '0.95rem' : '0.9rem';
        wrapper.appendChild(heading);

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = isCount ? '4px' : '6px'; 
        container.style.justifyContent = 'center';

        arr.forEach((val, idx) => {
            const boxWrapper = document.createElement('div');
            boxWrapper.style.display = 'flex';
            boxWrapper.style.flexDirection = 'column';
            boxWrapper.style.alignItems = 'center';
            boxWrapper.style.gap = '2px'; 
            
            if (!isCount && !final) {
                const idxSpan = document.createElement('span');
                idxSpan.textContent = idx;
                idxSpan.style.fontSize = '0.7rem';
                idxSpan.style.color = 'var(--color-text-light)';
                boxWrapper.appendChild(idxSpan);
            }

            // Value Box
            const box = document.createElement('div');
            box.style.display = 'flex';
            box.style.alignItems = 'center';
            box.style.justifyContent = 'center';
            box.style.width = isCount ? '40px' : `${elementWidth}px`; 
            box.style.height = '30px';
            box.style.border = '1.5px solid var(--color-primary)';
            box.style.borderRadius = '4px';
            box.style.fontWeight = isPrimary ? '600' : '500';
            box.style.fontSize = '0.85rem';
            box.style.transition = 'background-color 0.2s';

            let bgColor = final ? HLIGHT_COLOR_WRITE : 'var(--color-main-bg)'; 
            const currentCount = hlight.count;
            const currentPhase = hlight.phase;
            const currentDigitIdx = hlight.digitIdx; 

            // --- Background Color Logic (Non-Radix) ---
            if (isCount) {
                bgColor = HLIGHT_COLOR_COUNT; 
                if ((currentPhase && currentPhase.includes('update_count') && currentCount === idx) ||
                    (currentPhase && currentPhase.includes('update_accum') && currentCount === idx)) {
                    bgColor = HLIGHT_COLOR_COUNT_UPDATE; 
                } else if ((currentPhase && currentPhase.includes('read_count_accum') && currentCount === idx) ||
                            (currentPhase && currentPhase.includes('read_input_output') && currentCount === idx)) {
                    bgColor = HLIGHT_COLOR_READ; 
                }
            } else if (arrayId === 'output' && val !== undefined && val !== null) {
                if ((currentPhase && currentPhase.includes('place_output') && hlight.output === idx) ||
                    (currentPhase && currentPhase.includes('radix_place_output') && hlight.output === idx)) {
                    bgColor = HLIGHT_COLOR_WRITE; 
                }
            } else if (arrayId === 'input' && val !== undefined && val !== null) {
                if ((currentPhase && currentPhase.includes('read_input') && hlight.input === idx) ||
                    (currentPhase && currentPhase.includes('read_input_output') && hlight.input === idx) ||
                    (currentPhase === 'bucket_distribution' && hlight.input === idx)) {
                    bgColor = HLIGHT_COLOR_READ; 
                }
                
                // Radix-specific background color logic (Yellow for active element)
                if (selectedAlgorithm === 'radix' && !highlight.finalStep) {
                    if (hlight.input === idx && (currentPhase === 'radix_read_input' || currentPhase === 'radix_read_output')) {
                         bgColor = HLIGHT_COLOR_READ;
                    } else if (currentDigitIdx !== -1 && !currentPhase.includes('pass_complete') && !hlight.initStep) {
                         // Subtly color inactive elements in an active Radix pass
                         bgColor = 'rgba(240, 240, 240, 0.5)';
                    } else {
                         bgColor = 'var(--color-main-bg)'; 
                    }
                }
            }
            
            box.style.backgroundColor = bgColor;

            // --- Radix Digit Display and Highlighting ---
            if (selectedAlgorithm === 'radix' && !isCount && !final) { 
                box.innerHTML = ''; 
                
                const valString = (val !== undefined && val !== null) ? String(val) : '';
                const maxDigits = arrayData.length ? Math.max(...arrayData, 0).toString().length : 1;
                const paddedValue = valString.padStart(maxDigits, '0');
                const digits = paddedValue.split('');
                
                const focusedDigitCharIndex = digits.length - 1 - currentDigitIdx; 
                
                const isElementActive = hlight.input === idx && 
                                             currentDigitIdx !== -1 && 
                                             (currentPhase === 'radix_read_input' || currentPhase === 'radix_read_output');

                digits.forEach((digit, dIdx) => {
                    const digitSpan = document.createElement('span');
                    digitSpan.textContent = digit;
                    digitSpan.style.margin = '0 0.5px'; 
                    digitSpan.style.color = 'var(--color-text-dark)'; 

                    if (isElementActive && dIdx === focusedDigitCharIndex) {
                        // Apply the red highlight to the currently focused digit
                        digitSpan.style.color = '#e74c3c'; 
                        digitSpan.style.fontWeight = '700';
                        digitSpan.style.borderBottom = '2px solid #e74c3c';
                    }
                    box.appendChild(digitSpan);
                });
            } else {
                // Normal integer/float display
                const valSpan = document.createElement('span');
                valSpan.textContent = (val !== undefined && val !== null) ? (val % 1 !== 0 && selectedAlgorithm === 'bucket' ? val.toFixed(2) : val) : val;
                box.appendChild(valSpan);
            }

            boxWrapper.appendChild(box);
            if (isCount && !final) { 
                const idxSpan = document.createElement('span');
                idxSpan.textContent = idx;
                idxSpan.style.fontSize = '0.7rem';
                idxSpan.style.color = 'var(--color-text-light)';
                boxWrapper.appendChild(idxSpan);
            }

            container.appendChild(boxWrapper);
        });

        wrapper.appendChild(container);
        contentWrapper.appendChild(wrapper);
    }
    
    // 4. Sequential Layout Logic
    if (highlight.finalStep) {
        createArraySection('Original Input Array', inputArr, highlight, true, false, 'original', 1);
        
        const spacerFinal = document.createElement('div');
        spacerFinal.style.height = '30px';
        contentWrapper.appendChild(spacerFinal);
        
        createArraySection('Sorted Array', outputArr, highlight, true, false, 'final_output', 1);
        return; 
    }
    
    // 4.1 Input/Working Array
    if (inputArr) {
        const title = (selectedAlgorithm === 'radix' && !highlight.phase.includes('pass_complete')) ? 'Working Array' : 'Input Array';
        createArraySection(title, inputArr, highlight, true, false, 'input', 1);
    }
    
    const spacer = document.createElement('div');
    spacer.style.height = '20px';
    contentWrapper.appendChild(spacer);
    
    // 4.2 Count/Bucket Structure
    if (selectedAlgorithm === 'counting' || selectedAlgorithm === 'radix') {
          if (countArr) {
              createArraySection('Count/Frequency Array', countArr, highlight, false, true, 'count', 2);
          }
    } else if (selectedAlgorithm === 'bucket') {
        if (buckets) {
            renderBuckets(buckets, highlight, arrayData, contentWrapper, elementWidth, 2); 
        }
    }
    
    const spacer2 = document.createElement('div');
    spacer2.style.height = '20px';
    contentWrapper.appendChild(spacer2);

    // 4.3 Output Array
    if (outputArr) {
        createArraySection('Output Array', outputArr, highlight, true, false, 'output', 3);
    }
}


// --- Event Listeners ---

// 1. Algorithm Selection
ALGO_BUTTONS.forEach(btn => {
    btn.addEventListener('click', () => {
        const algo = btn.getAttribute('data-algo');
        if (selectedAlgorithm === algo) {
              resetVisualization(); 
              return;
        }

        ALGO_BUTTONS.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        selectedAlgorithm = algo;
        updateAlgorithmInfo(algo);
        resetVisualization(); 
    });
});

// 2. Speed Control
SPEED_RANGE.addEventListener('input', (e) => {
    animationSpeed = 1100 - parseInt(e.target.value); 

    if (autoplayInterval) {
        // If playing, restart the autoplay interval with the new speed
        startAutoplay(); 
    }
});

// 3. Visualization Start/Reset (using VISUALIZE_BTN)
VISUALIZE_BTN.addEventListener('click', async () => {
    if (isVisualizationActive) {
        resetVisualization();
        return;
    }
    
    if (!selectedAlgorithm) {
        alert('Please select a sorting algorithm first.');
        return;
    }

    const mode = ALGORITHM_DETAILS[selectedAlgorithm].mode;
    arrayData = parseArray(ARRAY_INPUT.value, mode);
    
    if (arrayData.length < 2) {
        alert('Please enter at least two valid non-negative numbers.');
        return;
    }
    
    // Prepare for visualization
    resetVisualization();
    isVisualizationActive = true;

    // Run the selected algorithm to populate animationSteps
    if (selectedAlgorithm === 'counting') {
        await countingSort(arrayData);
    } else if (selectedAlgorithm === 'radix') {
        await radixSort(arrayData);
    } else if (selectedAlgorithm === 'bucket') {
        await bucketSort(arrayData);
    }
    
    // Start playback
    if (animationSteps.length > 0) {
        renderStep(animationSteps[0]); 
        startAutoplay(); // Calls startAutoplay, which calls toggleControls and sets button to 'Pause'.
    }
});

// 4. Random Array Generation
RANDOM_BTN.addEventListener('click', () => {
    const mode = selectedAlgorithm ? ALGORITHM_DETAILS[selectedAlgorithm].mode : 'int';
    
    // Default maxVal is 20
    const randomArray = generateRandomArray(10, 20, mode); 
    
    ARRAY_INPUT.value = randomArray.join(', ');
    resetVisualization();
    
    if(selectedAlgorithm) {
        updateAlgorithmInfo(selectedAlgorithm);
    }
    toggleControls();
});

// 5. Playback Controls
PAUSE_BTN.addEventListener('click', () => {
    if (PAUSE_BTN.disabled) return; 
    
    if (autoplayInterval) { // If running (was 'Pause', so we stop it)
        clearInterval(autoplayInterval);
        autoplayInterval = null;
        isPausedByUser = true; // Set flag for manual pause
    } else { // If stopped (was 'Play', so we start it)
        isPausedByUser = false;
        startAutoplay();
    }
    toggleControls();
});

NEXT_BTN.addEventListener('click', () => {
    if (autoplayInterval) return; 
    
    if (currentStep < animationSteps.length - 1) {
        currentStep++;
        renderStep(animationSteps[currentStep]);
        toggleControls();
    }
});

PREV_BTN.addEventListener('click', () => {
    if (autoplayInterval) return; 
    
    if (currentStep > 0) {
        currentStep--;
        renderStep(animationSteps[currentStep]);
        toggleControls();
    }
});

// 6. Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    // Set initial speed based on range default value
    animationSpeed = 1100 - parseInt(SPEED_RANGE.value); 
    resetVisualization();
    toggleControls();
});