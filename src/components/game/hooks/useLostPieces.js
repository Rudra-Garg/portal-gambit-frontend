import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for tracking lost chess pieces
 * @param {Object} game - The chess game instance
 * @returns {[Object, Function]} An array with lost pieces object and update function
 */
export const useLostPieces = (game) => {
  const [lostPieces, setLostPieces] = useState({
    white: [],
    black: []
  });

  // Memoize the calculation function with useCallback
  const calculateLostPieces = useCallback((currentGame) => {
    if (!currentGame) return { white: [], black: [] };

    // Define the starting pieces for a standard chess game
    const startingPieces = {
      white: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
      black: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
    };

    // Count current pieces on the board
    const currentPieces = {
      white: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      black: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    };

    // Get the current board state
    const board = currentGame.board();
    
    // Count all pieces currently on the board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const color = piece.color === 'w' ? 'white' : 'black';
          currentPieces[color][piece.type]++;
        }
      }
    }

    // Calculate lost pieces
    const lost = {
      white: [],
      black: []
    };

    // For each color, determine which pieces are lost
    ['white', 'black'].forEach(color => {
      for (const pieceType in startingPieces[color]) {
        const lostCount = startingPieces[color][pieceType] - currentPieces[color][pieceType];
        for (let i = 0; i < lostCount; i++) {
          lost[color].push(pieceType);
        }
      }
    });

    return lost;
  }, []);

  // Memoize the update function with useCallback
  const updateLostPieces = useCallback((currentGame) => {
    const newLostPieces = calculateLostPieces(currentGame);
    
    // Only update state if lost pieces have changed
    setLostPieces(prevLostPieces => {
      if (JSON.stringify(prevLostPieces) !== JSON.stringify(newLostPieces)) {
        return newLostPieces;
      }
      return prevLostPieces;
    });

    return newLostPieces;
  }, [calculateLostPieces]);

  // Include updateLostPieces in the dependency array
  useEffect(() => {
    if (game) {
      updateLostPieces(game);
    }
  }, [game, updateLostPieces]);

  return [lostPieces, updateLostPieces];
};