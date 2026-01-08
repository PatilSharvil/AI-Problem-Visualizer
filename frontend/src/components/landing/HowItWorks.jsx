import React from 'react';
import { MousePointer, Zap, Code } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            id: '01',
            icon: MousePointer,
            title: 'Pick Some Problem',
            description: 'Choose any algorithm problem from our curated list of 100+ challenges across all difficulty levels.',
            color: 'bg-blue-500'
        },
        {
            id: '02',
            icon: Zap,
            title: 'AI Generates Visualization',
            description: 'Our AI analyzes the problem logic and instantly creates a step-by-step interactive visualization.',
            color: 'bg-cyan-400'
        },
        {
            id: '03',
            icon: Code,
            title: 'Write & Test',
            description: 'Implement your solution alongside the visual reference to verify your logic in real-time.',
            color: 'bg-purple-500'
        }
    ];

    return (
        <section id="how-it-works" className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Works</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Transform complex coding problems into intuitive visual experiences in just three simple steps.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 -z-10" />

                    {steps.map((step, index) => (
                        <div key={index} className="relative group">
                            {/* Card */}
                            <div className="h-full bg-surface border border-white/5 p-8 rounded-2xl hover:border-white/10 hover:bg-white/5 transition-all duration-300 relative z-10 overflow-hidden">
                                {/* Hover Glow */}
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${index === 1 ? 'from-cyan-400 to-blue-500' : index === 2 ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-400'} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                <div className="relative mb-6">
                                    <div className="w-14 h-14 rounded-xl bg-background border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <step.icon size={28} className={step.color.replace('bg-', 'text-')} />
                                    </div>
                                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                        {index + 1}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
