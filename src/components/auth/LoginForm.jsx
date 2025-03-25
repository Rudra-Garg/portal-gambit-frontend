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
    <div className="h-screen flex justify-center items-center relative">
         <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="relative z-10 bg-black-500 bg-opacity-50 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-96">
      <h1 className="p-3 text-4xl font-bold text-center blur-[0.5px]">
          <span className="bg-gradient-to-r from-green-500 to-blue-600 inline-block text-transparent bg-clip-text">
            PORTAL GAMBIT
          </span>
        </h1>
       
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
        
            <input
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
               className="w-full bg-white py-2 px-3 mt-4 rounded focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <div>
           
            <input
             placeholder="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white py-2 px-3 mt-4 rounded focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
             className="w-full bg-gradient-to-r from-green-400 to-yellow-400 py-2 mt-4 rounded text-white font-bold hover:opacity-80 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {verificationMessage && (
            <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mt-2">
              {verificationMessage}
            </div>
          )}

        </form>

        <div className="relative">
        
          <div className="relative flex justify-center text-sm">
            <span className="p-2 px-5 text-white">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FcGoogle className="h-5 w-5 mr-2" />
          Sign in with Google
        </button>

        <p className="text-center mt-4 text-white">
          Don&#39;t have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:text-blue-800">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;