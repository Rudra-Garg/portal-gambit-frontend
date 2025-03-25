import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

const LoginModal = ({ onClose, onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState('');
    const navigate = useNavigate();

    const saveAuthToken = (user) => {
        try {
            user.getIdToken().then((token) => {
                localStorage.setItem('access_token', token);
                localStorage.setItem('userId', user.uid);
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('emailVerified', user.emailVerified);
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
            onClose();
            navigate(`/profile:userId`);
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
            onClose();
            navigate(`/profile:userId`);
        } catch (error) {
            setError('Failed to sign in with Google');
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