import React from 'react';

const TechLogo = ({ name, icon }) => (
    <div className="flex items-center gap-6 px-16 group/logo cursor-default">
        <div className="text-gray-600 group-hover/logo:text-white transition-colors duration-300">
            {icon}
        </div>
        <span className="text-3xl font-bold text-gray-600 group-hover/logo:text-white transition-colors duration-300">
            {name}
        </span>
    </div>
);

const Stats = () => {
    const logos = [
        {
            name: 'React',
            icon: (
                <svg viewBox="-10.5 -9.45 21 18.9" fill="currentColor" width="56" height="56">
                    <circle cx="0" cy="0" r="2" fill="currentColor"></circle>
                    <g stroke="currentColor" strokeWidth="1" fill="none">
                        <ellipse rx="10" ry="4.5"></ellipse>
                        <ellipse rx="10" ry="4.5" transform="rotate(60)"></ellipse>
                        <ellipse rx="10" ry="4.5" transform="rotate(120)"></ellipse>
                    </g>
                </svg>
            )
        },
        {
            name: 'Vite',
            icon: (
                <svg viewBox="0 0 32 32" fill="currentColor" width="56" height="56">
                    <path d="M30 4 L16 30 L2 4 L10 4 L16 22 L22 4 Z" />
                </svg>
            )
        },
        {
            name: 'Tailwind CSS',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56">
                    <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"></path>
                </svg>
            )
        },
        {
            name: 'Node.js',
            icon: (
                <svg viewBox="0 0 32 32" fill="currentColor" width="56" height="56">
                    <path d="M16 4 L4 10 L4 22 L16 28 L28 22 L28 10 Z" />
                </svg>
            )
        },
        {
            name: 'Express',
            icon: (
                <svg viewBox="0 0 100 30" fill="currentColor" width="56" height="56">
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="60">ex</text>
                </svg>
            )
        },
        {
            name: 'Gemini',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56">
                    <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
                </svg>
            )
        },
        {
            name: 'GitHub',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
            )
        }
    ];

    // Duplicate logos to create seamless loop
    const loopedLogos = [...logos, ...logos];

    return (
        <div className="w-full border-y border-white/5 bg-[#0B0F19] backdrop-blur-sm overflow-hidden py-20 relative">
            {/* Gradient fade sides */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0B0F19] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0B0F19] to-transparent z-10"></div>

            <div className="flex w-[200%] animate-scroll hover:[animation-play-state:paused]">
                {loopedLogos.map((logo, index) => (
                    <TechLogo key={index} name={logo.name} icon={logo.icon} />
                ))}
            </div>
        </div>
    );
};

export default Stats;
