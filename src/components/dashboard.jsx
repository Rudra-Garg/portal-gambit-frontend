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
  
  // Process location state for automatic game creation or joining
  useEffect(() => {
    const processLocationState = async () => {
      if (location.state) {
        // Handle create game request from profile page
        if (location.state.createGame) {
          const { timeControl, playerColor } = location.state;
          await handleCreateGame(timeControl, playerColor);
        }
        
        // Handle find games request from profile page
        if (location.state.findGames) {
          await findGames(location.state.preferredTimeControl);
        }
        
        // Handle join game request from profile page
        if (location.state.joinGameId) {
          await joinGame(location.state.joinGameId);
        }
      }
    };
    
    processLocationState();
  }, [location.state]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleGoToProfile = () => {
    navigate('/profile/ProfilePage');
  };

  const handleCreateGame = async (timeControl = 5, playerColor = 'white') => {
    setIsLoading(true);
    try {
      // Get the user's name from auth or default to email
      const userName = user.displayName || user.email;
      
      // Determine which color the creator will play based on playerColor
      let whitePlayer, whitePlayerName, whitePlayerEmail;
      let blackPlayer, blackPlayerName, blackPlayerEmail;
      let gameStatus = 'waiting';
      
      // Set up player assignment based on color preference
      if (playerColor === 'random') {
        // Randomly assign color
        if (Math.random() < 0.5) {
          playerColor = 'white';
        } else {
          playerColor = 'black';
        }
      }
      
      if (playerColor === 'white') {
        whitePlayer = user.uid;
        whitePlayerName = userName;
        whitePlayerEmail = user.email;
      } else {
        blackPlayer = user.uid;
        blackPlayerName = userName;
        blackPlayerEmail = user.email;
      }
      
      const gameRef = push(ref(database, 'games'));
      const newGameId = gameRef.key;

      const updates = {};
      updates[`games/${newGameId}`] = {
        board: initialBoardSetup(),
        portals: {},
        current_turn: 'white',
        white_player: whitePlayer || null,
        white_player_name: whitePlayerName || null,
        white_player_email: whitePlayerEmail || null,
        black_player: blackPlayer || null,
        black_player_name: blackPlayerName || null,
        black_player_email: blackPlayerEmail || null,
        status: gameStatus,
        created_at: Date.now(),
        time_control: timeControl,
        chat: {},
        lostPieces: {
          white: [],
          black: []
        }
      };

      await update(ref(database), updates);
      setActiveGame(newGameId);

    } catch (error) {
      console.error('Error creating game:', error);
    }
    setIsLoading(false);
  };

  const createNewGame = () => handleCreateGame();

  const findGames = async (preferredTimeControl = null) => {
    setIsLoading(true);
    try {
      const gamesRef = ref(database, 'games');
      const snapshot = await get(gamesRef);
      const games = [];
      
      snapshot.forEach((childSnapshot) => {
        const game = childSnapshot.val();
        const isValidGame = game.status === 'waiting';
        const isNotCreator = 
          (game.white_player && game.white_player !== user.uid) || 
          (game.black_player && game.black_player !== user.uid);
        const hasSpotAvailable = !game.white_player || !game.black_player;
        
        // Filter by time control if specified
        const matchesTimeControl = preferredTimeControl 
          ? game.time_control === preferredTimeControl 
          : true;
        
        if (isValidGame && isNotCreator && hasSpotAvailable && matchesTimeControl) {
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
      const userName = user.displayName || user.email;
      
      // Get current game data
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);
      const game = snapshot.val();
      
      const updates = {};
      
      // Determine which color slot is available
      if (!game.white_player) {
        updates.white_player = user.uid;
        updates.white_player_name = userName;
        updates.white_player_email = user.email;
      } else if (!game.black_player) {
        updates.black_player = user.uid;
        updates.black_player_name = userName;
        updates.black_player_email = user.email;
      }
      
      // Check if game can now be set to active
      if ((game.white_player || updates.white_player) && 
          (game.black_player || updates.black_player)) {
        updates.status = 'active';
      }
      
      await update(ref(database, `games/${gameId}`), updates);
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
            <div className="flex space-x-3">
              <button
                onClick={handleGoToProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Profile
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
                <button
                  onClick={createNewGame}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  Create New Game
                </button>
                <button
                  onClick={() => findGames()}
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
                        <div className="flex flex-col">
                          <span className="text-gray-600">
                            Game with {game.white_player_email || game.black_player_email}
                          </span>
                          {game.time_control && (
                            <span className="text-sm text-gray-500">
                              Time: {game.time_control} minutes
                            </span>
                          )}
                        </div>
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