import { useState, useEffect } from 'react';
import { ref, runTransaction } from 'firebase/database';
import { database } from '../../../firebase/config';

export const useGameTimer = (
    gameId,
    gameState,
    getServerTime,
    areBothPlayersJoined,
    initiateArchiving, // Added: Function from useArchiving
    setGameEndDetails, // Keep for UI popup
    setShowGameEndPopup, // Keep for UI popup
    isGameArchived, // Added: State from useArchiving
    isArchivingLocally // Added: State from useArchiving
) => {
    const [whiteTime, setWhiteTime] = useState(null);
    const [blackTime, setBlackTime] = useState(null);

    useEffect(() => {
        if (!gameState || !gameId) return;

        // Skip timer if archived or archiving is in progress by any client (based on status)
        if (gameState.status === 'archived' || gameState.status === 'archiving' || isGameArchived) {
            return;
        }

        // Initialize times from gameState
        setWhiteTime(gameState.whiteTime);
        setBlackTime(gameState.blackTime);

        let timerInterval;

        // Only run timer if game is active and not being archived locally
        if (gameState.status === 'active' && !isArchivingLocally && areBothPlayersJoined && areBothPlayersJoined()) {
            timerInterval = setInterval(async () => {
                // Re-check statuses inside interval
                if (isGameArchived || isArchivingLocally || gameState.status === 'archived' || gameState.status === 'archiving') {
                    clearInterval(timerInterval);
                    return;
                }

                const now = getServerTime();
                const lastMoveTime = gameState.lastMoveTime || now;
                const elapsedSeconds = Math.floor((now - lastMoveTime) / 1000);

                // --- White's Turn --- 
                if (gameState.current_turn === 'white') {
                    const newWhiteTime = Math.max(0, gameState.whiteTime - elapsedSeconds);
                    setWhiteTime(newWhiteTime);

                    if (newWhiteTime <= 0 && gameState.whiteTime > 0) {
                        clearInterval(timerInterval);
                        const gameDetails = { winner: 'black', reason: 'timeout' };
                        const gameRef = ref(database, `games/${gameId}`);
                        const currentDataForArchive = { ...gameState, whiteTime: 0 };

                        // 1. Attempt to set status to finished
                        runTransaction(gameRef, (currentData) => {
                            if (!currentData || currentData.status !== 'active') return undefined; // Abort if not active
                            return {
                                ...currentData,
                                status: 'finished',
                                winner: 'black',
                                reason: 'timeout',
                                whiteTime: 0
                            };
                        }).then(async (transactionResult) => {
                            if (transactionResult.committed) {
                                // Update UI
                                setGameEndDetails(gameDetails);
                                setShowGameEndPopup(true);
                                // 2. Initiate Archiving
                                initiateArchiving(currentDataForArchive, gameDetails);
                            }
                        }).catch(error => { });
                    }
                    // --- Black's Turn --- 
                } else {
                    const newBlackTime = Math.max(0, gameState.blackTime - elapsedSeconds);
                    setBlackTime(newBlackTime);

                    if (newBlackTime <= 0 && gameState.blackTime > 0) {
                        clearInterval(timerInterval);
                        const gameDetails = { winner: 'white', reason: 'timeout' };
                        const gameRef = ref(database, `games/${gameId}`);
                        const currentDataForArchive = { ...gameState, blackTime: 0 };

                        // 1. Attempt to set status to finished
                        runTransaction(gameRef, (currentData) => {
                            if (!currentData || currentData.status !== 'active') return undefined; // Abort if not active
                            return {
                                ...currentData,
                                status: 'finished',
                                winner: 'white',
                                reason: 'timeout',
                                blackTime: 0
                            };
                        }).then(async (transactionResult) => {
                            if (transactionResult.committed) {
                                // Update UI
                                setGameEndDetails(gameDetails);
                                setShowGameEndPopup(true);
                                // 2. Initiate Archiving
                                initiateArchiving(currentDataForArchive, gameDetails);
                            }
                        }).catch(error => { });
                    }
                }
            }, 1000);
        }

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [
        gameState,
        gameId,
        getServerTime,
        areBothPlayersJoined,
        initiateArchiving, // Added initiateArchiving
        setGameEndDetails,
        setShowGameEndPopup,
        isGameArchived, // Added isGameArchived
        isArchivingLocally // Added isArchivingLocally
    ]);

    return { whiteTime, blackTime, setWhiteTime, setBlackTime };
};