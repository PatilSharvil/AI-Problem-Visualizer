import React from 'react';
import { Github, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import VishvaroopLogo from '../VishvaroopLogo';

const Footer = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleScroll = (e, targetId, path) => {
        e.preventDefault();

        // If we are already on the target page
        if (location.pathname === path) {
            if (targetId) {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            // Navigate to the page and hash
            navigate(`${path}${targetId ? `#${targetId}` : ''}`);
        }
    };

    // Handle scroll after navigation
    // Handle scroll after navigation
    React.useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } else if (!location.hash) {
            window.scrollTo(0, 0);
        }
    }, [location]);

    return (
        <footer className="bg-background border-t border-white/5 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <VishvaroopLogo />
                            <span className="text-xl font-bold text-white">
                                VishvaRoop
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            AI-powered algorithm visualization platform that turns complex problems into clear, step-by-step visual understanding. Built for students, developers, and problem solvers.
                        </p>
                        <div className="flex gap-4">
                            {[Github].map((Icon, index) => (
                                <a
                                    key={index}
                                    href="https://github.com/PatilSharvil/AI-Problem-Visualizer"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {[
                        {
                            title: "Algorithm Patterns",
                            links: [
                                { label: "Sliding Window", path: "/", targetId: "examples" },
                                { label: "Two Pointers", path: "/", targetId: "examples" },
                                { label: "Binary Search", path: "/", targetId: "examples" },
                                { label: "Stack & Queue", path: "/", targetId: "examples" },
                                { label: "Tree", path: "/", targetId: "examples" }
                            ]
                        },
                        {
                            title: "Resources",
                            links: [
                                { label: "Visualization Examples", path: "/", targetId: "how-it-works" },
                                { label: "Algorithm Guides", path: "/", targetId: "how-it-works" }
                            ]
                        },
                        {
                            title: "Our Platform",
                            links: [
                                { label: "About Vishwaroop", path: "/about", targetId: "mission" },
                                { label: "Our Vision", path: "/about", targetId: "mission" }
                            ]
                        },
                    ].map((column) => (
                        <div key={column.title}>
                            <h4 className="font-bold text-white mb-6">{column.title}</h4>
                            <ul className="space-y-4">
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={`${link.path}${link.targetId ? `#${link.targetId}` : ''}`}
                                            onClick={(e) => handleScroll(e, link.targetId, link.path)}
                                            className="text-gray-400 hover:text-primary transition-colors text-sm"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-8">
                    <p className="text-gray-400 text-sm font-medium">Go Beyond Memorizing Algorithms. Visualize Them.</p>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © 2026 Vishvaroop. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Built with</span>
                        <Heart size={14} className="text-red-500 fill-red-500" />
                        <span>by Developers, for Learners and Problem Solvers.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
