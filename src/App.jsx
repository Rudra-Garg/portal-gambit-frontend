import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import LoginForm from './components/auth/LoginForm.jsx';
import PrivateRoute from './components/auth/PrivateRoute.jsx';
import Dashboard from './components/dashboard.jsx';
import SignupForm from './components/auth/SignUpForm.jsx';
import ProfilePage from './components/profile/ProfilePage.jsx';  // Import the ProfilePage

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/signup" element={<SignupForm />} />

                    {/* Private routes wrapped with PrivateRoute */}
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />

                    {/* Profile Page Route */}
                    <Route
                        path="/profile/:userId"
                        element={
                            <PrivateRoute>
                                <ProfilePage />
                            </PrivateRoute>
                        }
                    />

                    {/* Redirect root to login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;
