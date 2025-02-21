import { useState, useEffect } from 'react';
import { initialBoardSetup, calculateValidMoves, makeMove, isCheck } from './chessLogic';
import './CustomChessBoard.css';

const CustomChessBoard = ({ gameId, onMove, currentTurn, isMyTurn, gameState }) => {
  const [board, setBoard] = useState(() => {
    const initialBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    return initialBoardSetup(initialBoard);
  });
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [portalMode, setPortalMode] = useState(false);
  const [portals, setPortals] = useState({});
  const [portalSelection, setPortalSelection] = useState(null);
  const [check, setCheck] = useState({ white: false, black: false });

  useEffect(() => {
    if (gameState?.board) {
      // Ensure the board is properly structured
      const newBoard = Array(8).fill(null).map((_, i) => 
        Array(8).fill(null).map((_, j) => gameState.board[i]?.[j] || null)
      );
      setBoard(newBoard);
    }
  }, [gameState]);

  useEffect(() => {
    if (board && Array.isArray(board)) {
      try {
        setCheck({
          white: isCheck(board, 'white'),
          black: isCheck(board, 'black')
        });
      } catch (error) {
        console.error('Error checking for check state:', error);
        setCheck({ white: false, black: false });
      }
    }
  }, [board]);

  useEffect(() => {
    console.log('Current board state:', board);
  }, [board]);

  const getPieceImage = (piece) => {
    if (!piece?.type || !piece?.color) return '';
    
    const pieceMap = {
      'pawn': 'p',
      'rook': 'r',
      'knight': 'n',  // Note: knight uses 'n' for "kNight" to avoid confusion with king
      'bishop': 'b',
      'queen': 'q',
      'king': 'k'
    };

    const pieceCode = pieceMap[piece.type];
    const colorCode = piece.color === 'white' ? 'w' : 'b';
    
    return `/assets/pieces/${colorCode}_${pieceCode}.svg`;
  };

  const getSquareClassName = (row, col) => {
    const classes = ['board-square'];
    
    // Add light/dark square
    classes.push((row + col) % 2 === 0 ? 'light' : 'dark');
    
    // Add selected state
    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
      classes.push('selected');
    }
    
    // Add valid move indicator
    if (validMoves.some(move => move.row === row && move.col === col)) {
      classes.push('valid-move');
    }
    
    // Add check indicator
    if (board?.[row]?.[col]?.type === 'king' && check[board[row][col].color]) {
      classes.push('check');
    }
    
    // Add portal indicator
    if (portals[`${row}-${col}`]) {
      classes.push('portal');
    }
    
    return classes.join(' ');
  };

  const handleSquareClick = (row, col) => {
    if (!board || !isMyTurn) {
      console.log('Board or turn check failed:', { board, isMyTurn });
      return;
    }

    if (portalMode) {
      handlePortalPlacement(row, col);
      return;
    }

    const piece = board[row]?.[col];
    console.log('Clicked piece:', piece, 'at position:', { row, col });
    
    // If no piece is selected, try to select one
    if (!selectedPiece && piece?.color === currentTurn) {
      const moves = calculateValidMoves(row, col, board, portals);
      console.log('Valid moves:', moves);
      setSelectedPiece({ row, col, piece });
      setValidMoves(moves);
      return;
    }

    // If a piece is selected and the clicked square is a valid move
    if (selectedPiece && validMoves.some(move => move.row === row && move.col === col)) {
      try {
        // Create a new board with proper 8x8 structure
        const newBoard = Array(8).fill(null).map((_, i) => 
          Array(8).fill(null).map((_, j) => {
            if (i === row && j === col) return selectedPiece.piece;
            if (i === selectedPiece.row && j === selectedPiece.col) return null;
            return board[i][j];
          })
        );
        
        console.log('New board state:', newBoard);
        onMove(newBoard);
        setSelectedPiece(null);
        setValidMoves([]);
      } catch (error) {
        console.error('Error making move:', error);
        setSelectedPiece(null);
        setValidMoves([]);
      }
      return;
    }

    // If we click anywhere else, clear the selection
    setSelectedPiece(null);
    setValidMoves([]);
  };

  const handlePortalPlacement = (row, col) => {
    if (!portalSelection) {
      setPortalSelection({ row, col });
      return;
    }

    const newPortals = {
      ...portals,
      [`${portalSelection.row}-${portalSelection.col}`]: {
        linkedTo: `${row}-${col}`
      },
      [`${row}-${col}`]: {
        linkedTo: `${portalSelection.row}-${portalSelection.col}`
      }
    };

    setPortals(newPortals);
    setPortalSelection(null);
    setPortalMode(false);
  };

  if (!board) {
    return <div className="chess-board loading">Loading...</div>;
  }

  return (
    <div className="chess-board-container">
      <div className="chess-board">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(rowIndex => (
          <div key={rowIndex} className="board-row">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
              const piece = board?.[rowIndex]?.[colIndex];
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getSquareClassName(rowIndex, colIndex)}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: (rowIndex + colIndex) % 2 === 0 ? '#f0d9b5' : '#b58863',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  {piece && (
                    <img
                      src={getPieceImage(piece)}
                      alt=""
                      className="chess-piece"
                      style={{
                        width: '50px',
                        height: '50px',
                        position: 'relative',
                        zIndex: 1
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="game-controls">
        <button
          onClick={() => setPortalMode(!portalMode)}
          className={`portal-button ${portalMode ? 'active' : ''}`}
          disabled={!isMyTurn}
        >
          {portalMode ? 'Cancel Portal' : 'Place Portal'}
        </button>
        
        {check.white && <div className="check-indicator">White is in check!</div>}
        {check.black && <div className="check-indicator">Black is in check!</div>}
      </div>
    </div>
  );
};

export default CustomChessBoard; 