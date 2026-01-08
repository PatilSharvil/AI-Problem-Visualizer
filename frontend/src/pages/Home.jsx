import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs';
import clsx from 'clsx';
import { ArrowRight, Code2, Brain, Play, Layers, Zap, GitGraph, Search, ListTree } from 'lucide-react';

const Home = () => {
    const heroRef = useRef(null);

    useEffect(() => {
        const tl = anime.timeline({ easing: 'easeOutExpo', duration: 1000 });
        tl.add({
            targets: '.hero-element',
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
        }).add({
            targets: '.hero-bg-shape',
            scale: [0, 1],
            opacity: [0, 0.4],
            rotate: '1turn',
            duration: 2000,
            offset: '-=800'
        });

        anime({
            targets: '.floating-shape',
            translateY: [-20, 20],
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine',
            duration: 3000,
            delay: anime.stagger(500)
        });
    }, []);

    const algorithms = [
        { name: 'Sliding Window', icon: <Layers />, color: 'text-blue-400', border: 'border-blue-500/30' },
        { name: 'Two Pointers', icon: <GitGraph />, color: 'text-purple-400', border: 'border-purple-500/30' },
        { name: 'Binary Search', icon: <Search />, color: 'text-green-400', border: 'border-green-500/30' },
        { name: 'Trees & Graphs', icon: <ListTree />, color: 'text-amber-400', border: 'border-amber-500/30' },
    ];

    return (
        <div className="min-h-screen bg-background text-text-primary overflow-hidden relative selection:bg-primary/30">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="hero-bg-shape absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full mix-blend-screen" />
                <div className="hero-bg-shape absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="floating-shape absolute top-20 right-[15%] w-16 h-16 border border-white/10 rounded-xl rotate-12 bg-white/5 backdrop-blur-sm" />
                <div className="floating-shape absolute bottom-40 left-[10%] w-24 h-24 border border-white/5 rounded-full bg-white/5 backdrop-blur-sm" />
            </div>
            <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight hero-element">
                    <Brain className="text-primary" /><span>AI AlgoViz</span>
                </div>
                <div className="flex gap-4">
                    <a href="#features" className="text-sm font-medium text-text-muted hover:text-white transition-colors hero-element">Features</a>
                </div>
            </nav>
            <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 max-w-6xl mx-auto z-10" ref={heroRef}>
                <div className="hero-element mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/50 border border-white/10 backdrop-blur text-xs font-mono text-accent">
                    <Zap size={14} fill="currentColor" /><span>AI-Powered Algorithm Learning</span>
                </div>
                <h1 className="hero-element text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                    Visualize <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent">Algorithms</span><br />Like Never Before
                </h1>
                <p className="hero-element text-lg md:text-xl text-text-secondary max-w-2xl mb-10 leading-relaxed">
                    Stop struggling with abstract code. Input any problem, and watch our AI generate a step-by-step, interactive visualization instantly.
                </p>
                <div className="hero-element flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
                    <Link to="/app" className="group relative px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden flex items-center justify-center gap-3">
                        <span className="relative z-10">Start Visualizing</span>
                        <ArrowRight className="group-hover:translate-x-1 transition-transform relative z-10" />
                    </Link>
                </div>
                <div className="hero-element mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    {algorithms.map((algo, i) => (
                        <div key={i} className={clsx("p-4 rounded-xl bg-surface/40 backdrop-blur border hover:bg-surface/60 transition-all cursor-default group", algo.border)}>
                            <div className={clsx("mb-3 p-2 rounded-lg w-fit transition-transform group-hover:scale-110 duration-300", "bg-black/20", algo.color)}>{algo.icon}</div>
                            <div className="text-left"><h3 className="font-semibold text-sm text-text-primary">{algo.name}</h3></div>
                        </div>
                    ))}
                </div>
            </section>
            <section id="features" className="py-24 px-4 bg-surface/30 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-text-muted">From text to understanding in seconds</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {[{ title: "Input Problem", icon: <Code2 />, desc: "Paste any LeetCode style question" },
                        { title: "AI Analysis", icon: <Brain />, desc: "Our model parses logic & state" },
                        { title: "Interactive Playback", icon: <Play />, desc: "Step through the solution visually" }
                        ].map((step, idx) => (
                            <div key={idx} className="relative flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-2xl bg-surface border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:border-primary/50 transition-colors z-10 relative overflow-hidden">
                                    <div className="text-primary group-hover:scale-110 transition-transform duration-300">{React.cloneElement(step.icon, { size: 32 })}</div>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                <p className="text-text-secondary text-sm max-w-[250px]">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-32 px-4 text-center relative overflow-hidden">
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to master algorithms?</h2>
                    <Link to="/app" className="inline-flex items-center px-8 py-4 bg-white text-background rounded-full font-bold text-lg hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1">
                        Try It Now - No Account Needed
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
