import { useNavigate, useParams } from 'react-router-dom';
import PortalChessGame from './PortalChessGame';

const GamePlay = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Current Game</h2>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Exit Game
                            </button>
                        </div>
                        <PortalChessGame gameId={gameId} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamePlay;