import {useEffect, useRef, useState} from 'react';
import {database} from '../../../firebase/config';
import {onValue, ref} from 'firebase/database';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const useMoveHistory = (gameId) => {
    const [moveHistory, setMoveHistory] = useState([]);
    const moveHistoryRef = useRef([]);
    const lastProcessedMoveKeyRef = useRef(null);
    const isResettingRef = useRef(false); // Flag to prevent race conditions during reset

    useEffect(() => {
        if (!gameId) {
            moveHistoryRef.current = [];
            lastProcessedMoveKeyRef.current = null;
            setMoveHistory([]);
            // console.log("useMoveHistory: No gameId provided, reset state.");
            return;
        }

        // Initial setup for a new gameId
        // console.log(`useMoveHistory: Setting up for gameId: ${gameId}`);
        moveHistoryRef.current = [];
        lastProcessedMoveKeyRef.current = null;
        setMoveHistory([]);
        isResettingRef.current = false; // Ensure reset flag is false initially

        const gameRef = ref(database, `games/${gameId}`);

        const listener = (snapshot) => {
            // If resetting is in progress, ignore this snapshot to avoid processing old data
            if (isResettingRef.current) {
                // console.log("useMoveHistory: Currently resetting, skipping snapshot.");
                return;
            }

            const data = snapshot.val();
            if (!data) {
                // console.log("useMoveHistory: Game data snapshot is null.");
                // Consider if a reset is needed here too, e.g., if game was deleted
                if (moveHistoryRef.current.length > 0) {
                    // console.log("useMoveHistory: Game data became null, resetting local history.");
                    moveHistoryRef.current = [];
                    lastProcessedMoveKeyRef.current = null;
                    setMoveHistory([]);
                }
                return;
            }

            const {lastMove, fen, lastMoveTime} = data;

            // --- Reset Condition Check ---
            // Use looser check for lastMove (null or undefined)
            const isStartingPos = fen === STARTING_FEN;
            const isLastMoveCleared = lastMove == null; // Checks for both null and undefined

            // Log the conditions being checked for reset
            // // console.log(`useMoveHistory: Reset check - isStartingPos: ${isStartingPos}, isLastMoveCleared:
            // ${isLastMoveCleared}, historyLength: ${moveHistoryRef.current.length}`);

            if (isStartingPos && isLastMoveCleared && moveHistoryRef.current.length > 0) {
                // console.log("useMoveHistory: *** RESET CONDITION MET *** Clearing history.");
                isResettingRef.current = true; // Set flag before async operations
                moveHistoryRef.current = [];
                lastProcessedMoveKeyRef.current = null;
                setMoveHistory([]); // Trigger UI update
                // Reset the flag after a short delay to allow state to settle
                setTimeout(() => {
                    isResettingRef.current = false;
                }, 50);
                return; // Exit callback after reset
            }

            // --- Append Condition Check ---
            if (lastMove) {
                const currentMoveKey = lastMoveTime || JSON.stringify(lastMove);

                if (currentMoveKey !== lastProcessedMoveKeyRef.current) {
                    // Ensure we don't append during or immediately after a reset
                    if (!isResettingRef.current) {
                        // console.log("useMoveHistory: Appending new move:", lastMove.san || 'Portal Move', `(Key: ${currentMoveKey})`);
                        moveHistoryRef.current = [...moveHistoryRef.current, lastMove];
                        lastProcessedMoveKeyRef.current = currentMoveKey;
                        setMoveHistory([...moveHistoryRef.current]);
                    } else {
                        // console.log("useMoveHistory: Skipping append due to recent reset flag.");
                    }
                }
            }
        };

        const unsubscribe = onValue(gameRef, listener, (error) => {
            console.error("useMoveHistory: Firebase listener error:", error);
            moveHistoryRef.current = [];
            lastProcessedMoveKeyRef.current = null;
            setMoveHistory([]);
            isResettingRef.current = false;
        });

        // Cleanup
        return () => {
            // console.log(`useMoveHistory: Cleaning up listener for gameId: ${gameId}`);
            unsubscribe();
        };

    }, [gameId]);

    return moveHistory;
};