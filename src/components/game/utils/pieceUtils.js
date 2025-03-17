// utils/pieceUtils.js

// Unicode chess symbols for both white and black pieces
export const pieceSymbols = {
  // White pieces
  'w_p': '♙', // white pawn
  'w_n': '♘', // white knight
  'w_b': '♗', // white bishop
  'w_r': '♖', // white rook
  'w_q': '♕', // white queen
  'w_k': '♔', // white king
  
  // Black pieces
  'b_p': '♟', // black pawn
  'b_n': '♞', // black knight
  'b_b': '♝', // black bishop
  'b_r': '♜', // black rook
  'b_q': '♛', // black queen
  'b_k': '♚', // black king
  
  // Single character piece types (for use with piece type only)
  'p': '♟', // pawn (default black for backward compatibility)
  'n': '♞', // knight
  'b': '♝', // bishop
  'r': '♜', // rook
  'q': '♛', // queen
  'k': '♚'  // king
};

// Function to get the proper piece symbol based on piece type and color
export const getPieceSymbol = (pieceType, pieceColor = 'b') => {
  const key = pieceColor === 'w' ? `w_${pieceType}` : `b_${pieceType}`;
  return pieceSymbols[key] || pieceSymbols[pieceType] || '?';
};

// Function to categorize captured pieces by type and count
export const categorizePieces = (pieces) => {
  const categorized = [];
  
  if (!pieces || !Array.isArray(pieces)) return categorized;
  
  const countMap = {};
  
  // Count each piece type
  pieces.forEach(pieceType => {
    countMap[pieceType] = (countMap[pieceType] || 0) + 1;
  });
  
  // Convert to array of objects with type and count
  for (const [type, count] of Object.entries(countMap)) {
    categorized.push({
      type,
      count
    });
  }
  
  // Sort by value (optional)
  categorized.sort((a, b) => {
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    return pieceValues[b.type] - pieceValues[a.type];
  });
  
  return categorized;
};