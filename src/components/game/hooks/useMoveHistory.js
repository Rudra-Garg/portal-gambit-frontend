import { useState, useEffect, useRef } from 'react';
import { database } from '../../../firebase/config';
import { ref, onValue, get } from 'firebase/database';

// Custom hook for managing move history
export const useMoveHistory = (gameId) => {
  const [moveHistory, setMoveHistory] = useState([]);
  const moveHistoryRef = useRef([]);

  useEffect(() => {
    if (!gameId) return;

    // Load initial history from Firebase if available
    const loadInitialHistory = async () => {
      try {
        const historySnapshot = await get(ref(database, `games/${gameId}/moveHistory`));
        if (historySnapshot.exists()) {
          const historyData = historySnapshot.val();
          moveHistoryRef.current = historyData;
          setMoveHistory(historyData);
        }
      } catch (error) {
        console.error("Error loading move history:", error);
      }
    };
    
    loadInitialHistory();

    // Set up a persistent listener for the game data
    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.lastMove) return;
      
      // Get the current last move from Firebase
      const lastMove = data.lastMove;
      
      // Update our ref first to avoid race conditions
      const currentHistory = [...moveHistoryRef.current];
      
      // Check if this move is already in our history to avoid duplicates
      const moveExists = currentHistory.some((move, index) => 
        move.from === lastMove.from && 
        move.to === lastMove.to && 
        move.piece === lastMove.piece &&
        move.san === lastMove.san && // Additional check using standard algebraic notation
        index === currentHistory.length - 1 // Check if it's the last move (position matters)
      );
      
      // Only add the move if it doesn't exist in our history
      if (!moveExists) {
        const updatedHistory = [...currentHistory, lastMove];
        moveHistoryRef.current = updatedHistory;
        setMoveHistory(updatedHistory);
        console.log("Added new move to history:", lastMove);
      }
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [gameId]);

  return moveHistory;
};