import { useState, useCallback, useEffect } from 'react';
import { ref, update, onValue, get, remove } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { PortalChess } from './CustomChessEngine';
import PropTypes from 'prop-types';
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
// import TimeoutPopup from './game/components/TimeoutPopup';
import GameEndPopup from './GameEndPopup';

import {BACKEND_URL} from '../../config.js';


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
  const exitGame = async () => {
    if (activeGame) {
      try {
        const gameSnapshot = await get(ref(database, `games/${activeGame}`));
        const gameData = gameSnapshot.val();

        if (!gameData) {
          console.error('Game not found');
          setActiveGame(null);
          return;
        }

        const updateData = {};

        if (gameData.white_player === user.uid) {
          updateData.white_player = null;
          updateData.white_player_name = null;
          updateData.white_player_email = null;
        } else if (gameData.black_player === user.uid) {
          updateData.black_player = null;
          updateData.black_player_name = null;
          updateData.black_player_email = null;
        }

        const bothPlayersLeaving =
          (gameData.white_player === user.uid || !gameData.white_player) &&
          (gameData.black_player === user.uid || !gameData.black_player);

        if (bothPlayersLeaving) {
          await remove(ref(database, `games/${activeGame}`));
          console.log('Game deleted as both players have left');
        } else {
          await update(ref(database, `games/${activeGame}`), updateData);
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
    const unsubscribe = onValue(gameRef,async (snapshot) => {
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
            
            setShowGameEndPopup(true);
            await archiveGame(gameDetails);

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
  const syncGameTime = useCallback(() => {
    if (!gameState || !gameId || gameState.status !== 'active') return;


    const now = Date.now();
    const lastMoveTime = gameState.lastMoveTime || now;
    const elapsedSeconds = Math.floor((now - lastMoveTime) / 1000);
    const currentPlayerTime = gameState.current_turn === 'white'
      ? gameState.whiteTime
      : gameState.blackTime;

    const newTime = Math.max(0, currentPlayerTime - elapsedSeconds);

    update(ref(database, `games/${gameId}`), {
      [`${gameState.current_turn}Time`]: newTime,
      lastMoveTime: now
    });
  }, [gameState, gameId]);

  /**
   * Effect hook to start time sync interval
   * Runs every 5 seconds to keep time in sync
   */
  useEffect(() => {
    if (!gameState || !gameId) return;

    const syncInterval = setInterval(syncGameTime, 5000);

    return () => clearInterval(syncInterval);
  }, [gameState, gameId, syncGameTime]);

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

        const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
        const currentTime = Date.now();
        const updates = {
          fen: newGame.fen(),
          portals: newGame.portals,
          current_turn: newTurn,
          lastMoveTime: currentTime,
          lastMove: cleanMove,
          whiteTime: gameState.current_turn === 'white' ? whiteTime : gameState.whiteTime,
          blackTime: gameState.current_turn === 'black' ? blackTime : gameState.blackTime
        };

        const gameStatus = newGame.isGameOver();
        if (gameStatus.over) {

          const gameDetails = {
            winner: gameStatus.winner,
            reason: gameStatus.reason
          };
          update(ref(database, `games/${gameId}`), {
            ...updates,
            status: 'finished',
            winner: gameStatus.winner,
            reason: gameStatus.reason
          });

          setGameEndDetails(gameDetails);
          setShowGameEndPopup(true);
          archiveGame(gameDetails);

        } else {
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
  }, [game, gameState, gameId, isMyTurn, updateLostPieces, whiteTime, blackTime, areBothPlayersJoined]);

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
        makeMove(selectedSquare, square);
        setSelectedSquare(null);
      }
    } else {
      // Portal mode handling
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
          update(ref(database, `games/${gameId}`), {
            fen: newGame.fen(),
            portals: newGame.portals,
            current_turn: newTurn,
            lastMoveTime: Date.now(),
            lastMove: portalMove
          });
        } catch (error) {
          console.error('Portal placement error:', error);
          alert(`Maximum number of portals (${gameState.portal_count}) reached!`);
          setPortalStart(null);
          setPortalMode(false);
        }
      }
    }
  }, [portalMode, selectedSquare, game, portalStart, gameState, gameId, makeMove]);

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

        const now = Date.now();
        const lastMoveTime = gameState.lastMoveTime || now;
        const elapsedSeconds = Math.floor((now - lastMoveTime) / 1000);

        if (gameState.current_turn === 'white') {
          const newWhiteTime = Math.max(0, gameState.whiteTime - elapsedSeconds);
          setWhiteTime(newWhiteTime);

          update(ref(database, `games/${gameId}`), {
            whiteTime: newWhiteTime,
            lastMoveTime: now
          });

          if (newWhiteTime <= 0) {

            const gameDetails = {
              winner: 'black',
              reason: 'timeout'
            };

            update(ref(database, `games/${gameId}`), {
              status: 'finished',
              winner: 'black',
              reason: 'timeout'
            });

            setGameEndDetails(gameDetails);
            setShowGameEndPopup(true);
            await archiveGame(gameDetails);

          }
        } else {
          const newBlackTime = Math.max(0, gameState.blackTime - elapsedSeconds);
          setBlackTime(newBlackTime);

          update(ref(database, `games/${gameId}`), {
            blackTime: newBlackTime,
            lastMoveTime: now
          });

          if (newBlackTime <= 0) {

            const gameDetails = {
              winner: 'white',
              reason: 'timeout'
            };

            update(ref(database, `games/${gameId}`), {
              status: 'finished',
              winner: 'white',
              reason: 'timeout'
            });

            setGameEndDetails(gameDetails);
            setShowGameEndPopup(true);
            await archiveGame(gameDetails);

          }
        }
      }, 1000);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [gameState, gameId, areBothPlayersJoined]);


  /**
   * Handles rematch requests
   * Resets game state while keeping players
   */
  const handleRematch = async () => {
    try {
      const initialTime = gameState.time_control * 60;
      const currentTime = Date.now();

      const newGameState = {
        white_player: gameState.white_player,
        white_player_name: gameState.white_player_name,
        white_player_email: gameState.white_player_email,
        black_player: gameState.black_player,
        black_player_name: gameState.black_player_name,
        black_player_email: gameState.black_player_email,
        status: 'active',
        current_turn: 'white',
        whiteTime: initialTime,
        blackTime: initialTime,
        lastMoveTime: currentTime,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        portals: {},
        lastMove: null,
        portal_count: gameState.portal_count,
        chat: {},
        lostPieces: {
          white: [],
          black: []
        }
      };

      await update(ref(database, `games/${gameId}`), newGameState);
      setShowGameEndPopup(false);
      setWhiteTime(initialTime);
      setBlackTime(initialTime);
      setIsTimerRunning(true);
    } catch (error) {
      console.error('Error starting rematch:', error);
    }
  };

  const archiveGame = async (gameDetails) => {
    try {
        // Wait a moment to ensure gameState is loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Safely access gameState with null checks
        if (!gameState) {
            console.error("Cannot archive game: gameState is null");
            return;
        }

        if (!gameState.white_player || !gameState.black_player) {
            console.error("Cannot archive game: missing player information");
            return;
        }

        const response = await fetch(`${BACKEND_URL}/history/games`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                game_id: gameId,
                white_player_id: gameState.white_player,
                black_player_id: gameState.black_player,
                start_time: new Date(gameState.created_at || Date.now()).toISOString(),
                end_time: new Date().toISOString(),
                result: gameDetails.winner === 'white' ? 'white_win' : 
                        gameDetails.winner === 'black' ? 'black_win' : 
                        gameDetails.winner === 'draw' ? 'draw' : 'abandoned',
                winner_id: gameDetails.winner === 'white' ? gameState.white_player :
                          gameDetails.winner === 'black' ? gameState.black_player : null,
                moves: moveHistory,
                initial_position: 'standard',
                white_rating: gameState.white_rating || 1200,
                black_rating: gameState.black_rating || 1200,
                rating_change: {
                    white: gameDetails.winner === 'white' ? 15 : 
                           gameDetails.winner === 'black' ? -15 : 0,
                    black: gameDetails.winner === 'black' ? 15 : 
                           gameDetails.winner === 'white' ? -15 : 0
                },
                game_type: `${gameState.portal_count}`,
                time_control: {
                    initial: (gameState.time_control || 10) * 60,
                    increment: gameState.increment || 0
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to archive game: ${errorData.detail || response.statusText}`);
        }

        console.log('Game archived successfully');
    } catch (error) {
        console.error('Error archiving game:', error);
    }
};

  // Game layout and component rendering
  return (
    <div className="portal-chess-container bg-purple-200 flex flex-col md:flex-row w-full h-screen">
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
          onClose={() => setShowGameEndPopup(false)}
          onRematch={handleRematch}
          onExit={exitGame}
        />
      )}
    </div>
  );
};

export default PortalChessGame;