import PropTypes from 'prop-types';

const GameHistory = ({ moveHistory, portalMode, setPortalMode, isMyTurn }) => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 flex-grow mb-2 rounded-lg border border-gray-200 shadow-inner flex flex-col" style={{ maxHeight: "471.48px" }}>
      {/* Header with date and user info */}
      <div className="flex justify-between items-center p-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-2">
            {"dev-rahul-1".substring(0, 2).toUpperCase()}
          </div>
          <h3 className="text-sm font-medium text-gray-800">{"dev-rahul-1"}</h3>
        </div>
        <div className="text-xs text-gray-500">
          2025-03-02 10:03:20 UTC
        </div>
      </div>
      
      {/* Move history section with scrolling */}
      <div className="overflow-y-auto p-2 flex-grow" style={{ minHeight: "0px" }}>
        {moveHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 italic text-sm">
            No moves yet. Game will start soon.
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Game start indicator */}
            <div className="flex justify-center mb-2">
              <div className="bg-gray-200 text-gray-600 rounded-full px-3 py-0.5 text-xs">
                Game started
              </div>
            </div>
            
            {/* Actual move history */}
            {moveHistory.map((move, index) => {
              const isPlayer1 = index % 2 === 0;
              return (
                <div key={index} className="flex items-center">
                  <div className="w-16 text-xs text-gray-500 flex-shrink-0">
                    {Math.floor(index/2) + 1}.{isPlayer1 ? '' : '..'}
                  </div>
                  <div className={`px-2 py-1 rounded ${
                    isPlayer1 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  } text-sm flex-grow`}>
                    {move.piece.toUpperCase() + move.from + move.to}
                    {move.captured ? 
                      <span className="font-medium text-red-600"> x{move.captured.toUpperCase()}</span> 
                      : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer with action buttons */}
      <div className="p-2 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
        <button 
          onClick={() => setPortalMode(!portalMode)}
          className={`portal-button ${portalMode ? 'active' : ''} bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center`}
          disabled={!isMyTurn()}
        >
          {portalMode ? 'Cancel Portal' : 'Place Portal'}
        </button>
        <button 
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
  })).isRequired,
  portalMode: PropTypes.bool.isRequired,
  setPortalMode: PropTypes.func.isRequired,
  isMyTurn: PropTypes.func.isRequired
};

export default GameHistory; 