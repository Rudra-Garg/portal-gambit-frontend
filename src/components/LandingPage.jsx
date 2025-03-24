import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BiChevronRight,
    BiGroup
} from 'react-icons/bi';
import { GiChessKnight, GiPortal } from 'react-icons/gi';
import Modal from './common/Modal';
import LoginModal from './auth/LoginModal';
import SignupModal from './auth/SignupModal';
import { fadeIn, slideUp, slideInLeft, slideInRight, scaleButton, portalPulse, staggerContainer } from '../utils/animations';

const LandingPage = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const navigate = useNavigate();
    
    const handleLoginClick = () => {
        const userId = localStorage.getItem('userId');
        const isEmailVerified = localStorage.getItem('emailVerified') === 'true';
        
        if (userId && isEmailVerified) {
            navigate('/profile:userId');
        } else {
            setIsLoginModalOpen(true);
        }
    };

    const handleSignUpClick = () => {
        const userId = localStorage.getItem('userId');
        const isEmailVerified = localStorage.getItem('emailVerified') === 'true';
        
        if (userId && isEmailVerified) {
            navigate('/profile:userId');
        } else {
            setIsSignupModalOpen(true);
        }
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

    // Add new animation variants
    const navItemVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0 }
    };

    const heroImageVariants = {
        hidden: { opacity: 0, scale: 0.8, rotate: -10 },
        visible: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 20
            }
        }
    };

    const backgroundVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 1.5
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="min-h-screen bg-background text-foreground relative overflow-hidden">
            
            {/* Enhanced Background Animation */}
            <motion.div 
                className="absolute inset-0"
                variants={backgroundVariants}
            >
                <motion.div 
                    className="absolute inset-0 bg-[url('/chess-pattern.png')] opacity-10 bg-repeat"
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                ></motion.div>
                <motion.div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5"></motion.div>
            </motion.div>

            {/* Enhanced Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-lg py-4 shadow-md">
                <motion.div 
                    className="container mx-auto px-4 md:px-6 flex items-center justify-between"
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <motion.div 
                        className="flex items-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <img
                            src="/favicons/515.png"
                            alt="Portal Gambit Logo"
                            className="w-8 h-8 transition-transform hover:scale-110"
                        />
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-indigo-600 transition-all duration-300">
                            Portal Gambit
                        </span>
                    </motion.div>

                    <nav className="hidden md:flex items-center space-x-8">
                        {['Features', 'How to Play'].map((item, index) => (
                            <motion.a
                                key={item}
                                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all duration-300"
                                variants={navItemVariants}
                                custom={index}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {item}
                            </motion.a>
                        ))}
                        <motion.button
                            onClick={handleLoginClick}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 rounded-full px-6 py-2"
                            variants={navItemVariants}
                            whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0,0,0,0.2)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Sign In
                        </motion.button>
                    </nav>
                </motion.div>
            </header>

            {/* Enhanced Hero Section */}
            <motion.div 
                className="relative pt-24 pb-20 overflow-hidden"
                variants={slideUp}
            >
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="container mx-auto px-4 md:px-6 relative z-10 mt-16">
                    <motion.div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto">
                        <motion.div
                            variants={slideInLeft}
                            className="md:w-1/2 text-left mb-10 md:mb-0 md:pr-10">
                            <motion.div className="inline-block px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-600/30 text-xs font-medium text-indigo-600 mb-6">
                                The next evolution in chess
                            </motion.div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                                Chess Meets<br />
                                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Portal Mechanics</span>
                            </h1>

                            <p className="text-gray-600 text-lg mb-8 max-w-md">
                                Experience a revolutionary twist on the classic game of chess. Teleport your pieces across the board through strategic portals and outmaneuver your opponents.
                            </p>

                            <motion.div className="flex flex-col sm:flex-row gap-4">
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
                            </motion.div>
                        </motion.div>

                        <motion.div
                            variants={slideInRight}
                            className="md:w-1/2 relative">
                            <motion.div className="aspect-square max-w-md mx-auto relative">
                                <motion.div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 300 }}>
                                        <GiChessKnight size={200} className="text-indigo-600" />
                                    </motion.div>
                                </motion.div>
                                <motion.div className="absolute -top-4 -right-4">
                                    <motion.div variants={portalPulse} animate="pulse">
                                        <GiPortal size={64} className="text-blue-500" />
                                    </motion.div>
                                </motion.div>
                                <motion.div className="absolute -bottom-4 -left-4">
                                    <motion.div variants={portalPulse} animate="pulse">
                                        <GiPortal size={64} className="text-orange-500" />
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div >
                </motion.div >
            </motion.div >

            {/* Features Section */}
            <section id="features" className="py-20 relative overflow-hidden bg-gray-50" >
                <motion.div className="container mx-auto px-4 md:px-6">
                    <motion.div
                        variants={slideUp}
                        className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            Portal Gambit
                        </h2>
                        <p className="text-gray-600 text-lg">
                            A revolutionary chess variant that introduces portal mechanics, allowing pieces to teleport across the board.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <motion.div
                            variants={fadeIn}
                            whileHover={scaleButton.hover}
                            className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
                            <motion.div className="bg-indigo-600/10 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                                <GiPortal className="text-indigo-600 w-8 h-8" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2">Portal Mechanics</h3>
                            <p className="text-gray-600">
                                Strategic portals allow your pieces to teleport across the board, creating new tactical opportunities.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeIn}
                            whileHover={scaleButton.hover}
                            className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
                            <motion.div className="bg-blue-600/10 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                                <GiChessKnight className="text-blue-600 w-8 h-8" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2">Classic Chess Rules</h3>
                            <p className="text-gray-600">
                                All the traditional chess rules you know, with a twist that requires new strategic thinking.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeIn}
                            whileHover={scaleButton.hover}
                            className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
                            <motion.div className="bg-indigo-600/10 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                                <BiGroup className="text-indigo-600 w-8 h-8" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2">Online Multiplayer</h3>
                            <p className="text-gray-600">
                                Challenge friends or random opponents to games in real-time with our smooth multiplayer experience.
                            </p>
                        </motion.div >
                    </motion.div >
                </motion.div >
            </section >

            {/* How to Play Section */}
            < section id="how-to-play" className="py-20 bg-white" >
                <motion.div className="container mx-auto px-4 md:px-6">
                    <motion.div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            How to Play
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Master the art of portal chess with innovative portal mechanics
                        </p>
                    </motion.div>

                    <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                        <motion.div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all group">
                            <motion.div className="bg-chess-pattern aspect-square rounded-lg mb-6 relative overflow-hidden">
                                {/* Portal Entry */}
                                <motion.div className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full border-2 border-indigo-600 animate-portal-pulse">
                                    <motion.div className="absolute inset-0 bg-indigo-600/20 rounded-full animate-portal-glow"></motion.div>
                                </motion.div>
                                {/* Portal Exit */}
                                <motion.div className="absolute bottom-1/4 right-1/4 w-12 h-12 rounded-full border-2 border-blue-600 animate-portal-pulse delay-150">
                                    <motion.div className="absolute inset-0 bg-blue-600/20 rounded-full animate-portal-glow delay-150"></motion.div>
                                </motion.div>
                                {/* Chess Piece Movement Indicator */}
                                <motion.div className="absolute top-1/4 left-1/4 w-8 h-8 bg-indigo-600 rounded-full opacity-0 group-hover:animate-piece-movement"></motion.div>
                            </motion.div>
                            <h3 className="text-xl font-bold mb-3">Portal Movement</h3>
                            <p className="text-gray-600">
                                When a piece&#39;s movement path intersects with a portal, it automatically teleports through and continues its movement from the exit portal.
                            </p>
                        </motion.div>

                        <motion.div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
                            <motion.div className="space-y-4 mb-6">
                                <motion.div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <motion.div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                        <span className="font-bold">1</span>
                                    </motion.div>
                                    <motion.div className="flex-1">Move pieces according to standard chess rules</motion.div>
                                </motion.div>
                                <motion.div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <motion.div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                        <span className="font-bold">2</span>
                                    </motion.div>
                                    <motion.div className="flex-1">Place up to 3 portals on the board - new portals replace the oldest ones</motion.div>
                                </motion.div>
                                <motion.div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <motion.div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                        <span className="font-bold">3</span>
                                    </motion.div>
                                    <motion.div className="flex-1">Pieces automatically teleport when their movement path crosses a portal</motion.div>
                                </motion.div>
                                <motion.div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <motion.div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                        <span className="font-bold">4</span>
                                    </motion.div>
                                    <motion.div className="flex-1">Use portals strategically to outmaneuver your opponent and checkmate their king</motion.div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </section >

            {/* Auth Modals */}
            < Modal isOpen={isLoginModalOpen} onClose={closeLoginModal} title="Sign In" >
                <LoginModal onClose={closeLoginModal} onSwitchToSignup={switchToSignup} />
            </Modal >

            <Modal isOpen={isSignupModalOpen} onClose={closeSignupModal} title="Sign Up">
                <SignupModal onClose={closeSignupModal} onSwitchToLogin={switchToLogin} />
            </Modal>
        </motion.div >
    );
};

export default LandingPage;