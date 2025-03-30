import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import LoginForm from './components/auth/LoginForm.jsx';
import PrivateRoute from './components/auth/PrivateRoute.jsx';
import SignupForm from './components/auth/SignUpForm.jsx';
import ProfilePage from './components/profile/ProfilePage.jsx';
import PortalChessGame from "./components/game/PortalChessGame.jsx";
import LandingPage from "./components/LandingPage.jsx";

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* <Route path="/login" element={<LoginForm />} />
                    <Route path="/signup" element={<SignupForm />} /> */}

                    <Route
                        path="/profile:userId"
                        element={
                            <PrivateRoute>
                                <ProfilePage />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/gameScreen"
                        element={
                            <PrivateRoute>
                                <PortalChessGame />
                            </PrivateRoute>
                        }
                    />


                    <Route path="/" element={<LandingPage />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;