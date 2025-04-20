import { useCallback } from 'react';
import { get, ref, remove, runTransaction } from 'firebase/database';
import { database } from '../../../firebase/config';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();
    const exitGame = useCallback(async () => {
        if (!activeGame) {
            setActiveGame(null);
            navigate('/profile');
            return;
        }

        if (isGameArchived || isArchivingLocally) {
            setActiveGame(null);
            navigate('/profile');
            return;
        }

        try {
            const gameRef = ref(database, `games/${activeGame}`);
            const gameSnapshot = await get(gameRef);
            const gameData = gameSnapshot.val();

            if (!gameData) {
                setActiveGame(null);
                return;
            }

            if (gameData.status === 'archived' || gameData.status === 'archiving') {
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
                    setGameEndDetails(gameDetails);
                    setShowGameEndPopup(true);
                    initiateArchiving(currentDataForArchive, gameDetails);
                    setActiveGame(null);
                } else {
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
                const updatedGameSnapshot = await get(gameRef);
                const updatedGameData = updatedGameSnapshot.val();
                if (updatedGameData && !updatedGameData.white_player && !updatedGameData.black_player && updatedGameData.status !== 'archived' && updatedGameData.status !== 'archiving') {
                    await remove(gameRef);
                }
            }
            setActiveGame(null);
            navigate('/profile');

        } catch (error) {
            setActiveGame(null);
            navigate('/profile');
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