# Interactive Sorting Visualizer

An interactive web-based application that visually demonstrates the execution of **non-comparison-based sorting algorithms**, helping bridge the gap between theoretical algorithm analysis and practical understanding.

This project focuses on how **linear-time sorting** is achieved by leveraging **data distribution and auxiliary memory**, rather than comparisons.


Live Demo **https://aayushi262005.github.io/VisualizationProject**

## Project Purpose

Sorting algorithms are often taught abstractly, making it difficult to reason about their internal behavior.  
This visualizer was built to make algorithm execution **observable, inspectable, and interactive**, allowing users to analyze:

- Intermediate array states
- Auxiliary data structures
- Step-by-step progression of the algorithm

## Features

- Step-by-step animation of sorting process
-  Playback controls:
    - Play / Pause
    - Next Step
    - Previous Step
- Adjustable animation speed
- Custom array input (comma-separated)
- Random array generation
- Visualization of auxiliary structures:
  - Count array (Counting & Radix Sort)
  - Buckets (Bucket Sort)
- Dynamic explanation with **Time & Space Complexity**
- Fully responsive UI (desktop & mobile friendly)

## Algorithms Covered

| Algorithm     | Time Complexity        | Space Complexity |
|---------------|------------------------|------------------|
| Counting Sort | O(n + k)               | O(k)             |
| Radix Sort    | O(d · (n + k))         | O(n + k)         |
| Bucket Sort   | O(n + k) (average)     | O(n + k)         |

## Tech Stack

- **JavaScript (ES6+)**
- **HTML5**
- **CSS3**
- **Git & GitHub Pages**

No external frameworks or libraries were used.

## How to Run

1. Clone the repository
2. Open `index.html` in a modern browser
3. Select a sorting algorithm from the top bar
4. Enter an array (comma-separated)  
   - Example: `34, 12, 9, 5, 20`
5. Or click **Generate Random Array**
6. Click **Visualize Array**
7. Control the animation using:
   - Play / Pause
   - Next / Previous step
   - Speed slider

## Learning Outcomes

- Understand why comparison-based sorts have theoretical lower bounds
- Visualize how auxiliary memory enables linear-time sorting
- Analyze algorithm stability, digit processing, and distribution techniques
- Strengthen DAA concepts through deterministic execution inspection

## Author

**Aayushi**  
B.Tech – Computer Science & Engineering (AI) 
This project is intended for academic and educational use.



