import React, { useEffect, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import anime from 'animejs';

const LiveDemo = () => {
    const containerRef = useRef(null);
    const inputString = "Visualizer";
    const chars = inputString.split('');

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';
        const charSize = 40, gap = 10, inputY = 40;
        const stackX = container.offsetWidth / 2 - (charSize / 2);
        const stackHeight = 220, stackTopY = 90, stackBottomY = stackTopY + stackHeight;
        const outputBlockY = 445;
        const stackBaseY = stackBottomY;
        const startX = (container.offsetWidth - (chars.length * (charSize + gap))) / 2;
        const availableStackSpace = stackHeight - charSize - 20;

        const inputLabel = document.createElement('div');
        inputLabel.className = 'absolute text-xs text-gray-500 font-mono uppercase tracking-wider';
        inputLabel.textContent = 'Input String';
        inputLabel.style.cssText = `left:${startX}px;top:${inputY - 20}px`;
        container.appendChild(inputLabel);

        const stackContainer = document.createElement('div');
        stackContainer.className = 'absolute border-x-2 border-b-2 border-white/20 rounded-b-lg bg-white/5';
        stackContainer.style.cssText = `width:${charSize + 20}px;height:${stackHeight}px;left:${stackX - 10}px;top:${stackTopY}px`;
        container.appendChild(stackContainer);

        const outputLabel = document.createElement('div');
        outputLabel.className = 'absolute text-xs text-gray-500 font-mono uppercase tracking-wider';
        outputLabel.textContent = 'Reversed Output';
        outputLabel.style.cssText = `left:${startX}px;top:420px`;
        container.appendChild(outputLabel);

        const elementNodes = chars.map((char, index) => {
            const el = document.createElement('div');
            el.className = 'absolute flex items-center justify-center w-[40px] h-[40px] rounded bg-surface border border-white/20 text-white font-bold text-lg shadow-lg z-10';
            el.textContent = char;
            const initialX = startX + index * (charSize + gap);
            el.style.cssText = `left:${initialX}px;top:${inputY}px`;
            container.appendChild(el);
            return { el, index, initialX, initialY: inputY };
        });

        const timeline = anime.timeline({ loop: true, autoplay: true, delay: 500 });
        const verticalStep = Math.min(10, chars.length > 1 ? availableStackSpace / (chars.length - 1) : 0);

        elementNodes.forEach((node, i) => {
            const stackPosY = stackBaseY - charSize - (i * verticalStep);
            timeline.add({
                targets: node.el,
                translateX: [0, stackX - node.initialX],
                translateY: [0, stackPosY - node.initialY],
                scale: [1, 0.9],
                rotate: '1turn',
                backgroundColor: '#3b82f6',
                borderColor: '#60a5fa',
                duration: 600,
                easing: 'easeInOutCubic'
            }, `+=${i === 0 ? 0 : 100}`);
        });

        timeline.add({ duration: 500 });
        const reversedChars = [...elementNodes].reverse();

        reversedChars.forEach((node, i) => {
            const targetX = startX + i * (charSize + gap);
            timeline.add({
                targets: node.el,
                translateX: targetX - node.initialX,
                translateY: outputBlockY - node.initialY,
                scale: 1,
                rotate: '2turn',
                backgroundColor: '#10b981',
                borderColor: '#34d399',
                duration: 600,
                easing: 'easeInOutBack'
            }, `+=${i === 0 ? 0 : 200}`);
        });

        timeline.add({ duration: 2000 });
        return () => timeline.pause();
    }, []);

    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Demo</span></h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">See how algorithms work in real-time.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0B0F19] shadow-2xl overflow-hidden max-w-5xl mx-auto">
                    <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <button className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20 flex items-center gap-2"><Play size={12} />Auto-Play</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 h-[500px]">
                        <div className="border-r border-white/5 p-8 bg-[#0d1117] flex flex-col justify-center">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Problem Statement</span>
                            <h3 className="text-2xl font-bold text-white mt-2 mb-4">Reverse String</h3>
                            <p className="text-gray-400 leading-relaxed text-lg">Reverse <strong>"{inputString}"</strong> using a <strong>Stack</strong>.</p>
                            <div className="bg-surface/50 p-4 rounded-lg border border-white/10 mt-4">
                                <ol className="list-decimal list-inside text-gray-300 font-mono text-sm space-y-2">
                                    <li>Initialize empty Stack</li>
                                    <li>Push each char</li>
                                    <li>Pop to reverse</li>
                                </ol>
                            </div>
                        </div>
                        <div className="bg-[#0B0F19] relative overflow-hidden">
                            <div className="absolute top-4 right-4 z-10">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Stack Operation</span>
                            </div>
                            <div ref={containerRef} className="w-full h-full relative" />
                            <div className="absolute top-[360px] left-1/2 -translate-x-1/2 flex items-center gap-4 bg-surface/80 backdrop-blur px-6 py-2 rounded-full border border-white/10 z-20">
                                <button className="p-2 hover:text-white text-gray-400 transition-colors"><RotateCcw size={16} /></button>
                                <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-1/3 animate-pulse" /></div>
                                <span className="text-xs font-mono text-gray-400">Processing...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LiveDemo;
