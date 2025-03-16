import { useState, useCallback, useEffect } from 'react';
import { ref, update, onValue } from 'firebase/database';
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

const PortalChessGame = ({ gameId,exit }) => {
  const [game, setGame] = useState(() => new PortalChess());
  const [portalMode, setPortalMode] = useState(false);
  const [portalStart, setPortalStart] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const { user } = useAuth();
  const [gameState, setGameState] = useState(null);
  
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
  }, [gameId]);

  const isMyTurn = useCallback(() => {
    if (!gameState || !user) return false;
    const myColor = gameState.white_player === user.uid ? 'white' : 
                   gameState.black_player === user.uid ? 'black' : null;
    return myColor === gameState.current_turn;
  }, [gameState, user]);

  const makeMove = useCallback((sourceSquare, targetSquare) => {
    if (!isMyTurn()) return false;
  
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
  }, [game, gameState, gameId, isMyTurn, updateLostPieces]);

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

  const handleLeaveGame = useCallback(() => {
    // Implement leave game functionality
    console.log("Leaving game...");
    // Navigation logic or cleanup here
  }, []);

  const amIWhitePlayer = gameState?.white_player === user?.uid;

  return (
    <div className="portal-chess-container bg-purple-200 flex flex-col md:flex-row w-full h-screen">
      <div className="w-full md:w-1/2 bg-transparent p-2 flex flex-col h-full max-h-screen overflow-hidden">
        <PlayerInfo 
          isTopPlayer={true}
          playerNumber={2}
          playerName="OPPONENT 2"
          isMyTurn={gameState?.current_turn === (amIWhitePlayer ? 'black' : 'white')}
          lostPieces={lostPieces.black}
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
          playerName="OPPONENT 1" 
          isMyTurn={gameState?.current_turn === (amIWhitePlayer ? 'white' : 'black')}
          lostPieces={lostPieces.white}
        />
      </div>

      <div className="w-full md:w-1/2 bg-transparent p-2 flex flex-col h-full">
        <GameHistory 
          moveHistory={moveHistory}
          portalMode={portalMode}
          setPortalMode={setPortalMode}
          isMyTurn={isMyTurn}
          exit={exit}
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
    </div>
  );
};

PortalChessGame.propTypes = {
  gameId: PropTypes.string.isRequired
};

export default PortalChessGame;