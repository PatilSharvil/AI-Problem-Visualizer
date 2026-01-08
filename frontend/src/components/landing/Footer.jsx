import React from 'react';
import { Github, Twitter, Linkedin, Heart } from 'lucide-react';
import VishvaroopLogo from '../VishvaroopLogo';

const Footer = () => {
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
                            Visualize algorithms instantly. Master complex problems with our AI-powered interactive learning platform.
                        </p>
                        <div className="flex gap-4">
                            {[Github, Twitter, Linkedin].map((Icon, index) => (
                                <a
                                    key={index}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {[
                        { title: "Product", links: ["Features", "Integrations", "Pricing", "Changelog"] },
                        { title: "Resources", links: ["Documentation", "API Reference", "Blog", "Community"] },
                        { title: "Company", links: ["About", "Careers", "Terms", "Privacy"] },
                    ].map((column) => (
                        <div key={column.title}>
                            <h4 className="font-bold text-white mb-6">{column.title}</h4>
                            <ul className="space-y-4">
                                {column.links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © 2024 Vishvaroop. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Made with</span>
                        <Heart size={14} className="text-red-500 fill-red-500" />
                        <span>by Developers for Developers</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
