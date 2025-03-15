import React from 'react';
import PropTypes from 'prop-types';

const GameHistory = ({ moveHistory = [], portalMode, setPortalMode, isMyTurn, onLeaveGame }) => {
  // Format date for display
  const formattedDate = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  return (
    <div 
      className="bg-gradient-to-b from-gray-50 to-gray-100 flex-grow mb-2 rounded-lg border border-gray-200 shadow-inner flex flex-col" 
      style={{ maxHeight: "471px" }}
    >
      {/* Header with date and user info */}
      <div className="flex justify-between items-center p-2 border-b border-gray-200 flex-shrink-0">
        <div className="text-xs text-center text-gray-500 w-full">
          {formattedDate}
        </div>
      </div>

      {/* Move history section with scrolling */}
      <div 
        className="overflow-y-auto p-3 flex-grow rounded-md border border-gray-200 shadow-inner bg-gray-50" 
      >
        {moveHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 italic text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>No moves yet. Game will start soon.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Game start indicator */}
            <div className="flex justify-center mb-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-4 py-1 text-xs font-medium shadow-sm">
                Game started
              </div>
            </div>
            
            {/* Actual move history */}
            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, turnIndex) => {
                const whiteIndex = turnIndex * 2;
                const blackIndex = whiteIndex + 1;
                const whiteMove = moveHistory[whiteIndex];
                const blackMove = blackIndex < moveHistory.length ? moveHistory[blackIndex] : null;
                
                return (
                  <div key={turnIndex} className="flex flex-col sm:flex-row gap-1">
                    {/* Move number */}
                    <div className="w-10 text-xs font-semibold text-gray-500 flex items-center justify-center rounded-md bg-gray-100 shadow-sm">
                      {turnIndex + 1}
                    </div>
                    
                    {/* Moves container */}
                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {/* White's move */}
                      {whiteMove && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm transition-all hover:shadow-md">
                          <div className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <div className="text-blue-800 text-sm font-medium">
                            {whiteMove.piece.toUpperCase() + whiteMove.from + whiteMove.to}
                            {whiteMove.captured && (
                              <span className="font-bold text-blue-800 inline-flex items-center">
                                {" x "}
                                {whiteMove.captured.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Black's move */}
                      {blackMove && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 shadow-sm transition-all hover:shadow-md">
                          <div className="h-3 w-3 rounded-full bg-purple-500 flex-shrink-0"></div>
                          <div className="text-purple-800 text-sm font-medium">
                            {blackMove.piece.toUpperCase() + blackMove.from + blackMove.to}
                            {blackMove.captured && (
                              <span className="font-bold text-purple-800 inline-flex items-center">
                                {" x "}
                                {blackMove.captured.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with action buttons */}
      <div className="p-2 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
        <button 
          onClick={() => setPortalMode(!portalMode)}
          className={`bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center ${portalMode ? 'ring-2 ring-blue-300' : ''}`}
          disabled={!isMyTurn()}
        >
          {portalMode ? 'Cancel Portal' : 'Place Portal'}
        </button>
        <button 
          onClick={onLeaveGame}
          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Leave Game
        </button>
      </div>
    </div>
  );
};

GameHistory.propTypes = {
  moveHistory: PropTypes.arrayOf(PropTypes.shape({
    piece: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    captured: PropTypes.string
  })),
  portalMode: PropTypes.bool.isRequired,
  setPortalMode: PropTypes.func.isRequired,
  isMyTurn: PropTypes.func.isRequired,
  onLeaveGame: PropTypes.func
};

export default GameHistory;