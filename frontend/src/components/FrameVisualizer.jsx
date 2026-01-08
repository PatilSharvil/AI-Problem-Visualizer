import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import { animationEngine } from '../utils/AnimationEngine';
import VisualCanvas from './VisualCanvas';
import InfoPanel from './InfoPanel';

const FrameVisualizer = ({ frames }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timerRef = useRef(null);

  // Determine current frame safely
  const currentFrame = frames[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < frames.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false); // Stop at end
    }
  }, [currentIndex, frames.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    animationEngine.reset();
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        handleNext();
      }, 2000 / playbackSpeed); // Base speed 2s per frame
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, handleNext, playbackSpeed]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isPlaying]);

  if (!frames || frames.length === 0) return null;

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Top Bar: Progress and Title */}
      <div className="flex items-center justify-between glass-panel p-4">
        <div>
          <h2 className="text-xl font-bold text-primary">{currentFrame.title}</h2>
          <p className="text-sm text-text-secondary">{currentFrame.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono bg-surface px-2 py-1 rounded border border-white/5">
            Step {currentIndex + 1} / {frames.length}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent border border-accent/20 uppercase tracking-wider font-bold">
            {currentFrame.phase_id || 'PHASE'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Main Visualization Canvas */}
        <div className="flex-[3] glass-panel relative overflow-hidden flex flex-col">
          <VisualCanvas frame={currentFrame} />

          {/* Floating Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur border border-white/10 p-2 rounded-full flex items-center gap-2 shadow-2xl z-50">
            <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded-full text-text-muted hover:text-white transition-colors" title="Reset">
              <RotateCcw size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button onClick={handlePrev} disabled={currentIndex === 0} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <button onClick={togglePlay} className="p-3 bg-primary hover:bg-blue-600 text-white rounded-full shadow-lg transition-transform active:scale-95">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={handleNext} disabled={currentIndex === frames.length - 1} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="flex-1 glass-panel p-0 flex flex-col min-w-[300px] overflow-hidden">
          <InfoPanel frame={currentFrame} />
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="glass-panel p-3 flex items-center gap-4">
        <span className="text-xs font-mono text-text-muted">START</span>
        <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden relative group cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            const newIndex = Math.floor(pct * frames.length);
            setCurrentIndex(Math.min(Math.max(0, newIndex), frames.length - 1));
          }}
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / frames.length) * 100}%` }}
          />
          {/* Hover indicator could go here */}
        </div>
        <span className="text-xs font-mono text-text-muted">END</span>
      </div>
    </div>
  );
};

export default FrameVisualizer;
