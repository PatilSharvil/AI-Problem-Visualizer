import React, { useState } from 'react';
import './ProblemInput.css';

const ProblemInput = ({ onSubmit, isLoading }) => {
  const [problemStatement, setProblemStatement] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (problemStatement.trim()) {
      onSubmit(problemStatement);
    }
  };

  return (
    <div className="problem-input">
      <form onSubmit={handleSubmit}>
        <label htmlFor="problemStatement">Enter Algorithm Problem:</label>
        <textarea
          id="problemStatement"
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          placeholder="Example: Find the maximum sum of any contiguous subarray of size 3"
          rows={3}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Visualize'}
        </button>
      </form>
    </div>
  );
};

export default ProblemInput;