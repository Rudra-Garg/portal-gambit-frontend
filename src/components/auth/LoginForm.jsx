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