import React, { useState, useEffect } from 'react';
import { Loader2, Server, CheckCircle2 } from 'lucide-react';
import VishvaroopLogo from './VishvaroopLogo';

const BackendLoader = () => {
    const [loadingText, setLoadingText] = useState("Waking up the server...");
    const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

    useEffect(() => {
        // Change text after 15 seconds as requested
        const timer = setTimeout(() => {
            setShowLongWaitMessage(true);
            setLoadingText("Still loading... Cold start can take up to a minute.");
        }, 15000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0F19] text-white overflow-hidden">
            {/* Background Gradients - Matching VisualizerPage theme */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[700px] h-[700px] bg-cyan-900/20 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-md w-full animate-fade-in">
                {/* Logo Section with Orbit */}
                <div className="relative mb-12 flex items-center justify-center">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>

                    {/* Orbit Rings - Surrounding the logo */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-t-transparent border-r-blue-500 border-b-transparent border-l-purple-500 rounded-full animate-spin-reverse opacity-70"></div>

                        {/* The Logo itself */}
                        <div className="scale-150 transform transition-transform duration-700 hover:rotate-12 z-10">
                            <VishvaroopLogo />
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-4 tracking-tight">
                    {loadingText}
                </h2>

                <p className="text-gray-400 text-sm md:text-base max-w-xs mx-auto leading-relaxed">
                    {showLongWaitMessage
                        ? "Render free tier spins down after inactivity. Hang tight!"
                        : "This may take a few seconds on first load due to server cold start."}
                </p>

                {/* Progress Indicators (Fake) */}
                <div className="mt-8 flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce delay-0"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-150"></span>
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-300"></span>
                </div>
            </div>
        </div>
    );
};

export default BackendLoader;
