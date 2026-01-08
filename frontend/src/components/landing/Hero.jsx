import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';
        container.className = 'w-full h-full flex flex-col relative overflow-hidden';

        const treeSection = document.createElement('div');
        treeSection.className = 'w-full flex-grow relative mt-14';
        container.appendChild(treeSection);

        const resultSection = document.createElement('div');
        resultSection.className = 'w-full h-[35%] min-h-[140px] flex flex-col items-center justify-center border-t border-white/5 bg-black/20 backdrop-blur-sm z-20';
        container.appendChild(resultSection);

        const resultLabel = document.createElement('div');
        resultLabel.className = 'text-xs font-mono text-cyan-400 mb-4 font-bold tracking-widest uppercase opacity-90';
        resultLabel.textContent = "BFS Traversal Sequence";
        resultSection.appendChild(resultLabel);

        const resultRow = document.createElement('div');
        resultRow.className = 'flex items-center justify-center gap-3';
        resultSection.appendChild(resultRow);

        const inputString = "VishvaRoop";
        const chars = inputString.split('');
        const nodes = [];
        const edges = [];
        const treeWidth = treeSection.offsetWidth;
        const treeHeight = treeSection.offsetHeight;

        const createNode = (id, xPct, yPct) => {
            nodes.push({ id, char: chars[id], x: xPct * treeWidth, y: yPct * treeHeight, el: null });
        };

        createNode(0, 0.50, 0.15);
        createNode(1, 0.25, 0.35);
        createNode(2, 0.75, 0.35);
        createNode(3, 0.125, 0.55);
        createNode(4, 0.375, 0.55);
        createNode(5, 0.625, 0.55);
        createNode(6, 0.875, 0.55);
        createNode(7, 0.0625, 0.75);
        createNode(8, 0.1875, 0.75);
        createNode(9, 0.3125, 0.75);

        for (let i = 1; i < chars.length; i++) {
            edges.push({ start: nodes[Math.floor((i - 1) / 2)], end: nodes[i], id: `edge-${i}` });
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "absolute top-0 left-0 w-full h-full pointer-events-none z-0");
        treeSection.appendChild(svg);

        edges.forEach(edge => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", edge.start.x);
            line.setAttribute("y1", edge.start.y);
            line.setAttribute("x2", edge.end.x);
            line.setAttribute("y2", edge.end.y);
            line.setAttribute("stroke", "rgba(139, 92, 246, 0.2)");
            line.setAttribute("stroke-width", "1");
            line.setAttribute("id", edge.id);
            svg.appendChild(line);
        });

        nodes.forEach(node => {
            const el = document.createElement('div');
            el.className = 'absolute w-9 h-9 -ml-[18px] -mt-[18px] rounded-full bg-[#0B0F19] border border-purple-500/30 flex items-center justify-center text-purple-300 font-mono text-xs font-bold shadow-lg z-10';
            el.textContent = node.char;
            el.style.left = `${node.x}px`;
            el.style.top = `${node.y}px`;
            treeSection.appendChild(el);
            node.el = el;
        });

        const timeline = anime.timeline({ loop: true, autoplay: true, delay: 800 });
        const STEP_DELAY = 150;

        nodes.forEach((node, i) => {
            const offset = i * STEP_DELAY;
            const resultChar = document.createElement('div');
            resultChar.className = 'w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold opacity-0 text-sm transform scale-75';
            resultChar.textContent = node.char;
            resultRow.appendChild(resultChar);

            timeline.add({ targets: resultChar, opacity: [0, 1], scale: [0.85, 1], duration: 80, easing: 'easeOutQuad' }, offset);
            timeline.add({ targets: node.el, borderColor: ['#8b5cf6', '#22d3ee'], color: ['#d8b4fe', '#ffffff'], backgroundColor: ['#0B0F19', 'rgba(34, 211, 238, 0.4)'], boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 20px rgba(34, 211, 238, 0.6)'], scale: [1, 1.12, 1], duration: 100, easing: 'easeOutQuad' }, offset + 80);
            timeline.add({ targets: node.el, opacity: 0.7, borderColor: '#7c3aed', backgroundColor: '#0B0F19', boxShadow: '0 0 0 rgba(0,0,0,0)', color: '#a78bfa', duration: 200, easing: 'linear' }, offset + 250);
        });

        timeline.add({ duration: 2000 });
        return () => timeline.pause();
    }, []);

    return (
        <div id="about" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px]" />
                <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px]" />
            </div>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="relative z-10 text-center lg:text-left">
                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-6">
                        Visualize Algorithms. <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">Instantly.</span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                        Transform algorithms into interactive visual experiences. Master complex problems with our AI-powered visualizer.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <Link to="/app" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2">
                            Start Visualizing<ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
                <div className="relative h-[400px] md:h-[500px] w-full bg-surface/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden group flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2 z-20">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div ref={containerRef} className="w-full h-full relative" />
                </div>
            </div>
        </div>
    );
};

export default Hero;
