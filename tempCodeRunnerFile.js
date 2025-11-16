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