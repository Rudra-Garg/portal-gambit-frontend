import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; // Make sure to install react-icons
import { Link } from 'react-router-dom';

const SignupForm = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      setMessage('Registration successful! Please check your email for verification.');

      // Optional: you can either redirect immediately or wait for email verification
      // navigate('/login');
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        default:
          setError('An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      navigate('/profile:userId');

    } catch (error) {
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center relative">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Login/Register Form */}
      <div className="relative z-10 bg-black-500 bg-opacity-50 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-96">
        {/* Gradient heading */}
        <h1 className="p-3 text-4xl font-bold text-center blur-[0.5px]">
          <span className="bg-gradient-to-r from-green-500 to-blue-600 inline-block text-transparent bg-clip-text">
            PORTAL GAMBIT
          </span>
        </h1>

     
         
        
        <form onSubmit={handleEmailSignup} className="space-y-6">
            <input
              type="text"
              id="displayName"
              value={displayName}
              placeholder="Name"
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white py-2 px-3 mt-4 rounded focus:ring-2 focus:ring-green-400"
              required
            />
            <input
             id="email"
              type="email"
              value={email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white py-2 px-3 mt-2 rounded focus:ring-2 focus:ring-green-400"
              required
            /> 
            <input
              type="password"
              id="password"
               placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white py-2 px-3 mt-2 rounded focus:ring-2 focus:ring-green-400"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-400 to-yellow-400 py-2 mt-4 rounded text-white font-bold hover:opacity-80 transition">
                {loading ? 'Creating Account...' : 'Sign Up'}

            </button>
           
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {message && <p className="text-green-500 text-sm m-1">{message}</p>}
   
            <p className="text-center text-white mt-0">
              Already have an account?{" "}
             
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
           login here
          </Link>
              
            </p>
       
            <button  type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FcGoogle className="h-5 w-5 mr-2" />
          Sign up with Google
            </button>
            </form>
      
         
      </div>
    </div>
  );
}

export default SignupForm;
