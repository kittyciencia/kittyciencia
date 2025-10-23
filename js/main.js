
const words = ["CELULA", "ADN", "NUCLEO", "CITOPLASMA", "ENZIMA", "CLOROFILA"];
const gridSize = 10;
let wordGrid;
let currentSelection = []; // almacena indices en orden de selección
let wordsFound = [];

document.addEventListener('DOMContentLoaded', () => {
  startNewGame();

  // botones
  const genBtn = document.getElementById('generateNew');
  const confirmBtn = document.getElementById('confirmSelection');
  const clearBtn = document.getElementById('clearSelection');

  if (genBtn) genBtn.addEventListener('click', startNewGame);
  if (confirmBtn) confirmBtn.addEventListener('click', confirmSelection);
  if (clearBtn) clearBtn.addEventListener('click', clearSelection);
});

function startNewGame() {
  wordGrid = generateEmptyGrid(gridSize);
  currentSelection = [];
  wordsFound = [];
  placeWordsInGrid(words, wordGrid);
  renderGrid(wordGrid);
  renderWordsList(words);
}

function generateEmptyGrid(size) {
  return Array(size).fill(null).map(() => Array(size).fill('_'));
}

/* Coloca las palabras horizontalmente */
function placeWordsInGrid(wordsArr, grid) {
  wordsArr.forEach(word => {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 500) {
      attempts++;
      const row = Math.floor(Math.random() * gridSize);
      const maxStart = Math.max(0, gridSize - word.length);
      const col = Math.floor(Math.random() * (maxStart + 1));
      if (canPlaceWordAt(word, grid, row, col)) {
        for (let i = 0; i < word.length; i++) {
          grid[row][col + i] = word[i];
        }
        placed = true;
      }
    }
  });
}

function canPlaceWordAt(word, grid, row, col) {
  for (let i = 0; i < word.length; i++) {
    if (grid[row][col + i] !== '_' && grid[row][col + i] !== '') return false;
  }
  return true;
}

function renderGrid(grid) {
  const container = document.getElementById('wordSearchContainer');
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cellElement = document.createElement('div');
      const value = (grid[r][c] === '_' ? randomLetter() : grid[r][c]);
      cellElement.textContent = value;
      const index = r * gridSize + c;
      cellElement.dataset.index = index;
      cellElement.dataset.row = r;
      cellElement.dataset.col = c;
      // Si la celda ya fue marcada como encontrada en una sesión previa, mantenemos la clase
      // (normalmente las celdas 'found' se aplican en confirmSelection)
      cellElement.addEventListener('click', () => toggleCellSelection(index, cellElement));
      container.appendChild(cellElement);
    }
  }

  // Si hay palabras ya encontradas (por ejemplo si llamas a renderGrid tras marcar),
  // marcamos sus celdas como 'found' para que se visualicen correctamente.
  markFoundCells();
}

/* Renderiza la lista de palabras (ahora siempre refleja wordsFound) */
function renderWordsList(wordsArr) {
  const wordsListContainer = document.getElementById('wordsList');
  wordsListContainer.innerHTML = '';
  wordsArr.forEach(word => {
    const wordElement = document.createElement('div');
    wordElement.textContent = word;
    wordElement.setAttribute('data-word', word);
    if (wordsFound.includes(word)) wordElement.classList.add('found');
    wordsListContainer.appendChild(wordElement);
  });
}

/* Toggle selección: si estaba seleccionada, la desmarca; si no, la marca */
function toggleCellSelection(index, element) {
  const idx = Number(index);
  const pos = currentSelection.indexOf(idx);
  if (pos === -1) {
    // añadir al final
    currentSelection.push(idx);
    element.classList.add('selected');
  } else {
    // quitar selección (toggle)
    currentSelection.splice(pos, 1);
    element.classList.remove('selected');
  }
}

/* Confirma la selección actual y valida palabra */
function confirmSelection() {
  if (currentSelection.length === 0) {
    flashMessage('Selecciona letras antes de confirmar.');
    return;
  }

  // Construir la palabra según el orden de selección
  const selectedWord = currentSelection.map(idx => {
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    return wordGrid[row][col];
  }).join('');

  const candidate = selectedWord.toUpperCase();

  if (words.includes(candidate) && !wordsFound.includes(candidate)) {
    // palabra correcta
    wordsFound.push(candidate);

    // marcar las celdas como 'found'
    currentSelection.forEach(idx => {
      const el = document.querySelector(`[data-index="${idx}"]`);
      if (el) {
        el.classList.remove('selected');
        el.classList.add('found');
      }
    });

    // RE-RENDER de la lista para asegurar que el item aparezca como encontrado
    renderWordsList(words);

    // limpiar selección
    currentSelection = [];

    // feedback
    setTimeout(() => alert(`¡Has encontrado la palabra "${candidate}"!`), 50);

    // verificar si ganó
    if (wordsFound.length === words.length) {
      setTimeout(() => {
        alert('¡Has ganado!');
        startNewGame();
      }, 700);
    }

  } else if (wordsFound.includes(candidate)) {
    flashMessage('Ya encontraste esa palabra.');
  } else {
    // palabra incorrecta: feedback visual (no limpia ni bloquea)
    flashSelectionIncorrect();
  }
}

/* Limpia la selección visual y el array */
function clearSelection() {
  currentSelection.forEach(idx => {
    const el = document.querySelector(`[data-index="${idx}"]`);
    if (el) el.classList.remove('selected');
  });
  currentSelection = [];
}

/* Marca las celdas que corresponden a palabras encontradas (útil si re-renderizas el grid) */
function markFoundCells() {
  // Recorremos todas las celdas; si su texto coincide con letras de palabras encontradas
  // en las posiciones correctas, las dejamos como 'found'. Pero como las palabras
  // están colocadas en el grid original, lo más fiable es revisar el grid y comparar.
  wordsFound.forEach(word => {
    // Buscar la palabra en el grid (horizontal, izquierda a derecha)
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c <= gridSize - word.length; c++) {
        let match = true;
        for (let k = 0; k < word.length; k++) {
          if (wordGrid[r][c + k] !== word[k]) {
            match = false;
            break;
          }
        }
        if (match) {
          // marcar esas celdas
          for (let k = 0; k < word.length; k++) {
            const idx = r * gridSize + (c + k);
            const el = document.querySelector(`[data-index="${idx}"]`);
            if (el) {
              el.classList.remove('selected');
              el.classList.add('found');
            }
          }
        }
      }
    }
  });
}

/* Utils */
function randomLetter() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

/* Flash visual para selección incorrecta */
function flashSelectionIncorrect() {
  currentSelection.forEach(idx => {
    const el = document.querySelector(`[data-index="${idx}"]`);
    if (!el) return;
    el.classList.add('incorrect-flash');
    setTimeout(() => el.classList.remove('incorrect-flash'), 500);
  });
}

/* Mensajes breves */
function flashMessage(text) {
  alert(text);
}
