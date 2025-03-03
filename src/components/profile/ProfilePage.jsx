import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

const ProfilePage = ({ userId }) => {
  // State for player data
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  // Simulated API call to fetch player data
  useEffect(() => {
    // In a real app, replace this with your actual API call
    const fetchPlayerData = async () => {
      setIsLoading(true);
      try {
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const data = {
          id: userId || 'player123',
          username: 'asd@gmail.com',
          avatar: '/api/placeholder/150/150',
         
         
          joinDate: '2023-06-15',
          status: 'online',
          stats: {
            wins: 187,
            losses: 103,
            winRate: 64.5,
            totalKills: 2436,
            totalDeaths: 1892,
            kdRatio: 1.29,
            highestScore: 9876,
            totalPlayTime: '328h 45m',
          },
          matches: [
            {
              id: 'match001',
              date: '2025-03-01T18:30:00',
              gameMode: 'Ranked',
              map: 'Cyber Arena',
              result: 'Victory',
              score: 3250,
              duration: '24:18',
              kills: 18,
              deaths: 7,
              assists: 5,
              mvp: true,
            },
            {
              id: 'match002',
              date: '2025-02-28T20:15:00',
              gameMode: 'Team Deathmatch',
              map: 'Neon City',
              result: 'Defeat',
              score: 2180,
              duration: '19:42',
              kills: 12,
              deaths: 14,
              assists: 3,
              mvp: false,
            },
            {
              id: 'match003',
              date: '2025-02-28T16:40:00',
              gameMode: 'Capture the Flag',
              map: 'Mountain Fortress',
              result: 'Victory',
              score: 2850,
              duration: '22:05',
              kills: 15,
              deaths: 9,
              assists: 8,
              mvp: false,
            },
            {
              id: 'match004',
              date: '2025-02-27T19:20:00',
              gameMode: 'Ranked',
              map: 'Desert Ruins',
              result: 'Victory',
              score: 3020,
              duration: '26:12',
              kills: 16,
              deaths: 10,
              assists: 7,
              mvp: true,
            },
            {
              id: 'match005',
              date: '2025-02-26T21:10:00',
              gameMode: 'Control Point',
              map: 'Industrial Zone',
              result: 'Defeat',
              score: 1950,
              duration: '18:35',
              kills: 9,
              deaths: 12,
              assists: 4,
              mvp: false,
            }
          ],
         
          friends: [
            { id: 'friend001', username: 'GameMaster44', status: 'online', avatar: '/api/placeholder/50/50',WinPercent: 76   },
            { id: 'friend002', username: 'EpicSniper', status: 'in-game', avatar: '/api/placeholder/50/50',WinPercent: 87  },
            { id: 'friend003', username: 'ShadowWarrior', status: 'offline', avatar: '/api/placeholder/50/50',WinPercent: 43 },
            { id: 'friend004', username: 'MidnightHunter', status: 'online', avatar: '/api/placeholder/50/50', WinPercent: 89  },
            { id: 'friend005', username: 'QuantumPlayer', status: 'idle', avatar: '/api/placeholder/50/50', WinPercent: 33 }
          ],
          
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

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!playerData) {
    return <div className="profile-error">Error loading profile data</div>;
  }

  const renderMatchHistory = () => (
    <div className="match-history">
      <h3>Recent Matches</h3>
      <div className="matches-list">
        {playerData.matches.map(match => (
          <div key={match.id} className={`match-card ${match.result.toLowerCase()}`}>
            <div className="match-header">
              <div className="match-mode">{match.gameMode}</div>
              <div className="match-result">{match.result}</div>
            </div>
            <div className="match-details">
              <div className="match-info">
                <div className="match-map">{match.map}</div>
                <div className="match-date">{formatDate(match.date)}</div>
              </div>
              <div className="match-stats">
                <div className="stat">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{match.score}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">W/D/L</span>
                  <span className="stat-value">{match.kills}/{match.deaths}/{match.assists}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{match.duration}</span>
                </div>
                {match.mvp && <div className="mvp-badge">MVP</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="stats-container">
      <h3>Player Statistics</h3>
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-value">{playerData.stats.wins}</span>
          <span className="stat-label">Wins</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{playerData.stats.losses}</span>
          <span className="stat-label">Losses</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{playerData.stats.winRate}%</span>
          <span className="stat-label">Win Rate</span>
        </div>
        
        

        
        <div className="stat-box">
          <span className="stat-value">{playerData.stats.highestScore}</span>
          <span className="stat-label">Highest Score</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{playerData.stats.totalPlayTime}</span>
          <span className="stat-label">Play Time</span>
        </div>
      </div>
    </div>
  );

  

  const renderFriends = () => (
    <div className="friends-container">
      <h3>Friends</h3>
      <div className="friends-list">
        {playerData.friends.map(friend => (
          <div key={friend.id} className="friend-card">
            <div className="friend-avatar">
              <img src={friend.avatar} alt={friend.username} />
              <span className={`status-indicator ${friend.status}`}></span>
            </div>
            <div className="friend-info">
              <h4>{friend.username}</h4>
              <span className="friend-level">Win Percent % {friend.WinPercent}</span>
              <span className={`friend-status ${friend.status}`}>
                {friend.status === 'online' ? 'Online' : 
                 friend.status === 'in-game' ? 'In Game' : 
                 friend.status === 'idle' ? 'Idle' : 'Offline'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover"></div>
        <div className="profile-avatar">
          <img src={playerData.avatar} alt={playerData.username} />
          <span className={`status-indicator ${playerData.status}`}></span>
        </div>
        <div className="profile-info">
          <h1>{playerData.username}</h1>
          <div className="profile-meta">
           
            <span className="player-join-date">Member since {new Date(playerData.joinDate).toLocaleDateString()}</span>
          </div>
         
        </div>
      </div>
      
      <div className="profile-navigation">
        <button 
          className={activeTab === 'matches' ? 'active' : ''} 
          onClick={() => setActiveTab('matches')}
        >
          Matches
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''} 
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
       
        <button 
          className={activeTab === 'friends' ? 'active' : ''} 
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        
      </div>
      
      <div className="profile-content">
        {activeTab === 'matches' && renderMatchHistory()}
        {activeTab === 'stats' && renderStats()}
       
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'activity' && renderActivity()}
      </div>
    </div>
  );
};

export default ProfilePage;
