import React from 'react';
import { Terminal, Cpu, Share2, Layers, BookOpen, Clock } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: Terminal,
            title: 'AI-Powered Logic',
            description: 'Our advanced AI engine understands algorithm constraints and generates edge cases automatically.'
        },
        {
            icon: Cpu,
            title: 'Real-time Execution',
            description: 'Watch your code run step-by-step with state inspection and variable tracking.'
        },
        {
            icon: Share2,
            title: 'Share & Collaborate',
            description: 'Generate unique links for your visualizations to share with peers or interviewers.'
        },
        {
            icon: Layers,
            title: 'Deep Architecture',
            description: 'Visualize data structures like Graphs, Trees, Heaps, and Linked Lists with zero setup.'
        },
        {
            icon: BookOpen,
            title: 'Curated Library',
            description: 'Access a growing library of common interview problems with optimal solutions.'
        },
        {
            icon: Clock,
            title: 'Performance Metrics',
            description: 'Compare time and space complexity of different approaches visually.'
        }
    ];

    return (
        <section id="features" className="py-24 bg-black/20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Developers</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Everything you need to master algorithms and ace your technical interviews.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div key={index} className="group p-8 rounded-2xl bg-surface/50 border border-white/5 hover:border-blue-500/30 hover:bg-surface transition-all duration-300">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                                <feature.icon size={24} className="text-blue-400 group-hover:text-blue-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
