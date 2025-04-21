import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './LostPiecesDisplay.css';

/**
 * Component to display lost chess pieces using SVG icons from the public folder
 */
const LostPiecesDisplay = ({ lostPieces, color }) => {
  // Add debug logging
  useEffect(() => {
    console.log('[DEBUG][LostPiecesDisplay] Rendering with props:', {
      lostPieces,
      color,
      hasLostPieces: !!(lostPieces && lostPieces[color === 'black' ? 'white' : 'black'])
    });
  }, [lostPieces, color]);

  // Determine the color of the pieces to display (opponent's lost pieces)
  const displayColor = color === 'black' ? 'white' : 'black';
  const displayColorPrefix = displayColor === 'white' ? 'w' : 'b';

  if (!lostPieces || !lostPieces[displayColor] || lostPieces[displayColor].length === 0) {
    console.log('[DEBUG][LostPiecesDisplay] No pieces to display');
    return <div className="lost-pieces-container lost-pieces-empty">No pieces lost</div>;
  }

  // Count pieces of each type
  const pieceCounts = {};
  lostPieces[displayColor].forEach(pieceType => {
    pieceCounts[pieceType] = (pieceCounts[pieceType] || 0) + 1;
  });
  
  console.log('[DEBUG][LostPiecesDisplay] Piece counts:', pieceCounts);

  // Rest of component code...

  // Sort pieces for consistent display (e.g., by value)
  const sortedPieceTypes = Object.keys(pieceCounts).sort((a, b) => {
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    return (pieceValues[b] || 0) - (pieceValues[a] || 0);
  });

  return (
    <div className="lost-pieces-container">
      {sortedPieceTypes.map((pieceType) => {
        const count = pieceCounts[pieceType];
        // Construct the absolute path to the SVG in the public directory
        const svgPath = `/assets/pieces/${displayColorPrefix}_${pieceType}.svg`;

        return (
          <div key={pieceType} className="lost-piece-item">
            {/* Use the constructed path directly in the src attribute */}
            <img src={svgPath} alt={`${displayColor} ${pieceType}`} className="piece-icon" />
            {count > 1 && <span className="piece-count">×{count}</span>}
          </div>
        );
      })}
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