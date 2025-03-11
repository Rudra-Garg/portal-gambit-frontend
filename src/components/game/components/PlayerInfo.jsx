import PropTypes from 'prop-types';
import { pieceSymbols } from '../utils/pieceUtils';

const PlayerInfo = ({ playerNumber, playerName, lostPieces }) => {
  const renderPieceWithCounter = (pieceData) => {
    return (
      <div key={pieceData.type} className="flex items-center mr-2">
        <span className="text-lg">{pieceSymbols[pieceData.type]}</span>
        {pieceData.count > 1 && (
          <span className="text-xs font-medium ml-1">x{pieceData.count}</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-1 rounded-lg shadow-md mb-1 flex flex-col border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mr-2 shadow-inner flex items-center justify-center text-white font-bold text-xs">
            O{playerNumber}
          </div>
          <div className="font-semibold text-gray-800 text-sm">{playerName}</div>
          <div className="flex items-center bg-gray-50 px-2 py-0.5 rounded-full">
            <div className="mr-1 text-xs text-gray-600 font-medium">X / X / X</div>
          </div>
        </div>
        <div className="flex items-center bg-gray-50 px-4 py-1 rounded-full">
          <div className="font-bold text-gray-800 text-xs">XX:XX</div>
        </div>
      </div>
      
      <div className="mt-1 flex items-center">
        <div className="flex flex-wrap min-h-[28px] bg-gray-50 rounded-md p-1 w-full">
          {lostPieces.length > 0 ? 
            lostPieces.map(piece => renderPieceWithCounter(piece)) : 
            <span className="text-gray-300 text-xs italic px-1">No pieces</span>
          }
        </div>
      </div>
    </div>
  );
};

PlayerInfo.propTypes = {
  playerNumber: PropTypes.number.isRequired,
  playerName: PropTypes.string.isRequired,
  lostPieces: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
  })).isRequired
};

export default PlayerInfo; 
