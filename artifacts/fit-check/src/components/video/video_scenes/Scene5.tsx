import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const slideTransitions = {
  initial: { scale: 0.8, opacity: 0, filter: 'blur(10px)' },
  animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
  exit: { scale: 1.1, opacity: 0, filter: 'blur(10px)' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1300),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center bg-[#F5A623] text-white"
      {...slideTransitions}
    >
      <motion.div
        className="text-8xl mb-8"
        initial={{ scale: 0 }}
        animate={phase >= 1 ? { scale: 1 } : { scale: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        ✨
      </motion.div>
      
      <motion.h1 
        className="text-3xl font-black mb-4 tracking-tight leading-tight"
        initial={{ y: 30, opacity: 0 }}
        animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        You're all set!
      </motion.h1>
      
      <motion.p 
        className="text-[16px] text-white/90 leading-relaxed font-medium"
        initial={{ y: 20, opacity: 0 }}
        animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Explore the app and let the weather decide your style.
      </motion.p>
      
      {/* Decorative ambient element */}
      <motion.div 
        className="absolute inset-0 border-[10px] border-white/20 rounded-[40px] m-4 pointer-events-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </motion.div>
  );
}
