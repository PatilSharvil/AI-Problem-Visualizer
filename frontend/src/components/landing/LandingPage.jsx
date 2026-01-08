import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import Stats from './Stats';
import HowItWorks from './HowItWorks';
import LiveDemo from './LiveDemo';
import ExampleProblems from './ExampleProblems';
import Comparison from './Comparison';
import Footer from './Footer';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background text-text-primary selection:bg-purple-500/30">
            <Navbar />
            <Hero />
            <Stats />
            <HowItWorks />
            <LiveDemo />
            <ExampleProblems />
            <Comparison />
            <Footer />
        </div>
    );
};

export default LandingPage;
