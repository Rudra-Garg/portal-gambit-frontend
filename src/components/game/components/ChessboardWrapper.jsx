import PropTypes from 'prop-types';
import { Chessboard } from 'react-chessboard';
import { useEffect, useState, useMemo } from 'react'; // Import useMemo

// Helper function to determine square color (standard chessboard)
// Returns true if the square is light, false if dark.
function isLightSquare(square) {
  if (!square || square.length !== 2) return false; // Handle invalid input
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0 for 'a', ..., 7 for 'h'
  const rank = parseInt(square[1], 10) - 1; // 0 for rank '1', ..., 7 for rank '8'
  // Standard chessboards: squares where (file + rank) is odd are light.
  return (file + rank) % 2 !== 0;
}

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
        const availableHeight = window.innerHeight - 120;
        const availableWidth = container.clientWidth;
        const size = Math.min(availableHeight, availableWidth);
        setBoardWidth(size);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define the custom SVG pieces using useMemo for performance
  const customPieces = useMemo(() => {
    const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
    const pieceComponents = {};

    pieces.forEach((piece) => {
      // Map react-chessboard notation (e.g., wP) to your SVG file naming convention (e.g., w_p)
      const svgFileName = `${piece[0].toLowerCase()}_${piece[1].toLowerCase()}.svg`;
      const svgPath = `/assets/pieces/${svgFileName}`; // Path relative to public folder

      pieceComponents[piece] = ({ squareWidth }) => (
        <div
          style={{
            width: squareWidth,
            height: squareWidth,
            backgroundImage: `url(${svgPath})`,
            backgroundSize: 'contain', // Or 'cover', '100%', etc. depending on desired look
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center'
          }}
        />
      );
    });

    return pieceComponents;
  }, []); // Empty dependency array ensures this runs only once

  // Calculate customSquareStyles using useMemo for performance
  const customSquareStyles = useMemo(() => {
    const styles = {
      // Apply portal styles first
      ...Object.entries(game.portals).reduce((acc, [square, portal]) => ({
        ...acc,
        [square]: {
          background: `radial-gradient(circle, ${portal.color_hash || '#2196f3'} 0%, transparent 70%)`,
          borderRadius: '50%'
        }
      }), {}),
      // Apply portal start selection style
      ...(portalStart ? {
        [portalStart]: {
          background: 'radial-gradient(circle, #4CAF50 0%, transparent 70%)',
          borderRadius: '50%'
        }
      } : {}),
    };

    // Apply selected square and move highlights if a square is selected
    if (selectedSquare) {
      // Determine the background color based on whether the selected square is light or dark
      const selectedBgColor = isLightSquare(selectedSquare)
        ? '#b1a7fc' // Highlight color for selected light squares
        : '#9990ec'; // Highlight color for selected dark squares

      // Apply the selected square background color, preserving existing styles (like portal background)
      styles[selectedSquare] = {
        ...(styles[selectedSquare] || {}), // Keep existing styles if any (e.g., portal)
        backgroundColor: selectedBgColor
      };

      // Calculate and apply move highlights
      const moveStyles = game.moves({ square: selectedSquare, verbose: true }).reduce((acc, move) => {
        // Determine portal color for this move if it's a portal move
        let portalColor = 'rgba(33, 150, 243, 0.4)'; // Default blue
        if (move.portal && move.via) {
          const firstPortalSquare = move.via.split('->')[0];
          if (game.portals[firstPortalSquare]?.color_hash) {
            // Attempt to parse the portal color and add alpha, fallback if invalid
            try {
              // Basic hex check
              if (/^#[0-9A-F]{6}$/i.test(game.portals[firstPortalSquare].color_hash)) {
                 portalColor = `${game.portals[firstPortalSquare].color_hash}66`; // Add ~40% alpha
              } else {
                 // Potentially handle other color formats or keep default
                 console.warn("Invalid portal color format:", game.portals[firstPortalSquare].color_hash);
              }
            } catch (e) {
              console.error("Error processing portal color:", e);
            }
          }
        }

        const moveHighlightStyle = {
          background: move.portal
            ? move.captured
              ? `radial-gradient(circle, transparent 35%, ${portalColor} 36%, ${portalColor} 45%, transparent 46%)` // Portal capture
              : `radial-gradient(circle, ${portalColor} 0%, ${portalColor} 30%, transparent 31%)` // Portal move
            : move.captured
              ? 'radial-gradient(circle, transparent 35%, rgba(0, 255, 0, 0.4) 36%, rgba(0, 255, 0, 0.4) 45%, transparent 46%)' // Normal capture
              : 'radial-gradient(circle, rgba(0, 255, 0, 0.4) 0%, rgba(0, 255, 0, 0.4) 30%, transparent 31%)' // Normal move
        };

        return {
          ...acc,
          [move.to]: {
            ...(styles[move.to] || {}), // Keep existing styles if any (e.g., portal)
            ...moveHighlightStyle
          }
        };
      }, {});

      // Merge move styles into the main styles object, potentially overwriting portal styles if a move ends on a portal
      Object.assign(styles, moveStyles);
    }

    return styles;
  }, [game, portalStart, selectedSquare]); // Dependencies for useMemo

  return (
    <div
      className="flex-grow bg-transparent flex items-center justify-center m-1 overflow-hidden"
      id="board-container"
    >
      <div className="board-container" style={{
        width: boardWidth,
        maxWidth: '100%',
        maxHeight: 'calc(100vh)'
      }}>
        <Chessboard
          position={game.fen()}
          onPieceDrop={(source, target) => makeMove(source, target)}
          onSquareClick={handleSquareClick}
          boardOrientation={gameState?.black_player === user?.uid ? 'black' : 'white'}
          arePiecesDraggable={isMyTurn()}
          customBoardStyle={{
            borderRadius: '3px',
          }}
          customSquareStyles={customSquareStyles}
          customDarkSquareStyle={{ backgroundColor: '#b7c0d8' }}
          customLightSquareStyle={{ backgroundColor: '#e8edf9' }}
          customPieces={customPieces}
        />
      </div>
    </div>
  );
};

ChessboardWrapper.propTypes = {
  game: PropTypes.shape({
    fen: PropTypes.func.isRequired,
    portals: PropTypes.object.isRequired,
    moves: PropTypes.func.isRequired,
    // Add other game methods/properties used if necessary
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
  // portalMode: PropTypes.bool.isRequired, // Removed if not used directly here
  portalStart: PropTypes.string,
  selectedSquare: PropTypes.string
};

export default ChessboardWrapper;