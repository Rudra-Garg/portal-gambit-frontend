import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useState } from 'react';
import { ref, push, get, update } from 'firebase/database';
import { database } from '../firebase/config';
import PortalChessGame from './game/PortalChessGame';
import { initialBoardSetup } from './game/chessLogic';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeGame, setActiveGame] = useState(null);
    const [availableGames, setAvailableGames] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    console.log('User:', user);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const createNewGame = async () => {
        setIsLoading(true);
        try {
            const gameRef = push(ref(database, 'games'), {
                board: initialBoardSetup(),
                portals: {},
                current_turn: "white",
                white_player: user.uid,
                white_player_email: user.email,
                status: "waiting",
                created_at: Date.now(),
                chat: {}
            });
            setActiveGame(gameRef.key);
        } catch (error) {
            console.error('Error creating game:', error);
        }
        setIsLoading(false);
    };

    const findGames = async () => {
        setIsLoading(true);
        try {
            const gamesRef = ref(database, 'games');
            const snapshot = await get(gamesRef);
            const games = [];
            snapshot.forEach((childSnapshot) => {
                const game = childSnapshot.val();
                if (game.status === 'waiting' && game.white_player !== user.uid) {
                    games.push({
                        id: childSnapshot.key,
                        ...game
                    });
                }
            });
            setAvailableGames(games);
        } catch (error) {
            console.error('Error finding games:', error);
        }
        setIsLoading(false);
    };

    const joinGame = async (gameId) => {
        try {
            await update(ref(database, `games/${gameId}`), {
                black_player: user.uid,
                black_player_email: user.email,
                status: 'active'
            });
            setActiveGame(gameId);
        } catch (error) {
            console.error('Error joining game:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Portal Chess</h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Welcome, {user?.email}</p>
                    </div>

                    {!activeGame ? (
                        <div className="border-t pt-4">
                            <h2 className="text-xl font-semibold mb-4">Game Options</h2>
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={createNewGame}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                                >
                                    Create New Game
                                </button>
                                <button
                                    onClick={findGames}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
                                >
                                    Find Games
                                </button>
                            </div>

                            {availableGames.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Available Games</h3>
                                    <div className="space-y-2">
                                        {availableGames.map((game) => (
                                            <div
                                                key={game.id}
                                                className="flex items-center justify-between p-3 border rounded"
                                            >
                                                <span className="text-gray-600">
                                                    Game with {game.white_player_email}
                                                </span>
                                                <button
                                                    onClick={() => joinGame(game.id)}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    Join
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Current Game</h2>
                                <button
                                    onClick={() => setActiveGame(null)}
                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Exit Game
                                </button>
                            </div>
                            <PortalChessGame gameId={activeGame} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;