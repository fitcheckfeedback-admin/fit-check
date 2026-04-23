import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const slideTransitions = {
  initial: { x: '100%', opacity: 0, scale: 0.95 },
  animate: { x: 0, opacity: 1, scale: 1 },
  exit: { x: '-100%', opacity: 0, scale: 0.95 },
  transition: { type: 'spring', stiffness: 300, damping: 30 }
};

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center bg-white"
      {...slideTransitions}
    >
      <motion.div
        className="text-7xl mb-8"
        initial={{ scale: 0, rotate: -45 }}
        animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -45 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        🌤️
      </motion.div>
      
      <motion.h1 
        className="text-2xl font-bold mb-4 text-[#2C2C2C] tracking-tight leading-tight"
        initial={{ y: 20, opacity: 0 }}
        animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        Your daily fit, sorted
      </motion.h1>
      
      <motion.p 
        className="text-[15px] text-[#2C2C2C]/70 leading-relaxed"
        initial={{ y: 20, opacity: 0 }}
        animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Every day Fit Check reads your local weather and suggests exactly what to wear — no more standing at your wardrobe guessing.
      </motion.p>
      
      {/* Decorative ambient element */}
      <motion.div 
        className="absolute bottom-10 w-12 h-1 bg-[#F5A623] rounded-full"
        animate={{ scaleX: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
