import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import CustomChessBoard from './CustomChessBoard';
import './PortalChessGame.css';

const PortalChessGame = ({ gameId }) => {
  const [gameState, setGameState] = useState(null);
  const [portalMode, setPortalMode] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!gameId || loading) return;

    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
      }
    });

    return () => unsubscribe();
  }, [gameId, user, loading]);

  const isMyTurn = () => {
    if (!gameState || !user) return false;

    const myColor = gameState.white_player === user.uid ? 'white' :
                   gameState.black_player === user.uid ? 'black' : null;

    if (!myColor) return false;
    return myColor === gameState.current_turn;
  };

  const handleMove = (newBoard) => {
    const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
    
    update(ref(database, `games/${gameId}`), {
      board: newBoard,
      current_turn: newTurn,
      lastMoveTime: Date.now()
    });
  };

  const getGameStatus = () => {
    if (loading) return 'Loading...';
    if (!user) return 'Please sign in to play';
    if (!gameState) return 'Game not found';

    const isPlayer = [gameState.white_player, gameState.black_player].includes(user.uid);
    if (!isPlayer) return 'You are observing this game';

    if (gameState.status === 'waiting' || !gameState.black_player) {
      return 'Waiting for opponent...';
    }

    if (gameState.status === 'active') {
      return isMyTurn() ? 'Your turn' : "Opponent's turn";
    }

    return 'Game ended';
  };

  return (
    <div className="game-container">
      <div className="game-controls">
        <button
          onClick={() => setPortalMode(!portalMode)}
          className={`portal-button ${portalMode ? 'active' : ''}`}
          disabled={!isMyTurn()}
        >
          {portalMode ? 'Cancel Portal' : 'Place Portal'}
        </button>

        {portalMode && (
          <div className="portal-instructions">
            Click two squares to create linked portals
          </div>
        )}
      </div>

      <div className="board-container">
        <CustomChessBoard
          gameId={gameId}
          onMove={handleMove}
          currentTurn={gameState?.current_turn}
          isMyTurn={isMyTurn()}
          gameState={gameState}
        />
      </div>

      <div className="game-status">
        {getGameStatus()}
      </div>

      {/* Debug information - you can remove this in production */}
      {user && gameState && (
        <div className="debug-info" style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <div>Player: {user.email}</div>
          <div>Role: {
            gameState.white_player === user.uid ? 'White' :
            gameState.black_player === user.uid ? 'Black' :
            'Observer'
          }</div>
          <div>Current Turn: {gameState.current_turn}</div>
          <div>Game Status: {gameState.status}</div>
        </div>
      )}
    </div>
  );
};

export default PortalChessGame;