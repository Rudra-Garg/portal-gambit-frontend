import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../firebase/config';
import { PortalChess } from '../CustomChessEngine';

export const useGameState = (
    gameId,
    setGameEndDetails,
    setShowGameEndPopup
) => {
    const [game, setGame] = useState(() => new PortalChess());
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        if (!gameId) return;

        const gameRef = ref(database, `games/${gameId}`);
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameState(data);
                try {
                    const newGame = new PortalChess(undefined, data.portal_count);
                    if (typeof data.fen === 'string') {
                        newGame.load(data.fen);
                    }
                    newGame.portals = data.portals || {};
                    newGame._turn = data.current_turn === 'white' ? 'w' : 'b';
                    setGame(newGame);

                    if (data.status === 'finished' && data.winner && data.reason) {
                        console.log("useGameState: Status is 'finished'. Showing popup.");
                        const gameDetails = {
                            winner: data.winner,
                            reason: data.reason
                        };
                        setGameEndDetails(prevDetails => 
                            JSON.stringify(prevDetails) !== JSON.stringify(gameDetails) ? gameDetails : prevDetails
                        );
                        setShowGameEndPopup(true);
                    } else if (data.status === 'active') {
                        console.log("useGameState: Status is 'active'. Hiding popup.");
                        setShowGameEndPopup(false);
                        setGameEndDetails(null);
                    } else if (data.status === 'waiting') {
                        console.log("useGameState: Status is 'waiting'. Showing waiting popup.");
                        const waitingDetails = { winner: null, reason: 'waiting' };
                        setGameEndDetails(waitingDetails);
                        setShowGameEndPopup(true);
                    } else if (data.status === 'archiving' || data.status === 'archived'){
                        console.log(`useGameState: Status is '${data.status}'. No change to popup visibility.`);
                    }

                } catch (error) {
                    console.error('Error initializing/updating chess game from Firebase data:', error);
                }
            } else {
                setGameState(null);
                setGame(new PortalChess());
                console.log("useGameState: Game data is null, resetting state.");
                setShowGameEndPopup(false);
                setGameEndDetails(null);
            }
        });

        return () => unsubscribe();
    }, [gameId, setGameEndDetails, setShowGameEndPopup]);

    return { game, setGame, gameState, setGameState };
}; 