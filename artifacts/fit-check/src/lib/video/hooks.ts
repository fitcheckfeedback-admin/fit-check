import { useState, useEffect } from 'react';

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const sceneKeys = Object.keys(durations);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).startRecording) {
      (window as any).startRecording();
    }
  }, []);

  useEffect(() => {
    const currentKey = sceneKeys[currentScene];
    const duration = durations[currentKey];

    if (!duration) return;

    const timer = setTimeout(() => {
      if (currentScene === sceneKeys.length - 1) {
        if (typeof window !== 'undefined' && (window as any).stopRecording) {
          (window as any).stopRecording();
          (window as any).stopRecording = undefined; // prevent calling again
        }
        setCurrentScene(0);
      } else {
        setCurrentScene(s => s + 1);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [currentScene, durations, sceneKeys]);

  return { currentScene };
}
