import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import PrivateRoute from './components/auth/PrivateRoute.jsx';
import ProfilePage from './components/profile/ProfilePage.jsx';
import PortalChessGame from "./components/game/PortalChessGame.jsx";
import LandingPage from "./components/LandingPage.jsx";

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>

                    <Route
                        path="/profile"
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