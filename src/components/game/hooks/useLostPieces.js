import { useState } from 'react';
import { getPieceValue } from '../utils/pieceUtils';

export const useLostPieces = (game) => {
  const [lostPieces, setLostPieces] = useState({
    white: [],
    black: []
  });

  const updateLostPieces = () => {
    const fen = game.fen();
    const position = fen.split(' ')[0];
    
    const pieceCounts = {
      'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1, 'k': 1,
      'P': 8, 'N': 2, 'B': 2, 'R': 2, 'Q': 1, 'K': 1
    };
    
    for (let char of position) {
      if (pieceCounts[char] !== undefined) {
        pieceCounts[char]--;
      }
    }
    
    const whiteLostCounts = {};
    const blackLostCounts = {};
    
    for (let piece in pieceCounts) {
      const count = pieceCounts[piece];
      if (piece === piece.toUpperCase() && count > 0) {
        whiteLostCounts[piece] = count;
      } else if (piece === piece.toLowerCase() && count > 0) {
        blackLostCounts[piece] = count;
      }
    }
    
    const whiteLost = Object.keys(whiteLostCounts).map(piece => ({
      type: piece,
      count: whiteLostCounts[piece],
      value: getPieceValue(piece)
    }));
    
    const blackLost = Object.keys(blackLostCounts).map(piece => ({
      type: piece,
      count: blackLostCounts[piece],
      value: getPieceValue(piece)
    }));
    
    whiteLost.sort((a, b) => b.value - a.value);
    blackLost.sort((a, b) => b.value - a.value);
    
    setLostPieces({
      white: whiteLost,
      black: blackLost
    });
  };

  return [lostPieces, updateLostPieces];
}; 