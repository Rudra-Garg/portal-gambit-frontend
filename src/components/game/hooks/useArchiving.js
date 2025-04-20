import { useState, useCallback, useEffect } from 'react';
import { ref, update, runTransaction, get, onValue } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../../../firebase/config';
import { BACKEND_URL } from '../../../config';

export const useArchiving = (gameId) => {
    // Local state to track if *this client* is actively archiving
    const [isArchivingLocally, setIsArchivingLocally] = useState(false);
    // Local state reflecting the game's archived status (driven by Firebase)
    const [isGameArchived, setIsGameArchived] = useState(false);

    // Central function to initiate the archive process
    const initiateArchiving = useCallback(async (gameDataForArchive, gameDetails) => {
        if (!gameId || !gameDataForArchive || !gameDetails) {
            return;
        }

        // Avoid starting if already archiving locally or game is known to be archived
        if (isArchivingLocally || isGameArchived) {
            return;
        }

        // Double-check player data before proceeding
        if (!gameDataForArchive.white_player || !gameDataForArchive.black_player) {
            return;
        }

        const gameRef = ref(database, `games/${gameId}`);
        const gameStatusRef = ref(database, `games/${gameId}/status`);

        setIsArchivingLocally(true); // Indicate local attempt

        try {
            const transactionResult = await runTransaction(gameStatusRef, (currentStatus) => {
                if (currentStatus === 'finished') {
                    return 'archiving'; // Attempt to claim archiving lock
                }
                // If status is already 'archiving' or 'archived', abort transaction
                return undefined; // Abort
            });

            if (transactionResult.committed) {
                const uniqueArchiveId = uuidv4();

                try {
                    // Fetch latest moves (needed for history API)
                    const movesRef = ref(database, `games/${gameId}/moves`);
                    const movesSnapshot = await get(movesRef);
                    const movesData = movesSnapshot.val() || {};
                    const formattedMoves = Object.values(movesData)
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .map(move => typeof move === 'string' ? move : move.san || '');

                    const response = await fetch(`${BACKEND_URL}/history/games`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        },
                        body: JSON.stringify({
                            game_id: uniqueArchiveId,
                            firebase_game_ref: gameId,
                            white_player_id: gameDataForArchive.white_player,
                            black_player_id: gameDataForArchive.black_player,
                            start_time: new Date(gameDataForArchive.created_at || gameDataForArchive.lastMoveTime || Date.now()).toISOString(), // Use best available start time
                            end_time: new Date().toISOString(),
                            result: gameDetails.winner === 'white' ? 'white_win' :
                                gameDetails.winner === 'black' ? 'black_win' :
                                    gameDetails.winner === 'draw' ? 'draw' :
                                        gameDetails.reason === 'abandoned' ? 'abandoned' : 'unknown', // Handle abandon explicitly
                            winner_id: gameDetails.winner === 'white' ? gameDataForArchive.white_player :
                                gameDetails.winner === 'black' ? gameDataForArchive.black_player : null,
                            moves: formattedMoves,
                            initial_position: 'standard',
                            white_rating: gameDataForArchive.white_rating || 1200,
                            black_rating: gameDataForArchive.black_rating || 1200,
                            // TODO: Actual rating calculation needed if implementing ratings
                            rating_change: {
                                white: gameDetails.winner === 'white' ? 15 : (gameDetails.winner === 'black' ? -15 : 0),
                                black: gameDetails.winner === 'black' ? 15 : (gameDetails.winner === 'white' ? -15 : 0)
                            },
                            game_type: `${gameDataForArchive.portal_count}`, // Ensure string
                            time_control: {
                                initial: (gameDataForArchive.time_control?.initial || (gameDataForArchive.time_control || 10) * 60), // Handle both formats
                                increment: (gameDataForArchive.time_control?.increment || gameDataForArchive.increment || 0)
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Failed to archive game via API: ${response.status} ${response.statusText}`);
                    }

                    await update(gameRef, {
                        status: 'archived',
                        archived_at: Date.now(),
                        archive_id: uniqueArchiveId
                    });
                    setIsGameArchived(true);

                } catch (apiError) {
                } finally {
                    setIsArchivingLocally(false);
                }

            } else {
                // Transaction failed - likely already archiving or archived by another client
                const snapshot = await get(gameRef);
                const currentData = snapshot.val();
                if (currentData?.status === 'archived' || currentData?.archive_id) {
                    setIsGameArchived(true); // Sync local state
                }
                setIsArchivingLocally(false);
            }
        } catch (error) {
            setIsArchivingLocally(false); // Release local lock on error
        }

    }, [gameId, isArchivingLocally, isGameArchived]);

    // Effect to listen for external changes to archived status (e.g., another client archived)
    useEffect(() => {
        if (!gameId) return;
        const statusRef = ref(database, `games/${gameId}/status`);
        const archiveIdRef = ref(database, `games/${gameId}/archive_id`);

        // Listener for status changes
        const unsubStatus = onValue(statusRef, (snapshot) => {
            const status = snapshot.val();
            if (status === 'archived') {
                setIsGameArchived(true);
                setIsArchivingLocally(false); // Stop local attempts if archived elsewhere
            } else {
                // If status is not 'archived' (e.g., active, finished, waiting, archiving)
                // Ensure local archived state is false
                setIsGameArchived(false);
            }
        });

        // Listener for archive_id changes (redundant but safe)
        const unsubArchiveId = onValue(archiveIdRef, (snapshot) => {
            if (snapshot.exists()) {
                setIsGameArchived(true);
                setIsArchivingLocally(false);
            } else {
                // If archive_id is removed (e.g., during rematch)
                // Ensure local archived state is false
                setIsGameArchived(false);
            }
        });

        return () => {
            unsubStatus();
            unsubArchiveId();
        };
    }, [gameId]);


    return { initiateArchiving, isArchivingLocally, isGameArchived };
};