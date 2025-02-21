// Piece movement vectors
const KNIGHT_MOVES = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

const KING_MOVES = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const BISHOP_VECTORS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
const ROOK_VECTORS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const QUEEN_VECTORS = [...BISHOP_VECTORS, ...ROOK_VECTORS];

export const initialBoardSetup = () => {
  // Create a new array with 8 rows
  const board = [];

  // Initialize each row with 8 null values
  for (let i = 0; i < 8; i++) {
    board[i] = new Array(8).fill(null);
  }

  // Place black pieces
  board[0][0] = { type: "rook", color: "black" };
  board[0][1] = { type: "knight", color: "black" };
  board[0][2] = { type: "bishop", color: "black" };
  board[0][3] = { type: "queen", color: "black" };
  board[0][4] = { type: "king", color: "black" };
  board[0][5] = { type: "bishop", color: "black" };
  board[0][6] = { type: "knight", color: "black" };
  board[0][7] = { type: "rook", color: "black" };

  // Place black pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: "pawn", color: "black" };
  }

  // Place white pawns
  for (let i = 0; i < 8; i++) {
    board[6][i] = { type: "pawn", color: "white" };
  }

  // Place white pieces
  board[7][0] = { type: "rook", color: "white" };
  board[7][1] = { type: "knight", color: "white" };
  board[7][2] = { type: "bishop", color: "white" };
  board[7][3] = { type: "queen", color: "white" };
  board[7][4] = { type: "king", color: "white" };
  board[7][5] = { type: "bishop", color: "white" };
  board[7][6] = { type: "knight", color: "white" };
  board[7][7] = { type: "rook", color: "white" };

  return board;
}; // Create an 8x8 board filled with null values first

const isInBounds = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

const isSquareEmpty = (board, row, col) => !board[row][col];

const isEnemy = (piece, targetPiece) => {
  return targetPiece && piece.color !== targetPiece.color;
};

const getStraightLineMoves = (board, row, col, vectors, maxDistance = 8) => {
  if (!board?.[row]?.[col]) return [];

  const piece = board[row][col];
  const moves = [];

  vectors.forEach(([dRow, dCol]) => {
    let currentRow = row + dRow;
    let currentCol = col + dCol;
    let distance = 1;

    while (
      currentRow >= 0 &&
      currentRow < 8 &&
      currentCol >= 0 &&
      currentCol < 8 &&
      distance <= maxDistance
    ) {
      if (
        !board[currentRow]?.[currentCol] ||
        isEnemy(piece, board[currentRow][currentCol])
      ) {
        moves.push({ row: currentRow, col: currentCol });
        if (board[currentRow]?.[currentCol]) break; // Stop if we hit a piece
      } else {
        break; // Stop if we hit our own piece
      }
      currentRow += dRow;
      currentCol += dCol;
      distance++;
    }
  });

  return moves;
};

export const calculateValidMoves = (row, col, board, portals = {}) => {
  const moves = [];
  const piece = board?.[row]?.[col];
  
  if (!piece || !board) return moves;

  const isInBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const isValidMove = (r, c) => {
    if (!isInBounds(r, c)) return false;
    const targetPiece = board[r]?.[c];
    return !targetPiece || targetPiece.color !== piece.color;
  };

  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;
      
      // Forward move
      const oneForward = row + direction;
      if (isInBounds(oneForward, col)) {
        if (!board[oneForward]?.[col]) {
          moves.push({ row: oneForward, col });
          
          // Double move from starting position
          if (row === startRow) {
            const twoForward = row + (2 * direction);
            if (isInBounds(twoForward, col) && !board[twoForward]?.[col]) {
              moves.push({ row: twoForward, col });
            }
          }
        }
      }
      
      // Diagonal captures
      const captureOffsets = [-1, 1];
      for (const offset of captureOffsets) {
        const newCol = col + offset;
        const newRow = row + direction;
        
        if (isInBounds(newRow, newCol)) {
          const targetPiece = board[newRow]?.[col + offset];
          if (targetPiece && targetPiece.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
      break;
    }
    
    case 'knight': {
      for (const [dr, dc] of KNIGHT_MOVES) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidMove(newRow, newCol)) {
          moves.push({ row: newRow, col: newCol });
        }
      }
      break;
    }
    
    case 'bishop': {
      const directions = BISHOP_VECTORS;
      for (const [dr, dc] of directions) {
        let newRow = row + dr;
        let newCol = col + dc;
        while (isInBounds(newRow, newCol)) {
          const targetPiece = board[newRow][newCol];
          if (!targetPiece) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          newRow += dr;
          newCol += dc;
        }
      }
      break;
    }
    
    case 'queen': {
      const directions = QUEEN_VECTORS;
      for (const [dr, dc] of directions) {
        let newRow = row + dr;
        let newCol = col + dc;
        while (isInBounds(newRow, newCol)) {
          const targetPiece = board[newRow][newCol];
          if (!targetPiece) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          newRow += dr;
          newCol += dc;
        }
      }
      break;
    }
    
    case 'king': {
      const directions = KING_MOVES;
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidMove(newRow, newCol)) {
          moves.push({ row: newRow, col: newCol });
        }
      }
      break;
    }
  }

  // Handle portal moves if applicable
  if (portals) {
    const portalKey = `${row}-${col}`;
    if (portals[portalKey]) {
      const [destRow, destCol] = portals[portalKey].linkedTo.split('-').map(Number);
      if (!board[destRow][destCol] || board[destRow][destCol].color !== piece.color) {
        moves.push({ row: destRow, col: destCol });
      }
    }
  }

  return moves;
};

export const makeMove = (from, to, board) => {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[from.row][from.col];

  // Update piece state
  if (piece) {
    piece.hasMoved = true;
  }

  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  return newBoard;
};

export const isCheck = (board, color) => {
  if (!board || !Array.isArray(board)) return false;

  // Find the king
  let kingPosition = null;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i]?.[j];
      if (piece?.type === "king" && piece.color === color) {
        kingPosition = { row: i, col: j };
        break;
      }
    }
    if (kingPosition) break;
  }

  if (!kingPosition) return false;

  // Check if any opponent piece can capture the king
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i]?.[j];
      if (piece && piece.color !== color) {
        try {
          const moves = calculateValidMoves(i, j, board);
          if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
            return true;
          }
        } catch (error) {
          console.error('Error calculating moves:', error);
          continue;
        }
      }
    }
  }

  return false;
};
