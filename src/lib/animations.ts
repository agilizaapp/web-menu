/**
 * Configurações de animações fluidas para o projeto
 * Usando Tailwind CSS e classes de animação personalizadas
 */

export const animations = {
  // Fade animations
  fadeIn: "animate-in fade-in duration-300",
  fadeOut: "animate-out fade-out duration-200",
  fadeInUp: "animate-in fade-in slide-in-from-bottom-4 duration-300",
  fadeInDown: "animate-in fade-in slide-in-from-top-4 duration-300",
  
  // Scale animations
  scaleIn: "animate-in zoom-in-95 duration-200",
  scaleOut: "animate-out zoom-out-95 duration-150",
  
  // Slide animations
  slideInFromLeft: "animate-in slide-in-from-left duration-300",
  slideInFromRight: "animate-in slide-in-from-right duration-300",
  slideInFromBottom: "animate-in slide-in-from-bottom duration-300",
  slideInFromTop: "animate-in slide-in-from-top duration-300",
  
  // Combined animations
  popIn: "animate-in zoom-in-95 fade-in duration-200",
  popOut: "animate-out zoom-out-95 fade-out duration-150",
  
  // Bounce effect
  bounceIn: "animate-in zoom-in-90 duration-300 ease-out",
  
  // Stagger delays for lists
  stagger: {
    item1: "animation-delay-0",
    item2: "animation-delay-75",
    item3: "animation-delay-150",
    item4: "animation-delay-225",
    item5: "animation-delay-300",
  },
  
  // Hover states
  hover: {
    lift: "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
    scale: "transition-transform duration-200 hover:scale-105",
    glow: "transition-all duration-200 hover:shadow-lg hover:shadow-primary/20",
    brightness: "transition-all duration-200 hover:brightness-110",
  },
  
  // Loading states
  pulse: "animate-pulse",
  spin: "animate-spin",
  bounce: "animate-bounce",
  
  // Custom transitions
  smooth: "transition-all duration-300 ease-in-out",
  fast: "transition-all duration-150 ease-out",
  slow: "transition-all duration-500 ease-in-out",
};

// Framer Motion variants (se você quiser usar no futuro)
export const motionVariants = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  },
  card: {
    hidden: { opacity: 0, scale: 0.95 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  },
  modal: {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  },
};
