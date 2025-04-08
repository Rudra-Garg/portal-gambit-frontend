import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import {BACKEND_URL} from '../../config';

const LoginModal = ({ onClose, onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState('');
    const navigate = useNavigate();


    const checkAndCreateProfile = async (user) => {
        try {
            const checkResponse = await fetch(`${BACKEND_URL}/profiles/${user.uid}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (checkResponse.status === 404) {
                const createResponse = await fetch(`${BACKEND_URL}/profiles/`, {
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
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await fetch(`${BACKEND_URL}/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firebase_token: firebaseToken,
                })
            });
         
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.detail?.includes('Token used too early')) {
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
            const firebaseToken = await user.getIdToken(/* forceRefresh */ true);
            
            console.log('Exchanging token with backend...');
            const backendTokens = await exchangeTokenWithBackend(firebaseToken);
    
            // Store tokens only after successful exchange
            localStorage.setItem('access_token', backendTokens.access_token);
            localStorage.setItem('token_type', backendTokens.token_type);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('userEmail', user.email);
        } catch (error) {
            console.error('Error saving auth tokens:', error);
            throw new Error('Failed to complete authentication process');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // console.log(userCredential);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await sendEmailVerification(userCredential.user);
                setVerificationMessage('Please verify your email before logging in. Verification link sent.');
                setLoading(false);
                return;
            }

            const userId = user.uid;
            console.log('User ID:', userId);
            await saveAuthToken(userCredential.user);
            await checkAndCreateProfile(user);
            onClose();
            navigate(`/profile`);
        } catch (error) {
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

            await saveAuthToken(user);
            await checkAndCreateProfile(user);
            onClose();
            navigate(`/profile`);
        } catch (error) {
            console.error('Google sign in error:', error);
            setError(error.message.includes('Failed to setup user profile')
                ? 'Failed to setup user profile. Please try again.'
                : 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6">


            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                    {error}
                </motion.div>
            )}

            <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-6 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
                <FcGoogle className="w-5 h-5" />
                <span className="text-gray-700 font-medium">Continue with Google</span>
            </motion.button>

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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {verificationMessage && (
                    <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mt-2">
                        {verificationMessage}
                    </div>
                )}

                <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </motion.button>
            </form>

            <div className="text-sm text-center">
                <span className="text-gray-600">Don't have an account? </span>
                <motion.button
                    onClick={onSwitchToSignup}
                    whileHover={{ scale: 1.05 }}
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                    Sign up
                </motion.button>
            </div>
        </motion.div>
    );
};

export default LoginModal;