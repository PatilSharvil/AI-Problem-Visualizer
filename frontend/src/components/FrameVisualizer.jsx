import React, { useState, useEffect, useRef } from 'react';
import ArrayRow from './ArrayRow';
import VariablePanel from './VariablePanel';
import HashMapDisplay from './HashMapDisplay';
import StackQueueDisplay from './StackQueueDisplay';
import SubsetsDisplay from './SubsetsDisplay';
import HeapDisplay from './HeapDisplay';
import LinkedListDisplay from './LinkedListDisplay';
import './FrameVisualizer.css';

function FrameVisualizer({ frames, currentFrameIndex, onPrevious, onNext }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);
  const visualizerRef = useRef(null);

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
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

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

  const currentFrame = frames[currentFrameIndex];
  if (!currentFrame) {
    return (
      <div className="frame-visualizer empty">
        <p>Invalid frame</p>
      </div>
    );
  }

  const components = currentFrame.components || [];

  const renderComponent = (comp, idx) => {
    if (!comp || !comp.type) return null;

    switch (comp.type) {
      case 'array':
        return (
          <ArrayRow
            key={comp.id || idx}
            id={comp.id}
            label={comp.label}
            data={comp.data || []}
            highlight={comp.highlight || []}
            pointers={comp.pointers || {}}
            window={comp.window}
            swapIndices={comp.swap}
          />
        );
      case 'hashmap':
        return <HashMapDisplay key={idx} data={comp.data || {}} />;
      case 'stack':
        return <StackQueueDisplay key={idx} type="stack" data={comp.data || []} operation={comp.operation} operationValue={comp.operationValue} />;
      case 'queue':
        return <StackQueueDisplay key={idx} type="queue" data={comp.data || []} operation={comp.operation} operationValue={comp.operationValue} />;
      case 'deque':
        return <StackQueueDisplay key={idx} type="deque" data={comp.data || []} operation={comp.operation} operationValue={comp.operationValue} />;
      case 'heap':
        return <HeapDisplay key={idx} data={comp.data || []} />;
      case 'subsets':
        return <SubsetsDisplay key={idx} data={comp.data || []} />;
      case 'linked_list':
        return <LinkedListDisplay key={idx} data={comp.data || []} pointers={comp.pointers} highlight={comp.highlight} operation={comp.operation} />;
      case 'variables':
        return <VariablePanel key={idx} items={comp.items || {}} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="frame-visualizer"
      ref={visualizerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="frame-header">
        <div className="header-badges">
          <span className="frame-counter">
            Step {currentFrameIndex + 1} / {frames.length}
          </span>
          {currentFrame.pattern && (
            <span className="pattern-badge">{currentFrame.pattern.replace(/_/g, ' ')}</span>
          )}
          {currentFrame.phase_name && (
            <span className="phase-badge">Phase {currentFrame.phase_number}: {currentFrame.phase_name}</span>
          )}
        </div>
        <h2 className="frame-title">{currentFrame.title || 'Step'}</h2>
        {currentFrame.description && (
          <p className="frame-description">{currentFrame.description}</p>
        )}
      </div>

      {/* Content */}
      <div className="frame-content">
        {components.length > 0 ? (
          components.map((comp, idx) => renderComponent(comp, idx))
        ) : (
          <div className="no-components">
            <p>Step rendered: {currentFrame.title}</p>
            <p className="debug-info">Components: {JSON.stringify(currentFrame).substring(0, 200)}...</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="frame-navigation">
        <button onClick={onPrevious} disabled={currentFrameIndex === 0} className="nav-btn">
          ◀ Prev
        </button>
        <button onClick={() => setIsPlaying(prev => !prev)} className="nav-btn play-btn">
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={onNext} disabled={currentFrameIndex === frames.length - 1} className="nav-btn">
          Next ▶
        </button>
      </div>

      {/* Progress */}
      <div className="progress-bar">
        {frames.map((_, index) => (
          <div
            key={index}
            className={`progress-step ${index === currentFrameIndex ? 'active' : ''} ${index < currentFrameIndex ? 'done' : ''}`}
          />
        ))}
      </div>

      <div className="keyboard-hint">
        Click here, then use: ← Prev | Space Play/Pause | → Next
      </div>
    </div>
  );
}

export default FrameVisualizer;