import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PlayerInfo from './components/PlayerInfo';
import ChessboardWrapper from './components/ChessboardWrapper';
import GameHistory from './components/GameHistory';
import ChatComponent from './components/ChatComponent';
import { useLostPieces } from './hooks/useLostPieces';
import { PortalChess } from './CustomChessEngine';
import { useChat } from './hooks/useChat';
import { useVoiceChat } from './hooks/useVoiceChat';
import { useMoveHistory } from './hooks/useMoveHistory';
import './PortalChessGame.css';
import GameEndPopup from './GameEndPopup';
import Modal from '../common/Modal';
import { useGameId } from './hooks/useGameId';
import { useServerTime } from './hooks/useServerTime';
import { useArchiving } from './hooks/useArchiving';
import { useGameLifecycle } from './hooks/useGameLifecycle';
import { useGameState } from './hooks/useGameState';
import { useGameTimer } from './hooks/useGameTimer';
import { useGameActions } from './hooks/useGameActions';
import { useRematch } from './hooks/useRematch';

const PortalChessGame = () => {
    const { user } = useAuth();

    // --- Setup Hooks ---
    const { gameId, activeGame, setActiveGame } = useGameId();
    const { getServerTime } = useServerTime();

    // --- Archiving Hook (Manages central archiving logic and state) ---
    const { initiateArchiving, isArchivingLocally, isGameArchived } = useArchiving(gameId);

    // --- Lifecycle Hook (Handles exiting, end popup state) ---
    // Needs initiateArchiving now, provides setters for popup
    const [showGameEndPopup, setShowGameEndPopup] = useState(false); // State still needed here for popup
    const [gameEndDetails, setGameEndDetails] = useState(null); // State still needed here for popup
    const { exitGame } = useGameLifecycle(
        gameId,
        user,
        activeGame,
        setActiveGame,
        initiateArchiving, // Pass initiateArchiving
        setGameEndDetails, // Pass setter
        setShowGameEndPopup, // Pass setter
        isGameArchived,    // Pass archive status
        isArchivingLocally // Pass local archiving status
    );

    // --- State for Temporary Archived Banner ---
    const [showArchivedBanner, setShowArchivedBanner] = useState(false);

    // Effect to show the archived banner temporarily
    useEffect(() => {
        let timerId;
        if (isGameArchived) {
            setShowArchivedBanner(true);
            timerId = setTimeout(() => {
                setShowArchivedBanner(false);
            }, 5000); // 5 seconds
        } else {
            // If isGameArchived becomes false (e.g., during rematch setup),
            // immediately hide the banner
            setShowArchivedBanner(false);
        }

        // Cleanup function to clear the timer
        return () => {
            if (timerId) {
                clearTimeout(timerId);
            }
        };
    }, [isGameArchived]); // Run only when isGameArchived changes

    // --- Game State & Dependent Hooks ---
    // 1. Lost Pieces Hook (Needs a game object, initialize with default)
    //    We'll update it based on the actual game object via useEffect below.
    const [lostPieces, updateLostPieces] = useLostPieces(new PortalChess());

    // 2. Game State Hook (Manages game and gameState from Firebase)
    //    Now only needs popup setters.
    const { game, setGame, gameState } = useGameState(
        gameId,
        setGameEndDetails,
        setShowGameEndPopup
    );

    // 3. Effect to sync Lost Pieces with Game State
    useEffect(() => {
        if (game && updateLostPieces) {
            updateLostPieces(game);
        }
        // Add game.fen() to dependencies if game object identity might not change reliably
        // This ensures updateLostPieces runs even if the game object instance is the same
        // but its internal state (FEN) has changed. For rematch, the instance *should*
        // change because useGameState calls `setGame(new PortalChess(...))`.
    }, [game, updateLostPieces]);

    // Other dependent hooks
    const moveHistory = useMoveHistory(gameId);
    const { chatMessages, newMessage, setNewMessage, sendMessage } = useChat(gameId, user);
    const { voiceChatEnabled, isMuted, isConnecting, connectionStatus, remoteAudioRef, toggleVoiceChat, toggleMute } = useVoiceChat(gameId, gameState, user);

    // Utility functions (derived state)
    const areBothPlayersJoined = useCallback(() => {
        return !!(gameState?.white_player && gameState?.black_player);
    }, [gameState]);

    const isMyTurn = useCallback(() => {
        if (!gameState || !user || !areBothPlayersJoined()) return false;
        const myColor = gameState.white_player === user.uid ? 'white' :
            gameState.black_player === user.uid ? 'black' : null;
        // Also check game status - cannot be turn if finished/archiving/archived
        return myColor === gameState.current_turn && 
               gameState.status === 'active' && 
               !isGameArchived && 
               !isArchivingLocally;
    }, [gameState, user, areBothPlayersJoined, isGameArchived, isArchivingLocally]);

    // --- Game Timer Hook ---
    // Needs initiateArchiving and archive status
    const { whiteTime, blackTime, setWhiteTime, setBlackTime } = useGameTimer(
        gameId,
        gameState,
        getServerTime,
        areBothPlayersJoined,
        initiateArchiving, // Pass initiateArchiving
        setGameEndDetails, // Pass setter
        setShowGameEndPopup, // Pass setter
        isGameArchived,    // Pass archive status
        isArchivingLocally // Pass local archiving status
    );

    // --- Game Actions Hook ---
    // Pass the correct updateLostPieces
    const {
        makeMove,
        handleSquareClick,
        portalMode,
        setPortalMode,
        portalStart,
        selectedSquare,
    } = useGameActions(
        game, // Pass the game object from useGameState
        setGame,
        gameState,
        user,
        gameId,
        moveHistory,
        getServerTime,
        updateLostPieces, // Pass the function from useLostPieces
        initiateArchiving,
        isGameArchived,
        isArchivingLocally,
        isMyTurn,
        areBothPlayersJoined,
        whiteTime,
        blackTime,
        setGameEndDetails,
        setShowGameEndPopup
    );

    // --- Rematch Hook ---
    // No changes needed here, only depends on game state and timer setters
    const {
        showRematchRequest,
        setShowRematchRequest,
        rematchRequestFrom,
        handleAcceptRematch,
        sendRematchRequest
    } = useRematch(
        gameId,
        user,
        gameState,
        setShowGameEndPopup,
        setGameEndDetails,
        setWhiteTime,
        setBlackTime
    );

    // --- Derived State for UI ---
    const amIWhitePlayer = gameState?.white_player === user?.uid;
    const whitePlayerName = gameState?.white_player_name || "White Player";
    const blackPlayerName = gameState?.black_player_name || "Black Player";
    const topPlayerColor = amIWhitePlayer ? 'black' : 'white';
    const bottomPlayerColor = amIWhitePlayer ? 'white' : 'black';

    // --- Render Logic ---
    // Add checks for isGameArchived or isArchivingLocally if needed to disable UI elements
    return (
        <div className="portal-chess-container bg-gradient-to-bl from-indigo-500/70 to-blue-600/70 flex flex-col md:flex-row w-full h-screen">
            {/* Archiving status - Increase z-index */}
            {(isArchivingLocally || gameState?.status === 'archiving') && (
                <div className="absolute top-0 left-0 w-full bg-yellow-500 text-black text-center p-1 z-[1100]">
                    Archiving game...
                </div>
            )}
            {/* Archived status - Increase z-index */}
            {showArchivedBanner && (
                 <div className="absolute top-0 left-0 w-full bg-gray-500 text-white text-center p-1 z-[1100]">
                     Game archived.
                 </div>
             )}

            <div className="w-full md:w-1/2 bg-transparent p-2 flex flex-col h-full max-h-screen overflow-hidden">
                <PlayerInfo
                    isTopPlayer={true}
                    playerNumber={2}
                    playerName={amIWhitePlayer ? blackPlayerName : whitePlayerName}
                    isMyTurn={isMyTurn}
                    lostPieces={lostPieces}
                    playerColor={topPlayerColor}
                    timeRemaining={amIWhitePlayer ? blackTime : whiteTime}
                />
                <ChessboardWrapper
                    game={game}
                    makeMove={makeMove}
                    handleSquareClick={handleSquareClick}
                    gameState={gameState}
                    user={user}
                    isMyTurn={isMyTurn}
                    portalMode={portalMode}
                    portalStart={portalStart}
                    selectedSquare={selectedSquare}
                />
                <PlayerInfo
                    isTopPlayer={false}
                    playerNumber={1}
                    playerName={amIWhitePlayer ? whitePlayerName : blackPlayerName}
                    isMyTurn={isMyTurn}
                    lostPieces={lostPieces}
                    playerColor={bottomPlayerColor}
                    timeRemaining={amIWhitePlayer ? whiteTime : blackTime}
                />
            </div>
            <div className="w-full md:w-1/2 bg-transparent p-2 flex flex-col h-full">
                <GameHistory
                    moveHistory={moveHistory}
                    portalMode={portalMode}
                    setPortalMode={setPortalMode}
                    isMyTurn={isMyTurn}
                    exit={exitGame}
                />
                <ChatComponent
                    chatMessages={chatMessages}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    sendMessage={sendMessage}
                    voiceChatEnabled={voiceChatEnabled}
                    isConnecting={isConnecting}
                    toggleVoiceChat={toggleVoiceChat}
                    isMuted={isMuted}
                    toggleMute={toggleMute}
                    connectionStatus={connectionStatus}
                    user={user}
                    remoteAudioRef={remoteAudioRef}
                />
            </div>
            {showGameEndPopup && gameEndDetails && (
                <GameEndPopup
                    winner={gameEndDetails.winner}
                    reason={gameEndDetails.reason}
                    onClose={() => {
                        setShowGameEndPopup(false);
                    }}
                    onRematch={sendRematchRequest}
                    onExit={exitGame}
                    gameId={gameId}
                    disableRematch={isArchivingLocally || gameState?.status === 'archiving'}
                />
            )}
            {showRematchRequest && rematchRequestFrom && (
                <Modal
                    isOpen={showRematchRequest}
                    onClose={() => setShowRematchRequest(false)}
                    title="Rematch Request"
                >
                    <div className="p-4">
                        <p className="mb-4">{rematchRequestFrom.name} wants a rematch!</p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowRematchRequest(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAcceptRematch}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PortalChessGame;
