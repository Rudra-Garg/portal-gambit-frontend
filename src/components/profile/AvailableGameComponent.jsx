import React from 'react';
import PropTypes from 'prop-types';

function AvailableGamesComponent({ availableGames, joinGame, backToSetup }) {
  return (
    <div className="bg-indigo-100 rounded-xl h-full p-6 shadow-md border border-indigo-100">
      <h2 className="text-xl font-bold text-indigo-800 mb-6">Available Games</h2>

      {availableGames.length > 0 ? (
        <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableGames.map((game) => (
              <div
                key={game.id}
                className="flex justify-between items-center p-3 border-b border-indigo-100 hover:bg-indigo-50 rounded transition-colors"
              >
                <div>
                  <span className="text-indigo-800 font-medium">
                    {game.white_player_email || game.black_player_email || 'Open Game'}
                  </span>
                  <div className="text-xs text-gray-500">
                    Time: {game.time_control} min | Portals: {game.portal_count}
                  </div>
                </div>
                <button
                  onClick={() => joinGame(game.id)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No available games found.</p>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={backToSetup}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to Game Setup
        </button>
      </div>
    </div>
  );
}

AvailableGamesComponent.propTypes = {
  availableGames: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      white_player_email: PropTypes.string,
      black_player_email: PropTypes.string,
      time_control: PropTypes.number,
      portal_count: PropTypes.number,
    })
  ).isRequired,
  joinGame: PropTypes.func.isRequired,
  backToSetup: PropTypes.func.isRequired,
};

export default AvailableGamesComponent;
