// Framer Motion animation variants

// Fade in animation
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
};

// Slide up animation
export const slideUp = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
};

// Slide in from left
export const slideInLeft = {
    hidden: { x: -100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.6 } }
};

// Slide in from right
export const slideInRight = {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.6 } }
};

// Scale animation for buttons
export const scaleButton = {
    tap: { scale: 0.95 },
    hover: { scale: 1.05 }
};

// Portal pulse animation
export const portalPulse = {
    pulse: {
        scale: [1, 1.1, 1],
        opacity: [0.7, 0.9, 0.7],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

// Modal animation
export const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
        y: 20
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        transition: {
            duration: 0.2
        }
    }
};

// Stagger children animation
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

// Chess piece movement animation
export const chessPieceMove = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.2, 1],
        transition: {
            duration: 0.5,
            ease: "easeInOut"
        }
    }
};