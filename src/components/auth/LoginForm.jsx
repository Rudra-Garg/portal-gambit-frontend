import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup,sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const navigate = useNavigate();


  const checkAndCreateProfile = async (user) => {

    try {
      // First check if profile exists
      const checkResponse = await fetch(`http://127.0.0.1:8000/profiles/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
  
      if (checkResponse.status === 404) {
        // Profile doesn't exist, create one
        const createResponse = await fetch('http://127.0.0.1:8000/profiles/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            display_name: user.displayName || 'Chess Player',
            draws: 0,
            email: user.email,
            games_played: 0,
            losses: 0,
            rating: 1200,
            uid: user.uid,
            username: user.email.split('@')[0],
            wins: 0
          })
        });
  
        if (!createResponse.ok) {
          throw new Error('Failed to create profile');
        }
      } else if (!checkResponse.ok) {
        throw new Error('Failed to check profile');
      }
    } catch (error) {
      console.error('Profile check/create error:', error);
      throw new Error('Failed to setup user profile');
    }
  };

  const exchangeTokenWithBackend = async (firebaseToken) => {
    try {

      // Add a small delay to handle clock synchronization issues
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      const response = await fetch('http://127.0.0.1:8000/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_token: firebaseToken,
          timestamp: Math.floor(Date.now() / 1000) // Add current timestamp
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail?.includes('Token used too early')) {
          // Retry once after a longer delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          return exchangeTokenWithBackend(firebaseToken);
        }
        throw new Error(errorData.detail || 'Backend authentication failed');
      }
  
      const data = await response.json();
      if (!data.access_token) {
        throw new Error('Invalid response from backend');

      }
  
      return data;
    } catch (error) {
      console.error('Backend token exchange error:', error);
      throw error;
    }
  };

  const saveAuthToken = async (user) => {
    try {

      console.log('Getting Firebase token...');
      const firebaseToken = await user.getIdToken(true);
      
      console.log('Exchanging token with backend...');
      let retryCount = 0;
      while (retryCount < 3) {
        try {
          const backendTokens = await exchangeTokenWithBackend(firebaseToken);
          
          if (!backendTokens.access_token) {
            throw new Error('Invalid token response from backend');
          }
          
          // Save tokens
          localStorage.setItem('firebase_token', firebaseToken);
          localStorage.setItem('access_token', backendTokens.access_token);
          localStorage.setItem('token_type', backendTokens.token_type);
          localStorage.setItem('userId', user.uid);
          localStorage.setItem('userEmail', user.email);
          
          return; // Success
        } catch (error) {
          if (error.message.includes('Token used too early') && retryCount < 2) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          throw error;
        }
      }

    } catch (error) {
      console.error('Error saving auth tokens:', error);
      throw new Error(
        error.message.includes('Token used too early')
          ? 'Please check your system clock and try again'
          : 'Failed to complete authentication process'
      );
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // Firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await sendEmailVerification(user);
      setVerificationMessage('Please verify your email before logging in. Verification link sent.');
      setLoading(false);
      return;
    }

    // Save tokens and authenticate with backend
    await saveAuthToken(user);
    await checkAndCreateProfile(user);
    navigate(`/profile/${user.uid}`);
  } catch (error){
    console.log(error);
    if (error.code === 'auth/too-many-requests') {
      setError('Too many failed login attempts. Please try again later.');
    } else if (error.message.includes('Backend authentication failed')) {
      setError('Backend authentication failed. Please try again.');
    } else if (error.message.includes('Failed to setup user profile')) {
      setError('Failed to setup user profile. Please try again.');
    } else {
      setError('Failed to sign in. Please check your credentials.');
    }
  }finally {
    setLoading(false);
  }
};

const handleGoogleSignIn = async () => {
  setLoading(true);
  setError('');

  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    const user = result.user;

    if (!user.emailVerified) {
      setError('This email address is not verified.');
      return;
    }

    await saveAuthToken(user);
    await checkAndCreateProfile(user); 
    navigate(`/profile/${user.uid}`);
  }catch (error) {
    console.error('Google sign in error:', error);
    setError(error.message.includes('Failed to setup user profile') 
      ? 'Failed to setup user profile. Please try again.'
      : 'Failed to sign in with Google');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/chess-pattern.png')] opacity-10 bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5"></div>
      </div>

      {/* Main content container */}
      <div className="relative container mx-auto px-4 py-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left side - Game Information */}
        <div className="lg:w-1/2 space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Portal Gambit
            </h1>
            <p className="text-2xl text-gray-700">
              Where Chess Meets Portal Mechanics
            </p>
          </div>


          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-indigo-600">Revolutionary Chess Experience</h2>
              <p className="text-gray-600">
                Challenge traditional chess strategies with the power of portals. 
                Move pieces through dimensional gates and create unprecedented tactical opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-indigo-600 font-medium mb-2">Portal Mechanics</h3>
                <p className="text-sm text-gray-600">Place portals strategically to create new pathways for your pieces</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-blue-600 font-medium mb-2">Real-time Matches</h3>
                <p className="text-sm text-gray-600">Challenge players worldwide in this innovative chess variant</p>
              </div>
            </div>

          
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="lg:w-1/2 max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to continue your chess journey</p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-6 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <FcGoogle className="w-5 h-5" />
              <span className="text-gray-700 font-medium">Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-gray-500 bg-white">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-600">
              New to Portal Gambit?{' '}
              <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;