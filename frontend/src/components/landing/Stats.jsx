import React from 'react';

const Stats = () => {
    const stats = [
        { label: 'Algorithms', value: '14+', color: 'text-cyan-400' },
        { label: 'Visualizations', value: '50+', color: 'text-blue-500' },
        { label: 'Active Users', value: '10k+', color: 'text-purple-500' },
        { label: 'Success Rate', value: '99%', color: 'text-green-400' },
    ];

    return (
        <div className="w-full border-y border-white/5 bg-surface/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex flex-col items-center justify-center border-r border-white/5 last:border-0 hover:bg-white/5 transition-colors py-2 rounded-lg">
                            <span className={`text-4xl font-bold mb-2 ${stat.color}`}>
                                {stat.value}
                            </span>
                            <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Stats;
