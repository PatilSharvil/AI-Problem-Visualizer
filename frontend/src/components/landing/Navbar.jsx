import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import VishvaroopLogo from '../VishvaroopLogo';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleGetStarted = () => {
        if (location.pathname === '/app') {
            const element = document.getElementById('describe-section');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/app#describe-section');
        }
        setMobileMenuOpen(false);
    };

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'How it Works', path: '/', hash: 'how-it-works' }
    ];

    const handleNavClick = (e, item) => {
        e.preventDefault();
        setMobileMenuOpen(false);

        if (location.pathname === item.path) {
            if (item.hash) {
                const element = document.getElementById(item.hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            navigate(`${item.path}${item.hash ? '#' + item.hash : ''}`);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-lg py-4' : 'bg-transparent py-6'
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
                    {navItems.map((item) => (
                        <a
                            key={item.name}
                            href={item.path}
                            onClick={(e) => handleNavClick(e, item)}
                            className="cursor-pointer text-gray-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            {item.name}
                        </a>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4 ml-8">

                    <button
                        onClick={handleGetStarted}
                        className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 group"
                    >
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
                    {navItems.map((item) => (
                        <a
                            key={item.name}
                            href={item.path}
                            onClick={(e) => handleNavClick(e, item)}
                            className="cursor-pointer text-gray-400 hover:text-white py-2 block"
                        >
                            {item.name}
                        </a>
                    ))}
                    <div className="h-px bg-white/5 my-2" />

                    <button
                        onClick={handleGetStarted}
                        className="bg-primary text-white w-full py-3 rounded-xl font-medium"
                    >
                        Get Started
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
