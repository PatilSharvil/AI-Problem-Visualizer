import React from 'react';
import { ArrowRight } from 'lucide-react';

const FinalCTA = () => {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10" />

            <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                    Start Visualizing <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Today</span>
                </h2>

                <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
                    Join thousands of developers who are mastering algorithms faster and more intuitively than ever before.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2">
                        Get Started for Free
                        <ArrowRight size={20} />
                    </button>

                    <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface border border-white/10 text-white font-medium hover:bg-white/5 hover:border-white/20 transition-all">
                        Browse Problems
                    </button>
                </div>

                <p className="mt-8 text-sm text-gray-600">
                    No credit card required. Free tier forever.
                </p>
            </div>
        </section>
    );
};

export default FinalCTA;
