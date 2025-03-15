import PropTypes from 'prop-types';
import { Chessboard } from 'react-chessboard';
import { useEffect, useState } from 'react';

const ChessboardWrapper = ({ 
  game, 
  makeMove, 
  handleSquareClick, 
  gameState, 
  user, 
  isMyTurn, 
  portalStart,
  selectedSquare
}) => {
  const [boardWidth, setBoardWidth] = useState(400);

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
    <div
    className="flex-grow bg-transparent flex items-center justify-center mb-1 overflow-hidden"
    id="board-container"
>
      <div className="board-container" style={{ 
        width: boardWidth, 
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 200px)'
      }}>
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
  );
};

ChessboardWrapper.propTypes = {
  game: PropTypes.shape({
    fen: PropTypes.func.isRequired,
    portals: PropTypes.object.isRequired,
    moves: PropTypes.func.isRequired
  }).isRequired,
  makeMove: PropTypes.func.isRequired,
  handleSquareClick: PropTypes.func.isRequired,
  gameState: PropTypes.shape({
    black_player: PropTypes.string
  }),
  user: PropTypes.shape({
    uid: PropTypes.string
  }),
  isMyTurn: PropTypes.func.isRequired,
  portalMode: PropTypes.bool.isRequired,
  portalStart: PropTypes.string,
  selectedSquare: PropTypes.string
};

export default ChessboardWrapper; 