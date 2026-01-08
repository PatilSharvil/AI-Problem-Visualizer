import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { Database, Share2, LayoutGrid, Network } from 'lucide-react';

const VishvaroopLogo = ({ size = 44, className = '' }) => {
    const wrapperRef = useRef(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const timeline = anime.timeline({
            loop: true,
            autoplay: true,
        });

        timeline.add({
            targets: wrapper.querySelector('.outer-eye-path'),
            strokeDashoffset: [anime.setDashoffset, 0],
            opacity: [0, 1],
            easing: 'easeInOutSine',
            duration: 1500
        }, 0);

        anime({
            targets: wrapper.querySelector('.core-pupil'),
            scale: [0.9, 1.1],
            opacity: [0.8, 1],
            boxShadow: ['0 0 10px rgba(34, 211, 238, 0.4)', '0 0 20px rgba(167, 139, 250, 0.6)'],
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine',
            duration: 2000
        });

        const icons = wrapper.querySelectorAll('.logo-icon');
        anime({
            targets: icons,
            opacity: [0.2, 1],
            scale: [0.8, 1],
            color: ['#4b5563', '#22d3ee'],
            delay: anime.stagger(600, { start: 500 }),
            direction: 'alternate',
            loop: true,
            easing: 'easeOutQuad',
            endDelay: 1000
        });

        return () => { };
    }, []);

    const iconSize = size * 0.35;

    return (
        <div
            ref={wrapperRef}
            className={`relative flex items-center justify-center bg-black/50 rounded-full border border-white/10 ${className}`}
            style={{ width: size, height: size }}
        >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className="outer-eye-path" d="M2,50 Q50,2 98,50 Q50,98 2,50 Z" stroke="url(#gradient-eye-unique)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="1" />
                <defs>
                    <linearGradient id="gradient-eye-unique" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="core-pupil w-[42%] h-[42%] rounded-full bg-[#0B0F19] border border-cyan-500/30 flex flex-wrap items-center justify-center content-center relative overflow-hidden z-10">
                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/5" />
                    <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/5" />
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-[15%]">
                        <div className="flex items-center justify-center"><Database size={iconSize} className="logo-icon text-gray-500" /></div>
                        <div className="flex items-center justify-center"><Share2 size={iconSize} className="logo-icon text-gray-500" /></div>
                        <div className="flex items-center justify-center"><LayoutGrid size={iconSize} className="logo-icon text-gray-500" /></div>
                        <div className="flex items-center justify-center"><Network size={iconSize} className="logo-icon text-gray-500" /></div>
                    </div>
                    <div className="absolute w-[20%] h-[20%] bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] z-20" />
                </div>
            </div>
        </div>
    );
};

export default VishvaroopLogo;
