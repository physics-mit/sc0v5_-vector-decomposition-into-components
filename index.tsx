/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// TypeScript interfaces for better type safety (optional, but good practice)
interface VectorComponents {
    ax: number;
    ay: number;
    az?: number;
}

interface Example {
    name: string;
    ax: number;
    ay: number;
    az?: number;
    mode: '2D' | '3D';
}

// Constants for canvas drawing
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const GRID_SIZE = 20; // Affects scale of vector display
const AXIS_COLOR = '#7f8c8d';
const GRID_COLOR = '#ecf0f1';
const VECTOR_COLOR = '#3498db';
const COMPONENT_X_COLOR = '#e74c3c';
const COMPONENT_Y_COLOR = '#2ecc71';
const COMPONENT_Z_COLOR = '#9b59b6'; // For 3D representation
const PROJECTION_LINE_COLOR = '#bdc3c7';


document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const mode2DRadio = document.getElementById('mode2D') as HTMLInputElement;
    const mode3DRadio = document.getElementById('mode3D') as HTMLInputElement;
    const axInput = document.getElementById('ax') as HTMLInputElement;
    const ayInput = document.getElementById('ay') as HTMLInputElement;
    const azInput = document.getElementById('az') as HTMLInputElement;
    const azGroup = document.getElementById('az-group') as HTMLDivElement;
    const drawVectorBtn = document.getElementById('drawVectorBtn') as HTMLButtonElement;
    const vectorEquationDiv = document.getElementById('vectorEquation') as HTMLDivElement;
    const canvas = document.getElementById('vectorCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    const exampleButtonsContainer = document.getElementById('exampleButtonsContainer') as HTMLDivElement;

    // Initial setup
    let currentMode: '2D' | '3D' = '2D';
    azGroup.style.display = 'none'; // Initially hide Az input for 2D mode

    if (!ctx) {
        console.error('Failed to get canvas rendering context');
        if (vectorEquationDiv) vectorEquationDiv.textContent = "Error: Canvas not supported.";
        return;
    }

    // Example Scenarios
    const examples: Example[] = [
        { name: 'A = 2i + 3j (1st Quad)', ax: 2, ay: 3, mode: '2D' },
        { name: 'B = -3i + 2j (2nd Quad)', ax: -3, ay: 2, mode: '2D' },
        { name: 'C = -2i - 2j (3rd Quad)', ax: -2, ay: -2, mode: '2D' },
        { name: 'D = 4i - 1j (4th Quad)', ax: 4, ay: -1, mode: '2D' },
        { name: 'E = 5i (Along X-axis)', ax: 5, ay: 0, mode: '2D' },
        { name: 'F = -3j (Along Y-axis)', ax: 0, ay: -3, mode: '2D' },
        { name: 'G = 1i + 2j + 3k (3D)', ax: 1, ay: 2, az: 3, mode: '3D' },
        { name: 'H = 2i - 1j - 2k (3D)', ax: 2, ay: -1, az: -2, mode: '3D' },
    ];

    /**
     * Populates the example buttons in the UI.
     */
    function populateExamples() {
        examples.forEach(example => {
            const button = document.createElement('button');
            button.textContent = example.name;
            button.setAttribute('aria-label', `Load example: ${example.name}`);
            button.addEventListener('click', () => {
                axInput.value = example.ax.toString();
                ayInput.value = example.ay.toString();
                if (example.mode === '3D' && example.az !== undefined) {
                    azInput.value = example.az.toString();
                    mode3DRadio.checked = true;
                    azGroup.style.display = 'block';
                    currentMode = '3D';
                } else {
                    mode2DRadio.checked = true;
                    azGroup.style.display = 'none';
                    currentMode = '2D';
                }
                drawVector();
            });
            exampleButtonsContainer.appendChild(button);
        });
    }


    /**
     * Handles mode change between 2D and 3D.
     */
    function handleModeChange() {
        currentMode = mode3DRadio.checked ? '3D' : '2D';
        azGroup.style.display = currentMode === '3D' ? 'block' : 'none';
        // Redraw with current values if mode changes
        drawVector();
    }

    mode2DRadio.addEventListener('change', handleModeChange);
    mode3DRadio.addEventListener('change', handleModeChange);

    /**
     * Clears the canvas.
     */
    function clearCanvas() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    /**
     * Draws the grid and axes on the canvas.
     * @param centerX - The x-coordinate of the canvas center.
     * @param centerY - The y-coordinate of the canvas center.
     */
    function drawGridAndAxes(centerX: number, centerY: number) {
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 0.5;

        // Draw grid lines
        for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = AXIS_COLOR;
        ctx.lineWidth = 2;

        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(CANVAS_WIDTH, centerY);
        ctx.stroke();
        ctx.fillText('X', CANVAS_WIDTH - 15, centerY - 5);

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.fillText('Y', centerX + 5, 15);

        if (currentMode === '3D') {
            // Simplified Z-axis representation (e.g., oblique projection)
            // This is a visual cue, not a true 3D projection.
            const zAxisEndX = centerX + CANVAS_WIDTH / 4;
            const zAxisEndY = centerY - CANVAS_HEIGHT / 4;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(zAxisEndX, zAxisEndY); // Angled line for Z
            ctx.stroke();
            ctx.fillText('Z', zAxisEndX + 5, zAxisEndY - 5);
        }
    }

    /**
     * Draws an arrow head at the given coordinates.
     * @param toX - The x-coordinate of the arrow tip.
     * @param toY - The y-coordinate of the arrow tip.
     * @param angle - The angle of the line the arrow is on.
     */
    function drawArrowHead(toX: number, toY: number, angle: number) {
        const headLength = 8; // Length of the arrow head lines
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }


    /**
     * Draws the vector and its components on the canvas.
     * @param ax - The x-component of the vector.
     * @param ay - The y-component of the vector.
     * @param az - The z-component of the vector (optional for 3D).
     */
    function drawVectorOnCanvas(ax: number, ay: number, az: number = 0) {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;

        clearCanvas();
        drawGridAndAxes(centerX, centerY);

        // Scale components for drawing
        const scaledAx = ax * GRID_SIZE;
        const scaledAy = ay * GRID_SIZE;
        const scaledAz = az * GRID_SIZE; // For 3D representation

        let endX = centerX + scaledAx;
        let endY = centerY - scaledAy; // Subtract because canvas Y increases downwards

        if (currentMode === '3D') {
            // Simple oblique projection for 3D:
            // Z contributes to X and Y displacement on the 2D plane.
            // This is a common simplification. A factor (e.g., 0.5) can be used for perspective.
            const zProjectionFactor = 0.4;
            endX += scaledAz * zProjectionFactor; // Z component shifts X
            endY -= scaledAz * zProjectionFactor; // Z component shifts Y (upwards on screen)
        }

        // --- Draw Components (projections) ---
        ctx.setLineDash([4, 2]); // Dashed line for projections

        // X-component projection
        ctx.strokeStyle = COMPONENT_X_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + scaledAx, centerY); // Along X-axis
        ctx.stroke();
        if (ax !== 0) drawArrowHead(centerX + scaledAx, centerY, (ax > 0 ? 0 : Math.PI));
        ctx.fillText(`Ax: ${ax}`, centerX + scaledAx / 2, centerY + (ay > 0 || scaledAy === 0 ? 15 : -5));


        // Y-component projection
        ctx.strokeStyle = COMPONENT_Y_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - scaledAy); // Along Y-axis
        ctx.stroke();
        if (ay !== 0) drawArrowHead(centerX, centerY - scaledAy, (ay > 0 ? -Math.PI / 2 : Math.PI / 2));
        ctx.fillText(`Ay: ${ay}`, centerX + (ax > 0 || scaledAx === 0 ? 5 : -30 - (ay.toString().length * 5)), centerY - scaledAy / 2);

        if (currentMode === '3D' && az !== 0) {
            // Z-component representation (simplified)
            // Draw a line representing the Z component's contribution in the projected space
            // This part is more illustrative. We can draw a line from (scaledAx, -scaledAy) point
            // in the direction of the Z projection used for the main vector.
            const zProjFactor = 0.4;
            const zLineEndX = centerX + scaledAx + scaledAz * zProjFactor;
            const zLineEndY = centerY - scaledAy - scaledAz * zProjFactor;

            ctx.strokeStyle = COMPONENT_Z_COLOR;
            ctx.beginPath();
            ctx.moveTo(centerX + scaledAx, centerY - scaledAy); // Start from end of XY plane projection
            ctx.lineTo(zLineEndX, zLineEndY); // To the point including Z projection
            ctx.stroke();
            // Label Az. Positioning can be tricky.
             ctx.fillText(`Az: ${az}`, (centerX + scaledAx + zLineEndX)/2 + 5, (centerY - scaledAy + zLineEndY)/2);
        }


        // Projection lines from vector tip to axes (for 2D mainly for clarity, for 3D it's more complex)
        ctx.strokeStyle = PROJECTION_LINE_COLOR;
        ctx.lineWidth = 1;
        if (currentMode === '2D' || (currentMode === '3D' && az === 0)) { // Simpler projections for 2D or XY plane in 3D
            ctx.beginPath(); // To X-axis
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX, centerY);
            ctx.stroke();

            ctx.beginPath(); // To Y-axis
            ctx.moveTo(endX, endY);
            ctx.lineTo(centerX, endY);
            ctx.stroke();
        }
        // For full 3D, drawing accurate projection lines to all three axes in a 2D view
        // can become cluttered. The component lines drawn earlier serve a similar purpose.

        ctx.setLineDash([]); // Reset line dash

        // --- Draw the main vector ---
        ctx.strokeStyle = VECTOR_COLOR;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead for the main vector
        const angle = Math.atan2(endY - centerY, endX - centerX);
        drawArrowHead(endX, endY, angle);
        ctx.fillStyle = '#000'; // Reset fillStyle for text
    }

    /**
     * Updates the displayed vector equation.
     * @param ax - The x-component.
     * @param ay - The y-component.
     * @param az - The z-component (optional for 3D).
     */
    function updateVectorEquation(ax: number, ay: number, az: number = 0) {
        let equation = `Vector A = ${ax}i `;
        equation += (ay >= 0 ? `+ ${ay}` : `- ${Math.abs(ay)}`) + 'j';
        if (currentMode === '3D') {
            equation += (az >= 0 ? ` + ${az}` : ` - ${Math.abs(az)}`) + 'k';
        }
        vectorEquationDiv.textContent = equation;
    }

    /**
     * Main function to read inputs and draw the vector.
     */
    function drawVector() {
        const ax = parseFloat(axInput.value) || 0;
        const ay = parseFloat(ayInput.value) || 0;
        const az = currentMode === '3D' ? (parseFloat(azInput.value) || 0) : 0;

        if (isNaN(ax) || isNaN(ay) || (currentMode === '3D' && isNaN(az))) {
            vectorEquationDiv.textContent = "Invalid input. Please enter numbers.";
            clearCanvas();
            drawGridAndAxes(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2); // Draw axes even on bad input
            return;
        }
        
        // Check for extreme values that might break rendering or be too small to see
        const MAX_COMPONENT_VALUE = 20; // Arbitrary limit based on GRID_SIZE and canvas
        if (Math.abs(ax) > MAX_COMPONENT_VALUE || Math.abs(ay) > MAX_COMPONENT_VALUE || (currentMode === '3D' && Math.abs(az) > MAX_COMPONENT_VALUE)) {
             vectorEquationDiv.textContent = `Warning: Values large. Max recommended: ${MAX_COMPONENT_VALUE}. Drawing scaled down.`;
             // Could implement dynamic scaling here, or just cap it for simplicity.
             // For now, it will draw, but might go off-canvas.
        }


        drawVectorOnCanvas(ax, ay, az);
        updateVectorEquation(ax, ay, az);
    }

    // Event listener for the draw button
    drawVectorBtn.addEventListener('click', drawVector);

    // Initial draw and examples setup
    populateExamples();
    drawVector(); // Initial draw with default values
});

// Explanation of the code:
// 1. DOMContentLoaded: Ensures the script runs after the HTML is fully loaded.
// 2. Element Selection: Gets references to all necessary HTML elements (inputs, buttons, canvas).
// 3. Initial State: Sets the default mode to 2D and hides the Z-component input.
// 4. Canvas Context: Obtains the 2D rendering context for the canvas.
// 5. Example Scenarios: Defines an array of predefined vectors that users can load.
//    - populateExamples(): Dynamically creates buttons for each example and sets up click listeners
//      to auto-fill inputs and draw the respective vector.
// 6. Mode Handling (handleModeChange): Switches between 2D and 3D modes, showing/hiding the Az input
//    and redrawing the vector.
// 7. Canvas Drawing:
//    - clearCanvas(): Clears the canvas before each redraw.
//    - drawGridAndAxes(): Draws a background grid and X, Y (and a projected Z in 3D mode) axes.
//      The origin (0,0) is set to the center of the canvas.
//    - drawArrowHead(): A helper function to draw arrowheads on lines.
//    - drawVectorOnCanvas():
//        - Calculates scaled components (ax * GRID_SIZE, etc.) for display on the canvas.
//        - For 3D mode, it applies a simple oblique projection for the Z-component by shifting
//          the X and Y screen coordinates. This is a visual aid, not a full 3D perspective.
//        - Draws dashed lines representing the X, Y (and illustrative Z) components along/parallel to axes.
//        - Draws the main vector from the origin to the calculated (endX, endY) point.
//        - Uses different colors for the main vector and its components.
// 8. Vector Equation (updateVectorEquation): Constructs and displays the algebraic representation
//    of the vector (e.g., "Vector A = 2i + 3j - 1k").
// 9. Main Draw Function (drawVector):
//    - Parses the numerical values from the input fields.
//    - Performs basic validation (checks for NaN).
//    - Calls drawVectorOnCanvas() to visualize the vector.
//    - Calls updateVectorEquation() to display its formula.
//    - Includes a basic check for very large component values.
// 10. Event Listeners: Attaches event listeners to the mode radio buttons and the "Draw Vector" button.
// 11. Initial Call: Calls populateExamples() and drawVector() on page load to display the default vector
//     and set up example buttons.
//
// Coordinate System:
// - The canvas origin (0,0) is at its top-left.
// - The simulation maps the mathematical origin (0,0,0) to the center of the canvas.
// - Positive Y in mathematics is upwards, but on canvas, Y increases downwards.
//   Hence, `centerY - scaledAy` is used for y-coordinates.
//
// 3D Representation:
// - The 3D visualization is simplified for a 2D canvas. It uses an oblique-like projection
//   where the Z-component influences the X and Y screen positions to give a sense of depth.
//   This is common for basic 3D vector illustration without complex 3D rendering libraries.
//   The Z-axis is drawn at an angle.
//
// Accessibility:
// - `aria-label` attributes are added to inputs, buttons, and the canvas for better screen reader support.
// - `aria-live="polite"` on the vector equation display ensures updates are announced by screen readers.
