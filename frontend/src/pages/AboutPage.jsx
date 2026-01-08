import React from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Database, Globe } from 'lucide-react';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-background text-text-primary selection:bg-purple-500/30">
            <Navbar />

            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-bold text-white mb-6">
                            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">VishvaRoop</span>
                        </h1>
                        <p className="text-xl text-gray-400">
                            Democratizing algorithm education through intelligent visualization.
                        </p>
                    </div>

                    {/* Mission Section */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                        <div className="bg-surface border border-white/10 p-8 rounded-2xl">
                            <p className="text-gray-300 leading-relaxed text-lg mb-4">
                                Algorithms are the language of computing, yet understanding them often involves deciphering static code or abstract diagrams.
                                <strong className="text-blue-400"> Vishvaroop</strong> bridges this gap.
                            </p>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                We believe that everyone should be able to visualize how data moves and transforms.
                                By combining generative AI with dynamic animations, we turn standard code problems into
                                interactive learning experiences instantly.
                            </p>
                        </div>
                    </div>

                    {/* Tech Stack Grid */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Built With</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-surface/50 border border-white/5 rounded-xl hover:bg-surface hover:border-white/10 transition-all group">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Globe className="text-blue-400" size={24} />
                                </div>
                                <h3 className="text-white font-bold mb-2">Modern Frontend</h3>
                                <p className="text-sm text-gray-400">Built with React, Vite, and Tailwind CSS for a seamless, responsive experience.</p>
                            </div>

                            <div className="p-6 bg-surface/50 border border-white/5 rounded-xl hover:bg-surface hover:border-white/10 transition-all group">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Code className="text-purple-400" size={24} />
                                </div>
                                <h3 className="text-white font-bold mb-2">Dynamic Animation</h3>
                                <p className="text-sm text-gray-400">Powered by Anime.js to create liquid-smooth, 60fps visualizations.</p>
                            </div>

                            <div className="p-6 bg-surface/50 border border-white/5 rounded-xl hover:bg-surface hover:border-white/10 transition-all group">
                                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Database className="text-cyan-400" size={24} />
                                </div>
                                <h3 className="text-white font-bold mb-2">Generative AI</h3>
                                <p className="text-sm text-gray-400">Integration with Google Gemini to analyze and break down complex logic.</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-12 border border-white/5">
                        <h2 className="text-3xl font-bold text-white mb-6">Ready to learn?</h2>
                        <Link to="/app" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors">
                            Start Visualizing
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AboutPage;
