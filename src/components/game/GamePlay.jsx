import { useNavigate, useParams } from 'react-router-dom';
import PortalChessGame from './PortalChessGame';

const GamePlay = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 ">
            <div className="w-full mx-auto">
                <div className="bg-white rounded-lg shadow ">

                    <PortalChessGame gameId={gameId} />

                </div>
            </div>
        </div>
    );
};

export default GamePlay;