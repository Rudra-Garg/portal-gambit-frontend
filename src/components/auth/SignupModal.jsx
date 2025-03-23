import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

const SignupModal = ({ onClose, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) return "Password must be at least 8 characters long";
        if (!hasUpperCase) return "Password must contain at least one uppercase letter";
        if (!hasLowerCase) return "Password must contain at least one lowercase letter";
        if (!hasNumbers) return "Password must contain at least one number";
        if (!hasSpecialChar) return "Password must contain at least one special character";
        return null;
    };

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: displayName,
                photoURL: `https://ui-avatars.com/api/?name=${username}&background=random`
            });
            await sendEmailVerification(userCredential.user);

            setMessage('Verification email sent! Please check your inbox and verify your email before continuing.');
            setLoading(false);

            // Set up listener for email verification
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                if (user?.emailVerified) {
                    unsubscribe();
                    onClose();
                    navigate('/dashboard');
                }
            });

        } catch (error) {
            setError('Failed to create account: ' + error.message);
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            if (result.user.emailVerified) {
                onClose();
                navigate('/dashboard');
            } else {
                setMessage('Please verify your email before continuing.');
            }
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
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-6 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
                <FcGoogle className="w-5 h-5" />
                <span className="text-gray-700 font-medium">Sign up with Google</span>
            </button>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="px-4 text-sm text-gray-500 bg-white">or sign up with email</span>
                </div>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

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

                <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                    {loading ? 'Creating account...' : 'Sign up'}
                </button>
            </form>

            <div className="text-sm text-center">
                <span className="text-gray-600">Already have an account? </span>
                <button
                    onClick={onSwitchToLogin}
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                    Sign in
                </button>
            </div>
        </div>
    );
};

export default SignupModal;