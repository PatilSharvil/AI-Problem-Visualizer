import React, { useState } from 'react';
import ProblemInput from './components/ProblemInput';
import FrameVisualizer from './components/FrameVisualizer';
import './App.css';

function App() {
  const [frames, setFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleProblemSubmit = async (problemStatement) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problemStatement }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setFrames(data.frames);
      setCurrentFrameIndex(0);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const nextFrame = () => {
    if (currentFrameIndex < frames.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
    }
  };

  const prevFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };

  return (
    <div className="app">
      <h1>AI Algorithm Visualizer</h1>

      <ProblemInput onSubmit={handleProblemSubmit} isLoading={isLoading} />

      {error && <div className="error">Error: {error}</div>}

      {frames.length > 0 && (
        <FrameVisualizer
          frames={frames}
          currentFrameIndex={currentFrameIndex}
          onNext={nextFrame}
          onPrevious={prevFrame}
        />
      )}
    </div>
  );
}

export default App;