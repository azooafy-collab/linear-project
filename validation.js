// ============================================================================
// INPUT VALIDATION & PARSING (js/validation.js)
// ============================================================================
// Converts user text strings into exact Math.js fractions.

const V = {
  // Parses string number or fraction (e.g. "-2.5", "3/4") into Math.js fraction
  num: function(str) {
    if (str === null || str === undefined) return null;
    let cleanStr = String(str).trim();
    cleanStr = cleanStr.replace(/[−–—]/g, '-').replace(/^\+/, '');

    let regex = /^-?(\d+\.?\d*|\.\d+)(\/\d+)?$/;
    if (!regex.test(cleanStr)) {
      return null;
    }

    try {
      if (cleanStr.includes('/')) {
        let parts = cleanStr.split('/');
        let numerator = parts[0];
        let denominator = parts[1];

        if (parseInt(denominator, 10) === 0) {
          return null; // Division by zero invalid
        }

        return math.divide(math.fraction(numerator), math.fraction(denominator));
      }
      return math.fraction(cleanStr);
    } catch (err) {
      return null;
    }
  },

  // Parses single equation string into coefficients object and constant value
  eq: function(line) {
    const rawLine = line;
    let cleanLine = line.replace(/[−–—]/g, '-').replace(/\s+/g, '');
    let sides = cleanLine.split('=');

    if (sides.length !== 2 || sides[0].length === 0 || sides[1].length === 0) {
      throw new Error('"' + rawLine.trim() + '": needs one left side, one "=" and one right side.');
    }

    const coefficients = {};
    let constantValue = math.fraction(0);

    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      let sideText = sides[sideIndex];
      let sideMultiplier = math.fraction(sideIndex === 0 ? 1 : -1);
      let termRegex = /([+-]?)(\d*\.?\d+(?:\/\d+)?|\d+\.)?\*?([a-zA-Z]\d*)?/y;
      let pos = 0;

      while (pos < sideText.length) {
        termRegex.lastIndex = pos;
        let match = termRegex.exec(sideText);

        if (!match || !match[0] || (!match[2] && !match[3])) {
          throw new Error('"' + rawLine.trim() + '": cannot read "' + sideText.slice(pos) + '".');
        }

        pos += match[0].length;

        let numberPart = match[2];
        let varPart = match[3];

        let coeffValue;
        if (numberPart) {
          coeffValue = V.num(numberPart);
        } else {
          coeffValue = math.fraction(1);
        }

        if (!coeffValue) {
          throw new Error('"' + rawLine.trim() + '": "' + numberPart + '" is not a valid number.');
        }

        if (match[1] === '-') {
          coeffValue = math.unaryMinus(coeffValue);
        }

        coeffValue = math.multiply(coeffValue, sideMultiplier);

        if (varPart) {
          let existingCoeff = coefficients[varPart] || math.fraction(0);
          coefficients[varPart] = math.add(existingCoeff, coeffValue);
        } else {
          constantValue = math.subtract(constantValue, coeffValue);
        }
      }
    }

    return {
      co: coefficients,
      k: constantValue
    };
  },

  // Parses multiline equations text into matrix coefficients array
  system: function(text) {
    let rawLines = text.split('\n');
    let lines = [];

    for (let i = 0; i < rawLines.length; i++) {
      let trimmed = rawLines[i].trim();
      if (trimmed.length > 0) {
        lines.push(trimmed);
      }
    }

    if (lines.length === 0) {
      return { errors: ['Enter at least one equation.'] };
    }

    const errors = [];
    const parsedEquations = [];
    const variables = [];

    for (let i = 0; i < lines.length; i++) {
      try {
        let parsed = V.eq(lines[i]);
        parsedEquations.push(parsed);

        let varNames = Object.keys(parsed.co);
        for (let j = 0; j < varNames.length; j++) {
          let v = varNames[j];
          if (!variables.includes(v)) {
            variables.push(v);
          }
        }
      } catch (err) {
        errors.push('Equation ' + (i + 1) + ': ' + err.message);
      }
    }

    if (errors.length > 0) {
      return { errors: errors };
    }

    if (variables.length === 0) {
      return { errors: ['No variables found.'] };
    }

    const matrixRows = [];
    for (let i = 0; i < parsedEquations.length; i++) {
      let eq = parsedEquations[i];
      let row = [];

      for (let j = 0; j < variables.length; j++) {
        let v = variables[j];
        let val = eq.co[v] || math.fraction(0);
        row.push(val);
      }
      row.push(eq.k);
      matrixRows.push(row);
    }

    return {
      vars: variables,
      rows: matrixRows,
      errors: []
    };
  }
};