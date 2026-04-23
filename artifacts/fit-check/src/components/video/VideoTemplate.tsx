import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '../../lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  slide1: 4500,
  slide2: 4500,
  slide3: 4500,
  slide4: 4500,
  slide5: 5000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FDFBF7] font-sans text-[#2C2C2C]">
      {/* Persistent Background layer */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute rounded-full opacity-20 blur-[60px]"
          style={{ background: '#F5A623', width: '60vw', height: '60vw' }}
          animate={{
            x: ['-20%', '80%', '20%'],
            y: ['-20%', '30%', '60%'],
            scale: [1, 1.2, 0.9],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-0 bottom-0 rounded-full opacity-10 blur-[80px]"
          style={{ background: '#F5A623', width: '50vw', height: '50vw' }}
          animate={{
            x: ['20%', '-50%', '10%'],
            y: ['20%', '-20%', '-40%'],
            scale: [1, 1.1, 0.8],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Decorative midground */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <motion.div
          className="w-[300px] h-[600px] rounded-[40px] border border-[#2C2C2C]/5"
          animate={{
            rotate: [0, 2, -2, 0],
            scale: currentScene === 4 ? 1.05 : 1,
            borderColor: currentScene === 4 ? 'rgba(245, 166, 35, 0.3)' : 'rgba(44, 44, 44, 0.05)'
          }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-20 w-full h-full flex items-center justify-center">
        <div className="relative w-[300px] h-[600px] overflow-hidden rounded-[40px] bg-white shadow-2xl shadow-[#2C2C2C]/10 border border-[#F5A623]/20">
          <AnimatePresence initial={false} mode="popLayout">
            {currentScene === 0 && <Scene1 key="slide1" />}
            {currentScene === 1 && <Scene2 key="slide2" />}
            {currentScene === 2 && <Scene3 key="slide3" />}
            {currentScene === 3 && <Scene4 key="slide4" />}
            {currentScene === 4 && <Scene5 key="slide5" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
