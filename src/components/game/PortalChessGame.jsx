import { useCallback, useEffect, useState } from 'react';
import { get, onValue, ref, remove, runTransaction, update, push, set } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { PortalChess } from './CustomChessEngine';
import PlayerInfo from './components/PlayerInfo';
import ChessboardWrapper from './components/ChessboardWrapper';
import GameHistory from './components/GameHistory';
import ChatComponent from './components/ChatComponent';
import { useLostPieces } from './hooks/useLostPieces';
import { useChat } from './hooks/useChat';
import { useVoiceChat } from './hooks/useVoiceChat';
import { useMoveHistory } from './hooks/useMoveHistory';
import './PortalChessGame.css';
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import GameEndPopup from './GameEndPopup';
import { BACKEND_URL } from '../../config.js';
import Modal from '../common/Modal';

const PortalChessGame = () => {
    // Initial state declarations with useState hooks
    const [game, setGame] = useState(() => new PortalChess()); // Manages chess game state
    const [portalMode, setPortalMode] = useState(false);       // Controls portal placement mode
    const [portalStart, setPortalStart] = useState(null);      // Stores starting point of portal
    const [selectedSquare, setSelectedSquare] = useState(null); // Tracks selected chess square
    const { user } = useAuth();
    const [gameState, setGameState] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [activeGame, setActiveGame] = useState(null);
    const [whiteTime, setWhiteTime] = useState(null);
    const [blackTime, setBlackTime] = useState(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showGameEndPopup, setShowGameEndPopup] = useState(false);
    const [gameEndDetails, setGameEndDetails] = useState(null);
    // Add these new state variables for rematch functionality
    const [showRematchRequest, setShowRematchRequest] = useState(false);
    const [rematchRequestFrom, setRematchRequestFrom] = useState(null);

    const [serverTimeOffset, setServerTimeOffset] = useState(0);
    useEffect(() => {
        const offsetRef = ref(database, '.info/serverTimeOffset');
        const unsubscribe = onValue(offsetRef, (snapshot) => {
            const offset = snapshot.val() || 0;
            setServerTimeOffset(offset);
        });

        return () => unsubscribe();
    }, []);

    const getServerTime = () => Date.now() + serverTimeOffset;

    /**
     * Checks if both players have joined the game
     * @returns {boolean} True if both white and black players are present
     */
    const areBothPlayersJoined = useCallback(() => {
        return gameState?.white_player && gameState?.black_player;
    }, [gameState]);

    const navigate = useNavigate();

    /**
     * Effect hook to extract gameId from URL parameters
     * Runs once when component mounts
     */
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const urlObj = new URL(window.location.href);
                setGameId(urlObj.searchParams.get('gameId'));
                setActiveGame(urlObj.searchParams.get('gameId'))
            } catch (error) {
                console.error("Invalid URL:", error);
                setGameId(null);
            }
        } else {
            setGameId(null);
        }
    }, [setGameId]);

    /**
     * Handles player exit from game
     * Updates database by removing player and cleaning up game if both players leave
     */
    const [gameArchived, setGameArchived] = useState(false);
    const exitGame = async () => {
        if (activeGame) {
            try {
                const gameSnapshot = await get(ref(database, `games/${activeGame}`));
                const gameData = gameSnapshot.val();

                if (!gameData) {
                    console.error('Game not found');
                    setActiveGame(null);
                    navigate("/profile");
                    return;
                }

                // Check if game was active and should be archived as abandoned
                if (gameData && gameData.status === 'active') {
                    // Determine winner based on who's leaving
                    const isWhiteLeaving = gameData.white_player === user.uid;
                    const isBlackLeaving = gameData.black_player === user.uid;

                    const gameDetails = {
                        winner: isWhiteLeaving ? 'black' : 'white',
                        reason: 'abandoned'
                    };
                    setGameEndDetails(gameDetails);
                    setShowGameEndPopup(true);
                    // Use transaction for status update first
                    const gameStatusRef = ref(database, `games/${activeGame}/status`);
                    await runTransaction(gameStatusRef, (currentStatus) => {
                        if (currentStatus === 'finished') {
                            return currentStatus;
                        }
                        return 'finished';
                    });

                    // Then update other game end details
                    await update(ref(database, `games/${activeGame}`), {
                        winner: gameDetails.winner,
                        reason: 'abandoned'
                    });

                    // Archive the abandoned game
                    const uniqueArchiveId = uuidv4();
                    await archiveGame(uniqueArchiveId, gameDetails, gameData);
                    setGameArchived(true);
                    return;
                }

                // Now handle the player leaving using transaction
                const gameRef = ref(database, `games/${activeGame}`);
                await runTransaction(gameRef, (game) => {
                    if (game === null) {
                        return null; // Game was deleted, abort transaction
                    }

                    // Create transaction update
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

                // Check if both players are now gone
                const updatedGameSnapshot = await get(ref(database, `games/${activeGame}`));
                const updatedGameData = updatedGameSnapshot.val();

                if (updatedGameData &&
                    (!updatedGameData.white_player && !updatedGameData.black_player)) {
                    // Both players have left, remove the game
                    await remove(ref(database, `games/${activeGame}`));
                    console.log('Game deleted as both players have left');
                } else {
                    console.log('Player removed from game');
                }

                setActiveGame(null);
                navigate("/profile");
            } catch (error) {
                console.error('Error exiting game:', error);
            }
        } else {
            setActiveGame(null);
        }
    };

    // Custom hooks for managing different aspects of the game
    const moveHistory = useMoveHistory(gameId);        // Tracks game move history
    const [lostPieces, updateLostPieces] = useLostPieces(game); // Manages captured pieces
    const { chatMessages, newMessage, setNewMessage, sendMessage } = useChat(gameId, user); // Chat functionality

    const {
        voiceChatEnabled,
        isMuted,
        isConnecting,
        connectionStatus,
        remoteAudioRef,
        toggleVoiceChat,
        toggleMute
    } = useVoiceChat(gameId, gameState, user);

    /**
     * Effect hook to sync game state with Firebase
     * Updates local game state when database changes
     */
    useEffect(() => {
        if (!gameId) return;

        const gameRef = ref(database, `games/${gameId}`);
        const unsubscribe = onValue(gameRef, async (snapshot) => {
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
                    updateLostPieces(newGame);

                    // Add this new block to handle game end state
                    if (data.status === 'finished' && data.winner && data.reason) {

                        const gameDetails = {
                            winner: data.winner,
                            reason: data.reason
                        };
                        setGameEndDetails(gameDetails);
                        console.log(data);
                        setShowGameEndPopup(true);
                        const uniqueArchiveId = uuidv4();
                        await archiveGame(uniqueArchiveId, gameDetails, data);

                    }

                } catch (error) {
                    console.error('Error initializing chess game:', error);
                }
            }
        });

        return () => unsubscribe();
    }, [gameId, updateLostPieces]);

    /**
     * Checks if it's the current user's turn
     * @returns {boolean} True if it's the current user's turn
     */
    const isMyTurn = useCallback(() => {
        if (!gameState || !user || !areBothPlayersJoined()) return false;
        const myColor = gameState.white_player === user.uid ? 'white' :
            gameState.black_player === user.uid ? 'black' : null;
        return myColor === gameState.current_turn;
    }, [gameState, user, areBothPlayersJoined]);

    /**
     * Synchronizes game time with server
     * Updates time remaining for current player
     */


    /**
     * Effect hook to start time sync interval
     * Runs every 5 seconds to keep time in sync
     */
    const archiveGame = async (archiveId, gameDetails, gameDataToArchive) => {
        try {
            if (!gameDataToArchive) {
                console.error("Cannot archive game: game data provided is null or undefined");
                return;
            }

            if (!gameDataToArchive.white_player || !gameDataToArchive.black_player) {
                console.error("Cannot archive game: missing player information in provided data");
                return;
            }
            const formattedMoves = Array.isArray(moveHistory) // Use local moveHistory state for this
                ? moveHistory.map(move => typeof move === 'string' ? move : move.san || '')
                : [];

            const response = await fetch(`${BACKEND_URL}/history/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    game_id: archiveId, // *** Use the generated UUID for the history entry ID ***
                    firebase_game_ref: gameId,
                    white_player_id: gameDataToArchive.white_player,
                    black_player_id: gameDataToArchive.black_player,
                    start_time: new Date(gameDataToArchive.created_at || Date.now()).toISOString(),
                    end_time: new Date().toISOString(),
                    result: gameDetails.winner === 'white' ? 'white_win' :
                        gameDetails.winner === 'black' ? 'black_win' :
                            gameDetails.winner === 'draw' ? 'draw' : 'abandoned',
                    winner_id: gameDetails.winner === 'white' ? gameDataToArchive.white_player :
                        gameDetails.winner === 'black' ? gameDataToArchive.black_player : null,
                    moves: formattedMoves,
                    initial_position: 'standard',
                    white_rating: gameDataToArchive.white_rating || 1200,
                    black_rating: gameDataToArchive.black_rating || 1200,
                    rating_change: {
                        white: gameDetails.winner === 'white' ? 15 :
                            gameDetails.winner === 'black' ? -15 : 0,
                        black: gameDetails.winner === 'black' ? 15 :
                            gameDetails.winner === 'white' ? -15 : 0
                    },
                    game_type: `${gameDataToArchive.portal_count}`,
                    time_control: {
                        initial: (gameDataToArchive.time_control || 10) * 60,
                        increment: gameDataToArchive.increment || 0
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API error details:', errorData);
                throw new Error(`Failed to archive game: ${response.status} ${response.statusText}`);
            }

            console.log('Game archived successfully');
        } catch (error) {
            console.error('Error archiving game:', error);
        }
    };
    /**
     * Handles chess piece movement
     * Validates moves and updates game state
     * @param {string} sourceSquare Starting position
     * @param {string} targetSquare Ending position
     * @returns {boolean} True if move was successful
     */
    const makeMove = useCallback((sourceSquare, targetSquare) => {
        if (!areBothPlayersJoined()) {
            console.log('Waiting for both players to join');
            return false;
        }
        if (!isMyTurn()) return false;
        if (gameState.current_turn === 'white' && whiteTime <= 0) {
            update(ref(database, `games/${gameId}`), {
                status: 'finished',
                winner: 'black',
                reason: 'timeout'
            });
            return false;
        }
        if (gameState.current_turn === 'black' && blackTime <= 0) {
            update(ref(database, `games/${gameId}`), {
                status: 'finished',
                winner: 'white',
                reason: 'timeout'
            });
            return false;
        }
        try {
            const newGame = new PortalChess(game.fen(), gameState.portal_count);
            newGame.portals = { ...game.portals };

            const moves = newGame.moves({ square: sourceSquare, verbose: true });

            const portalMove = moves.find(move =>
                move.portal &&
                move.to === targetSquare
            );

            let move;
            if (portalMove) {
                move = newGame.move({
                    from: sourceSquare,
                    to: targetSquare,
                    via: portalMove.via,
                    portal: true
                });
            } else {
                move = newGame.move({
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: 'q'
                });
            }

            if (move) {
                const cleanMove = {
                    ...move,
                    captured: move.captured || null,
                    promotion: move.promotion || null,
                    from: move.from,
                    to: move.to,
                    piece: move.piece,
                    color: move.color,
                    flags: move.flags || '',
                    san: move.san || '',
                    via: move.via || null,
                    portal: move.portal || false
                };
                const currentHistory = moveHistory || [];
                const updatedHistory = [...currentHistory, cleanMove];
                const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
                const currentTime = getServerTime();
                const lastMoveTime = gameState.lastMoveTime || currentTime;

                const elapsedSeconds = Math.floor((currentTime - lastMoveTime) / 1000);

                // Add validation for whiteTime and blackTime
                const currentWhiteTime = typeof gameState.whiteTime === 'number' ? gameState.whiteTime : 600; // 10-min
                // fallback
                const currentBlackTime = typeof gameState.blackTime === 'number' ? gameState.blackTime : 600;

                const updatedWhiteTime = gameState.current_turn === 'white'
                    ? Math.max(0, currentWhiteTime - elapsedSeconds)
                    : currentWhiteTime;
                const updatedBlackTime = gameState.current_turn === 'black'
                    ? Math.max(0, currentBlackTime - elapsedSeconds)
                    : currentBlackTime;
                const updates = {
                    fen: newGame.fen(),
                    portals: newGame.portals,
                    current_turn: newTurn,
                    lastMoveTime: currentTime,
                    lastMove: cleanMove,
                    whiteTime: isNaN(updatedWhiteTime) ? currentWhiteTime : updatedWhiteTime,
                    blackTime: isNaN(updatedBlackTime) ? currentBlackTime : updatedBlackTime
                };

                const gameStatus = newGame.isGameOver();
                if (gameStatus.over) {
                    if (gameState.status === 'finished') { // Prevent re-archiving
                        console.log("Game already finished, ignoring end condition");
                        return true;
                    }
                    const gameDetails = {
                        winner: gameStatus.winner,
                        reason: gameStatus.reason
                    };
                    const gameStatusRef = ref(database, `games/${gameId}/status`);

                    // Use a local copy of the game data for archiving *before* potentially stale updates
                    const currentDataForArchive = {
                        ...gameState,
                        fen: newGame.fen(),
                        portals: newGame.portals,
                        lastMove: cleanMove,
                        moveHistory: updatedHistory
                    }; // Add latest move/fen

                    runTransaction(gameStatusRef, (currentStatus) => {
                        if (currentStatus === 'finished') {
                            console.log("Game already finished, ignoring end condition");
                            return currentStatus; // Abort transaction if already finished
                        }
                        return 'finished'; // Set status to finished
                    }).then(async (transactionResult) => {
                        // Only proceed if the transaction committed (i.e., status was not already 'finished')
                        if (transactionResult.committed) {
                            console.log("Game status set to finished via transaction.");
                            // Update the rest of the game end details
                            await update(ref(database, `games/${gameId}`), {
                                ...updates, // Apply all other updates (fen, turn, time, history etc.)
                                winner: gameStatus.winner,
                                reason: gameStatus.reason
                            });

                            setGameEndDetails(gameDetails);
                            setShowGameEndPopup(true);
                            // *** Pass the captured data to archiveGame ***
                            const uniqueArchiveId = uuidv4();
                            await archiveGame(uniqueArchiveId, gameDetails, currentDataForArchive);
                            setGameArchived(true); // You might need this state variable
                        } else {
                            console.log("Game status transaction aborted (already finished).");
                        }
                    }).catch(error => {
                        console.error("Error during game end transaction/update:", error);
                    });

                } else {
                    // Regular move update
                    update(ref(database, `games/${gameId}`), updates);
                }

                setGame(newGame);
                updateLostPieces(newGame);

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error making move:', error);
            return false;
        }
    }, [areBothPlayersJoined, isMyTurn, gameState, whiteTime, blackTime, gameId, game, moveHistory, getServerTime, updateLostPieces, archiveGame]);

    /**
     * Handles square click events on the chessboard
     * Manages both normal moves and portal placement
     * @param {string} square Clicked square coordinate
     */
    const handleSquareClick = useCallback((square) => {
        if (!portalMode) {
            if (!selectedSquare) {
                const piece = game.get(square);
                if (piece && piece.color === game.turn()) {
                    setSelectedSquare(square);
                }
            } else {
                // Check if clicked square is a portal entrance with opponent's piece at exit
                if (game.portals[square]) {
                    const portalExit = game.portals[square].linkedTo;
                    const pieceAtExit = game.get(portalExit);
                    const selectedPiece = game.get(selectedSquare);

                    // If there's an opponent's piece at the exit, try to make a portal capture move
                    if (pieceAtExit && selectedPiece && pieceAtExit.color !== selectedPiece.color) {
                        // Check if this move is valid through the portal
                        const moves = game.moves({ square: selectedSquare, verbose: true });
                        const portalCaptureMove = moves.find(move =>
                            move.portal &&
                            move.to === portalExit &&
                            move.via &&
                            move.via.includes(square)
                        );

                        if (portalCaptureMove) {
                            // Execute capture move through portal
                            makeMove(selectedSquare, portalExit);
                            setSelectedSquare(null);
                            return;
                        }
                    }
                }

                // Regular move logic
                makeMove(selectedSquare, square);
                setSelectedSquare(null);
            }
        } else {
            // Portal mode handling remains unchanged
            if (!portalStart) {
                // Check if square is occupied before setting portal start
                if (game.get(square)) {
                    // Square is occupied, notify user
                    alert("Cannot place portal on an occupied square!");
                    return;
                }
                setPortalStart(square);
            } else {
                // Check if square is occupied before setting portal end
                if (game.get(square)) {
                    // Square is occupied, notify user
                    alert("Cannot place portal on an occupied square!");
                    return;
                }

                // Also check if we're trying to place a portal on top of another portal
                if (game.portals[square] || game.portals[portalStart]) {
                    alert("Cannot place portal on a square that already has a portal!");
                    return;
                }

                try {
                    const newGame = new PortalChess(game.fen(), gameState.portal_count);
                    newGame.portals = { ...game.portals };
                    newGame.placePair(portalStart, square);

                    setGame(newGame);
                    setPortalStart(null);
                    setPortalMode(false);
                    const portalMove = {
                        type: 'portal',
                        from: portalStart,
                        to: square,
                        piece: gameState.current_turn === 'white' ? 'P' : 'p',
                        color: gameState.current_turn,
                        san: `Portal ${portalStart}↔${square}`,
                        portal: true
                    };
                    const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
                    const currentTime = getServerTime();
                    const lastMoveTime = gameState.lastMoveTime || currentTime;
                    // Ensure we're dealing with numbers
                    const elapsedSeconds = Math.floor((currentTime - lastMoveTime) / 1000);

                    // Add validation for whiteTime and blackTime
                    const currentWhiteTime = typeof gameState.whiteTime === 'number' ? gameState.whiteTime : 600; // 10-min
                    // fallback
                    const currentBlackTime = typeof gameState.blackTime === 'number' ? gameState.blackTime : 600;

                    const updatedWhiteTime = gameState.current_turn === 'white'
                        ? Math.max(0, currentWhiteTime - elapsedSeconds)
                        : currentWhiteTime;
                    const updatedBlackTime = gameState.current_turn === 'black'
                        ? Math.max(0, currentBlackTime - elapsedSeconds)
                        : currentBlackTime;

                    update(ref(database, `games/${gameId}`), {
                        fen: newGame.fen(),
                        portals: newGame.portals,
                        current_turn: newTurn,
                        lastMoveTime: currentTime,
                        lastMove: portalMove,
                        whiteTime: isNaN(updatedWhiteTime) ? currentWhiteTime : updatedWhiteTime,
                        blackTime: isNaN(updatedBlackTime) ? currentBlackTime : updatedBlackTime
                    });
                } catch (error) {
                    console.error('Portal placement error:', error);
                    alert(`Maximum number of portals (${gameState.portal_count}) reached!`);
                    setPortalStart(null);
                    setPortalMode(false);
                }
            }
        }
    }, [portalMode, selectedSquare, game, portalStart, gameState, gameId, makeMove, getServerTime]);

    const amIWhitePlayer = gameState?.white_player === user?.uid;

    const whitePlayerName = gameState?.white_player_name || "White Player";
    const blackPlayerName = gameState?.black_player_name || "Black Player";

    const topPlayerColor = amIWhitePlayer ? 'black' : 'white';
    const bottomPlayerColor = amIWhitePlayer ? 'white' : 'black';

    /**
     * Effect hook to manage game timer
     * Updates time remaining and checks for timeout victories
     */
    useEffect(() => {
        if (!gameState || !gameId) return;

        setWhiteTime(gameState.whiteTime);
        setBlackTime(gameState.blackTime);

        let timerInterval;

        if (gameState.status === 'active' && areBothPlayersJoined()) {
            timerInterval = setInterval(async () => {

                const now = getServerTime();
                const lastMoveTime = gameState.lastMoveTime || now;
                const elapsedSeconds = Math.floor((now - lastMoveTime) / 1000);

                if (gameState.current_turn === 'white') {
                    const newWhiteTime = Math.max(0, gameState.whiteTime - elapsedSeconds);
                    setWhiteTime(newWhiteTime); // Update UI

                    if (newWhiteTime <= 0 && gameState.whiteTime > 0 && gameState.status !== 'finished') { // Check status
                        console.log("White timed out.");
                        const gameDetails = { winner: 'black', reason: 'timeout' };
                        const gameStatusRef = ref(database, `games/${gameId}/status`);
                        // *** Capture current data before update ***
                        const currentDataForArchive = { ...gameState, whiteTime: 0 };

                        runTransaction(gameStatusRef, (currentStatus) => {
                            if (currentStatus === 'finished') {
                                // Already finished, don't change
                                return currentStatus;
                            }
                            return 'finished';
                        })
                            .then(async (transactionResult) => {
                                if (transactionResult.committed) {
                                    await update(ref(database, `games/${gameId}`), {
                                        winner: 'black',
                                        reason: 'timeout',
                                        whiteTime: 0
                                    });
                                    setGameEndDetails(gameDetails);
                                    setShowGameEndPopup(true);
                                    // *** Pass captured data ***
                                    const uniqueArchiveId = uuidv4();
                                    await archiveGame(uniqueArchiveId, gameDetails, currentDataForArchive);
                                    setGameArchived(true);
                                }
                            });
                    }
                } else { // Black's turn
                    const newBlackTime = Math.max(0, gameState.blackTime - elapsedSeconds);
                    setBlackTime(newBlackTime); // Update UI

                    if (newBlackTime <= 0 && gameState.blackTime > 0 && gameState.status !== 'finished') { // Check status
                        console.log("Black timed out.");
                        const gameDetails = { winner: 'white', reason: 'timeout' };
                        const gameStatusRef = ref(database, `games/${gameId}/status`);
                        // *** Capture current data before update ***
                        const currentDataForArchive = { ...gameState, blackTime: 0 };

                        runTransaction(gameStatusRef, (currentStatus) => {
                            if (currentStatus === 'finished') {
                                // Already finished, don't change
                                return currentStatus;
                            }
                            return 'finished';
                        })
                            .then(async (transactionResult) => {
                                if (transactionResult.committed) {
                                    await update(ref(database, `games/${gameId}`), {
                                        winner: 'white',
                                        reason: 'timeout',
                                        blackTime: 0
                                    });
                                    setGameEndDetails(gameDetails);
                                    setShowGameEndPopup(true);
                                    // *** Pass captured data ***
                                    const uniqueArchiveId = uuidv4();
                                    await archiveGame(uniqueArchiveId, gameDetails, currentDataForArchive);
                                    setGameArchived(true);
                                }
                            });
                    }
                }
            }, 1000);
        }

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [gameState, gameId, areBothPlayersJoined, getServerTime]);


    // Add this after your other useEffect hooks
    useEffect(() => {
        // Clean up portal start when exiting portal mode
        if (!portalMode) {
            setPortalStart(null);
        }
    }, [portalMode]);

    /**
     * Handles rematch requests
     * Resets game state while keeping players
     */
    const handleRematch = async () => {
        try {
            const initialTime = gameState.time_control * 60;
            const currentTime = Date.now();

            const newGameState = {
                // Keep player info
                white_player: gameState.white_player,
                white_player_name: gameState.white_player_name,
                white_player_email: gameState.white_player_email,
                black_player: gameState.black_player,
                black_player_name: gameState.black_player_name,
                black_player_email: gameState.black_player_email,

                // Reset game state
                status: 'active', // Make sure status is active
                current_turn: 'white',
                whiteTime: initialTime,
                blackTime: initialTime,
                lastMoveTime: currentTime, // Set to now, crucial for detecting new moves

                // *** CRITICAL RESETS FOR HISTORY HOOK ***
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Reset FEN
                lastMove: null, // Set lastMove to null explicitly

                // Other resets
                portals: {},
                portal_count: gameState.portal_count,
                lostPieces: { white: [], black: [] },
                winner: null,
                reason: null
                // No need to manage moveHistory array here
            };

            // Update the entire game node in Firebase
            await update(ref(database, `games/${gameId}`), newGameState);

            // Reset local UI states
            setShowGameEndPopup(false);
            setGameEndDetails(null);
            setWhiteTime(initialTime);
            setBlackTime(initialTime);
            // The useMoveHistory hook will reset itself based on the Firebase update

            console.log("handleRematch: Successfully updated Firebase for rematch.");

        } catch (error) {
            console.error('Error starting rematch:', error);
        }
    };





    // Add notification listener
    useEffect(() => {
        if (!gameId || !user) return;

        const notificationsRef = ref(database, `games/${gameId}/notifications`);
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            const notifications = snapshot.val();
            if (!notifications) return;

            Object.entries(notifications).forEach(([key, notification]) => {
                if (notification.type === 'rematch_request' && notification.from !== user.uid) {
                    setRematchRequestFrom({
                        uid: notification.from,
                        name: notification.fromName
                    });
                    setShowRematchRequest(true);
                    // Remove the notification after processing
                    update(ref(database, `games/${gameId}/notifications/${key}`), null);
                }
            });
        });

        return () => unsubscribe();
    }, [gameId, user]);

    // Handle accepting rematch request
    const handleAcceptRematch = () => {
        setShowRematchRequest(false);
        handleRematch();
    };


    return (
        <div className="portal-chess-container bg-gradient-to-bl from-indigo-500/70 to-blue-600/70 flex flex-col md:flex-row w-full h-screen">
            {/* Game board section */}
            <div className="w-full md:w-1/2 bg-transparent p-2 flex flex-col h-full max-h-screen overflow-hidden">
                <PlayerInfo
                    isTopPlayer={true}
                    playerNumber={2}
                    playerName={amIWhitePlayer ? blackPlayerName : whitePlayerName}
                    isMyTurn={gameState?.current_turn === (amIWhitePlayer ? 'black' : 'white')}
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
                    isMyTurn={gameState?.current_turn === (amIWhitePlayer ? 'white' : 'black')}
                    lostPieces={lostPieces}
                    playerColor={bottomPlayerColor}
                    timeRemaining={amIWhitePlayer ? whiteTime : blackTime}
                />
            </div>

            {/* Sidebar section */}
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
            {/* Game end popup */}
            {showGameEndPopup && gameEndDetails && (
                <GameEndPopup
                    winner={gameEndDetails.winner}
                    reason={gameEndDetails.reason}
                    onClose={() => {
                        setShowGameEndPopup(false);
                    }}
                    onRematch={handleRematch}
                    onExit={exitGame}
                    gameId={gameId}
                />
            )}

            {/* Add Rematch Request Modal */}
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

            {/* Game end popup */}
        </div>
    );
};

export default PortalChessGame;
