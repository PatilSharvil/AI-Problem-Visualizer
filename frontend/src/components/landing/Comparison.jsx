import React from 'react';
import { Check, X } from 'lucide-react';
import VishvaroopLogo from '../VishvaroopLogo';

const Comparison = () => {
    const points = [
        { feature: "AI-Powered Analysis", us: true, others: false },
        { feature: "Interactive Step-through", us: true, others: true },
        { feature: "Custom Test Cases", us: true, others: false },
        { feature: "Ad-free Experience", us: true, others: false },
    ];

    return (
        <section className="py-24 bg-surface/30">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Vishvaroop?</span>
                    </h2>
                </div>

                <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-3 bg-black/40 p-6 border-b border-white/5">
                        <div className="col-span-1 text-gray-400 font-medium">Feature</div>
                        <div className="col-span-1 text-center font-bold text-white flex items-center justify-center gap-2">
                            <VishvaroopLogo size={52} />
                            VishvaRoop
                        </div>
                        <div className="col-span-1 text-center text-gray-500 font-medium">Others</div>
                    </div>

                    {/* Rows */}
                    {points.map((point, index) => (
                        <div key={index} className="grid grid-cols-3 p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="col-span-1 text-gray-300 font-medium">{point.feature}</div>
                            <div className="col-span-1 flex justify-center text-blue-400">
                                {point.us ? <Check size={20} className="stroke-[3px]" /> : <X size={20} className="text-gray-600" />}
                            </div>
                            <div className="col-span-1 flex justify-center text-gray-600">
                                {point.others ? <Check size={20} /> : <X size={20} />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Comparison;
