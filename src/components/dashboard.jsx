import {useAuth} from '../contexts/AuthContext';
import {useNavigate} from 'react-router-dom';
import {signOut} from 'firebase/auth';
import {auth} from '../firebase/config';

const Dashboard = () => {
    const {user} = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Welcome, {user?.email}</p>
                    </div>
                    <div className="border-t pt-4">
                        <h2 className="text-xl font-semibold mb-4">Your Content</h2>
                        <p className="text-gray-500">
                            This is a placeholder dashboard. Add your content here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;