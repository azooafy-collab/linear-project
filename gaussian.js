// ============================================================================
// GAUSSIAN ELIMINATION & MATRIX SOLVER (js/gaussian.js)
// ============================================================================
// Performs Gaussian Elimination step-by-step:
// 1. Row Echelon Form (REF) - Stage 1 (Forward Elimination)
// 2. Reduced Row Echelon Form (RREF) - Stage 2 (Backward Elimination & Normalization)
// 3. Solution Analysis (Unique, Infinitely Many, or No Solution)

const G = {
  // Formats a number: whole numbers and exact decimals are shown as decimals
  // (4, 0.5, -2.25). A fraction is kept ONLY when a decimal would never end (1/3, 2/7).
  fmt: function(x) {
    let text = math.format(x, { fraction: 'ratio' });   // "4", "3/8" or "-1/3"
    let parts = text.split('/');
    if (parts.length === 1) {
      return text;                                      // whole number
    }

    let numerator = Number(parts[0]);
    let denominator = Number(parts[1]);

    // A fraction has a finite decimal only if its denominator has no prime
    // factors other than 2 and 5. Remove all 2s and 5s and see what is left.
    let rest = denominator;
    while (rest % 2 === 0) {
      rest = rest / 2;
    }
    while (rest % 5 === 0) {
      rest = rest / 5;
    }

    if (rest === 1) {
      return String(numerator / denominator);           // exact decimal
    }
    return text;                                        // keep the fraction
  },

  // Main solver function: takes input matrix A and variable count m
  solve: function(A, m) {
    // Step 1: Create a deep copy of matrix A to preserve original input
    let M = [];
    for (let i = 0; i < A.length; i++) {
      M.push(A[i].slice());
    }

    const n = M.length; // Number of rows (equations)
    const steps = [];   // Recorded step-by-step history for step navigation
    const P = [];       // Recorded pivot locations [row, column]

    // Helper: Creates a snapshot of current matrix state
    function copyMatrix() {
      let copy = [];
      for (let i = 0; i < M.length; i++) {
        copy.push(M[i].slice());
      }
      return copy;
    }

    // Helper: Records single row operation step
    function recordStep(stage, type, text, opText, highlight, actionFunction) {
      const stateBefore = copyMatrix();
      actionFunction(); // Execute operation on M
      const stateAfter = copyMatrix();

      steps.push({
        stage: stage,          // 1 (REF) or 2 (RREF)
        type: type,            // 'Row swap', 'Elimination', 'Normalize', 'Eliminate above'
        text: text,            // Explanation description
        op: opText,            // Mathematical notation (e.g. R2 -> R2 - 2R1)
        hl: highlight,         // UI highlighting indexes
        before: stateBefore,   // State before operation
        after: stateAfter      // State after operation
      });
    }

    // Helper: Subtracts (factor * pivotRow) from targetRow
    function subtractRowMultiple(targetRowIndex, pivotRowIndex, factor) {
      for (let j = 0; j < M[targetRowIndex].length; j++) {
        let product = math.multiply(factor, M[pivotRowIndex][j]);
        M[targetRowIndex][j] = math.subtract(M[targetRowIndex][j], product);
      }
    }

    // Helper: Constructs row operation string (e.g., "R2 → R2 - (2)R1")
    function createOpText(targetRowIndex, pivotRowIndex, factor) {
      const absoluteFactor = math.abs(factor);
      let factorString = "";
      if (!math.equal(absoluteFactor, 1)) {
        factorString = "(" + G.fmt(absoluteFactor) + ")";
      }
      let signSymbol = math.smaller(factor, 0) ? '+' : '−';
      let rTarget = targetRowIndex + 1;
      let rPivot = pivotRowIndex + 1;

      return "R" + rTarget + " → R" + rTarget + " " + signSymbol + " " + factorString + "R" + rPivot;
    }

    // ========================================================================
    // STAGE 1: FORWARD ELIMINATION (ROW ECHELON FORM - REF)
    // ========================================================================
    let pivotRowIndex = 0;

    for (let col = 0; col < m && pivotRowIndex < n; col++) {
      // Step A: Find row with maximum absolute value in current column (Partial Pivoting)
      let bestRowIndex = -1;
      let maxMagnitude = math.fraction(0);

      for (let row = pivotRowIndex; row < n; row++) {
        let currentMagnitude = math.abs(M[row][col]);
        if (math.larger(currentMagnitude, maxMagnitude)) {
          maxMagnitude = currentMagnitude;
          bestRowIndex = row;
        }
      }

      // If entire column below pivotRowIndex is 0, move to next column
      if (bestRowIndex < 0 || math.equal(maxMagnitude, 0)) {
        continue;
      }

      // Step B: Swap current row with best pivot row if needed
      if (bestRowIndex !== pivotRowIndex) {
        let pRow = pivotRowIndex;
        let bRow = bestRowIndex;
        let pivotValStr = G.fmt(M[bRow][col]);

        let swapExplanation = "Column " + (col + 1) + ": partial pivoting picks the entry with the largest magnitude, " +
          pivotValStr + " in row " + (bRow + 1) + ", as the pivot. Rows " + (pRow + 1) + " and " + (bRow + 1) + " trade places.";

        let swapNotation = "R" + (pRow + 1) + " ↔ R" + (bRow + 1);

        recordStep(
          1,
          'Row swap',
          swapExplanation,
          swapNotation,
          { pr: pRow, pc: col, target: bRow, ref: pRow },
          function() {
            let tempRow = M[pRow];
            M[pRow] = M[bRow];
            M[bRow] = tempRow;
          }
        );
      }

      // Step C: Eliminate entries below pivot element
      for (let row = pivotRowIndex + 1; row < n; row++) {
        if (math.equal(M[row][col], 0)) {
          continue; // Already zero
        }

        let factor = math.divide(M[row][col], M[pivotRowIndex][col]);

        let elimExplanation = "The pivot " + G.fmt(M[pivotRowIndex][col]) + " is at row " + (pivotRowIndex + 1) +
          ", column " + (col + 1) + ". To zero the entry " + G.fmt(M[row][col]) + " below it, subtract " +
          G.fmt(factor) + " times row " + (pivotRowIndex + 1) + " from row " + (row + 1) + ".";

        let elimNotation = createOpText(row, pivotRowIndex, factor);

        recordStep(
          1,
          'Elimination',
          elimExplanation,
          elimNotation,
          { pr: pivotRowIndex, pc: col, target: row, ref: pivotRowIndex },
          function() {
            subtractRowMultiple(row, pivotRowIndex, factor);
          }
        );
      }

      // Record pivot position and advance row index
      P.push([pivotRowIndex, col]);
      pivotRowIndex++;
    }

    const refEndStepIndex = steps.length;

    // ========================================================================
    // STAGE 2: BACKWARD ELIMINATION & NORMALIZATION (RREF)
    // ========================================================================
    for (let k = P.length - 1; k >= 0; k--) {
      let pRow = P[k][0];
      let pCol = P[k][1];
      let pivotValue = M[pRow][pCol];

      // Step A: Normalize pivot to 1
      if (!math.equal(pivotValue, 1)) {
        let normExplanation = "Divide row " + (pRow + 1) + " by " + G.fmt(pivotValue) +
          " so its pivot becomes exactly 1.";

        let normNotation = "R" + (pRow + 1) + " → R" + (pRow + 1) + " ÷ " + G.fmt(pivotValue);

        recordStep(
          2,
          'Normalize',
          normExplanation,
          normNotation,
          { pr: pRow, pc: pCol, target: pRow, ref: pRow },
          function() {
            for (let j = 0; j < M[pRow].length; j++) {
              M[pRow][j] = math.divide(M[pRow][j], pivotValue);
            }
          }
        );
      }

      // Step B: Clear entries above pivot
      for (let row = 0; row < pRow; row++) {
        if (math.equal(M[row][pCol], 0)) {
          continue;
        }

        let factor = M[row][pCol];

        let elimAboveExplanation = "The pivot in column " + (pCol + 1) + " is 1. Clear the entry " +
          G.fmt(factor) + " above it using row " + (pRow + 1) + ".";

        let elimAboveNotation = createOpText(row, pRow, factor);

        recordStep(
          2,
          'Eliminate above',
          elimAboveExplanation,
          elimAboveNotation,
          { pr: pRow, pc: pCol, target: row, ref: pRow },
          function() {
            subtractRowMultiple(row, pRow, factor);
          }
        );
      }
    }

    // ========================================================================
    // STAGE 3: CLASSIFY SYSTEM SOLUTION TYPE
    // ========================================================================
    let solutionType = 'unique';
    let inconsistentRowIndex = -1;

    // Check for contradiction row: [0 0 ... 0 | b] where b != 0
    for (let i = 0; i < n; i++) {
      let allCoeffsZero = true;
      for (let j = 0; j < m; j++) {
        if (!math.equal(M[i][j], 0)) {
          allCoeffsZero = false;
          break;
        }
      }

      let constantIsZero = math.equal(M[i][m], 0);

      if (allCoeffsZero && !constantIsZero) {
        inconsistentRowIndex = i;
        solutionType = 'none';
        break;
      }
    }

    // Determine pivot and free variables
    let pivotColumns = [];
    for (let i = 0; i < P.length; i++) {
      pivotColumns.push(P[i][1]);
    }

    let freeVariables = [];
    for (let c = 0; c < m; c++) {
      if (!pivotColumns.includes(c)) {
        freeVariables.push(c);
      }
    }

    if (solutionType !== 'none' && freeVariables.length > 0) {
      solutionType = 'infinite';
    }

    return {
      steps: steps,
      refEnd: refEndStepIndex,
      init: A,
      final: M,
      pivots: P,
      free: freeVariables,
      type: solutionType,
      bad: inconsistentRowIndex,
      m: m,
      n: n
    };
  },

  // Formats solution outcome as HTML string
  analysis: function(res, vars) {
    const f = G.fmt;
    const M = res.final;
    const m = res.m;

    if (res.type === 'none') {
      let rowNum = res.bad + 1;
      let constVal = f(M[res.bad][m]);
      return "<h3>No solution</h3><p>Row " + rowNum + " of the final matrix reads <b>0 = " + constVal +
        "</b>, a contradiction. No values of the variables satisfy it, so the system is inconsistent.</p>";
    }

    if (res.type === 'unique') {
      let html = "<h3>Unique solution</h3>";
      for (let i = 0; i < res.pivots.length; i++) {
        let r = res.pivots[i][0];
        let c = res.pivots[i][1];
        html += '<div class="eq">' + vars[c] + " = " + f(M[r][m]) + '</div>';
      }
      html += "<p>Every variable has a pivot, so exactly one solution exists.</p>";
      return html;
    }

    let pivotVarNames = [];
    for (let i = 0; i < res.pivots.length; i++) {
      pivotVarNames.push(vars[res.pivots[i][1]]);
    }

    let freeVarNames = [];
    for (let i = 0; i < res.free.length; i++) {
      freeVarNames.push(vars[res.free[i]]);
    }

    let html = "<h3>Infinitely many solutions</h3><p>Pivot variables: <b>" + pivotVarNames.join(', ') +
      "</b>. Free variables: <b>" + freeVarNames.join(', ') + "</b> (any real value).</p>";

    for (let i = 0; i < res.pivots.length; i++) {
      let r = res.pivots[i][0];
      let c = res.pivots[i][1];
      let expression = f(M[r][m]);

      for (let k = 0; k < res.free.length; k++) {
        let fc = res.free[k];
        let coeff = M[r][fc];

        if (!math.equal(coeff, 0)) {
          let absCoeff = math.abs(coeff);
          let signStr = math.smaller(coeff, 0) ? ' + ' : ' − ';
          let coeffStr = math.equal(absCoeff, 1) ? '' : f(absCoeff);
          expression += signStr + coeffStr + vars[fc];
        }
      }
      html += '<div class="eq">' + vars[c] + " = " + expression + '</div>';
    }

    for (let k = 0; k < res.free.length; k++) {
      let fc = res.free[k];
      html += '<div class="eq">' + vars[fc] + " is free</div>";
    }

    return html;
  }
};