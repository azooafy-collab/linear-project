// ============================================================================
// MATRIX GRID MANAGEMENT (js/matrix.js)
// ============================================================================
// Manages constructing the interactive input table and reading cell values.

const Mx = {
  vars: [],

  // Generates variable names array (e.g. ['x', 'y', 'z'] or ['x1', 'x2', ...])
  names: function(m) {
    const defaultNames = ['x', 'y', 'z', 'w', 'v', 'u'];
    let result = [];
    for (let i = 0; i < m; i++) {
      if (m <= 6) {
        result.push(defaultNames[i]);
      } else {
        result.push('x' + (i + 1));
      }
    }
    return result;
  },

  // Builds HTML table grid for manual input or parsed values
  build: function(n, m, rows, vars) {
    this.vars = vars || this.names(m);
    const gridContainer = document.getElementById('grid');
    gridContainer.className = 'mx';

    let html = '<tr>';
    for (let j = 0; j < this.vars.length; j++) {
      html += '<th>' + this.vars[j] + '</th>';
    }
    html += '<th class="k">=</th></tr>';

    for (let i = 0; i < n; i++) {
      html += '<tr>';
      for (let j = 0; j <= m; j++) {
        let isConstantCol = (j === m);
        let cellClass = isConstantCol ? 'k' : '';
        let initialValue = '0';

        if (rows && rows[i] && rows[i][j] !== undefined) {
          initialValue = G.fmt(rows[i][j]);
        }

        html += '<td class="' + cellClass + '">';
        html += '<input data-i="' + i + '" data-j="' + j + '" ';
        html += 'aria-label="Row ' + (i + 1) + ', column ' + (j + 1) + '" ';
        html += 'value="' + initialValue + '">';
        html += '</td>';
      }
      html += '</tr>';
    }

    gridContainer.innerHTML = html;

    // Attach input event listeners for dynamic error highlighting
    const inputElements = gridContainer.querySelectorAll('input');
    for (let k = 0; k < inputElements.length; k++) {
      let input = inputElements[k];
      input.addEventListener('input', function() {
        let parsedVal = V.num(input.value);
        if (parsedVal === null) {
          input.classList.add('bad');
        } else {
          input.classList.remove('bad');
        }
      });
    }
  },

  // Reads matrix grid cells into 2D fraction array
  read: function() {
    const errors = [];
    const inputElements = Array.from(document.querySelectorAll('#grid input'));

    if (inputElements.length === 0) {
      return { errors: ['Create a matrix first.'] };
    }

    let maxRowIndex = 0;
    let maxColIndex = 0;

    for (let k = 0; k < inputElements.length; k++) {
      let rIdx = parseInt(inputElements[k].dataset.i, 10);
      let cIdx = parseInt(inputElements[k].dataset.j, 10);
      if (rIdx > maxRowIndex) maxRowIndex = rIdx;
      if (cIdx > maxColIndex) maxColIndex = cIdx;
    }

    const numRows = maxRowIndex + 1;
    const numCols = maxColIndex;

    const rows = [];
    for (let i = 0; i < numRows; i++) {
      rows.push(new Array(numCols + 1));
    }

    for (let k = 0; k < inputElements.length; k++) {
      let input = inputElements[k];
      let value = V.num(input.value);
      let r = parseInt(input.dataset.i, 10);
      let c = parseInt(input.dataset.j, 10);

      if (value === null) {
        input.classList.add('bad');
        let colLabel = (c === numCols) ? 'constant' : ('variable ' + this.vars[c]);
        errors.push('Row ' + (r + 1) + ', ' + colLabel + ': "' + input.value + '" is not a number. Fix just this cell.');
      } else {
        input.classList.remove('bad');
        rows[r][c] = value;
      }
    }

    return {
      rows: rows,
      m: numCols,
      vars: this.vars,
      errors: errors
    };
  }
};