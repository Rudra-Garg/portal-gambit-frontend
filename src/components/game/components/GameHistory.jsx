import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

const GameHistory = ({ moveHistory = [], portalMode, setPortalMode, isMyTurn, exit }) => {
  const getMoveDisplay = useCallback((move) => {
    if (!move) return '';

    if (move.portal) {
      return `Portal ${move.from}↔${move.to}`;
    }
    if (move.via) {
      return `${move.piece.toUpperCase()}${move.from}→${move.via}→${move.to}`;
    }
    return move.san || `${move.piece.toUpperCase()}${move.from}-${move.to}`;
  }, []);

  const formattedDate = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  return (
    <div className="bg-indigo-100 flex-grow mb-2 rounded-lg border border-indigo-200 flex flex-col overflow-hidden"      style={{ maxHeight: "471px" }}>
      <div className="relative flex justify-end items-center p-2 border-b border-gray-200 flex-shrink-0 space-x-2"> 
        <div className="absolute left-1/2 transform -translate-x-1/2 text-m text-center text-indigo-800 font-medium pointer-events-none"> 
          Moves
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 z-10">
          <button
            onClick={() => setPortalMode(!portalMode)}
            className={`bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center ${portalMode ? 'ring-2 ring-blue-300' : ''} disabled:opacity-50 disabled:cursor-not-allowed`} 
            disabled={!isMyTurn()}
          >
            {portalMode ? 'Cancel Portal' : 'Place Portal'}
          </button>
          <button
            onClick={exit}
            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave Game
          </button>
        </div>
      </div>


      <div className="overflow-y-auto p-3 flex-grow border border-indigo-200 bg-indigo-100">
        {moveHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 italic text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {portalMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              )}
            </svg>
            <span>
              {portalMode ? 'Select two squares to place a portal' : 'No moves yet. Game will start soon.'}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center mb-3">
              <div className="bg-indigo-100 text-gray-500 px-4 py-1 text-xs font-medium">
                Game started
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, turnIndex) => {
                const whiteIndex = turnIndex * 2;
                const blackIndex = whiteIndex + 1;
                const whiteMove = moveHistory[whiteIndex];
                const blackMove = blackIndex < moveHistory.length ? moveHistory[blackIndex] : null;

                return (
                  <div key={turnIndex} className="flex flex-col sm:flex-row gap-1">
                    <div className="w-10 text-xs font-semibold text-gray-500 flex items-center justify-center bg-indigo-100">
                      {turnIndex + 1}
                    </div>

                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {whiteMove && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${whiteMove.portal
                          ? 'bg-gradient-to-bl from-green-200 to-green-100 border border-green-200'
                          : 'bg-gradient-to-bl from-blue-200 to-blue-100 border border-blue-200'
                          } shadow-sm transition-all hover:shadow-md`}>
                          <div className={`h-3 w-3 rounded-full ${whiteMove.portal ? 'bg-green-500' : 'bg-blue-500'} flex-shrink-0`}></div>
                          <div className={`${whiteMove.portal ? 'text-green-800' : 'text-blue-800'} text-sm font-medium`}>
                            {getMoveDisplay(whiteMove)}
                          </div>
                        </div>
                      )}

                      {blackMove && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${blackMove.portal
                          ? 'bg-gradient-to-bl from-green-200 to-green-100 border border-green-200'
                          : 'bg-gradient-to-bl from-purple-200 to-purple-100 border border-purple-200'
                          } shadow-sm transition-all hover:shadow-md`}>
                          <div className={`h-3 w-3 rounded-full ${blackMove.portal ? 'bg-green-500' : 'bg-purple-500'} flex-shrink-0`}></div>
                          <div className={`${blackMove.portal ? 'text-green-800' : 'text-purple-800'} text-sm font-medium`}>
                            {getMoveDisplay(blackMove)}
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

      
    </div>
  );
};

GameHistory.propTypes = {
  moveHistory: PropTypes.arrayOf(PropTypes.shape({
    piece: PropTypes.string,
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    captured: PropTypes.string,
    portal: PropTypes.bool,
    via: PropTypes.string,
    san: PropTypes.string
  })),
  portalMode: PropTypes.bool.isRequired,
  setPortalMode: PropTypes.func.isRequired,
  isMyTurn: PropTypes.func.isRequired,
  exit: PropTypes.func.isRequired
};

export default GameHistory;