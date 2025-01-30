import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import PrivateRoute from './components/auth/PrivateRoute';
import Dashboard from './components/Dashboard';
import SignupForm from './components/auth/SignupForm';

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