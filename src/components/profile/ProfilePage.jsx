import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion'; // Import motion
import { BiUserCircle, BiStats, BiTimeFive, BiStar, BiGame } from 'react-icons/bi'; // Import icons
import GameSetup from './GameSetup';
import Friends from './Friends';
import MatchHistory from './MatchHistory';
import AuthContext from "../../contexts/AuthContext.jsx";
import { BACKEND_URL } from "../../config.js";
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';

// Animation Variants (similar to LandingPage)
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 1 }, // Start visible to avoid layout shift
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};


const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  console.log(user.stsTokenManager.accessToken);
  console.log(user.uid);
  const [userProfile, setUserProfile] = useState({
    username: 'Loading...', // Default placeholder
    email: 'Loading...',    // Default placeholder
    games_played: 0,
    created_at: '',
    display_name: 'Loading...', // Default placeholder
    draws: 0,
    losses: 0,
    rating: 0, // Added rating here
    uid: '',
    wins: 0,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.uid) {
        try {
          // First, get the access token

          // const tokenResponse = await fetch(`${BACKEND_URL}/auth/token`, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify({
          //     firebase_token: user.stsTokenManager.accessToken
          //   }),
          // });


          // if (!tokenResponse.ok) {
          //   throw new Error('Failed to get access token');
          // }

          // const tokenData = await tokenResponse.json();
          // localStorage.setItem('access_token', tokenData.access_token);

          // Then fetch the profile using GET request
          const profileResponse = await fetch(`${BACKEND_URL}/profiles/${user.uid}`, {
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
            setUserProfile(prev => ({ // Set error state or defaults
              ...prev,
              username: 'Error',
              email: 'Could not load profile',
              display_name: 'Error'
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(prev => ({ // Set error state or defaults
            ...prev,
            username: 'Error',
            email: 'Could not load profile',
            display_name: 'Error'
          }));
        }
      }
    };

    fetchUserProfile();
  }, [user]);


  const [activeSection, setActiveSection] = useState('friends');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      // Optionally handle error
    }
  };

  return (
    // Updated background to match LandingPage gradient style

    <div className="min-h-screen bg-gradient-to-br from-indigo-500/70 to-blue-700/70 text-gray-800 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Remove the top-right logout button */}
      <div className="absolute inset-0 bg-[url('/chess-pattern.png')] opacity-5 bg-repeat" style={{ backgroundSize: '200px' }}></div>

      <motion.div
        className="container mx-auto max-w-7xl flex flex-col lg:flex-row gap-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Left Column */}
        <motion.div className="lg:w-2/5 space-y-8" variants={fadeIn}>

          {/* User Profile Header - Updated with logout button */}
          <motion.div
            className="bg-indigo-100 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/30 overflow-hidden"
            variants={slideUp}
          >
            <div className="flex items-center gap-5">
              <motion.div
                className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg border-2 border-white/50 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
              >
                {userProfile.username && userProfile.username !== 'Loading...' && userProfile.username !== 'Error'
                  ? userProfile.username.charAt(0).toUpperCase()
                  : <BiUserCircle />}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold text-indigo-700 truncate" title={userProfile.display_name || userProfile.username}>
                    {userProfile.display_name || userProfile.username}
                  </h1>
                  <button
                    onClick={handleLogout}
                    className="ml-4 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg shadow hover:bg-red-600 transition flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Logout</span>
                    <BiUserCircle className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-600 text-sm truncate" title={userProfile.email}>{userProfile.email}</p>
              </div>
            </div>
            {/* Stats Section - Updated styling */}
            <motion.div
              className="mt-6 grid grid-cols-2 gap-4 text-sm"
              variants={staggerContainer}
            >
              <motion.div className="flex items-center space-x-2 p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm" variants={slideUp}>
                <BiStar className="text-yellow-500 text-lg flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-600 block">Rating</span>
                  <span className="text-lg font-semibold text-gray-800">{userProfile.rating}</span>
                </div>
              </motion.div>
              <motion.div className="flex items-center space-x-2 p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm" variants={slideUp}>
                <BiGame className="text-green-500 text-lg flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-600 block">Games Played</span>
                  <span className="text-lg font-semibold text-gray-800">{userProfile.games_played}</span>
                </div>
              </motion.div>
              <motion.div className="flex items-center space-x-2 p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm" variants={slideUp}>
                <BiStats className="text-blue-500 text-lg flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-600 block">Win Rate</span>
                  <span className="text-lg font-semibold text-gray-800">
                    {userProfile.games_played > 0
                      ? `${((userProfile.wins / userProfile.games_played) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
              </motion.div>
              <motion.div className="flex items-center space-x-2 p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm" variants={slideUp}>
                <BiTimeFive className="text-purple-500 text-lg flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-600 block">Member Since</span>
                  <span className="text-lg font-semibold text-gray-800">
                    {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Toggle Buttons & Content Area - Updated styling */}
          <motion.div variants={slideUp}>
            <div className="flex bg-indigo-100 backdrop-blur-sm rounded-t-xl">
              {['friends', 'matchHistory'].map((section) => (
                <motion.button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`flex-1 px-4 py-3 text-center font-medium transition-colors duration-300 focus:outline-none relative ${activeSection === section
                    ? 'text-indigo-600' // Active color
                    : 'text-gray-600 hover:text-indigo-500' // Inactive/hover color
                    }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {section === 'friends' ? 'Friends' : 'Match History'}
                  {activeSection === section && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                      layoutId="underline"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Content Area - Updated styling */}
            <div className="rounded-b-xl shadow-lg overflow-hidden min-h-[400px]">
              {activeSection === 'friends' && <Friends />}
              {activeSection === 'matchHistory' && <MatchHistory />}
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column - Game Setup - Updated styling */}
        <motion.div className="lg:w-3/5" variants={fadeIn}>
          <div className="bg-indigo-100 backdrop-blur-md rounded-xl shadow-lg border border-white/30 h-full">
            <GameSetup />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
