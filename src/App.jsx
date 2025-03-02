import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext.jsx';
import LoginForm from './components/auth/LoginForm.jsx';
import PrivateRoute from './components/auth/PrivateRoute.jsx';
import Dashboard from './components/dashboard.jsx';
import SignupForm from './components/auth/SignUpForm.jsx';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginForm/>}/>
                    <Route path="/signup" element={<SignupForm />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard/>
                            </PrivateRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/login" replace/>}/>
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;