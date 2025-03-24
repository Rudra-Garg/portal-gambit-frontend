import React from 'react';
import PropTypes from 'prop-types';
import LostPiecesDisplay from './LostPiecesDisplay';
const formatTime = (seconds) => {
  if (seconds === null) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const PlayerInfo = ({ isTopPlayer, playerNumber, playerName, isMyTurn, lostPieces, playerColor,timeRemaining }) => {
  return (
    <div className="bg-white p-1 rounded-lg shadow-md mb-1 flex flex-col border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mr-2 shadow-inner 
                          flex items-center justify-center text-white font-bold text-xs 
                          ${isMyTurn ? 'ring-2 ring-yellow-400' : ''}`}>
            {isTopPlayer ? "p2" : "p1"}
          </div>
          <div className="font-semibold text-gray-800 text-sm">
            {playerName}
          </div>
          <div className="flex items-center bg-gray-50 px-2 py-0.5 rounded-full ml-2">
            <div className="mr-1 text-xs text-gray-600 font-medium">0 / 0 / 0</div>
          </div>
        </div>
        <div className="flex items-center bg-gray-50 px-4 py-1 rounded-full">
        <div className="timer-display text-xl font-bold">
  {formatTime(timeRemaining)}
</div>
        </div>
      </div>
      
      <div className="mt-1 flex items-center">
        <LostPiecesDisplay 
          lostPieces={typeof lostPieces === 'object' ? lostPieces : { white: [], black: [] }} 
          color={playerColor} 
        />
      </div>
    </div>
  );
};

PlayerInfo.propTypes = {
  isTopPlayer: PropTypes.bool.isRequired,
  playerNumber: PropTypes.number.isRequired,
  playerName: PropTypes.string.isRequired,
  isMyTurn: PropTypes.bool.isRequired,
  lostPieces: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.shape({
      white: PropTypes.array,
      black: PropTypes.array
    })
  ]),
  playerColor: PropTypes.string.isRequired
};

export default PlayerInfo;