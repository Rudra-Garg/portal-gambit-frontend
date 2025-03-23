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

  const saveAuthToken = (user) => {
    try {
      // Get the auth token
      user.getIdToken().then((token) => {
        // Save token and user data in localStorage
        localStorage.setItem('access_token', token);
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('userEmail', user.email);
      });
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(userCredential);
      const user = userCredential.user;
      if (!user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        setVerificationMessage('Please verify your email before logging in. Verification link sent.');
        setLoading(false);
        return;
      }
      const userId = user.uid;
      saveAuthToken(userCredential.user);
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.log(error);
      
      if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setError('Failed to sign in. Please check your credentials.');
      }
    } finally {
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
      const userId = result.user.uid;
      console.log(result.user);
      saveAuthToken(result.user);
      navigate(`/profile/${userId}`);
    } catch (error) {
      setError('Failed to sign in with Google');
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