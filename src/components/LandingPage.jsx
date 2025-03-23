import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BiChevronRight,
    BiCircle,
    BiGroup,
    BiJoystick,
    BiTargetLock
} from 'react-icons/bi';
import { GiChessKnight, GiPortal } from 'react-icons/gi';
import Modal from './common/Modal';
import LoginModal from './auth/LoginModal';
import SignupModal from './auth/SignupModal';

const LandingPage = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };

    const handleSignUpClick = () => {
        setIsSignupModalOpen(true);
    };

    const closeLoginModal = () => {
        setIsLoginModalOpen(false);
    };

    const closeSignupModal = () => {
        setIsSignupModalOpen(false);
    };

    const switchToSignup = () => {
        setIsLoginModalOpen(false);
        setIsSignupModalOpen(true);
    };

    const switchToLogin = () => {
        setIsSignupModalOpen(false);
        setIsLoginModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[url('/chess-pattern.png')] opacity-10 bg-repeat"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5"></div>
            </div>

            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-lg py-4 shadow-md">
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <img
                            src="/favicons/515.png"
                            alt="Portal Gambit Logo"
                            className="w-8 h-8 transition-transform hover:scale-110"
                        />
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-indigo-600 transition-all duration-300">
                            Portal Gambit
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all duration-300">
                            Features
                        </a>
                        <a href="#how-to-play" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all duration-300">
                            How to Play
                        </a>
                        <button
                            onClick={handleLoginClick}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 rounded-full px-6 py-2 hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Sign In
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative pt-24 pb-20 overflow-hidden">
                <div className="container mx-auto px-4 md:px-6 relative z-10 mt-16">
                    <div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto">
                        <div className="md:w-1/2 text-left mb-10 md:mb-0 md:pr-10">
                            <div className="inline-block px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-600/30 text-xs font-medium text-indigo-600 mb-6">
                                The next evolution in chess
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                                Chess Meets<br />
                                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Portal Mechanics</span>
                            </h1>

                            <p className="text-gray-600 text-lg mb-8 max-w-md">
                                Experience a revolutionary twist on the classic game of chess. Teleport your pieces across the board through strategic portals and outmaneuver your opponents.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleSignUpClick}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 rounded-full px-8 py-4 flex items-center gap-2"
                                >
                                    Play Now <BiChevronRight size={18} />
                                </button>
                                <a
                                    href="#how-to-play"
                                    className="border border-indigo-600/50 text-indigo-600 hover:bg-indigo-600/5 rounded-full px-8 py-4 text-center"
                                >
                                    Learn More
                                </a>
                            </div>
                        </div>

                        <div className="md:w-1/2 relative">
                            <div className="aspect-square max-w-md mx-auto relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <GiChessKnight size={200} className="text-indigo-600" />
                                </div>
                                <div className="absolute -top-4 -right-4">
                                    <GiPortal size={64} className="text-blue-500 animate-pulse" />
                                </div>
                                <div className="absolute -bottom-4 -left-4">
                                    <GiPortal size={64} className="text-orange-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <section id="features" className="py-20 relative overflow-hidden bg-gray-50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            Portal Gambit
                        </h2>
                        <p className="text-gray-600 text-lg">
                            A revolutionary chess variant that introduces portal mechanics, allowing pieces to teleport across the board.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
                            <div className="bg-indigo-600/10 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                                <GiPortal className="text-indigo-600 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Portal Mechanics</h3>
                            <p className="text-gray-600">
                                Strategic portals allow your pieces to teleport across the board, creating new tactical opportunities.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
                            <div className="bg-blue-600/10 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                                <GiChessKnight className="text-blue-600 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Classic Chess Rules</h3>
                            <p className="text-gray-600">
                                All the traditional chess rules you know, with a twist that requires new strategic thinking.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
                            <div className="bg-indigo-600/10 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                                <BiGroup className="text-indigo-600 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Online Multiplayer</h3>
                            <p className="text-gray-600">
                                Challenge friends or random opponents to games in real-time with our smooth multiplayer experience.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How to Play Section */}
            <section id="how-to-play" className="py-20 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            How to Play
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Master the art of portal chess with innovative portal mechanics
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all group">
                            <div className="bg-chess-pattern aspect-square rounded-lg mb-6 relative overflow-hidden">
                                {/* Portal Entry */}
                                <div className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full border-2 border-indigo-600 animate-portal-pulse">
                                    <div className="absolute inset-0 bg-indigo-600/20 rounded-full animate-portal-glow"></div>
                                </div>
                                {/* Portal Exit */}
                                <div className="absolute bottom-1/4 right-1/4 w-12 h-12 rounded-full border-2 border-blue-600 animate-portal-pulse delay-150">
                                    <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-portal-glow delay-150"></div>
                                </div>
                                {/* Chess Piece Movement Indicator */}
                                <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-indigo-600 rounded-full opacity-0 group-hover:animate-piece-movement"></div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Portal Movement</h3>
                            <p className="text-gray-600">
                                When a piece's movement path intersects with a portal, it automatically teleports through and continues its movement from the exit portal.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                        <span className="font-bold">1</span>
                                    </div>
                                    <div className="flex-1">Move pieces according to standard chess rules</div>
                                </div>
                                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                        <span className="font-bold">2</span>
                                    </div>
                                    <div className="flex-1">Place up to 3 portals on the board - new portals replace the oldest ones</div>
                                </div>
                                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                        <span className="font-bold">3</span>
                                    </div>
                                    <div className="flex-1">Pieces automatically teleport when their movement path crosses a portal</div>
                                </div>
                                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                        <span className="font-bold">4</span>
                                    </div>
                                    <div className="flex-1">Use portals strategically to outmaneuver your opponent and checkmate their king</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Auth Modals */}
            <Modal isOpen={isLoginModalOpen} onClose={closeLoginModal} title="Sign In">
                <LoginModal onClose={closeLoginModal} onSwitchToSignup={switchToSignup} />
            </Modal>

            <Modal isOpen={isSignupModalOpen} onClose={closeSignupModal} title="Sign Up">
                <SignupModal onClose={closeSignupModal} onSwitchToLogin={switchToLogin} />
            </Modal>
        </div>
    );
};

export default LandingPage;