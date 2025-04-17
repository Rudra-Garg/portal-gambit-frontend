import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BACKEND_URL } from '../../config.js';

const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [opponentProfiles, setOpponentProfiles] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchMatchHistory = async () => {
      if (!user || !user.uid) return;
      
      try {
        setLoading(true);
        const response = await fetch(
          `${BACKEND_URL}/history/users/${user.uid}/games?limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch match history');
        }

        const data = await response.json();
        
        // Get unique opponent IDs
        const opponentIds = [...new Set(data.map(game => 
          game.white_player_id === user.uid ? game.black_player_id : game.white_player_id
        ))];
        
        // Fetch opponent profiles
        const profilesData = {};
        await Promise.all(opponentIds.map(async (opponentId) => {
          try {
            const profileResponse = await fetch(
              `${BACKEND_URL}/profiles/${opponentId}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
              }
            );
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              profilesData[opponentId] = profileData;
            }
          } catch (err) {
            console.error(`Error fetching profile for ${opponentId}:`, err);
          }
        }));
        
        setOpponentProfiles(profilesData);
        
        // Transform the API data to match our component's format
        const formattedMatches = data.map(game => {
          // Determine if the current user won or lost
          const isUserWhite = game.white_player_id === user.uid;
          let result;
          let opponentId;
          
          if (game.result === 'draw') {
            result = 'draw';
          } else if ((isUserWhite && game.result === 'white_win') || 
                     (!isUserWhite && game.result === 'black_win')) {
            result = 'win';
          } else {
            result = 'loss';
          }
          
          // Get opponent ID
          opponentId = isUserWhite ? game.black_player_id : game.white_player_id;
          
          // Format date from ISO string
          const date = new Date(game.start_time).toLocaleDateString();
          
          // Format time control (convert seconds to minutes)
          const timeControlMinutes = Math.floor(game.time_control.initial / 60);
          const timeControl = `${timeControlMinutes} min`;
          
          // Get player's rating
          const playerRating = isUserWhite ? game.white_rating : game.black_rating;
          
          // Get portal count
          const portalCount = typeof game.game_type === 'string' && 
                              game.game_type.startsWith('portal_gambit_') 
                                ? game.game_type.replace('portal_gambit_', '') 
                                : game.game_type || 0;
          
          return {
            id: game.game_id,
            opponentId,
            result,
            date,
            timeControl,
            playerMatches: playerRating,
            portalCount: parseInt(portalCount)
          };
        });
        
        setMatches(formattedMatches);
        setError(null);
      } catch (err) {
        console.error('Error fetching match history:', err);
        setError('Failed to load match history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchHistory();
  }, [user]);

  const filteredMatches = filter === 'all' ? matches : matches.filter(match => match.result === filter);

  const getResultColor = (result) => {
    switch (result) {
      case 'win': return 'bg-green-100 text-green-800 border-green-200';
      case 'loss': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'win': return '↑';
      case 'loss': return '↓';
      default: return '⟷';
    }
  };
  
  // Get opponent display name
  const getOpponentName = (opponentId) => {
    if (opponentProfiles[opponentId]) {
      return opponentProfiles[opponentId].username || 
             opponentProfiles[opponentId].displayName || 
             opponentId.substring(0, 8);
    }
    return opponentId.substring(0, 8) + "...";
  };

  return (
    <div className="bg-indigo-100 h-full p-6 shadow-md">
      <h2 className="text-2xl font-bold text-indigo-800 mb-6">Match History</h2>

      <div className="flex gap-2 mb-6">

      {['all', 'win', 'loss', 'draw'].map(option => (
        <button 
          key={option} 
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === option 
              ? 'bg-gray-800 text-white font-medium' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter(option)}
        >
          {option === 'all' ? 'All' : 
          option === 'loss' ? 'Loss' : 
          option.charAt(0).toUpperCase() + option.slice(1) + 's'}
        </button>
      ))}
    </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg border border-red-100">
          {error}
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-64">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => (
              <div key={match.id} className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 hover:border-gray-300 transition-all duration-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-800">
                    vs. {getOpponentName(match.opponentId)}
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full border ${getResultColor(match.result)}`}>
                    {getResultIcon(match.result)} {match.result.toUpperCase()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">
                    <span className="inline-block mr-2">📅</span>
                    {match.date}
                  </div>
                  <div className="text-gray-600 text-right">
                    <span className="inline-block mr-2">⏱️</span>
                    {match.timeControl}
                  </div>
                  <div className="text-gray-600">
                    <span className="inline-block mr-2">📊</span>
                    Rating: {match.playerMatches}
                  </div>
                  <div className="text-gray-600 text-right">
                    <span className="inline-block mr-2">🌀</span>
                    Portals: {match.portalCount}
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
              No matches found with the selected filter
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MatchHistory;