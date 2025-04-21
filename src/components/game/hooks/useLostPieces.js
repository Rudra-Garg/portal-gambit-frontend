import { useState, useEffect, useCallback } from 'react';

export const useLostPieces = (game) => {
  // Initialize with empty arrays
  const [lostPieces, setLostPieces] = useState({
    white: [],
    black: []
  });

  // Define the calculation function
  const calculateLostPieces = useCallback((currentGame) => {
    if (!currentGame || typeof currentGame.board !== 'function') {
      console.error('[LostPieces] Invalid game object:', currentGame);
      return { white: [], black: [] };
    }

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

    try {
      // Get the current board state
      const board = currentGame.board();
      
      // Make sure the board is properly structured
      if (!Array.isArray(board) || board.length !== 8) {
        throw new Error('Invalid board structure');
      }
      
      // Count all pieces currently on the board
      let pieceCount = 0;
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece) {
            pieceCount++;
            const color = piece.color === 'w' ? 'white' : 'black';
            const type = piece.type;
            currentPieces[color][type]++;
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
          const expectedCount = startingPieces[color][pieceType];
          const actualCount = currentPieces[color][pieceType];
          const lostCount = Math.max(0, expectedCount - actualCount);
          
          for (let i = 0; i < lostCount; i++) {
            lost[color].push(pieceType);
          }
        }
      });
      return lost;
    } catch (error) {
      console.error('[LostPieces] Error calculating lost pieces:', error);
      return { white: [], black: [] };
    }
  }, []);

  // Function to update lost pieces
  const updateLostPieces = useCallback((currentGame) => {
    if (!currentGame) return lostPieces;
    
    
    const newLostPieces = calculateLostPieces(currentGame);
    
    setLostPieces(prevLostPieces => {
      // Check if there's a real change
      const hasChanged = 
        JSON.stringify(prevLostPieces.white) !== JSON.stringify(newLostPieces.white) ||
        JSON.stringify(prevLostPieces.black) !== JSON.stringify(newLostPieces.black);
      
      
      if (hasChanged) {
        return newLostPieces;
      }
      return prevLostPieces;
    });
    
    return newLostPieces;
  }, [calculateLostPieces, lostPieces]);

  // Update when the game changes
  useEffect(() => {
    if (game && typeof game.board === 'function') {
      updateLostPieces(game);
    }
  }, [game, updateLostPieces]);

  // IMPORTANT: Update when a move is made
  // This will force a recalculation when the FEN changes
  useEffect(() => {
    if (game && typeof game.fen === 'function') {
      const fen = game.fen();
      updateLostPieces(game);
    }
  }, [game?.fen?.(), updateLostPieces]);

  return [lostPieces, updateLostPieces];
};