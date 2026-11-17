// ============================================================================
// STEP VISUALIZATION & HIGHLIGHTING (js/visualization.js)
// ============================================================================
// Renders matrix state snapshots, applies highlight classes, and handles steps.

const Viz = {
  res: null,
  vars: [],
  idx: 0,
  mode: 'step',

  // Renders formatted fraction into HTML string with custom CSS classes
  h: function(x) {
    const s = G.fmt(x);
    const m = s.match(/^(-?)(\d+)\/(\d+)$/);
    if (m) {
      return m[1] + '<span class="fr"><i>' + m[2] + '</i><i>' + m[3] + '</i></span>';
    }
    return s;
  },

  // Builds HTML matrix table with custom row/cell CSS highlighting classes
  mat: function(M, hl, arrow) {
    if (!hl) hl = {};
    if (arrow === undefined) arrow = false;

    const m = M[0].length - 1;
    let t = '<table class="mx"><tr>';

    for (let j = 0; j < this.vars.length; j++) {
      t += '<th>' + this.vars[j] + '</th>';
    }
    t += '<th class="k">=</th></tr>';

    for (let i = 0; i < M.length; i++) {
      t += '<tr>';
      for (let j = 0; j < M[i].length; j++) {
        let cellValue = M[i][j];
        let cellClasses = [];

        if (j === m) cellClasses.push('k');

        if (hl.pr === i && hl.pc === j) {
          cellClasses.push('pv'); // Pivot cell
        } else if (hl.pc === j && hl.target === i && hl.elim) {
          cellClasses.push('el'); // Target element being eliminated
        } else if (hl.target === i) {
          cellClasses.push('tg'); // Target row
        } else if (hl.ref === i) {
          cellClasses.push('rf'); // Reference row
        } else if (hl.pc === j) {
          cellClasses.push('ac'); // Active column
        }

        let classAttr = cellClasses.join(' ');
        t += '<td class="' + classAttr + '">' + this.h(cellValue) + '</td>';
      }
      t += '</tr>';
    }

    if (arrow && hl.pc !== undefined) {
      t += '<tr class="arrow">';
      for (let j = 0; j <= m; j++) {
        let arrowSymbol = (j === hl.pc) ? '▲' : '';
        t += '<td>' + arrowSymbol + '</td>';
      }
      t += '</tr>';
    }

    t += '</table>';
    return t;
  },

  // Loads new reduction result into viewer
  load: function(res, vars) {
    this.res = res;
    this.vars = vars;
    this.idx = 0;
    this.mode = 'step';
    this.render();
  },

  // Generates HTML step card for given step index k
  stepCard: function(k) {
    const stepData = this.res.steps[k - 1];
    const isElim = (stepData.type === 'Elimination' || stepData.type === 'Eliminate above');
    const highlightConfig = Object.assign({}, stepData.hl, { elim: isElim });

    let stageLabel = (stepData.stage === 1) ? 'REF stage' : 'RREF stage';

    let html = '<div class="step">';
    html += '<h4>Step ' + k + ' of ' + this.res.steps.length + ': ' + stepData.type +
      ' <small>(' + stageLabel + ')</small></h4>';
    html += '<p>' + stepData.text + '</p>';
    html += '<span class="op">' + stepData.op + '</span>';
    html += '<div class="pair">';
    html += '<div><small>Before</small>' + this.mat(stepData.before, highlightConfig, true) + '</div>';
    html += '<span class="arr">→</span>';
    html += '<div><small>After</small>' + this.mat(stepData.after, { target: stepData.hl.target }) + '</div>';
    html += '</div></div>';

    return html;
  },

  // Renders output container based on current view mode
  render: function() {
    const r = this.res;
    const N = r.steps.length;
    const viewElem = document.getElementById('view');
    const stageElem = document.getElementById('stage');
    const resultElem = document.getElementById('result');

    let html = '';
    let showResultSummary = false;

    if (this.mode === 'step') {
      if (this.idx === 0) {
        let noOpNote = (N === 0) ? ' No operations are needed here.' : '';
        html = '<div class="step"><h4>Starting point</h4><p>The augmented matrix. First we reach row echelon form (zeros below every pivot), then reduced form (each pivot is 1 with zeros above and below).' + noOpNote + '</p>' + this.mat(r.init) + '</div>';
        stageElem.textContent = 'Original matrix';
      } else {
        html = this.stepCard(this.idx);
        if (this.idx <= r.refEnd) {
          stageElem.textContent = 'Stage 1: building Row Echelon Form';
        } else {
          stageElem.textContent = 'Stage 2: building Reduced Row Echelon Form';
        }
      }
      showResultSummary = (this.idx === N);
    } else if (this.mode === 'all') {
      html = '<div class="step"><h4>Original matrix</h4>' + this.mat(r.init) + '</div>';
      for (let i = 1; i <= N; i++) {
        html += this.stepCard(i);
      }
      stageElem.textContent = 'Complete solution history';
      showResultSummary = true;
    } else if (this.mode === 'ref') {
      let refMatrix = (r.refEnd > 0) ? r.steps[r.refEnd - 1].after : r.init;
      html = '<div class="step"><h4>Row Echelon Form (REF)</h4><p>Every pivot has only zeros below it. Reached after ' + r.refEnd + ' operation(s).</p>' + this.mat(refMatrix) + '</div>';
      stageElem.textContent = 'REF';
    } else if (this.mode === 'rref') {
      html = '<div class="step"><h4>Reduced Row Echelon Form (RREF)</h4><p>Each pivot is 1 and is the only nonzero entry in its column.</p>' + this.mat(r.final) + '</div>';
      stageElem.textContent = 'RREF';
      showResultSummary = true;
    }

    viewElem.innerHTML = html;

    if (showResultSummary) {
      resultElem.innerHTML = '<div class="res">' + G.analysis(r, this.vars) + '</div>';
    } else {
      resultElem.innerHTML = '';
    }

    document.getElementById('prev').disabled = (this.mode === 'step' && this.idx === 0);
    document.getElementById('next').disabled = (this.mode === 'step' && this.idx === N);

    const modeButtons = [
      ['all', 'all'],
      ['ref', 'viewRef'],
      ['rref', 'viewRref']
    ];

    for (let i = 0; i < modeButtons.length; i++) {
      let modeName = modeButtons[i][0];
      let btnId = modeButtons[i][1];
      let btnElem = document.getElementById(btnId);
      if (this.mode === modeName) {
        btnElem.classList.add('on');
      } else {
        btnElem.classList.remove('on');
      }
    }
  },

  // Navigation controller functions
  next: function() {
    if (this.mode !== 'step') {
      this.mode = 'step';
    } else if (this.idx < this.res.steps.length) {
      this.idx++;
    }
    this.render();
  },

  prev: function() {
    if (this.mode !== 'step') {
      this.mode = 'step';
    } else if (this.idx > 0) {
      this.idx--;
    }
    this.render();
  },

  setMode: function(m) {
    this.mode = m;
    this.render();
  },

  restart: function() {
    this.mode = 'step';
    this.idx = 0;
    this.render();
  }
};