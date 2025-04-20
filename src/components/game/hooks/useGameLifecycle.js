import { useCallback } from 'react';
import { get, ref, remove, runTransaction } from 'firebase/database';
import { database } from '../../../firebase/config';

export const useGameLifecycle = (
    gameId,
    user,
    activeGame,
    setActiveGame,
    initiateArchiving,
    setGameEndDetails,
    setShowGameEndPopup,
    isGameArchived,
    isArchivingLocally
) => {
    const exitGame = useCallback(async () => {
        if (!activeGame) {
             setActiveGame(null);
             return;
        }

        if (isGameArchived || isArchivingLocally) {
             console.log('Exit Game: Game is archived or archiving locally, skipping exit logic.');
             setActiveGame(null);
             return;
        }

        try {
            const gameRef = ref(database, `games/${activeGame}`);
            const gameSnapshot = await get(gameRef);
            const gameData = gameSnapshot.val();

            if (!gameData) {
                console.error('Exit Game: Game not found or already deleted.');
                setActiveGame(null);
                return;
            }

            if (gameData.status === 'archived' || gameData.status === 'archiving') {
                 console.log('Exit Game: Game status in DB is archived/archiving, skipping logic.');
                 setActiveGame(null);
                 return;
             }

            if (gameData.status === 'active') {
                const isWhiteLeaving = gameData.white_player === user.uid;
                const gameDetails = {
                    winner: isWhiteLeaving ? 'black' : 'white',
                    reason: 'abandoned'
                };
                const currentDataForArchive = {
                     ...gameData,
                     winner: gameDetails.winner,
                     reason: gameDetails.reason
                 };

                const transactionResult = await runTransaction(gameRef, (currentData) => {
                    if (!currentData || currentData.status !== 'active') return undefined;
                    return {
                        ...currentData,
                        status: 'finished',
                        winner: gameDetails.winner,
                        reason: gameDetails.reason
                    };
                });

                if (transactionResult.committed) {
                    console.log("Exit Game: Set status to finished (abandoned).");
                    setGameEndDetails(gameDetails);
                    setShowGameEndPopup(true);
                    initiateArchiving(currentDataForArchive, gameDetails);
                    setActiveGame(null);
                } else {
                    console.log("Exit Game: Failed to set status to finished (already ended/archiving?).");
                    setActiveGame(null);
                }
                return;
            }

            const transactionResult = await runTransaction(gameRef, (game) => {
                if (game === null || game.status === 'archived' || game.status === 'archiving') return undefined;

                if (game.white_player === user.uid) {
                    game.white_player = null;
                    game.white_player_name = null;
                    game.white_player_email = null;
                } else if (game.black_player === user.uid) {
                    game.black_player = null;
                    game.black_player_name = null;
                    game.black_player_email = null;
                }
                return game;
            });

             if (transactionResult.committed) {
                console.log('Exit Game: Player removed from non-active game.');
                 const updatedGameSnapshot = await get(gameRef);
                 const updatedGameData = updatedGameSnapshot.val();
                 if (updatedGameData && !updatedGameData.white_player && !updatedGameData.black_player && updatedGameData.status !== 'archived' && updatedGameData.status !== 'archiving') {
                     await remove(gameRef);
                     console.log('Exit Game: Game deleted as both players have left.');
                 }
             } else {
                 console.log('Exit Game: Failed to remove player (game deleted or status changed?).');
             }
            setActiveGame(null);

        } catch (error) {
            console.error('Error exiting game:', error);
            setActiveGame(null);
        }

    }, [
        activeGame,
        user,
        initiateArchiving,
        setActiveGame,
        setGameEndDetails,
        setShowGameEndPopup,
        isGameArchived,
        isArchivingLocally
    ]);

    return {
        exitGame
    };
}; 