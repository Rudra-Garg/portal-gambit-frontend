import React, { useState } from 'react';

const MatchHistory = () => {
  const [matches, setMatches] = useState([
    { id: 1, opponent: 'AliceChess42', result: 'win', date: '2025-03-10', timeControl: '5 min', playerMatches: 1780, portalCount: 2 },
    { id: 2, opponent: 'BobKnight', result: 'loss', date: '2025-03-09', timeControl: '7 min', playerMatches: 1768, portalCount: 3 },
    { id: 3, opponent: 'CharlieRook', result: 'draw', date: '2025-03-08', timeControl: '5 min', playerMatches: 1776, portalCount: 2 },
    { id: 4, opponent: 'DianaBishop', result: 'win', date: '2025-03-05', timeControl: '10 min', playerMatches: 1776, portalCount: 4 }
  ]);

  const [filter, setFilter] = useState('all');

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

  return (
    <div className="bg-white rounded-b-xl p-6 shadow-lg min-h-[500px] border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Match History</h2>
      
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
            {option.charAt(0).toUpperCase() + option.slice(1) + (option !== 'all' ? 's' : '')}
          </button>
        ))}
      </div>
      
      <div className="space-y-4 overflow-y-auto max-h-64">
        {filteredMatches.map(match => (
          <div key={match.id} className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 hover:border-gray-300 transition-all duration-200">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-gray-800">vs. {match.opponent}</div>
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
                Matches: {match.playerMatches}
              </div>
              <div className="text-gray-600 text-right">
                <span className="inline-block mr-2">🌀</span>
                Portals: {match.portalCount}
              </div>
            </div>
          </div>
        ))}
        {filteredMatches.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
            No matches found with the selected filter
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistory;