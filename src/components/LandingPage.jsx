import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BiChevronRight,
    BiGroup,BiSliderAlt,BiMessageRoundedDetail,BiHistory,BiTime
} from 'react-icons/bi';
import { GiChessKnight, GiPortal, GiChessBishop, GiChessRook } from 'react-icons/gi';
import { HiOutlineSparkles } from 'react-icons/hi';
import Modal from './common/Modal';
import LoginModal from './auth/LoginModal';
import SignupModal from './auth/SignupModal';

// Enhanced animations
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

const slideUp = {
    hidden: { opacity: 0, y: 100 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.7, ease: "easeOut" }
    }
};

const slideInLeft = {
    hidden: { opacity: 0, x: -100 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.7, ease: "easeOut", delay: 0.2 }
    }
};

const slideInRight = {
    hidden: { opacity: 0, x: 100 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.7, ease: "easeOut", delay: 0.3 }
    }
};

const scaleButton = {
    hover: { 
        scale: 1.05, 
        boxShadow: "0 10px 25px rgba(99, 102, 241, 0.2)",
        transition: { duration: 0.3, ease: "easeOut" }
    }
};

const portalPulse = {
    pulse: {
        scale: [1, 1.1, 1],
        opacity: [0.8, 1, 0.8],
        filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3
        }
    }
};

const LandingPage = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
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


    // Enhanced navigation animation variants
    const navItemVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: (i) => ({ 
            opacity: 1, 
            y: 0,
            transition: {
                delay: 0.1 * i,
                duration: 0.5,
                ease: "easeOut"
            }
        })
    };

    // Floating animation for chess pieces
    const floatingAnimation = {
        animate: {
            y: [0, -10, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Dynamic background with parallax effect */}
            <motion.div 
                className="absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
            >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/70 to-gray-400/90"></div>                
                {/* Animated chess pattern */}
                <motion.div 
                    className="absolute inset-0 bg-[url('/chess-pattern.png')] opacity-5 bg-repeat"
                    style={{ 
                        backgroundSize: '200px',
                        y: scrollY * 0.1 
                    }}
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.05, 0.08, 0.05]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                ></motion.div>
             
                
               
            </motion.div>

            {/* Enhanced Navbar with glassmorphism */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/10 py-4 shadow-md border-b border-white/10">
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
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.8 }}
                        >
                            <img
                                src="/favicons/515.png"
                                alt="Portal Gambit Logo"
                                className="w-10 h-10 drop-shadow-lg"
                            />
                        </motion.div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-200 hover:to-white transition-all duration-500">
                            Portal Gambit
                        </span>
                    </motion.div>

                    <nav className="hidden md:flex items-center space-x-8">
                        {[
                            { name: 'About', href: '#about' },
                            { name: 'Features', href: '#features' },
                            { name: 'Gameplay', href: '#how-to-play' },
                            
                        ].map((item, index) => (
                            <motion.a
                                key={item.name}
                                href={item.href}
                                className="text-sm font-medium text-blue-100 hover:text-white transition-all duration-300 relative group"
                                variants={navItemVariants}
                                custom={index}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {item.name}
                                <motion.span 
                                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-300 group-hover:w-full transition-all duration-300"
                                    layoutId={`underline-${index}`}
                                />
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
                    
                    {/* Mobile menu button */}
                    <motion.button
                        className="md:hidden text-white p-2 rounded-md"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </motion.button>
                </motion.div>
            </header>

            {/* Enhanced Hero Section with 3D elements */}
            <section id="about"> 
            <motion.div 
                className="relative pt-32 pb-20 overflow-hidden"
                variants={slideUp}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    variants={fadeIn}
                    className="container mx-auto px-4 md:px-6 relative z-10 mt-16">
                    <motion.div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto">
                        <motion.div
                            variants={slideInLeft}
                            className="md:w-1/2 text-left mb-10 md:mb-0 md:pr-10">
                            <motion.div 
                                className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/30 text-xs font-medium text-blue-100 mb-6"
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                            >
                                <HiOutlineSparkles className="inline mr-1" />
                                REVOLUTIONARY CHESS VARIANT
                            </motion.div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-black leading-tight">
                                Reimagine Chess Through<br />
                                <motion.span 
                                    className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent"
                                    animate={{
                                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                                    }}
                                    transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    Portal Mechanics
                                </motion.span>
                            </h1>

                            <p className="text-blue-100 text-lg mb-8 max-w-md leading-relaxed">
                                Experience an innovative evolution of chess where strategic portals allow pieces to teleport across the board, creating entirely new dimensions of gameplay and strategy.
                            </p>

                            <motion.div className="flex flex-col sm:flex-row gap-4">
                                <motion.button
                                    onClick={handleSignUpClick}
                                    className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 rounded-full px-8 py-4 flex items-center justify-center gap-2 font-medium"
                                    whileHover={scaleButton.hover}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Play Now <BiChevronRight size={20} />
                                </motion.button>
                                <motion.a
                                    href="#how-to-play"
                                    className="border border-white/30 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 text-center transition-all duration-300 flex items-center justify-center gap-2"
                                    whileHover={scaleButton.hover}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Watch Gameplay
                                </motion.a>
                            </motion.div>
                            
                          
                        </motion.div>

                        <motion.div
                            variants={slideInRight}
                            className="md:w-1/2 relative">
                            {/* 3D Chess board representation */}
                            <motion.div className="aspect-square max-w-md mx-auto relative perspective-800">
                                {/* Chessboard background */}
                                <motion.div 
                                    className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
                                    style={{ transform: `rotateX(20deg) rotateY(${-5 + scrollY * 0.01}deg)` }}
                                    animate={{ 
                                        rotateX: [20, 25, 20],
                                        rotateY: [-5, 5, -5],
                                    }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-900/80 via-indigo-800 to-blue-900/80 p-4 backdrop-blur-sm border border-indigo-700/50">
                                        {/* Chess grid pattern */}
                                        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                                            {[...Array(64)].map((_, i) => {
                                                const row = Math.floor(i / 8);
                                                const col = i % 8;
                                                const isBlack = (row + col) % 2 === 1;
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={`${isBlack ? 'bg-indigo-800/70' : 'bg-indigo-600/30'} 
                                                                  border border-indigo-700/20`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                                
                                {/* Chess pieces and portals */}
                                <motion.div 
                                    className="absolute inset-0 flex items-center justify-center z-10"
                                    style={{ transform: `rotateX(20deg) rotateY(${-5 + scrollY * 0.01}deg)` }}
                                    animate={{ 
                                        rotateX: [20, 25, 20],
                                        rotateY: [-5, 5, -5],
                                    }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <motion.div
                                        variants={floatingAnimation}
                                        animate="animate"
                                        className="relative"
                                    >
                                        <GiChessKnight size={100} className="text-white drop-shadow-2xl filter brightness-110" />
                                    </motion.div>
                                    
                                    {/* Additional chess pieces */}
                                    <motion.div 
                                        className="absolute top-1/4 left-1/4"
                                        variants={floatingAnimation}
                                        animate="animate"
                                    >
                                        <GiChessBishop size={70} className="text-blue-300 drop-shadow-2xl" />
                                    </motion.div>
                                    
                                    <motion.div 
                                        className="absolute bottom-1/4 right-1/4"
                                        variants={floatingAnimation}
                                        animate="animate"
                                        style={{ animationDelay: '1s' }}
                                    >
                                        <GiChessRook size={70} className="text-blue-300 drop-shadow-2xl" />
                                    </motion.div>
                                </motion.div>
                                
                               
                                <motion.div 
                                    className="absolute -bottom-5 -left-5 z-20"
                                    variants={portalPulse} 
                                    animate="pulse"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-orange-500 blur-xl opacity-40 scale-150" />
                                        <GiPortal size={80} className="text-orange-400 filter drop-shadow-lg brightness-125" />
                                    </div>
                                </motion.div>
                                
                                {/* Portal connection line/beam */}
                                <motion.div 
                                    className="absolute top-0 left-0 w-full h-full z-15 overflow-hidden pointer-events-none"
                                    style={{ transform: `rotateX(20deg) rotateY(${-5 + scrollY * 0.01}deg)` }}
                                >
                                    <motion.div 
                                        className="absolute h-1 bg-gradient-to-r from-blue-400 via-indigo-300 to-orange-400 rounded-full top-1/2 left-0 right-0 opacity-70 blur-sm"
                                        animate={{
                                            opacity: [0.3, 0.7, 0.3],
                                            height: ['2px', '3px', '2px']
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
</section>
            {/* Features Section with modern cards */}
            <section id="features" className="py-20 relative overflow-hidden" >
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-b from-indigo-900/0 via-indigo-700/50 to-indigo-700/70"
                    style={{ y: scrollY * -0.1 }}
                />
                
                <motion.div 
                    className="container mx-auto px-4 md:px-6 relative z-10"
                    variants={slideUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <motion.div
                        className="text-center max-w-3xl mx-auto mb-16">
                        <motion.div 
                            className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/30 text-xs font-medium text-blue-100 mb-4"
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                        >
                            GAMEPLAY FEATURES
                        </motion.div>
                        
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                            A New Dimension of Chess
                        </h2>
                        <p className="text-blue-100 text-lg">
                            Portal Gambit introduces revolutionary mechanics that transform traditional chess into an entirely new strategic experience.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
    {
        icon: <GiPortal className="text-blue-400 w-8 h-8" />,
        title: "Dimensional Portals",
        description: "Warp pieces instantly with portals, unlocking new strategies."
    },
    {
        icon: <BiSliderAlt className="text-blue-400 w-8 h-8" />,
        title: "Customizable Matches",
        description: "Set time limits and portal rules for a tailored experience."
    },
    {
        icon: <BiMessageRoundedDetail className="text-blue-400 w-8 h-8" />,
        title: "Interactive Communication",
        description: "Chat with opponents via voice and text for strategic play."
    },
    {
        icon: <BiGroup className="text-blue-400 w-8 h-8" />,
        title: "Social Competition",
        description: "Track rivalries, build your network, and challenge friends."
    },
    {
        icon: <BiHistory className="text-blue-400 w-8 h-8" />,
        title: "Match History",
        description: "Review past games to analyze moves and improve strategy."
    },
    {
        icon: <BiTime className="text-blue-400 w-8 h-8" />,
        title: "Flexible Time Controls",
        description: "Play fast blitz or deep-thinking correspondence games."
    }
]
.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={fadeIn}
                                whileHover={scaleButton.hover}
                                className="bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:border-white/30 transition-all group"
                            >
                                <motion.div className="bg-gradient-to-br from-indigo-600/30 to-blue-600/30 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 border border-indigo-500/30 group-hover:border-indigo-500/50 transition-all">
                                    {feature.icon}
                                </motion.div>
                                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-200 transition-all">{feature.title}</h3>
                                <p className="text-blue-100 group-hover:text-white transition-all">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

           
      
  


          {/* How to Play Section */}
<section id="how-to-play" className="py-20 relative overflow-hidden">
    <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 via-indigo-900/70 to-indigo-900/90"
        style={{ y: scrollY * -0.1 }}
    />
    
    <motion.div 
        className="container mx-auto px-4 md:px-6 relative z-10"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
    >
        <motion.div className="text-center max-w-3xl mx-auto mb-12">
            <motion.div 
                className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/30 text-xs font-medium text-blue-100 mb-4"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
            >
                GAME MECHANICS
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                How to Play
            </h2>
            <p className="text-blue-100 text-lg">
                Master the art of portal chess with innovative teleportation mechanics
            </p>
        </motion.div>

        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
        >
            <motion.div 
                variants={slideInLeft}
                className="bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20 hover:border-white/30 transition-all group shadow-lg"
                whileHover={scaleButton.hover}
            >
                <motion.div 
                    className="aspect-square rounded-lg mb-6 relative overflow-hidden border border-indigo-500/30 bg-indigo-900/30"
                    whileHover={{
                        boxShadow: "0 0 30px rgba(99, 102, 241, 0.3)",
                    }}
                >
                    {/* Portal Entry */}
                    <motion.div 
                        className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full border-2 border-indigo-500"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                            boxShadow: [
                                "0 0 0 rgba(99, 102, 241, 0.4)",
                                "0 0 15px rgba(99, 102, 241, 0.6)",
                                "0 0 0 rgba(99, 102, 241, 0.4)"
                            ]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <motion.div 
                            className="absolute inset-0 bg-indigo-500/30 rounded-full"
                            animate={{
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        ></motion.div>
                    </motion.div>
                    
                    {/* Portal Exit */}
                    <motion.div 
                        className="absolute bottom-1/4 right-1/4 w-12 h-12 rounded-full border-2 border-blue-500"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                            boxShadow: [
                                "0 0 0 rgba(59, 130, 246, 0.4)",
                                "0 0 15px rgba(59, 130, 246, 0.6)",
                                "0 0 0 rgba(59, 130, 246, 0.4)"
                            ]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    >
                        <motion.div 
                            className="absolute inset-0 bg-blue-500/30 rounded-full"
                            animate={{
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1
                            }}
                        ></motion.div>
                    </motion.div>
                    
                    {/* Chess Knight Piece Movement Indicator - with corrected path */}
                    <motion.div 
                        className="absolute top-1/4 left-1/4 w-8 h-8 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 1, 1, 1, 0],
                            x: [0, 0, 125, 125, 125],  // Start at portal 1, end at portal 2 X position
                            y: [0, 0, 125, 125, 125]   // Start at portal 1, end at portal 2 Y position
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: "easeInOut",
                            times: [0, 0.1, 0.5, 0.9, 1]  // Control timing of each keyframe
                        }}
                    >
                        {/* Knight Chess Piece SVG */}
                        <svg 
                            viewBox="0 0 45 45" 
                            width="100%" 
                            height="100%" 
                            className="text-indigo-500 fill-current"
                        >
                            <g>
                                <path
                                    d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
                                    style={{ fill: "currentColor", stroke: "white", strokeWidth: 1.5, strokeLinejoin: "round" }}
                                />
                                <path
                                    d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
                                    style={{ fill: "currentColor", stroke: "white", strokeWidth: 1.5, strokeLinecap: "round" }}
                                />
                                <path
                                    d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
                                    style={{ fill: "white", stroke: "white", strokeWidth: 1.5 }}
                                />
                                <path
                                    d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z"
                                    transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
                                    style={{ fill: "white", stroke: "white", strokeWidth: 1.5 }}
                                />
                            </g>
                        </svg>
                    </motion.div>
                    
                    {/* Portal connection line/beam */}
                    <motion.div 
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    >
                        <motion.div 
                            className="absolute h-1 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full top-1/2 left-0 right-0 opacity-70 blur-sm"
                            animate={{
                                opacity: [0.3, 0.7, 0.3],
                                height: ['2px', '3px', '2px']
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>
                </motion.div>
                
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-200 transition-all">Portal Movement</h3>
                <p className="text-blue-100 group-hover:text-white transition-all">
                    When a piece's movement path intersects with a portal, it automatically teleports through and continues its movement from the exit portal.
                </p>
            </motion.div>

            <motion.div 
                variants={slideInRight}
                className="bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20 hover:border-white/30 transition-all shadow-lg"
                whileHover={scaleButton.hover}
            >
                <motion.div className="space-y-4 mb-6">
                    {[
                       "Classic Chess with a Twist – move pieces as usual or place portals instead",
                       "Strategic Portals – teleport pieces instantly across the board",
                       "Turn-Based Portal Play – placing a portal pair costs a turn",
                       "Customizable Rules – set time limits & portal limits before playing",
                       "Manage Portals Wisely – exceeding the limit removes the oldest ones"
                     ].map((step, index) => (
                        <motion.div 
                            key={index}
                            className="flex items-center space-x-4 p-4 bg-indigo-900/30 rounded-lg border border-indigo-500/30 group-hover:border-indigo-500/50 hover:bg-indigo-800/40 transition-all"
                            variants={fadeIn}
                            whileHover={{ x: 5 }}
                        >
                            <motion.div 
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600/70 to-blue-600/70 flex items-center justify-center shadow-md"
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="font-bold text-white">{index + 1}</span>
                            </motion.div>
                            <motion.div className="flex-1 text-blue-100">{step}</motion.div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </motion.div>
    </motion.div>
</section>

            {/* Auth Modals */}
            < Modal isOpen={isLoginModalOpen} onClose={closeLoginModal} title="Sign In" >
                <LoginModal onClose={closeLoginModal} onSwitchToSignup={switchToSignup} />
            </Modal >

            <Modal isOpen={isSignupModalOpen} onClose={closeSignupModal} title="Sign Up">
                <SignupModal onClose={closeSignupModal} onSwitchToLogin={switchToLogin} />
            </Modal>
                        
        </div>
    );
};

export default LandingPage;