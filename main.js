// ============================================================================
// MAIN APPLICATION CONTROLLER (js/main.js)
// ============================================================================
// Connects HTML buttons and user inputs to matrix reader, solver, and visualizer.

// Shortcut function for document.getElementById
function getElement(id) {
  return document.getElementById(id);
}

// Shows floating toast message
function showToast(message) {
  const toastElem = getElement('toast');
  toastElem.textContent = message;
  toastElem.classList.add('show');

  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }

  window.toastTimeout = setTimeout(function() {
    toastElem.classList.remove('show');
  }, 2600);
}

// Renders error message list above input section
function showErrors(errorList) {
  const errorsContainer = getElement('errors');
  if (!errorList || errorList.length === 0) {
    errorsContainer.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 0; i < errorList.length; i++) {
    html += '<div>• ' + errorList[i] + '</div>';
  }
  errorsContainer.innerHTML = html;
}

// Tab switcher setup
const tabButtons = document.querySelectorAll('.tab');
tabButtons.forEach(function(btn) {
  btn.onclick = function() {
    tabButtons.forEach(function(b) {
      if (b === btn) {
        b.classList.add('on');
      } else {
        b.classList.remove('on');
      }
    });

    let tabTarget = btn.dataset.t;
    getElement('t-manual').hidden = (tabTarget !== 'manual');
    getElement('t-upload').hidden = (tabTarget !== 'upload');
  };
});

// Parses text input and constructs matrix grid
function buildMatrixFromTextInput(text) {
  const parsedSystem = V.system(text);

  if (parsedSystem.errors && parsedSystem.errors.length > 0) {
    showErrors(parsedSystem.errors);
    showToast('Some equations could not be read');
    return;
  }

  showErrors([]);
  Mx.build(parsedSystem.rows.length, parsedSystem.vars.length, parsedSystem.rows, parsedSystem.vars);
  showToast('Matrix ready. Check it, then solve.');
}

// Button Click Event Listeners
getElement('parseBtn').onclick = function() {
  buildMatrixFromTextInput(getElement('eqText').value);
};

getElement('ocrParse').onclick = function() {
  buildMatrixFromTextInput(getElement('ocrText').value);
};

getElement('gridBtn').onclick = function() {
  const numEquations = parseInt(getElement('nIn').value, 10);
  const numVariables = parseInt(getElement('mIn').value, 10);

  if (isNaN(numEquations) || isNaN(numVariables) ||
      numEquations < 1 || numEquations > 8 ||
      numVariables < 1 || numVariables > 8) {
    showErrors(['Equations and variables must each be between 1 and 8.']);
    return;
  }

  showErrors([]);
  Mx.build(numEquations, numVariables, null);
};

// OCR / PDF File Upload Listener
getElement('file').onchange = async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  getElement('ocrStatus').textContent = 'Reading file…';

  try {
    const rawText = await FR.read(file, function(statusText) {
      getElement('ocrStatus').textContent = statusText;
    });

    const cleanedEquations = FR.clean(rawText);
    getElement('ocrText').value = cleanedEquations || rawText;

    if (cleanedEquations) {
      getElement('ocrStatus').textContent = 'Done. Compare with your original, fix any misread sign, digit or variable, then press "Use these equations".';
    } else {
      getElement('ocrStatus').textContent = 'No lines containing "=" were found. The raw text is below; edit it into equations.';
    }
  } catch (err) {
    getElement('ocrStatus').textContent = 'Could not read this file: ' + err.message;
  }
};

// Solve Button Listener
getElement('solveBtn').onclick = function() {
  const matrixData = Mx.read();

  if (matrixData.errors && matrixData.errors.length > 0) {
    showErrors(matrixData.errors);
    showToast('Fix the highlighted cells first');
    return;
  }

  showErrors([]);
  getElement('solve').hidden = false;

  const result = G.solve(matrixData.rows, matrixData.m);
  Viz.load(result, matrixData.vars);

  getElement('solve').scrollIntoView({ behavior: 'smooth' });
};

// Visualizer Navigation Buttons
getElement('next').onclick = function() { Viz.next(); };
getElement('prev').onclick = function() { Viz.prev(); };
getElement('all').onclick = function() { Viz.setMode('all'); };
getElement('restart').onclick = function() { Viz.restart(); };
getElement('viewRef').onclick = function() { Viz.setMode('ref'); };
getElement('viewRref').onclick = function() { Viz.setMode('rref'); };

// Initial setup on page load
buildMatrixFromTextInput(getElement('eqText').value);