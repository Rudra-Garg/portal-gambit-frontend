import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { ref, push, get, update, remove } from 'firebase/database';
import { database } from '../../firebase/config';
import PortalChessGame from '../game/PortalChessGame';
import AvailableGamesComponent from './AvailableGameComponent.jsx';
import { initialBoardSetup } from '../game/chessLogic';

const GameSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [gameTime, setGameTime] = useState(5);
  const [playerColor, setPlayerColor] = useState('random');
  const [portalCount, setPortalCount] = useState(2);
  
  const [isLoading, setIsLoading] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [showAvailableGames, setShowAvailableGames] = useState(false);
  const [activeGame, setActiveGame] = useState(null);

  // Process navigation state if coming from another page
  useEffect(() => {
    if (location.state) {
      const { createGame, findGames, joinGameId, timeControl, playerColor, portalCount } = location.state;
      
      if (createGame) {
        handleCreateGame(timeControl, playerColor, portalCount);
        navigate(location.pathname, { replace: true }); // Clear state
      } else if (findGames) {
        handleFindGames(timeControl);
        navigate(location.pathname, { replace: true }); // Clear state
      } else if (joinGameId) {
        joinGame(joinGameId);
        navigate(location.pathname, { replace: true }); // Clear state
      }
    }
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleCreateGame = async (timeControl = gameTime, color = playerColor, portals = portalCount) => {
    setIsLoading(true);
    try {
      // Determine player assignment based on color preference
      let whitePlayer = null;
      let blackPlayer = null;
      let whitePlayerName =null;
      let blackPlayerName =null;

      if (color === 'white') {
        whitePlayer = user.uid;
        whitePlayerName= user.displayName||user.email;
      } else if (color === 'black') {
        blackPlayer = user.uid;
        blackPlayerName= user.displayName||user.email;
      } else if (color === 'random') {
        // Randomly assign color
        if (Math.random() > 0.5) {
          whitePlayer = user.uid;
          whitePlayerName= user.displayName||user.email;
        } else {
          blackPlayer = user.uid;
          blackPlayerName= user.displayName||user.email;
        }
      }
      
      const gameRef = push(ref(database, 'games'), {
        board: initialBoardSetup(),
        portals: {},
        current_turn: "white",
        white_player: whitePlayer,
        white_player_name: whitePlayerName||null,
        white_player_email: whitePlayer ? user.email : null,
        black_player: blackPlayer,
        black_player_name: blackPlayerName || null,
        black_player_email: blackPlayer ? user.email : null,
        status: "waiting",
        created_at: Date.now(),
        time_control: timeControl,
        whiteTime:  timeControl * 60, // Convert minutes to seconds
        blackTime: timeControl * 60,
        portal_count: portals,
        chat: {},
        lostPieces: {
          white: [],
          black: []
        }
      });
      
      setActiveGame(gameRef.key);
    } catch (error) {
      console.error('Error creating game:', error);
    }
    setIsLoading(false);
  };

  const createNewGame = () => {
    handleCreateGame();
  };

  const handleFindGames = async (preferredTimeControl = gameTime) => {
    setIsLoading(true);
    try {
      const gamesRef = ref(database, 'games');
      const snapshot = await get(gamesRef);
      const games = [];
      
      snapshot.forEach((childSnapshot) => {
        const game = childSnapshot.val();
        if (game.status === 'waiting') {
          // Check if the user is not already in this game
          const notInGame = game.white_player !== user.uid && game.black_player !== user.uid;
          
          // Check if there's a slot available (either white or black)
          const slotAvailable = !game.white_player || !game.black_player;
          
          // Filter by time control if specified
          const timeControlMatches = !preferredTimeControl || 
            game.time_control === preferredTimeControl || 
            !game.time_control;
          
          if (notInGame && slotAvailable && timeControlMatches) {
            games.push({
              id: childSnapshot.key,
              ...game
            });
          }
        }
      });
      
      setAvailableGames(games);
      setShowAvailableGames(true);
    } catch (error) {
      console.error('Error finding games:', error);
    }
    setIsLoading(false);
  };

  const findGames = () => {
    handleFindGames();
  };

  const joinGame = async (gameId) => {
    try {
      // Get current game data first
      const userName = user.displayName || user.email;
      const gameSnapshot = await get(ref(database, `games/${gameId}`));
      const gameData = gameSnapshot.val();
      
      if (!gameData) {
        console.error('Game not found');
        return;
      }
      
      const updateData = {};
      
      // Determine which role to take
      if (!gameData.white_player) {
        updateData.white_player = user.uid;
        updateData.white_player_name = userName;
        updateData.white_player_email = user.email;
      } else if (!gameData.black_player) {
        updateData.black_player = user.uid;
        updateData.black_player_name = userName;
        updateData.black_player_email = user.email;
      } else {
        console.error('No available slots in this game');
        return;
      }
      
      // If both players are now assigned, update game status
      if ((gameData.white_player || updateData.white_player) && 
          (gameData.black_player || updateData.black_player)) {
        updateData.status = 'active';
      }
      
      await update(ref(database, `games/${gameId}`), updateData);
      setActiveGame(gameId);
      setShowAvailableGames(false);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };
  
  const exitGame = async () => {
    if (activeGame) {
      try {
        // Get current game data
        const gameSnapshot = await get(ref(database, `games/${activeGame}`));
        const gameData = gameSnapshot.val();
        
        if (!gameData) {
          console.error('Game not found');
          setActiveGame(null);
          setShowAvailableGames(false);
          return;
        }
        
        const updateData = {};
        
        // Determine which player is leaving
        if (gameData.white_player === user.uid) {
          updateData.white_player = null;
          updateData.white_player_name = null;
          updateData.white_player_email = null;
        } else if (gameData.black_player === user.uid) {
          updateData.black_player = null;
          updateData.black_player_name = null;
          updateData.black_player_email = null;
        }
        
        // Check if both players will be gone after this update
        const bothPlayersLeaving = 
          (gameData.white_player === user.uid || !gameData.white_player) && 
          (gameData.black_player === user.uid || !gameData.black_player);
        
        if (bothPlayersLeaving) {
          // Delete the game if both players have left
          await remove(ref(database, `games/${activeGame}`));
          console.log('Game deleted as both players have left');
        } else {
          // Update the game with the player removed
          await update(ref(database, `games/${activeGame}`), updateData);
          console.log('Player removed from game');
        }
        
        setActiveGame(null);
        setShowAvailableGames(false);
      } catch (error) {
        console.error('Error exiting game:', error);
      }
    } else {
      setActiveGame(null);
      setShowAvailableGames(false);
    }
  };

  const backToSetup = () => {
    setShowAvailableGames(false);
  };

  return (
    <>
          {activeGame ? (
              navigate(`/gameScreen?gameId=${activeGame}`)
              // <PortalChessGame
              // gameId={activeGame}
              // exit={exitGame}
              // />
          
          ) : showAvailableGames ? (
            <AvailableGamesComponent 
            availableGames={availableGames} 
            joinGame={joinGame} 
            backToSetup={backToSetup} 
          />
          ) : (
           
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl h-full p-6 shadow-md border border-indigo-100">
                <h2 className="text-2xl font-bold text-indigo-800 mb-6">Game Setup</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block font-medium text-indigo-700 mb-3">Time Control</label>
                    <input 
                      type="range" min="3" max="10" step="1" 
                      value={gameTime} 
                      onChange={(e) => setGameTime(Number(e.target.value))} 
                      className="w-full accent-indigo-600 h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-sm text-indigo-600">
                      <span>3 min</span>
                      <span className="font-medium">{gameTime} minutes</span>
                      <span>10 min</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-indigo-700 mb-3">Play As</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['white', 'black', 'random'].map(color => (
                        <button 
                          key={color} 
                          className={`py-2 rounded-lg transition-all duration-200 ${
                            playerColor === color 
                              ? 'bg-indigo-600 text-white font-medium shadow-md' 
                              : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                          }`}
                          onClick={() => setPlayerColor(color)}
                        >
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-indigo-700 mb-3">Number of Portals</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[2, 3, 4].map(num => (
                        <button 
                          key={num} 
                          className={`py-2 rounded-lg transition-all duration-200 ${
                            portalCount === num 
                              ? 'bg-indigo-600 text-white font-medium shadow-md' 
                              : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                          }`}
                          onClick={() => setPortalCount(num)}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button 
                      onClick={createNewGame}
                      disabled={isLoading} 
                      className="py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
                    >
                      Create Game
                    </button>
                    <button 
                      onClick={findGames}
                      disabled={isLoading} 
                      className="py-3 bg-indigo-800 text-white font-bold rounded-lg hover:bg-indigo-900 transition-colors shadow-md disabled:opacity-50"
                    >
                      Find Games
                    </button>
                  </div>
                </div>
              </div>
           
          )}
        
    
    </>
  );
};

export default GameSetup;