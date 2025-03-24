
import { useState } from 'react';

import GameSetup from './GameSetup';
import Friends from './Friends';
import MatchHistory from './MatchHistory';
import AuthContext from "../../contexts/AuthContext.jsx";

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  console.log(user.stsTokenManager.accessToken);
  console.log(user.uid);
  const [userProfile, setUserProfile] = useState({
    username: '',
    email: '',
    games_played: 0,
    created_at: '',
    display_name: '',
    draws: 0,
    losses: 0,
    rating: 0,
    uid: '',
    wins: 0,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.uid) {
        try {
          // First, get the access token
          const tokenResponse = await fetch('http://localhost:8000/auth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebase_token: user.stsTokenManager.accessToken
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error('Failed to get access token');
          }

          const tokenData = await tokenResponse.json();
          localStorage.setItem('access_token', tokenData.access_token);

          // Then fetch the profile using GET request
          const profileResponse = await fetch(`http://localhost:8000/profiles/${user.uid}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });

          if (profileResponse.ok) {
            const data = await profileResponse.json();
            setUserProfile(data);
          } else {
            console.error('Failed to fetch user profile:', profileResponse.status);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  console.log(userProfile); // Log the fetched profile
  // const [userProfile] = useState({
  //   username: 'ChessMaster99',
  //   email: 'chessmaster@example.com',
  //   gamesPlayed: 127,
  //   winRate: '58%',
  //   memberSince: '2092-1-12'
  // });

  const [activeSection, setActiveSection] = useState('friends'); // Default to "friends"

  return (
    <div className="container mx-auto px-4 py-10 bg-gray-300 min-h-screen flex flex-col md:flex-row gap-8 text-white">
      {/* Left Column - User Profile, Friends & Match History */}
      <div className="md:w-2/5 space-y-6">

        {/* User Profile Header */}
        <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-indigo-500 backdrop-blur-lg">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-extrabold shadow-lg">
              {userProfile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-indigo-400 tracking-wide">{userProfile.username}</h1>
              <p className="text-gray-400 text-sm">{userProfile.email}</p>
              <div className="mt-4 space-y-1 text-gray-300">
                <div className="text-lg"><span className="font-semibold text-indigo-400">Games Played:</span> {userProfile.games_played}</div>
                <div className="text-lg">
                  <span className="font-semibold text-indigo-400">Win Rate:</span>{' '}
                  {userProfile.games_played > 0
                    ? `${((userProfile.wins / userProfile.games_played) * 100).toFixed(1)}%`
                    : 'NA'}
                </div>
                <div className="text-lg"><span className="font-semibold text-indigo-400">Member Since:</span> {new Date(userProfile.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Buttons for Friends & Match History */}
        <div>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveSection('friends')}
              className={`w-1/2 px-6 py-3 text-center font-medium rounded-t-lg transition-all duration-300
              ${activeSection === 'friends'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-indigo-500 hover:text-white'}`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveSection('matchHistory')}
              className={`w-1/2 px-6 py-3 text-center font-medium rounded-t-lg transition-all duration-300
              ${activeSection === 'matchHistory'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-indigo-500 hover:text-white'}`}
            >
              Match History
            </button>
          </div>

          {/* Expanded Content with Scrollable Section */}
          <div className="rounded-b-xl shadow-lg overflow-hidden ">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-700">
              {activeSection === 'friends' && <Friends />}
              {activeSection === 'matchHistory' && <MatchHistory />}
            </div>
          </div>
        </div>
      </div>
      {/* Right Column - Game Setup Expands Entire Right Side */}
      <div className="md:w-3/5">
        <GameSetup />
      </div>
    </div>
  );
};

export default ProfilePage;
