import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, push, set } from 'firebase/database';
import { database } from '../../../firebase/config';

export const useRematch = (
    gameId,
    user,
    gameState,
    setShowGameEndPopup, // from useGameLifecycle
    setGameEndDetails, // from useGameLifecycle
    setWhiteTime, // from useGameTimer
    setBlackTime // from useGameTimer
) => {
    const [showRematchRequest, setShowRematchRequest] = useState(false);
    const [rematchRequestFrom, setRematchRequestFrom] = useState(null);

    // Function to handle the actual game state reset for rematch
    const handleRematch = useCallback(async () => {
        if (!gameId || !gameState) {
            console.error("Cannot start rematch: missing gameId or gameState");
            return;
        }
        try {
            // Calculate initial time based on game settings, fallback to default
            const initialTime = (gameState.time_control?.initial || 10 * 60);
            const currentTime = Date.now(); // Use local time for reset, server offset handled elsewhere

            const newGameState = {
                // Keep player info
                white_player: gameState.white_player,
                white_player_name: gameState.white_player_name,
                white_player_email: gameState.white_player_email,
                black_player: gameState.black_player,
                black_player_name: gameState.black_player_name,
                black_player_email: gameState.black_player_email,

                // Reset game state
                status: 'active', // Crucial: Set status back to active
                current_turn: 'white',
                whiteTime: initialTime,
                blackTime: initialTime,
                lastMoveTime: currentTime, // Reset last move time
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Standard starting FEN
                lastMove: null,
                portals: {},
                portal_count: gameState.portal_count, // Keep portal count setting
                // lostPieces are managed by useLostPieces based on game state
                winner: null,
                reason: null,
                // Clear any existing rematch notifications or archive info
                notifications: null,
                archive_id: null,
                archived_at: null
                // Moves history will be implicitly cleared by resetting other fields in Firebase
            };

            // Update the entire game node in Firebase
            await update(ref(database, `games/${gameId}`), newGameState);

            // Reset local UI states managed by other hooks
            setShowGameEndPopup(false);
            setGameEndDetails(null);
            setWhiteTime(initialTime);
            setBlackTime(initialTime);
            // GameArchived state should be handled by the lifecycle hook reacting to DB changes

            console.log("Rematch: Successfully updated Firebase for rematch.");

        } catch (error) {
            console.error('Error starting rematch:', error);
        }
    }, [gameId, gameState, setShowGameEndPopup, setGameEndDetails, setWhiteTime, setBlackTime]);

    // Listener for incoming rematch requests
    useEffect(() => {
        if (!gameId || !user) return;

        const notificationsRef = ref(database, `games/${gameId}/notifications`);
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            const notifications = snapshot.val();
            if (!notifications) return;

            Object.entries(notifications).forEach(([key, notification]) => {
                if (notification?.type === 'rematch_request' && notification.from !== user.uid) {
                    setRematchRequestFrom({
                        uid: notification.from,
                        name: notification.fromName || 'Opponent' // Fallback name
                    });
                    setShowRematchRequest(true);
                    // Remove the notification after processing to avoid re-triggering
                    update(ref(database, `games/${gameId}/notifications/${key}`), null);
                }
            });
        });

        return () => unsubscribe();
    }, [gameId, user]);

    // Function called when the user accepts an incoming rematch request
    const handleAcceptRematch = () => {
        setShowRematchRequest(false);
        setRematchRequestFrom(null);
        handleRematch(); // Trigger the game state reset
    };

    // Function to *send* a rematch request (could be called from GameEndPopup)
    const sendRematchRequest = useCallback(async () => {
        if (!gameId || !user || !gameState) return;

        const notification = {
            type: 'rematch_request',
            from: user.uid,
            fromName: user.displayName || user.email, // Use display name or email
            timestamp: Date.now()
        };
        const notificationRef = ref(database, `games/${gameId}/notifications`);
        const newNotificationRef = push(notificationRef); // Use push for unique key
        try {
            await set(newNotificationRef, notification);
            console.log("Rematch request sent.");
            // Optionally close the popup or show a waiting message here
        } catch (error) {
            console.error("Error sending rematch request:", error);
        }
    }, [gameId, user, gameState]);


    return {
        showRematchRequest,
        setShowRematchRequest,
        rematchRequestFrom,
        handleAcceptRematch,
        handleRematch, // Expose the main rematch logic if needed elsewhere (e.g., initiator)
        sendRematchRequest // Expose function to send request
    };
}; 