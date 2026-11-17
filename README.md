# Gauss — Gaussian Elimination Studio
Interactive step-by-step solver (REF → RREF) using exact fractions. Pure HTML/CSS/JS.

## Requirements
- VS Code + the **Live Server** extension (Ritwick Dey)
- Internet connection (libraries load from CDNs): Math.js 12.4.1, Tesseract.js 5.0.5, PDF.js 3.11.174, Google Fonts

## Run
1. File → Open Folder → `Gaussian-Elimination-Project`
2. Right-click `index.html` → **Open with Live Server**

## Structure
index.html · css/style.css · js/main.js (controller) · matrix.js (grid) · gaussian.js (algorithm) · visualization.js (rendering/navigation) · validation.js (parsing/errors) · fileReader.js (OCR/PDF)

## Use
- **Type equations**, one per line (`2x + 3y - z = 5`; decimals and `1/2` allowed), press *Build matrix*, or create an empty grid. Edit any cell; invalid cells turn red and are listed by position.
- **Upload** PNG/JPG/PDF. OCR text appears in an editable box; correct it, press *Use these equations*. OCR is not always accurate, so always check.
- Press *Confirm and solve*, then use Previous/Next, Show all, Restart, View REF, View RREF.

## Test systems
- Unique (x=2, y=3, z=-1): `2x+y-z=8` / `-3x-y+2z=-11` / `-2x+y+2z=-3`
- Needs a row swap: `y+z=3` / `x+y=2` / `x+2z=5`
- Infinite (row 3 = row 1 + row 2): `2x+3y-z=5` / `x-y+2z=3` / `3x+2y+z=8`
- Infinite: `x+y+z=3` / `2x+2y+2z=6`
- Inconsistent: `x+y=1` / `x+y=2`
- Decimals: `0.5x+1.5y=2` / `x-y=0`
- More equations than variables: `x+y=3` / `x-y=1` / `2x+y=4`
