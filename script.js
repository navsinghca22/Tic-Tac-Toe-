const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const STRIKE_COORDS = {
  '0,1,2': [20, 50, 280, 50],
  '3,4,5': [20, 150, 280, 150],
  '6,7,8': [20, 250, 280, 250],
  '0,3,6': [50, 20, 50, 280],
  '1,4,7': [150, 20, 150, 280],
  '2,5,8': [250, 20, 250, 280],
  '0,4,8': [20, 20, 280, 280],
  '2,4,6': [280, 20, 20, 280],
};

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const strikeEl = document.getElementById('strike');
const tallyXEl = document.getElementById('tallyX');
const tallyOEl = document.getElementById('tallyO');
const drawsNoteEl = document.getElementById('drawsNote');

let cells = Array(9).fill(null);
let current = 'X';
let gameOver = false;
let score = { X: 0, O: 0, draws: 0 };

function buildBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `cell ${i + 1}`);
    cell.dataset.index = i;
    cell.addEventListener('click', onCellClick);
    boardEl.appendChild(cell);
  }
}

function markSVG(player) {
  if (player === 'X') {
    return `<svg class="mark-x" viewBox="0 0 40 40">
      <line x1="7" y1="7" x2="33" y2="33"/>
      <line x1="33" y1="7" x2="7" y2="33"/>
    </svg>`;
  }
  return `<svg class="mark-o" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="14"/>
  </svg>`;
}

function onCellClick(e) {
  const i = Number(e.currentTarget.dataset.index);
  if (gameOver || cells[i]) return;

  cells[i] = current;
  e.currentTarget.innerHTML = markSVG(current);
  e.currentTarget.disabled = true;

  const win = checkWin();
  if (win) {
    endGame(win);
    return;
  }

  if (cells.every(Boolean)) {
    score.draws++;
    statusEl.textContent = 'nobody wins this one';
    drawsNoteEl.textContent = `${score.draws} draw${score.draws === 1 ? '' : 's'} so far`;
    gameOver = true;
    return;
  }

  current = current === 'X' ? 'O' : 'X';
  statusEl.textContent = `${current}'s turn`;
}

function checkWin() {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return line;
    }
  }
  return null;
}

function endGame(line) {
  gameOver = true;
  const winner = cells[line[0]];
  score[winner]++;
  statusEl.textContent = `${winner} takes the board`;
  drawWinLine(line);
  renderTally(tallyXEl, score.X);
  renderTally(tallyOEl, score.O);
}

function drawWinLine(line) {
  const key = line.join(',');
  const [x1, y1, x2, y2] = STRIKE_COORDS[key];
  strikeEl.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  requestAnimationFrame(() => strikeEl.classList.add('drawn'));
}

function renderTally(svgEl, count) {
  svgEl.innerHTML = '';
  const groups = Math.ceil(count / 5) || 0;
  let x = 4;
  let remaining = count;

  for (let g = 0; g < groups; g++) {
    const inGroup = Math.min(5, remaining);
    remaining -= inGroup;
    const lines = [];

    for (let s = 0; s < Math.min(inGroup, 4); s++) {
      const lx = x + s * 6;
      lines.push(`<line x1="${lx}" y1="6" x2="${lx}" y2="34"/>`);
    }
    if (inGroup === 5) {
      lines.push(`<line x1="${x - 2}" y1="32" x2="${x + 20}" y2="8"/>`);
    }
    svgEl.insertAdjacentHTML('beforeend', lines.join(''));
    x += 4 * 6 + 10;
  }
}

function newRound() {
  cells = Array(9).fill(null);
  current = 'X';
  gameOver = false;
  strikeEl.classList.remove('drawn');
  strikeEl.innerHTML = '';
  buildBoard();
  statusEl.textContent = "X's turn";
}

function clearScore() {
  score = { X: 0, O: 0, draws: 0 };
  drawsNoteEl.textContent = '';
  renderTally(tallyXEl, 0);
  renderTally(tallyOEl, 0);
}

document.getElementById('resetBoard').addEventListener('click', newRound);
document.getElementById('resetScore').addEventListener('click', () => {
  clearScore();
  newRound();
});

newRound();
