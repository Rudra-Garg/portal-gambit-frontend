import React from 'react';
import PropTypes from 'prop-types';
import LostPiecesDisplay from './LostPiecesDisplay';

const formatTime = (seconds) => {
  if (seconds === null) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const PlayerInfo = ({ isTopPlayer, playerNumber, playerName, isMyTurn, lostPieces, playerColor, timeRemaining }) => {
  return (
    <div className="bg-indigo-100 p-1 rounded-lg flex flex-col border border-indigo-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-grow min-w-0 mr-2"> {/* Added flex-grow, min-w-0, mr-2 */}
          <div className={`w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mr-2 shadow-inner
                          flex items-center justify-center text-white font-bold text-xs
                          ${isMyTurn ? 'ring-2 ring-yellow-400' : ''}`}>
            {isTopPlayer ? "p2" : "p1"}
          </div>
          <div className="font-semibold text-gray-800 text-sm truncate mr-2"> {/* Added truncate, mr-2 */}
            {playerName}
          </div>
          {/* Moved LostPiecesDisplay here */}
          <div className="flex-shrink-0"> {/* Added flex-shrink-0 */}
            <LostPiecesDisplay
              lostPieces={typeof lostPieces === 'object' ? lostPieces : { white: [], black: [] }}
              color={playerColor}
            />
          </div>
          {/* Removed the 0/0/0 display div */}
        </div>
        <div className="flex items-center bg-indigo-100 px-4 py-1 rounded-full flex-shrink-0"> {/* Added flex-shrink-0 */}
          <div className="timer-display text-xl font-bold">
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>
      {/* Removed the second row that previously contained LostPiecesDisplay */}
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
  playerColor: PropTypes.string.isRequired,
  timeRemaining: PropTypes.number // Assuming timeRemaining is a number of seconds
};

export default PlayerInfo;