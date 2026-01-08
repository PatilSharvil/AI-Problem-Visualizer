import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ProblemInput from '../components/ProblemInput';
import FrameVisualizer from '../components/FrameVisualizer';
import { mockFrames, mockBinarySearchFrames } from '../data/mockData';
import clsx from 'clsx';
import { Loader2, ArrowLeft } from 'lucide-react';

import VishvaroopLogo from '../components/VishvaroopLogo';

function VisualizerPage() {
    const [frames, setFrames] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debugData, setDebugData] = useState(null);
    const [hasStarted, setHasStarted] = useState(false);

    // Auto-fill logic
    const location = useLocation();
    const autoFill = location.state?.autoFill;

    useEffect(() => {
        if (autoFill) {
            const element = document.getElementById('describe-section');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Hash scroll support
        if (location.hash === '#describe-section') {
            const element = document.getElementById('describe-section');
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [autoFill, location.hash]);

    // Use mock data for now if API fails or for dev
    const handleProblemSubmit = async (problemStatement) => {
        setIsLoading(true);
        setError(null);
        setHasStarted(true);

        try {
            const response = await fetch('/api/classify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ problemStatement }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();

            // Validation: Ensure valid frames array
            if (data.frames && Array.isArray(data.frames) && data.frames.length > 0) {
                setFrames(data.frames);
            } else {
                console.warn("API returned invalid format");
                setDebugData(data); // Capture what we got
                setError("API returned invalid/empty data structure. See Raw Response below.");
                // Ensure we don't automatically overwrite with mock frames yet, let user see debug screen
            }

        } catch (err) {
            console.error('Backend Error:', err.message);
            // Fallback to mock data on error so visualization still works
            const lowerInput = problemStatement.toLowerCase();
            if (lowerInput.includes('search') || lowerInput.includes('binary') || lowerInput.includes('sorted')) {
                console.log('Falling back to Binary Search mock data');
                setFrames(mockBinarySearchFrames);
            } else {
                console.log('Falling back to Default mock data');
                setFrames(mockFrames);
            }
            setError(null); // Clear error to allow rendering frames
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-text-primary p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/5 rounded-full blur-[150px]" />
            </div>

            <header className="w-full max-w-7xl mb-12 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white group">
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <VishvaroopLogo />
                        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-fade-in drop-shadow-sm">
                            VishvaRoop
                        </h1>
                    </div>
                </div>

                {hasStarted ? (
                    <button
                        onClick={() => setHasStarted(false)}
                        className="text-sm font-medium text-gray-500 hover:text-white hidden md:flex items-center gap-2 tracking-wide uppercase transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                ) : (
                    <div className="text-sm font-medium text-gray-500 hidden md:block tracking-wide uppercase">
                        Smart Algorithm Visualization
                    </div>
                )}
            </header>

            <main className="w-full max-w-7xl flex-1 flex flex-col gap-8 relative z-10">
                {!hasStarted ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
                        <div className="relative group w-full max-w-3xl transform transition-all duration-500 hover:scale-[1.002]">
                            {/* Glowing Border Background */}
                            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/30 via-blue-600/30 to-purple-600/30 rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition duration-1000"></div>

                            {/* Card Content */}
                            <div className="relative backdrop-blur-2xl bg-[#0B0F19]/70 p-8 md:p-14 w-full text-center space-y-10 rounded-3xl border border-white/10 shadow-[0_0_50px_-15px_rgba(0,0,0,0.5)]">
                                <div className="space-y-6">
                                    <h2 id="describe-section" className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tight drop-shadow-lg">
                                        Describe your algorithm problem
                                    </h2>
                                    <p className="text-gray-400 text-lg md:text-xl font-light max-w-xl mx-auto leading-relaxed">
                                        Enter a LeetCode-style problem statement, and our AI will generate a <span className="text-cyan-400 font-medium">step-by-step visualization</span> for you.
                                    </p>
                                </div>
                                <ProblemInput onSubmit={handleProblemSubmit} isLoading={isLoading} initialValue={autoFill} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 h-[90vh] animate-fade-in bg-black/20 rounded-xl overflow-hidden p-1 border border-white/5">
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center glass-panel">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                    <p className="text-lg font-medium">Generating visualization...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex-1 glass-panel p-8 flex items-center justify-center text-error">
                                <p>Error: {error}</p>
                            </div>
                        ) : (
                            <>
                                <FrameVisualizer frames={frames} />
                                {error && (
                                    <div className="absolute inset-0 z-50 bg-black/90 p-8 overflow-auto text-left font-mono">
                                        <div className="text-red-400 font-bold mb-4 text-xl">⚠️ DEBUG MODE: Backend Failure</div>
                                        <div className="text-white mb-2">Error: {error}</div>
                                        <div className="text-yellow-400 mb-2">If you see this, the Frontend connected to Backend, but the data was invalid.</div>
                                        {debugData && (
                                            <div>
                                                <div className="text-blue-400 mt-4 font-bold">Raw Backend Response:</div>
                                                <pre className="text-xs text-green-300 whitespace-pre-wrap border border-gray-700 p-4 rounded mt-2">
                                                    {JSON.stringify(debugData, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setError(null)}
                                            className="mt-6 px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
                                        >
                                            Close Debug & Show Mock Data
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </main>

            <footer className="mt-8 text-center text-text-muted text-sm pb-4">
                &copy; 2026 AI Problem Visualizer
            </footer>
        </div>
    );
}

export default VisualizerPage;
