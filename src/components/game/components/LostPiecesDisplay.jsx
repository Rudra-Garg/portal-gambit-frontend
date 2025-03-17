import React from 'react';
import PropTypes from 'prop-types';
import { pieceSymbols } from '../utils/pieceUtils';
import './LostPiecesDisplay.css';

/**
 * Component to display lost chess pieces
 */
const LostPiecesDisplay = ({ lostPieces, color }) => {
  if (color && color === 'black') {
    color = 'white';
  } else {
    color = 'black';
  }

  if (!lostPieces || !lostPieces[color] || lostPieces[color].length === 0) {
    return <div className="lost-pieces-container lost-pieces-empty">No pieces lost</div>;
  }

  // Count pieces of each type
  const pieceCounts = {};

  lostPieces[color].forEach(pieceType => {
    pieceCounts[pieceType] = (pieceCounts[pieceType] || 0) + 1;
  });

  return (
    <div className="lost-pieces-container">
      {Object.entries(pieceCounts).map(([pieceType, count]) => (
        <div key={pieceType} className="lost-piece-item">
          <span className="piece-symbol">{pieceSymbols[pieceType]}</span>
          {count > 1 && <span className="piece-count">×{count}</span>}
        </div>
      ))}
    </div>
  );
};

LostPiecesDisplay.propTypes = {
  lostPieces: PropTypes.shape({
    white: PropTypes.array.isRequired,
    black: PropTypes.array.isRequired
  }).isRequired,
  color: PropTypes.oneOf(['white', 'black']).isRequired
};

export default LostPiecesDisplay;