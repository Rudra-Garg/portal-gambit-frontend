import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GameSetup = () => {
  const navigate = useNavigate();
  
  const [gameTime, setGameTime] = useState(5);
  const [playerColor, setPlayerColor] = useState('random');
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [showAvailableGames, setShowAvailableGames] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [portalCount, setPortalCount] = useState(2);

  const createNewGame = () => {
    navigate('/dashboard', { 
      state: { 
        createGame: true,
        timeControl: gameTime,
        playerColor: playerColor,
        portalCount: portalCount
      } 
    });
  };

  const findGames = () => {
    navigate('/dashboard', { 
      state: { 
        findGames: true,
        preferredTimeControl: gameTime  
      } 
    });
  };

  const joinGame = (gameId) => {
    navigate('/dashboard', { state: { joinGameId: gameId } });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 shadow-md border border-indigo-100 h-full">
      <h2 className="text-2xl font-bold text-indigo-800 mb-6">Game Setup</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block font-medium text-indigo-700 mb-3">Time Control</label>
          <input 
            type="range" min="3" max="10" step="1" 
            value={gameTime} 
            onChange={(e) => setGameTime(Number(e.target.value))} 
            className="w-full accent-indigo-600 h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2 text-sm text-indigo-600">
            <span>3 min</span>
            <span className="font-medium">{gameTime} minutes</span>
            <span>10 min</span>
          </div>
        </div>

        <div>
          <label className="block font-medium text-indigo-700 mb-3">Play As</label>
          <div className="grid grid-cols-3 gap-2">
            {['white', 'black', 'random'].map(color => (
              <button 
                key={color} 
                className={`py-2 rounded-lg transition-all duration-200 ${
                  playerColor === color 
                    ? 'bg-indigo-600 text-white font-medium shadow-md' 
                    : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                }`}
                onClick={() => setPlayerColor(color)}
              >
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-indigo-700 mb-3">Number of Portals</label>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4].map(num => (
              <button 
                key={num} 
                className={`py-2 rounded-lg transition-all duration-200 ${
                  portalCount === num 
                    ? 'bg-indigo-600 text-white font-medium shadow-md' 
                    : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                }`}
                onClick={() => setPortalCount(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button 
            onClick={createNewGame} 
            disabled={isGameLoading} 
            className="py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
          >
            Create Game
          </button>
          <button 
            onClick={findGames} 
            disabled={isGameLoading} 
            className="py-3 bg-indigo-800 text-white font-bold rounded-lg hover:bg-indigo-900 transition-colors shadow-md disabled:opacity-50"
          >
            Find Games
          </button>
        </div>
      </div>
    
      {showAvailableGames && availableGames.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow border border-indigo-100">
          <h3 className="text-lg font-semibold text-indigo-700 mb-3">Available Games</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableGames.map((game) => (
              <div key={game.id} className="flex justify-between items-center p-3 border-b border-indigo-100 hover:bg-indigo-50 rounded transition-colors">
                <span className="text-indigo-800 font-medium">
                  {game.white_player_email || game.black_player_email || 'Open Game'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{game.time_control || 5} min</span>
                  <button 
                    onClick={() => joinGame(game.id)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSetup;