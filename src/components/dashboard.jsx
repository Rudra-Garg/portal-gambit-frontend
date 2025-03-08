import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useState, useEffect } from 'react';
import { ref, push, get, update } from 'firebase/database';
import { database } from '../firebase/config';
import PortalChessGame from './game/PortalChessGame';
import { initialBoardSetup } from './game/chessLogic';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeGame, setActiveGame] = useState(null);
    const [availableGames, setAvailableGames] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    console.log('User:', user);

    // Check for incoming game parameters from profile page
    useEffect(() => {
        const handleIncomingGameRequest = async () => {
            if (location.state) {
                // If a game is being created from the profile page
                if (location.state.createGame) {
                    const { timeControl, playerColor } = location.state;
                    createNewGameWithParams(timeControl, playerColor);
                }
                // If a game is being joined from the profile page
                else if (location.state.joinGameId) {
                    joinGame(location.state.joinGameId);
                }
                // If find games is being requested from the profile page
                else if (location.state.findGames) {
                    findGames();
                }
            }
        };

        handleIncomingGameRequest();
    }, [location.state]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const navigateToProfile = () => {
        navigate(`/profile/${user.uid}`);
    };
    
    const createNewGameWithParams = async (timeControl = 5, playerColor = 'white') => {
        setIsLoading(true);
        try {
            const gameConfig = {
                board: initialBoardSetup(),
                portals: {},
                current_turn: "white",
                time_control: timeControl,
                status: "waiting",
                created_at: Date.now(),
                chat: {}
            };

            // Set player based on color selection
            if (playerColor === 'white' || (playerColor === 'random' && Math.random() > 0.5)) {
                gameConfig.white_player = user.uid;
                gameConfig.white_player_email = user.email;
            } else {
                gameConfig.black_player = user.uid;
                gameConfig.black_player_email = user.email;
            }

            const gameRef = push(ref(database, 'games'), gameConfig);
            setActiveGame(gameRef.key);
        } catch (error) {
            console.error('Error creating game:', error);
        }
        setIsLoading(false);
    };

    const createNewGame = async () => {
        // Use default settings if called directly from dashboard
        createNewGameWithParams();
    };

    const findGames = async () => {
        setIsLoading(true);
        try {
            const gamesRef = ref(database, 'games');
            const snapshot = await get(gamesRef);
            const games = [];
            snapshot.forEach((childSnapshot) => {
                const game = childSnapshot.val();
                // Check if the game is waiting and the current user isn't already a player
                if (game.status === 'waiting' && 
                    game.white_player !== user.uid && 
                    game.black_player !== user.uid) {
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
        setIsLoading(true);
        try {
            const gameRef = ref(database, `games/${gameId}`);
            const snapshot = await get(gameRef);
            const game = snapshot.val();
            
            // Determine which role to take (white or black)
            let updateData = {
                status: 'active'
            };
            
            if (!game.white_player) {
                updateData.white_player = user.uid;
                updateData.white_player_email = user.email;
            } else if (!game.black_player) {
                updateData.black_player = user.uid;
                updateData.black_player_email = user.email;
            } else {
                console.error('Game already has both players');
                setIsLoading(false);
                return;
            }
            
            await update(ref(database, `games/${gameId}`), updateData);
            setActiveGame(gameId);
        } catch (error) {
            console.error('Error joining game:', error);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Portal Chess</h1>
                        <div className="flex space-x-3">
                            <button
                                onClick={navigateToProfile}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                View Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Welcome, {user?.email}</p>
                    </div>

                    {!activeGame ? (
                        <div className="border-t pt-4">
                            <h2 className="text-xl font-semibold mb-4">Game Options</h2>
                            <div className="flex gap-4 mb-6">
                              
                            </div>

                            {isLoading && (
                                <div className="flex justify-center my-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            )}

                            {availableGames.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Available Games</h3>
                                    <div className="space-y-2">
                                        {availableGames.map((game) => (
                                            <div
                                                key={game.id}
                                                className="flex items-center justify-between p-3 border rounded"
                                            >
                                                <div>
                                                    <span className="text-gray-600">
                                                        {game.white_player_email ? `Game with ${game.white_player_email}` : 
                                                        game.black_player_email ? `Game with ${game.black_player_email}` : 
                                                        'Open Game'}
                                                    </span>
                                                   
                                                </div>
                                                <button
                                                    onClick={() => joinGame(game.id)}
                                                    disabled={isLoading}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                                                >
                                                    Join
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {availableGames.length === 0 && !isLoading && (
                                <div className="text-center text-gray-500 my-4">
                                    No available games found. Create a new game or try again later.
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