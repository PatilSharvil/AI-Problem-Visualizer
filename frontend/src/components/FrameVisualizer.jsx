import React, { useState, useEffect, useRef } from 'react';
import EntityRenderer from './EntityRenderer';
import './FrameVisualizer.css';

/**
 * Universal Frame Visualizer
 * Renders frames with entities and actions - no pattern-specific logic
 */
function FrameVisualizer({ frames, currentFrameIndex, onPrevious, onNext }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying && frames && currentFrameIndex < frames.length - 1) {
      playIntervalRef.current = setInterval(() => {
        onNext();
      }, 1500);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
      if (isPlaying && currentFrameIndex >= frames.length - 1) {
        setIsPlaying(false);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentFrameIndex, frames, onNext]);

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onPrevious();
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsPlaying(prev => !prev);
    }
  };

  if (!frames || frames.length === 0) {
    return (
      <div className="frame-visualizer empty">
        <p>No visualization available</p>
      </div>
    );
  }

  const frame = frames[currentFrameIndex];
  if (!frame) return null;

  const { entities = [], actions = [], title, description, variables } = frame;

  return (
    <div
      className="frame-visualizer"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Step Header */}
      <div className="step-header">
        <div className="step-counter">
          Step {currentFrameIndex + 1} of {frames.length}
        </div>
        <h3 className="step-title">{title}</h3>
        <p className="step-description">{description}</p>
      </div>

      {/* Entities */}
      <div className="entities-container">
        {entities.map((entity, idx) => (
          <EntityRenderer
            key={entity.id || idx}
            entity={entity}
            actions={actions}
          />
        ))}
      </div>

      {/* Variables - inline simple display */}
      {variables && Object.keys(variables).length > 0 && (
        <div className="variables-panel">
          {Object.entries(variables).map(([key, value]) => (
            <span key={key} className="variable-item">
              <strong>{key}:</strong> {JSON.stringify(value)}
            </span>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <button
          className="nav-btn"
          onClick={onPrevious}
          disabled={currentFrameIndex === 0}
        >
          ← Previous
        </button>

        <button
          className={`nav-btn play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={() => setIsPlaying(prev => !prev)}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          className="nav-btn"
          onClick={onNext}
          disabled={currentFrameIndex === frames.length - 1}
        >
          Next →
        </button>
      </div>

      <div className="keyboard-hint">
        Use ← → arrow keys to navigate, Space to play/pause
      </div>
    </div>
  );
}

export default FrameVisualizer;