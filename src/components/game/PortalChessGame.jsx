import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import './PortalChessGame.css';

const PortalChessGame = ({ gameId }) => {
  const [game, setGame] = useState(new Chess());
  const [gameState, setGameState] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [portalMode, setPortalMode] = useState(false);
  const [portals, setPortals] = useState({});
  const { user, loading } = useAuth(); // Changed from currentUser to user

  useEffect(() => {
    if (!gameId || loading) return;

    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('Game State Data:', data);
        console.log('Current User:', user?.uid);
        console.log('White Player:', data.white_player);
        console.log('Black Player:', data.black_player);
        console.log('Current Turn:', data.current_turn);

        setGameState(data);
        const newGame = new Chess();
        newGame.load(data.fen);
        setGame(newGame);
        setPortals(data.portals || {});
      }
    });

    return () => unsubscribe();
  }, [gameId, user, loading]);

  const isMyTurn = () => {
    if (!gameState || !user) {
      console.log('No game state or user not logged in');
      return false;
    }

    // Determine player's color
    const myColor = gameState.white_player === user.uid ? 'white' :
                   gameState.black_player === user.uid ? 'black' : null;

    if (!myColor) {
      console.log('User is not a player in this game');
      return false;
    }

    const isMyMove = myColor === gameState.current_turn;
    console.log('Turn Status:', {
      myColor,
      currentTurn: gameState.current_turn,
      isMyMove
    });

    return isMyMove;
  };

  const onDrop = (sourceSquare, targetSquare) => {
    if (!isMyTurn()) {
      console.log('Not your turn!');
      return false;
    }

    try {
      if (portals[sourceSquare]?.linkedTo) {
        sourceSquare = portals[sourceSquare].linkedTo;
      }

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move) {
        const newTurn = game.turn() === 'w' ? 'white' : 'black';
        console.log('Making move, new turn:', newTurn);

        update(ref(database, `games/${gameId}`), {
          fen: game.fen(),
          current_turn: newTurn,
          lastMoveTime: Date.now()
        });
        return true;
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
    return false;
  };

  const onSquareClick = (square) => {
    if (!portalMode || !isMyTurn()) return;

    if (selectedSquare === null) {
      setSelectedSquare(square);
    } else {
      const newPortals = {
        ...portals,
        [selectedSquare]: {
          position: selectedSquare,
          linkedTo: square
        },
        [square]: {
          position: square,
          linkedTo: selectedSquare
        }
      };

      update(ref(database, `games/${gameId}/portals`), newPortals);
      setSelectedSquare(null);
      setPortalMode(false);
    }
  };

  const customPieces = () => {
    const pieces = {};
    Object.keys(portals).forEach(square => {
      pieces[square] = ({ piece }) => (
        <div className="portal-square">
          {piece && <div className="piece-container">{piece}</div>}
          <div className="portal-indicator" />
        </div>
      );
    });
    return pieces;
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
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          }}
          customPieces={customPieces()}
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