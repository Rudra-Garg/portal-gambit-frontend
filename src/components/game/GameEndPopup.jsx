import React from 'react';

const GameEndPopup = ({ winner, reason, onClose, onRematch, onExit }) => {
    const getMessage = () => {
        switch (reason) {
            case 'checkmate':
                return `Game Over! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins by checkmate!`;
            case 'stalemate':
                return 'Game Over! Draw by stalemate';
            case 'draw':
                return 'Game Over! Draw by agreement';
            case 'timeout':
                return `Game Over! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins on time!`;
            default:
                return 'Game Over!';
        }
    };
    const handleExit = () => {
        onClose();  // Close the popup first
         // Then call the exit handler
        
        // Add a small delay before navigation
          // Use navigate from react-router-dom
          window.location.href = "/profile";
       
      };
      

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">{getMessage()}</h2>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onRematch}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Rematch
                    </button>
                    <button
                        onClick={handleExit}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Exit
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameEndPopup;