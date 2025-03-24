import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

const LoginModal = ({ onClose, onSwitchToSignup }) => {
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (!userCredential.user.emailVerified) {
                await sendEmailVerification(userCredential.user);
                setError('Please verify your email before logging in. A new verification email has been sent.');
                return;
            }

            onClose();
            navigate('/profile:userId');
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
            const result = await signInWithPopup(auth, provider);

            if (!result.user.emailVerified) {
                await sendEmailVerification(result.user);
                setError('Please verify your email before logging in. A verification email has been sent.');
                return;
            }

            onClose();
            navigate('/profile:userId');
        } catch (error) {
            setError('Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                    {error}
                </div>
            )}

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
                        placeholder="Email"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                        required
                    />
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                    <FcGoogle size={20} />
                    Sign in with Google
                </button>
            </form>

            <div className="text-sm text-center">
                <span className="text-gray-600">Don't have an account? </span>
                <button
                    onClick={onSwitchToSignup}
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                    Sign up
                </button>
            </div>
        </div>
    );
};

export default LoginModal;