import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import VishvaroopLogo from '../VishvaroopLogo';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-lg border-b border-white/5 py-4' : 'bg-transparent py-6'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <VishvaroopLogo />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        VishvaRoop
                    </span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8 ml-auto">
                    {['Home', 'About', 'How it Works'].map((item) => {
                        const isLink = item === 'About';
                        const isHome = item === 'Home';

                        // If we are on a different page, Home should link to /
                        // If we are on Home, it should be #

                        return isLink ? (
                            <Link
                                key={item}
                                to={`/${item.toLowerCase()}`}
                                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                {item}
                            </Link>
                        ) : (
                            <a
                                key={item}
                                href={isHome ? '/' : `#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                {item}
                            </a>
                        );
                    })}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4 ml-8">

                    <button className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 group">
                        Get Started
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-gray-400 hover:text-white ml-auto"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-background border-b border-white/5 md:hidden p-6 flex flex-col gap-4">
                    {['Home', 'About', 'How it Works'].map((item) => {
                        const isLink = item === 'About';
                        const isHome = item === 'Home';

                        return isLink ? (
                            <Link
                                key={item}
                                to={`/${item.toLowerCase()}`}
                                className="text-gray-400 hover:text-white py-2 block"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item}
                            </Link>
                        ) : (
                            <a
                                key={item}
                                href={isHome ? '/' : `#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-gray-400 hover:text-white py-2 block"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item}
                            </a>
                        );
                    })}
                    <div className="h-px bg-white/5 my-2" />

                    <button className="bg-primary text-white w-full py-3 rounded-xl font-medium">
                        Get Started
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
