import React from 'react';
import PropTypes from 'prop-types';

const TimeoutPopup = ({ winner, onClose, onRematch, onExit }) => {
  const handleRematch = () => {
    onRematch();
    onClose();
  };

  const handleExit = () => {
    onExit();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-4">Game Over!</h2>
        <p className="text-center text-lg mb-6">
          {winner === 'white' ? 'Black' : 'White'} ran out of time. 
          {winner.charAt(0).toUpperCase() + winner.slice(1)} wins!
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRematch}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Rematch
          </button>
          <button
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Exit Game
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

TimeoutPopup.propTypes = {
  winner: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onRematch: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired
};

export default TimeoutPopup;