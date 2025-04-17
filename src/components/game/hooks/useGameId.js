import { useState, useEffect } from 'react';

export const useGameId = () => {
    const [gameId, setGameId] = useState(null);
    const [activeGame, setActiveGame] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const urlObj = new URL(window.location.href);
                const id = urlObj.searchParams.get('gameId');
                setGameId(id);
                setActiveGame(id);
            } catch (error) {
                console.error("Invalid URL:", error);
                setGameId(null);
                setActiveGame(null);
            }
        } else {
            setGameId(null);
            setActiveGame(null);
        }
    }, []);

    return { gameId, setGameId, activeGame, setActiveGame };
}; 