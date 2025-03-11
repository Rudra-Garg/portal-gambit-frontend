import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { ref, update, onValue, push, serverTimestamp } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { PortalChess } from './CustomChessEngine';
import Peer from 'peerjs';
import './PortalChessGame.css';

const PortalChessGame = ({ gameId }) => {
    const navigate = useNavigate();
    const [game, setGame] = useState(() => new PortalChess());
    const [portalMode, setPortalMode] = useState(false);
    const [portalStart, setPortalStart] = useState(null);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const { user } = useAuth();
    const [gameState, setGameState] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // Voice chat states
    const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
    const [isMutyed, setIsMuted] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [boardWidth, setBoardWidth] = useState(400);

    // Refs for voice chat
    const peerRef = useRef(null);
    const connectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteAudioRef = useRef(null);

    const [lostPieces, setLostPieces] = useState({
        white: [],
        black: [],
    });

    const [player1Name, setPlayer1Name] = useState("Player 1"); // Default name
    const [player2Name, setPlayer2Name] = useState("Player 2"); // Default name
    //for board::
    useEffect(() => {
        const handleResize = () => {
            const container = document.getElementById('board-container');
            if (container) {
                const availableHeight = window.innerHeight - 200;
                const availableWidth = container.clientWidth;
                const size = Math.min(availableHeight, availableWidth);
                setBoardWidth(size);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!gameId) return;

        const gameRef = ref(database, `games/${gameId}`);
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameState(data);

                // Set player names from gameState, using default names if not available
                setPlayer1Name(data.white_player_name || "Player 1");
                setPlayer2Name(data.black_player_name || "Player 2");

                try {
                    const newGame = new PortalChess();

                    if (typeof data.fen === 'string') {
                        newGame.load(data.fen);
                    }

                    newGame.portals = data.portals || {};
                    newGame._turn = data.current_turn === 'white' ? 'w' : 'b';

                    setGame(newGame);
                    updateMoveHistory();

                    // Update local lostPieces from database
                    if (data.lostPieces) {
                        setLostPieces(data.lostPieces);
                    }
                    updateLostPieces();

                } catch (error) {
                    console.error('Error initializing chess game:', error);
                }
            }
        });

        return () => unsubscribe();
    }, [gameId]);

    useEffect(() => {
        if (!gameId) return;

        const chatRef = ref(database, `games/${gameId}/chat`);
        const unsubscribe = onValue(chatRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const messagesArray = Object.entries(data)
                    .map(([id, message]) => ({
                        id,
                        ...message,
                    }))
                    .sort((a, b) => a.timestamp - b.timestamp);

                setChatMessages(messagesArray);
            }
        });

        return () => unsubscribe();
    }, [gameId]);

    useEffect(() => {
        if (!gameId || !user || !voiceChatEnabled) return;

        const voiceChatRef = ref(database, `games/${gameId}/voiceChat`);
        const unsubscribe = onValue(voiceChatRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const amIWhitePlayer = gameState?.white_player === user.uid;
            const myRole = amIWhitePlayer ? 'white' : 'black';
            const opponentRole = amIWhitePlayer ? 'black' : 'white';

            if (data[myRole] && !data[opponentRole]) {
                setConnectionStatus('waiting');
                return;
            }

            if (data[myRole] && data[opponentRole] && connectionRef.current === null) {
                if (myRole === 'white') {
                    connectToPeer(data[opponentRole]);
                }
            }
        });

        return () => unsubscribe();
    }, [gameId, user, voiceChatEnabled, gameState]);

    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }

            if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
            }

            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, []);

    const isMyTurn = () => {
        if (!gameState || !user) return false;
        const myColor =
            gameState.white_player === user.uid
                ? 'white'
                : gameState.black_player === user.uid
                    ? 'black'
                    : null;
        return myColor === gameState.current_turn;
    };

    const makeMove = useCallback(
        (sourceSquare, targetSquare) => {
            if (!isMyTurn()) return false;

            try {
                const newGame = new PortalChess(game.fen());
                newGame.portals = { ...game.portals };

                const moves = newGame.moves({ square: sourceSquare, verbose: true });

                const portalMove = moves.find(
                    (move) => move.portal && move.to === targetSquare
                );

                let move;
                if (portalMove) {
                    move = newGame.move({
                        from: sourceSquare,
                        to: targetSquare,
                        via: portalMove.via,
                        portal: true,
                    });
                } else {
                    move = newGame.move({
                        from: sourceSquare,
                        to: targetSquare,
                        promotion: 'q',
                    });
                }

                if (move) {
                    const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';

                    const capturingPlayer = gameState.white_player === user.uid ? 'white' : 'black';
                    const capturedPlayer = gameState.black_player === user.uid ? 'white' : 'black';
                    console.log("IN MOve white: ", gameState.white_player, " ", user.uid);
                    console.log("IN MOve black: ", gameState.black_player, " ", user.uid);
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
                        portal: move.portal || false,
                    };

                    // Call updateLostPieces with move and capturingPlayer to correctly determine piece updates
                    const updatedLostPieces = updateLostPieces(cleanMove, capturingPlayer);

                    update(ref(database, `games/${gameId}`), {
                        fen: newGame.fen(),
                        portals: newGame.portals,
                        current_turn: newTurn,
                        lastMoveTime: Date.now(),
                        lastMove: cleanMove,
                        lostPieces: updatedLostPieces, // Update database with updated lostPieces
                    });

                    setGame(newGame);
                    updateMoveHistory();
                    console.log("Clean move:", cleanMove.captured);

                    // No need to call setLostPieces directly here. The Firebase listener will update the state.

                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error making move:', error);
                return false;
            }
        },
        [game, gameState, gameId, isMyTurn]
    );

    useEffect(() => {
        if (gameState) {
            updateMoveHistory();
        }
    }, [gameState]);

    const handleSquareClick = (square) => {
        console.log('Square clicked:', square);
        console.log('Portal mode:', portalMode);
        console.log('Selected square:', selectedSquare);

        if (!portalMode) {
            if (!selectedSquare) {
                const piece = game.get(square);
                console.log('Piece at clicked square:', piece);
                if (piece && piece.color === game.turn()) {
                    console.log('Valid piece selected, calculating moves');
                    const availableMoves = game.moves({ square, verbose: true });
                    console.log('Available moves:', availableMoves);
                    setSelectedSquare(square);
                }
            } else {
                console.log('Attempting move from', selectedSquare, 'to', square);
                makeMove(selectedSquare, square);
                setSelectedSquare(null);
            }
        } else {
            console.log('Portal placement - Start:', portalStart, 'Current:', square);
            if (!portalStart) {
                setPortalStart(square);
            } else {
                try {
                    console.log('Placing portal pair:', portalStart, square);
                    const newGame = new PortalChess(game.fen());
                    newGame.portals = { ...game.portals };
                    newGame.placePair(portalStart, square);
                    console.log('New portal configuration:', newGame.portals);

                    setGame(newGame);
                    setPortalStart(null);
                    setPortalMode(false);

                    const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
                    update(ref(database, `games/${gameId}`), {
                        fen: newGame.fen(),
                        portals: newGame.portals,
                        current_turn: newTurn,
                        lastMoveTime: Date.now(),
                    });
                } catch (error) {
                    console.error('Portal placement error:', error);
                    alert('Maximum number of portals (3) reached!');
                    setPortalStart(null);
                    setPortalMode(false);
                }
            }
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !gameId) return;

        const chatRef = ref(database, `games/${gameId}/chat`);
        push(chatRef, {
            text: newMessage.trim(),
            sender: user.uid,
            senderName: user.displayName || user.email,
            timestamp: serverTimestamp(),
        });

        setNewMessage('');
    };

    // Voice chat functions
    const toggleVoiceChat = async () => {
        if (voiceChatEnabled) {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }

            if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
            }

            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }

            const amIWhitePlayer = gameState?.white_player === user.uid;
            const myRole = amIWhitePlayer ? 'white' : 'black';

            const updates = {};
            updates[`games/${gameId}/voiceChat/${myRole}`] = null;
            update(ref(database), updates);

            setVoiceChatEnabled(false);
            setConnectionStatus('disconnected');
        } else {
            setIsConnecting(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;

                const peer = new Peer();
                peerRef.current = peer;

                peer.on('open', (id) => {
                    console.log('My peer ID is:', id);

                    const amIWhitePlayer = gameState?.white_player === user.uid;
                    const myRole = amIWhitePlayer ? 'white' : 'black';

                    const updates = {};
                    updates[`games/${gameId}/voiceChat/${myRole}`] = id;
                    update(ref(database), updates);

                    setVoiceChatEnabled(true);
                    setConnectionStatus('waiting');
                });

                peer.on('call', (call) => {
                    call.answer(localStreamRef.current);

                    call.on('stream', (remoteStream) => {
                        if (remoteAudioRef.current) {
                            remoteAudioRef.current.srcObject = remoteStream;
                            remoteAudioRef.current.play().catch((e) => console.error('Error playing audio:', e));
                        }
                        setConnectionStatus('connected');
                    });

                    connectionRef.current = call;
                });

                peer.on('error', (err) => {
                    console.error('Peer error:', err);
                    setConnectionStatus('error');
                    setIsConnecting(false);
                });
            } catch (error) {
                console.error('Error accessing microphone:', error);
                setConnectionStatus('error');
                setIsConnecting(false);
            }
        }
    };

    const connectToPeer = (peerId) => {
        if (!peerRef.current || !localStreamRef.current) return;

        setConnectionStatus('connecting');

        const call = peerRef.current.call(peerId, localStreamRef.current);

        call.on('stream', (remoteStream) => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                remoteAudioRef.current.play().catch((e) => console.error('Error playing audio:', e));
            }
            setConnectionStatus('connected');
        });

        call.on('error', (err) => {
            console.error('Call error:', err);
            setConnectionStatus('error');
        });

        connectionRef.current = call;
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            audioTracks.forEach((track) => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const customSquareStyles = {
        ...Object.keys(game.portals).reduce((acc, square) => ({
            ...acc,
            [square]: {
                background: 'radial-gradient(circle, #2196f3 0%, transparent 70%)',
                borderRadius: '50%',
            },
        }), {}),
        ...(portalStart
            ? {
                [portalStart]: {
                    background: 'radial-gradient(circle, #4CAF50 0%, transparent 70%)',
                    borderRadius: '50%',
                },
            }
            : {}),
        ...(selectedSquare
            ? {
                [selectedSquare]: {
                    backgroundColor: 'rgba(255, 255, 0, 0.5)',
                },
                ...game
                    .moves({ square: selectedSquare, verbose: true })
                    .reduce((acc, move) => {
                        console.log('Move object:', move);
                        return {
                            ...acc,
                            [move.to]: {
                                background: move.portal
                                    ? move.captured
                                        ? 'radial-gradient(circle, transparent 35%, rgba(33, 150, 243, 0.4) 36%, rgba(33, 150, 243, 0.4) 45%, transparent 46%)'
                                        : 'radial-gradient(circle, rgba(33, 150, 243, 0.4) 0%, rgba(33, 150, 243, 0.4) 30%, transparent 31%)'
                                    : move.captured
                                        ? 'radial-gradient(circle, transparent 35%, rgba(0, 255, 0, 0.4) 36%, rgba(0, 255, 0, 0.4) 45%, transparent 46%)'
                                        : 'radial-gradient(circle, rgba(0, 255, 0, 0.4) 0%, rgba(0, 255, 0, 0.4) 30%, transparent 31%)',
                            },
                        };
                    }, {}),
            }
            : {}),
    };

    const [moveHistory, setMoveHistory] = useState([]);

    const updateLostPieces = (move, capturingPlayer) => {
        // If move is undefined, return the current lostPieces to preserve data integrity
        if (!move) {
            return lostPieces;
        }

        // Create a deep copy of the current state to modify and return
        const updatedLostPieces = {
            white: Array.isArray(lostPieces.white) ? [...lostPieces.white] : [],
            black: Array.isArray(lostPieces.black) ? [...lostPieces.black] : []
        };

        if (move?.captured) {
            const capturedPiece = move.captured;

            if (capturingPlayer === 'white') {
                updatedLostPieces.black.push(capturedPiece);
            } else if (capturingPlayer === 'black') {
                updatedLostPieces.white.push(capturedPiece);
            }
        }

        // Sort the pieces
        updatedLostPieces.white.sort((a, b) => getPieceValue(b) - getPieceValue(a));
        updatedLostPieces.black.sort((a, b) => getPieceValue(b) - getPieceValue(a));

        // Update the state with the new values
        setLostPieces(updatedLostPieces);

        // Return the updated value to be used immediately in Firebase update
        return updatedLostPieces;
    };

    const getPieceValue = (piece) => {
        const values = {
            p: 1,
            n: 3,
            b: 3,
            r: 5,
            q: 9,
            k: 0,
            P: 1,
            N: 3,
            B: 3,
            R: 5,
            Q: 9,
            K: 0,
        };
        return values[piece] || 0;
    };

    // Component state setup
    const moveHistoryRef = useRef([]); // To keep a reference that doesn't trigger re-renders

    // Update the move history function
    const updateMoveHistory = () => {
        if (!gameId) return;

        // Reference to the game in Firebase to watch for lastMove changes
        const gameRef = ref(database, `games/${gameId}`);

        // Set up a persistent listener for the game data
        return onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.lastMove) return;

            // Get the current last move from Firebase
            const lastMove = data.lastMove;

            // Update our ref first to avoid race conditions
            const currentHistory = [...moveHistoryRef.current];

            // Check if this move is already in our history to avoid duplicates
            const moveExists = currentHistory.some((move, index) =>
                move.from === lastMove.from &&
                move.to === lastMove.to &&
                move.piece === lastMove.piece &&
                move.san === lastMove.san && // Additional check using standard algebraic notation
                index === currentHistory.length - 1 // Check if it's the last move (position matters)
            );

            // Only add the move if it doesn't exist in our history
            if (!moveExists) {
                const updatedHistory = [...currentHistory, lastMove];
                moveHistoryRef.current = updatedHistory;
                setMoveHistory(updatedHistory);
                console.log("Added new move to history:", lastMove);

                // Optionally, you could store the full history back to Firebase
                // This would solve the persistence issue but requires additional writes
                // set(ref(database, `games/${gameId}/moveHistory`), updatedHistory);
            }
        });
    };

    // Set up and clean up the listener with useEffect
    useEffect(() => {
        const unsubscribe = updateMoveHistory();

        // Optional: You could load an initial history from Firebase if you're storing it
        const loadInitialHistory = async () => {
            try {
                const historySnapshot = await get(ref(database, `games/${gameId}/moveHistory`));
                if (historySnapshot.exists()) {
                    const historyData = historySnapshot.val();
                    moveHistoryRef.current = historyData;
                    setMoveHistory(historyData);
                }
            } catch (error) {
                console.error("Error loading move history:", error);
            }
        };

        loadInitialHistory();

        // Clean up listener on unmount
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [gameId]);

    const pieceSymbols = {
        p: '♟',
        n: '♞',
        b: '♝',
        r: '♜',
        q: '♛',
        k: '♚',
        P: '♙',
        N: '♘',
        B: '♗',
        R: '♖',
        Q: '♕',
        K: '♔',
    };

    const renderPieceWithCounter = (pieceData) => {
        const count = lostPieces[pieceData.color]?.filter(piece => piece === pieceData.type)?.length || 0;

        return (
            <div key={pieceData.type} className="flex items-center mr-2">
                <span className="text-lg">{pieceSymbols[pieceData.type]}</span>
                {count > 1 && <span className="text-xs font-medium ml-1">x{count}</span>}
            </div>
        );
    };

    const LostPiecesDisplay = ({ pieces = [] }) => {
        // Count occurrences of each piece type
        const lostPiecesCounts = pieces.reduce((acc, piece) => {
            acc[piece] = (acc[piece] || 0) + 1;
            return acc;
        }, {});

        return (
            <div className="flex flex-wrap min-h-[28px] bg-gray-50 rounded-md p-1 w-full">
                {Object.entries(lostPiecesCounts).length > 0 ? (
                    Object.entries(lostPiecesCounts).map(([piece, count]) => (
                        <div key={piece} className="flex items-center mr-2">
                            <span className="text-lg">{pieceSymbols[piece]}</span>
                            {count > 1 && <span className="text-xs font-medium ml-1">x{count}</span>}
                        </div>
                    ))
                ) : (
                    <span className="text-gray-300 text-xs italic px-1">No pieces</span>
                )}
            </div>
        );
    };

    const PlayerInfoPanel = ({ isTopPlayer, playerName, isMyTurn, lostPieces = [] }) => {
        return (
            <div className="bg-white p-1 rounded-lg shadow-md mb-1 flex flex-col border border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mr-2 shadow-inner 
                              flex items-center justify-center text-white font-bold text-xs 
                              ${isMyTurn ? 'ring-2 ring-yellow-400' : ''}`}>
                            {isTopPlayer ? "p2" : "p1"}
                        </div>
                        <div className="font-semibold text-gray-800 text-sm">
                            {playerName}
                        </div>
                        <div className="flex items-center bg-gray-50 px-2 py-0.5 rounded-full ml-2">
                            <div className="mr-1 text-xs text-gray-600 font-medium">0 / 0 / 0</div>
                        </div>
                    </div>
                    <div className="flex items-center bg-gray-50 px-4 py-1 rounded-full">
                        <div className="font-bold text-gray-800 text-xs">00:00</div>
                    </div>
                </div>
                <div className="mt-1 flex items-center">
                    <LostPiecesDisplay pieces={lostPieces} />
                </div>
            </div>
        );
    };

    // Determine if the board is oriented to black for the current user
    const isBlackOrientation = gameState?.black_player === user?.uid;
    const amIWhitePlayer = gameState?.white_player === user?.uid;

    // Helper function to determine the player name based on your role
    const getPlayerName = (isWhitePlayer) => {
        if (isWhitePlayer) {
            return gameState?.white_player === user?.uid
                ? user?.displayName || user?.email || player1Name // My Name if White
                : player1Name; // Opponent's Name (White)
        } else {
            return gameState?.black_player === user?.uid
                ? user?.displayName || user?.email || player2Name // My Name if Black
                : player2Name; // Opponent's Name (Black)
        }
    };

    return (
        <div className="portal-chess-container bg-purple-200 flex flex-col md:flex-row w-full h-screen">
            <div className="w-full md:w-1/2 bg-transparent p-2 flex flex-col h-full max-h-screen overflow-hidden">
                {/* Player 1 (Black if !isBlackOrientation, White if isBlackOrientation) */}
                <PlayerInfoPanel
                    isTopPlayer={true}
                    playerName={amIWhitePlayer ? getPlayerName(false) : getPlayerName(true)}
                    isMyTurn={gameState?.current_turn === (amIWhitePlayer ? 'black' : 'white')}
                    lostPieces={!amIWhitePlayer ? lostPieces.black : lostPieces.white}
                />

                {/* Chessboard */}
                <div
                    className="flex-grow bg-transparent flex items-center justify-center mb-1 overflow-hidden"
                    id="board-container"
                >
                    <div
                        className="board-container"
                        style={{
                            width: boardWidth,
                            maxWidth: '100%',
                            maxHeight: 'calc(100vh - 200px)',
                        }}
                    >
                        <Chessboard
                            position={game.fen()}
                            onPieceDrop={(source, target) => makeMove(source, target)}
                            onSquareClick={handleSquareClick}
                            boardOrientation={gameState?.black_player === user?.uid ? 'black' : 'white'}
                            arePiecesDraggable={isMyTurn()}
                            customBoardStyle={{
                                borderRadius: '4px',
                                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                            }}
                            customSquareStyles={customSquareStyles}
                            customDarkSquareStyle={{ backgroundColor: '#b0b6d8' }}
                            customLightSquareStyle={{ backgroundColor: '#e6e9f5' }}
                        />
                    </div>
                </div>

                {/* Player 2 (White if !isBlackOrientation, Black if isBlackOrientation) */}
                <PlayerInfoPanel
                    isTopPlayer={false}
                    playerName={amIWhitePlayer ? getPlayerName(true) : getPlayerName(false)}
                    isMyTurn={gameState?.current_turn === (amIWhitePlayer ? 'white' : 'black')}
                    lostPieces={!amIWhitePlayer ? lostPieces.white : lostPieces.black}
                />
            </div>

            {/* Right side - Game log and controls */}
            <div className="w-full md:w-1/2 bg-transparent p-2 flex flex-col h-full">
                {/* game history */}
                <div
                    className="bg-gradient-to-b from-gray-50 to-gray-100 flex-grow mb-2 rounded-lg border border-gray-200 shadow-inner flex flex-col"
                    style={{ maxHeight: '471.48px' }}
                >
                    {/* Header with date and user info */}
                    <div className="flex justify-between items-center p-2 border-b border-gray-200 flex-shrink-0">
                        <div className="text-xs text-center text-gray-500 w-full">
                            2025-03-02 10:03:20 UTC
                        </div>
                    </div>

                    {/* Move history section with scrolling */}
                    {/* Move history section with scrolling */}
                    <div
                        className="overflow-y-auto p-3 flex-grow rounded-md border border-gray-200 shadow-inner bg-gray-50"
                        style={{ minHeight: '200px', maxHeight: '400px' }}
                    >
                        {moveHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 italic text-sm gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>No moves yet. Game will start soon.</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Game start indicator */}
                                <div className="flex justify-center mb-3">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-4 py-1 text-xs font-medium shadow-sm">
                                        Game started
                                    </div>
                                </div>

                                {/* Actual move history */}
                                <div className="grid grid-cols-1 gap-2">
                                    {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, turnIndex) => {
                                        const whiteIndex = turnIndex * 2;
                                        const blackIndex = whiteIndex + 1;
                                        const whiteMove = moveHistory[whiteIndex];
                                        const blackMove = blackIndex < moveHistory.length ? moveHistory[blackIndex] : null;

                                        return (
                                            <div key={turnIndex} className="flex flex-col sm:flex-row gap-1">
                                                {/* Move number */}
                                                <div className="w-10 text-xs font-semibold text-gray-500 flex items-center justify-center rounded-md bg-gray-100 shadow-sm">
                                                    {turnIndex + 1}
                                                </div>

                                                {/* Moves container */}
                                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                    {/* White's move */}
                                                    {whiteMove && (
                                                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm transition-all hover:shadow-md">
                                                            <div className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                                                            <div className="text-blue-800 text-sm font-medium">
                                                                {whiteMove.piece.toUpperCase() + whiteMove.from + whiteMove.to}
                                                                {whiteMove.captured && (
                                                                    <span className="font-bold text-red-600 ml-1 inline-flex items-center">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                        {whiteMove.captured.toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Black's move */}
                                                    {blackMove && (
                                                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 shadow-sm transition-all hover:shadow-md">
                                                            <div className="h-3 w-3 rounded-full bg-purple-500 flex-shrink-0"></div>
                                                            <div className="text-purple-800 text-sm font-medium">
                                                                {blackMove.piece.toUpperCase() + blackMove.from + blackMove.to}
                                                                {blackMove.captured && (
                                                                    <span className="font-bold text-red-600 ml-1 inline-flex items-center">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                        {blackMove.captured.toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer with action buttons */}
                    <div className="p-2 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                        <button
                            onClick={() => setPortalMode(!portalMode)}
                            className={`portal-button ${portalMode ? 'active' : ''
                                } bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center`}
                            disabled={!isMyTurn()}
                        >
                            {portalMode ? 'Cancel Portal' : 'Place Portal'}
                        </button>
                        <button
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center"
                            onClick={() => navigate('/dashboard')}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            Leave Game
                        </button>
                    </div>
                </div>

                {/* chat history */}
                <div className="chat-container">
                    <div className="chat-header">
                        <h3>Game Chat</h3>
                        <div className="voice-chat-controls flex items-center space-x-2">
                            <button
                                onClick={toggleVoiceChat}
                                className={`voice-chat-toggle px-3 py-1.5 rounded-md text-sm font-medium transition-all ${voiceChatEnabled
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                    } ${connectionStatus === 'connecting' ? 'opacity-75 cursor-wait' : ''}`}
                                disabled={connectionStatus === 'connecting'}
                            >
                                {connectionStatus === 'connecting' ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connecting...
                                    </span>
                                ) : voiceChatEnabled ? 'Disable Voice' : 'Enable Voice'}
                            </button>

                            {voiceChatEnabled && (
                                <button
                                    onClick={toggleMute}
                                    className={`mute-button px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isMuted
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                        }`}
                                    disabled={connectionStatus !== 'connected'}
                                >
                                    <span className="flex items-center">
                                        {isMuted ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                                </svg>
                                                Unmute
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                </svg>
                                                Mute
                                            </>
                                        )}
                                    </span>
                                </button>
                            )}

                            {voiceChatEnabled && (
                                <div className={`connection-status px-2.5 py-1 rounded-full text-xs font-medium ${connectionStatus === 'disconnected' ? 'bg-gray-200 text-gray-800' :
                                    connectionStatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                        connectionStatus === 'connecting' ? 'bg-blue-100 text-blue-800' :
                                            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                    }`}>
                                    <span className="flex items-center">
                                        <span className={`h-2 w-2 rounded-full mr-1.5 ${connectionStatus === 'disconnected' ? 'bg-gray-500' :
                                            connectionStatus === 'waiting' ? 'bg-yellow-500' :
                                                connectionStatus === 'connecting' ? 'bg-blue-500 animate-pulse' :
                                                    connectionStatus === 'connected' ? 'bg-green-500' :
                                                        'bg-red-500'
                                            }`}></span>
                                        {connectionStatus === 'disconnected' && 'Disconnected'}
                                        {connectionStatus === 'waiting' && 'Waiting for opponent...'}
                                        {connectionStatus === 'connecting' && 'Connecting...'}
                                        {connectionStatus === 'connected' && 'Connected'}
                                        {connectionStatus === 'error' && 'Connection Error'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="chat-messages">
                        {chatMessages.length === 0 ? (
                            <div className="empty-chat-message">No messages yet. Start the conversation!</div>
                        ) : (
                            chatMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`chat-message ${message.sender === user?.uid ? 'my-message' : 'other-message'}`}
                                >
                                    <div className="message-sender">{message.senderName}</div>
                                    <div className="message-text">{message.text}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <form onSubmit={sendMessage} className="chat-input-form">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="chat-input"
                        />
                        <button type="submit" className="chat-send-button">
                            Send
                        </button>
                    </form>

                    <audio ref={remoteAudioRef} autoPlay playsInline hidden />
                </div>
            </div>
        </div>
    );
};

export default PortalChessGame;