import PropTypes from 'prop-types';
import { ref, push, set } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const GameEndPopup = ({ winner, reason, onClose, onRematch, gameId, disableRematch }) => {
    const { user } = useAuth();

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
            case 'abandoned':
                return `Game Over! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins by abandonment!`;
            default:
                return 'Game Over!';
        }
    };

    const handleRematch = async () => {
        try {
            const notificationRef = push(ref(database, `games/${gameId}/notifications`));
            await set(notificationRef, {
                type: 'rematch_request',
                from: user.uid,
                fromName: user.displayName || user.email,
                timestamp: Date.now()
            });
            onRematch();
        } catch (error) {
            console.error('Error sending rematch notification:', error);
        }
    };

    const handleExit = () => {
        onClose();
        window.location.href = "/profile";
    };

    const isWaiting = reason === 'waiting';
    const displayMessage = isWaiting ? "Waiting for the other player to join..." : getMessage();

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white/90 p-6 rounded-lg shadow-lg backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4">{displayMessage}</h2>
                <div className="flex justify-center gap-4">
                    {!isWaiting ? (
                        <>
                            <button
                                onClick={handleRematch}
                                disabled={disableRematch}
                                className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${disableRematch ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

GameEndPopup.propTypes = {
    winner: PropTypes.oneOf(['white', 'black', 'draw', null]),
    reason: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onRematch: PropTypes.func.isRequired,
    gameId: PropTypes.string,
    disableRematch: PropTypes.bool,
};

export default GameEndPopup;