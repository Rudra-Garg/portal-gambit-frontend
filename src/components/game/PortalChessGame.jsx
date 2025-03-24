import { useState, useCallback, useEffect } from 'react';
import {ref, update, onValue, get, remove} from 'firebase/database';
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
import {useNavigate} from "react-router-dom";
import TimeoutPopup from './components/TimeoutPopup';

const PortalChessGame = () => {
  const [game, setGame] = useState(() => new PortalChess());
  const [portalMode, setPortalMode] = useState(false);
  const [portalStart, setPortalStart] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const { user } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState(null);
  const[activeGame,setActiveGame]=useState(null);
  const [whiteTime, setWhiteTime] = useState(null);
const [blackTime, setBlackTime] = useState(null);
const [isTimerRunning, setIsTimerRunning] = useState(false);
const [showTimeoutPopup, setShowTimeoutPopup] = useState(false);
const [timeoutWinner, setTimeoutWinner] = useState(null);

// Add this function after the state declarations
const areBothPlayersJoined = useCallback(() => {
  return gameState?.white_player && gameState?.black_player;
}, [gameState]);

  const navigate = useNavigate();

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
  }, [setGameId]); // Add setGameId to the dependency array


  const exitGame = async () => {
    if (activeGame) {
      try {
        // Get current game data
        const gameSnapshot = await get(ref(database, `games/${activeGame}`));
        const gameData = gameSnapshot.val();

        if (!gameData) {
          console.error('Game not found');
          setActiveGame(null);
          // setShowAvailableGames(false);
          return;
        }

        const updateData = {};

        // Determine which player is leaving
        if (gameData.white_player === user.uid) {
          updateData.white_player = null;
          updateData.white_player_name = null;
          updateData.white_player_email = null;
        } else if (gameData.black_player === user.uid) {
          updateData.black_player = null;
          updateData.black_player_name = null;
          updateData.black_player_email = null;
        }

        // Check if both players will be gone after this update
        const bothPlayersLeaving =
          (gameData.white_player === user.uid || !gameData.white_player) &&
          (gameData.black_player === user.uid || !gameData.black_player);

        if (bothPlayersLeaving) {
          // Delete the game if both players have left
          await remove(ref(database, `games/${activeGame}`));
          console.log('Game deleted as both players have left');
        } else {
          // Update the game with the player removed
          await update(ref(database, `games/${activeGame}`), updateData);
          console.log('Player removed from game');
        }

        setActiveGame(null);
        navigate("/profile/:userId");
        // setShowAvailableGames(false);
      } catch (error) {
        console.error('Error exiting game:', error);
      }
    } else {
      setActiveGame(null);
      // setShowAvailableGames(false);
    }
  };
  // Use the custom hooks
  const moveHistory = useMoveHistory(gameId);
  const [lostPieces, updateLostPieces] = useLostPieces(game);
  const { chatMessages, newMessage, setNewMessage, sendMessage } = useChat(gameId, user);
  
  const {
    voiceChatEnabled,
    isMuted,
    isConnecting,
    connectionStatus,
    remoteAudioRef,
    toggleVoiceChat,
    toggleMute
  } = useVoiceChat(gameId, gameState, user);

  useEffect(() => {
    if (!gameId) return;

    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
        try {
          const newGame = new PortalChess();
          if (typeof data.fen === 'string') {
            newGame.load(data.fen);
          }
          
          newGame.portals = data.portals || {};
          newGame._turn = data.current_turn === 'white' ? 'w' : 'b';
          
          setGame(newGame);
          updateLostPieces(newGame);
          
        } catch (error) {
          console.error('Error initializing chess game:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, updateLostPieces]);

    const isMyTurn = useCallback(() => {
      if (!gameState || !user || !areBothPlayersJoined()) return false;
      const myColor = gameState.white_player === user.uid ? 'white' : 
                     gameState.black_player === user.uid ? 'black' : null;
      return myColor === gameState.current_turn;
    }, [gameState, user, areBothPlayersJoined]);

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
      const newGame = new PortalChess(game.fen());
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
        update(ref(database, `games/${gameId}`), {
          fen: newGame.fen(),
          portals: newGame.portals,
          current_turn: newTurn,
          lastMoveTime: Date.now(),
          lastMove: cleanMove
        });
  
        setGame(newGame);
        updateLostPieces(newGame);
  
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  },  [game, gameState, gameId, isMyTurn, updateLostPieces, whiteTime, blackTime, areBothPlayersJoined]);

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
      if (!portalStart) {
        setPortalStart(square);
      } else {
        try {
          const newGame = new PortalChess(game.fen());
          newGame.portals = { ...game.portals };
          newGame.placePair(portalStart, square);
          
          setGame(newGame);
          setPortalStart(null);
          setPortalMode(false);

          const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
          update(ref(database, `games/${gameId}`), {
            fen: newGame.fen(),
            portals: newGame.portals,
            current_turn: newTurn,
            lastMoveTime: Date.now()
          });
        } catch (error) {
          console.error('Portal placement error:', error);
          alert('Maximum number of portals (3) reached!');
          setPortalStart(null);
          setPortalMode(false);
        }
      }
    }
  }, [portalMode, selectedSquare, game, portalStart, gameState, gameId, makeMove]);

  const amIWhitePlayer = gameState?.white_player === user?.uid;
  
  // Get player names from gameState
  const whitePlayerName = gameState?.white_player_name || "White Player";
  const blackPlayerName = gameState?.black_player_name || "Black Player";

  // Determine player colors
  const topPlayerColor = amIWhitePlayer ? 'black' : 'white';
  const bottomPlayerColor = amIWhitePlayer ? 'white' : 'black';


// Add this useEffect after other useEffects
// Replace the existing timer useEffect with this updated version
useEffect(() => {
  if (!gameState || !gameId) return;

  // Initialize timers from gameState
  if (!whiteTime && !blackTime) {
    setWhiteTime(gameState.whiteTime);
    setBlackTime(gameState.blackTime);
  }
  setIsTimerRunning(gameState.status === 'active');

  const timerInterval = setInterval(() => {
    if (isTimerRunning && gameState.status === 'active') {
      const currentPlayer = gameState.current_turn;
      if (currentPlayer === 'white') {
        setWhiteTime(prevTime => {
          if (prevTime <= 0) {
            // White loses on time
            update(ref(database, `games/${gameId}`), {
              status: 'finished',
              winner: 'black',
              reason: 'timeout'
            });
            setIsTimerRunning(false);
            setTimeoutWinner('black');
            setShowTimeoutPopup(true);
            return 0;
          }
          const newTime = prevTime - 1;
          update(ref(database, `games/${gameId}`), {
            whiteTime: newTime
          });
          return newTime;
        });
      } else {
        setBlackTime(prevTime => {
          if (prevTime <= 0) {
            // Black loses on time
            update(ref(database, `games/${gameId}`), {
              status: 'finished',
              winner: 'white',
              reason: 'timeout'
            });
            setIsTimerRunning(false);
            setTimeoutWinner('white');
            setShowTimeoutPopup(true);
            return 0;
          }
          const newTime = prevTime - 1;
          update(ref(database, `games/${gameId}`), {
            blackTime: newTime
          });
          return newTime;
        });
      }
    }
  }, 1000);

  return () => clearInterval(timerInterval);
}, [gameState?.current_turn, isTimerRunning, gameId, gameState?.status]);

const handleRematch = async () => {
  try {
    // Reset game state with same players but new time
    const newGameState = {
      white_player: gameState.white_player,
      white_player_name: gameState.white_player_name,
      white_player_email: gameState.white_player_email,
      black_player: gameState.black_player,
      black_player_name: gameState.black_player_name,
      black_player_email: gameState.black_player_email,
      status: 'active',
      current_turn: 'white',
      time_control: gameState.time_control,
      whiteTime: gameState.time_control * 60,
      blackTime: gameState.time_control * 60,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      portals: {},
      lastMove: null,
      lastMoveTime: Date.now(),
      portal_count: gameState.portal_count,
      chat: {},
      lostPieces: {
        white: [],
        black: []
      }
    };
    
    await update(ref(database, `games/${gameId}`), newGameState);
    setShowTimeoutPopup(false);
    setWhiteTime(newGameState.whiteTime);
    setBlackTime(newGameState.blackTime);
    setIsTimerRunning(true);
    setTimeoutWinner(null);
  } catch (error) {
    console.error('Error starting rematch:', error);
  }
};

// Add this helper function to format time display
  return (
    <div className="portal-chess-container bg-purple-200 flex flex-col md:flex-row w-full h-screen">
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
      {showTimeoutPopup && (
      <TimeoutPopup
        winner={timeoutWinner}
        onClose={() => setShowTimeoutPopup(false)}
        onRematch={handleRematch}
        onExit={exitGame}
      />
    )}
    </div>
  );
};

export default PortalChessGame;