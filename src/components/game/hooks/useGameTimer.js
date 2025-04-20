import { useState, useEffect, useRef } from 'react';
import { ref, runTransaction } from 'firebase/database';
import { database } from '../../../firebase/config';

export const useGameTimer = (
    gameId,
    gameState,
    getServerTime,
    areBothPlayersJoined,
    initiateArchiving,
    setGameEndDetails,
    setShowGameEndPopup,
    isGameArchived,
    isArchivingLocally
) => {
    // Keep state for UI rendering
    const [whiteTime, setWhiteTime] = useState(null);
    const [blackTime, setBlackTime] = useState(null);
    
    // Track real-time local values separate from render state
    const localWhiteTimeRef = useRef(null);
    const localBlackTimeRef = useRef(null);
    const lastTickRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const initializedRef = useRef(false);
    
    // Track last move made time to detect new moves
    const lastMoveTimeRef = useRef(null);

    // Initialize or sync timer values when game state changes
    useEffect(() => {
        if (!gameState) return;
        
        // Only sync times when server values actually change OR on initial load
        const newMoveDetected = lastMoveTimeRef.current !== gameState.lastMoveTime;
        
        if (newMoveDetected || !initializedRef.current) {
            // Update our tracking reference
            lastMoveTimeRef.current = gameState.lastMoveTime;
            
            // Update actual timer values
            localWhiteTimeRef.current = gameState.whiteTime;
            localBlackTimeRef.current = gameState.blackTime;
            lastTickRef.current = getServerTime();
            
            // Update UI state
            setWhiteTime(Math.ceil(gameState.whiteTime));
            setBlackTime(Math.ceil(gameState.blackTime));
            
            initializedRef.current = true;
        }
    }, [gameState?.lastMoveTime, gameState?.whiteTime, gameState?.blackTime, getServerTime]);

    // Main timer effect
    useEffect(() => {
        if (!gameState || !gameId || !initializedRef.current) {
            return;
        }

        // Check if any moves have been made - don't start timer if it's the very beginning
        const firstMoveNotMade = !gameState.lastMoveTime || !gameState.lastMove;
        const isInitialWhiteTurn = gameState.current_turn === 'white' && firstMoveNotMade;
        
        if (isInitialWhiteTurn) {
            return;
        }

        if (gameState.status !== 'active' || isArchivingLocally || isGameArchived || 
            (areBothPlayersJoined && !areBothPlayersJoined())) {
            return;
        }

        // Clear any existing interval
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        
        // Get reference values rather than closure values for timer stability
        const currentTurn = gameState.current_turn;
        
        let tickCount = 0;
        let lastFrameTime = getServerTime();
        
        // Start a consistent interval for visual updates
        timerIntervalRef.current = setInterval(() => {
            tickCount++;
            
            // Get current time and calculate elapsed time since last tick
            const now = getServerTime();
            const elapsedSec = (now - lastFrameTime) / 1000;
            lastFrameTime = now;

            // Update the appropriate timer based on current turn
            if (currentTurn === 'white') {
                if (localWhiteTimeRef.current !== null) {
                    localWhiteTimeRef.current = Math.max(0, localWhiteTimeRef.current - elapsedSec);
                    
                    // Update UI state - use Math.ceil for smoother countdown experience
                    setWhiteTime(Math.ceil(localWhiteTimeRef.current));
                }
                
                // Server-side timeout check
                const serverElapsed = Math.floor((now - gameState.lastMoveTime) / 1000);
                const serverWhiteTime = Math.max(0, gameState.whiteTime - serverElapsed);
                
                if (serverWhiteTime <= 0 && gameState.whiteTime > 0) {
                    handleWhiteTimeout();
                }
            } else {
                if (localBlackTimeRef.current !== null) {
                    localBlackTimeRef.current = Math.max(0, localBlackTimeRef.current - elapsedSec);
                    
                    // Update UI state
                    setBlackTime(Math.ceil(localBlackTimeRef.current));
                }
                
                // Server-side timeout check
                const serverElapsed = Math.floor((now - gameState.lastMoveTime) / 1000);
                const serverBlackTime = Math.max(0, gameState.blackTime - serverElapsed);
                
                if (serverBlackTime <= 0 && gameState.blackTime > 0) {
                    handleBlackTimeout();
                }
            }
        }, 50); // Update every 50ms for smoother countdown

        // Timeout handlers
        function handleWhiteTimeout() {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            setWhiteTime(0); // Ensure UI shows 0
            
            const gameDetails = { winner: 'black', reason: 'timeout' };
            const gameRef = ref(database, `games/${gameId}`);
            const currentDataForArchive = { ...gameState, whiteTime: 0 };

            runTransaction(gameRef, (currentData) => {
                if (!currentData || currentData.status !== 'active') return undefined;
                return {
                    ...currentData,
                    status: 'finished',
                    winner: 'black',
                    reason: 'timeout',
                    whiteTime: 0
                };
            }).then((transactionResult) => {
                if (transactionResult.committed) {
                    setGameEndDetails(gameDetails);
                    setShowGameEndPopup(true);
                    initiateArchiving(currentDataForArchive, gameDetails);
                }
            }).catch(error => console.error("Error during timeout transaction:", error));
        }

        function handleBlackTimeout() {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            setBlackTime(0); // Ensure UI shows 0
            
            const gameDetails = { winner: 'white', reason: 'timeout' };
            const gameRef = ref(database, `games/${gameId}`);
            const currentDataForArchive = { ...gameState, blackTime: 0 };

            runTransaction(gameRef, (currentData) => {
                if (!currentData || currentData.status !== 'active') return undefined;
                return {
                    ...currentData,
                    status: 'finished',
                    winner: 'white',
                    reason: 'timeout',
                    blackTime: 0
                };
            }).then((transactionResult) => {
                if (transactionResult.committed) {
                    setGameEndDetails(gameDetails);
                    setShowGameEndPopup(true);
                    initiateArchiving(currentDataForArchive, gameDetails);
                }
            }).catch(error => console.error("Error during timeout transaction:", error));
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [
        gameId,
        gameState?.status,
        gameState?.current_turn,
        gameState?.lastMoveTime,
        gameState?.lastMove,
        isGameArchived,
        isArchivingLocally,
        areBothPlayersJoined,
        initiateArchiving,
        setGameEndDetails, 
        setShowGameEndPopup
    ]); // Dependencies that affect whether timer should run

    return { whiteTime, blackTime };
};