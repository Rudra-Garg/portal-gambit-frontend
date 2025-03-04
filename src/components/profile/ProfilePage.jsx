import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

const ProfilePage = ({ userId }) => {
  // State for player data
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Game setup states
  const [gameTime, setGameTime] = useState(5);
  const [playerColor, setPlayerColor] = useState('random');

  // Simulated API call to fetch player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const data = {
          id: userId || 'chess001',
          username: 'ChessMaster2024',
          email: 'mail@gmail.com',
          avatar: '/api/placeholder/150/150',
          joinDate: '2023-06-15',
          country: 'United States',
          age: 28,
          stats: {
            wins: 187,
            losses: 103,
            draws: 22,
            winRate: 64.5,
            totalGames: 312,
            winPercentage: 60,
            drawPercentage: 7,
            lossPercentage: 33
          },
          friends: [
            { id: 'friend1', username: 'ProPlayer', status: 'Online' },
            { id: 'friend2', username: 'KnightOwl', status: 'Offline' },
            { id: 'friend3', username: 'JackJon', status: 'Away' },
            { id: 'friend4', username: 'Alphant', status: 'Online' },
          ],
          matches: [
            {
              id: 'match001',
              date: '2025-03-01T18:30:00',
              opponent: 'ProPlayer',
              result: 'Victory',
              timeControl: '5+2',
            },
            {
              id: 'match002',
              date: '2025-02-28T20:15:00',
              opponent: 'KnightOwl',
              result: 'Defeat',
              timeControl: '3+0',
            },
            {
              id: 'match003',
              date: '2025-02-28T16:40:00',
              opponent: 'JackJon',
              result: 'Draw',
              timeControl: '10',
            }
          ]
        };
        setPlayerData(data);
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [userId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Error state
  if (!playerData) {
    return <div className="profile-error">Error loading profile data</div>;
  }

  return (
    <div className="profile-page-container">
      <div className="profile-grid">
        {/* Profile Block */}
        <div className="profile-block">
          <div className="profile-header">
            <img 
              src={playerData.avatar} 
              alt="Profile" 
              className="profile-avatar" 
            />
            <div className="profile-info">
              <h2>{playerData.username}</h2>
              <p>{playerData.email}</p>
            </div>
          </div>
          
          <div className="profile-game-stats">
            <div className="game-stats-grid">
              <div className="game-stat-item wins">
                <span className="game-stat-label">Wins</span>
                <span className="game-stat-value">{playerData.stats.wins}</span>
                <span className="game-stat-percentage">
                  {playerData.stats.winPercentage}%
                </span>
              </div>
              <div className="game-stat-item draws">
                <span className="game-stat-label">Draws</span>
                <span className="game-stat-value">{playerData.stats.draws}</span>
                <span className="game-stat-percentage">
                  {playerData.stats.drawPercentage}%
                </span>
              </div>
              <div className="game-stat-item losses">
                <span className="game-stat-label">Defeats</span>
                <span className="game-stat-value">{playerData.stats.losses}</span>
                <span className="game-stat-percentage">
                  {playerData.stats.lossPercentage}%
                </span>
              </div>
              <div className="game-stat-item losses">
                <span className="game-stat-label">Total Games</span>
                <span className="game-stat-value">{playerData.stats.totalGames}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="match-history-block">
          <h2>Match History</h2>
          {playerData.matches.map(match => (
            <div key={match.id} className="match-item">
              <div className="match-details">
                <span>{match.opponent}</span>
                <span className={`match-result ${match.result.toLowerCase()} px-40`}>
                  {match.result}
                </span>
              </div>
              <div className="match-time">
                {match.timeControl}
              </div>
            </div>
          ))}
        </div>

        <div className="game-setup-block">
          <h2>Game Setup</h2>
          <div className="time-control">
            <label>Time Control (minutes)</label>
            <input 
              type="range" 
              min="3" 
              max="10"
              step="1"
              value={gameTime}
              onChange={(e) => setGameTime(Number(e.target.value))}
            />
           
            <div>Selected: {gameTime} minutes</div>
          </div>
           
          <div className="color-selection">
            <label>Play As</label>
            <div className="color-buttons">
              <button 
                className={playerColor === 'white' ? 'active' : ''} 
                onClick={() => setPlayerColor('white')}
              >
                White
              </button>
              <button 
                className={playerColor === 'black' ? 'active' : ''} 
                onClick={() => setPlayerColor('black')}
              >
                Black
              </button>
              <button 
                className={playerColor === 'random' ? 'active' : ''} 
                onClick={() => setPlayerColor('random')}
              >
                Random
              </button>
            </div>
          </div>
        </div>

        {/* Additional Block (Friends) */}
        <div className="additional-block">
          <h2>Friends</h2>
          <div className="friends-list">
            {playerData.friends.map(friend => (
              <div key={friend.id} className="friend-item">
                <span className="friend-name">{friend.username}</span>
                <span className={`friend-status ${friend.status.toLowerCase()}`}>
                  {friend.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
