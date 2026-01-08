import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const ProblemInput = ({ onSubmit, isLoading }) => {
  const [problemStatement, setProblemStatement] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Use anime.js for button hover effect later if needed, mostly CSS is robust enough for now

  const exampleProblem = "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (problemStatement.trim()) {
      onSubmit(problemStatement);
    }
  };

  const handleTryExample = () => {
    setProblemStatement(exampleProblem);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
      <div className="relative group/input">
        <div className={clsx(
          "absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-lg transition-opacity duration-500",
          isFocused ? "opacity-100" : "opacity-0"
        )} />

        <textarea
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Example: Given an array of integers, find two numbers such that they add up to a specific target number."
          className={clsx(
            "relative w-full min-h-[180px] resize-none text-lg p-6 rounded-2xl",
            "bg-black/30 border border-white/10 text-white backdrop-blur-sm",
            "placeholder:text-gray-600 placeholder:font-light leading-relaxed",
            "focus:outline-none focus:border-cyan-500/30 focus:bg-black/40 focus:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300",
            "shadow-inner"
          )}
          disabled={isLoading}
        />

        <div className="absolute bottom-4 right-4 text-xs font-mono text-gray-600 transition-colors duration-300 group-focus-within/input:text-cyan-400">
          {problemStatement.length} chars
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handleTryExample}
          className="text-sm text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 group/link py-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 group-hover/link:bg-cyan-400 transition-colors" />
          <span className="group-hover/link:underline decoration-cyan-400/30 underline-offset-4 tracking-wide">Try an example</span>
        </button>

        <button
          type="submit"
          disabled={isLoading || !problemStatement.trim()}
          className={clsx(
            "relative px-10 py-4 rounded-xl font-bold text-white transition-all duration-300 overflow-hidden group shadow-lg",
            !isLoading && problemStatement.trim()
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-[0.98] ring-1 ring-white/20"
              : "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
          )}
        >
          <div className="relative z-10 flex items-center gap-2.5">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                <span className="tracking-wide">Processing...</span>
              </>
            ) : (
              <>
                <span className="tracking-wide text-lg">Visualize</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </>
            )}
          </div>

          {/* Shine Effect */}
          {!isLoading && problemStatement.trim() && (
            <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shine duration-1000" />
          )}
        </button>
      </div>
    </form>
  );
};

export default ProblemInput;
