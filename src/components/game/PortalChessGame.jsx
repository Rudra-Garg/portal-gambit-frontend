import { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { ref, update, onValue } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { PortalChess } from './CustomChessEngine';
import './PortalChessGame.css';

const PortalChessGame = ({ gameId }) => {
  const [game, setGame] = useState(() => new PortalChess());
  const [portalMode, setPortalMode] = useState(false);
  const [portalStart, setPortalStart] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const { user } = useAuth();
  const [gameState, setGameState] = useState(null);

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
          
          // Ensure portals are properly set
          newGame.portals = data.portals || {};
          
          // Force turn to match the game state
          newGame._turn = data.current_turn === 'white' ? 'w' : 'b';
          
          setGame(newGame);
        } catch (error) {
          console.error('Error initializing chess game:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  const isMyTurn = () => {
    if (!gameState || !user) return false;
    const myColor = gameState.white_player === user.uid ? 'white' : 
                   gameState.black_player === user.uid ? 'black' : null;
    return myColor === gameState.current_turn;
  };

  const makeMove = useCallback((sourceSquare, targetSquare) => {
    if (!isMyTurn()) return false;

    try {
      const newGame = new PortalChess(game.fen());
      newGame.portals = { ...game.portals };

      // Get all valid moves for the source square
      const moves = newGame.moves({ square: sourceSquare, verbose: true });
      
      // Find if there's a portal move to the target square
      const portalMove = moves.find(move => 
        move.portal && 
        move.to === targetSquare
      );

      let move;
      if (portalMove) {
        // For portal moves, we need to include the 'via' square
        move = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          via: portalMove.via,
          portal: true
        });
      } else {
        // Regular move
        move = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q' // Default to queen for simplicity
        });
      }

      if (move) {
        // Clean up the move object to ensure no undefined values
        const cleanMove = {
          ...move,
          captured: move.captured || null,  // Replace undefined with null
          promotion: move.promotion || null,
          // Include other essential move properties
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          flags: move.flags || '',
          san: move.san || '',
          via: move.via || null,
          portal: move.portal || false
        };

        // Update game state in Firebase
        const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
        update(ref(database, `games/${gameId}`), {
          fen: newGame.fen(),
          portals: newGame.portals,
          current_turn: newTurn,
          lastMoveTime: Date.now(),
          lastMove: cleanMove
        });
        
        // Update local game state
        setGame(newGame);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  }, [game, gameState, gameId, isMyTurn]);

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
      // Portal placement logging
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
          
          // Update local game state first
          setGame(newGame);
          setPortalStart(null);
          setPortalMode(false);

          // Update Firebase with new game state
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
  };

  const customSquareStyles = {
    ...Object.keys(game.portals).reduce((acc, square) => ({
      ...acc,
      [square]: {
        background: 'radial-gradient(circle, #2196f3 0%, transparent 70%)',
        borderRadius: '50%'
      }
    }), {}),
    ...(portalStart ? {
      [portalStart]: {
        background: 'radial-gradient(circle, #4CAF50 0%, transparent 70%)',
        borderRadius: '50%'
      }
    } : {}),
    ...(selectedSquare ? {
      [selectedSquare]: {
        backgroundColor: 'rgba(255, 255, 0, 0.5)'
      },
      ...game.moves({ square: selectedSquare, verbose: true }).reduce((acc, move) => {
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
                : 'radial-gradient(circle, rgba(0, 255, 0, 0.4) 0%, rgba(0, 255, 0, 0.4) 30%, transparent 31%)'
          }
        };
      }, {})
    } : {})
  };

  return (
    <div className="portal-chess-container">
      <div className="game-status">
        {isMyTurn() ? "Your turn" : "Opponent's turn"}
      </div>
      <div className="board-container">
        <Chessboard 
          position={game.fen()}
          onPieceDrop={(source, target) => makeMove(source, target)}
          onSquareClick={handleSquareClick}
          boardOrientation={gameState?.black_player === user?.uid ? 'black' : 'white'}
          arePiecesDraggable={isMyTurn()}
          customSquareStyles={customSquareStyles}
        />
      </div>
      <div className="controls">
        <button 
          onClick={() => setPortalMode(!portalMode)}
          className={`portal-button ${portalMode ? 'active' : ''}`}
          disabled={!isMyTurn()}
        >
          {portalMode ? 'Cancel Portal' : 'Place Portal'}
        </button>
      </div>
    </div>
  );
};

export default PortalChessGame;