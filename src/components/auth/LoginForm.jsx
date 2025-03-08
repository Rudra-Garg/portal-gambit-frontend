import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/profile/:userId');
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/profile/:userId');
      // eslint-disable-next-line no-unused-vars
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