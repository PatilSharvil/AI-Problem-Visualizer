import React from 'react';
import { ArrowRight, MousePointer2, Layers, ArrowUpDown, Disc, Network, GalleryHorizontalEnd } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExampleProblems = () => {
    const navigate = useNavigate();

    const problems = [
        {
            title: "2Sum",
            type: "Two Pointers",
            difficulty: "Easy",
            icon: <MousePointer2 />,
            color: "bg-green-500",
            border: "border-green-500/20",
            prompt: "Take an array of integers and find two numbers such that they add up to a specific target number."
        },
        {
            title: "Sliding Window Maximum",
            type: "Sliding Window",
            difficulty: "Hard",
            icon: <Layers />,
            color: "bg-blue-500",
            border: "border-blue-500/20",
            prompt: "Take an array of integers and a window size k, and find the maximum value in each sliding window of size k."
        },
        {
            title: "Bubble Sort",
            type: "Sorting",
            difficulty: "Easy",
            icon: <ArrowUpDown />,
            color: "bg-orange-500",
            border: "border-orange-500/20",
            prompt: "Take an array of integers and sort the array in ascending order using the Bubble Sort algorithm."
        },
        {
            title: "String Reverse",
            type: "Stack",
            difficulty: "Easy",
            icon: <Disc />,
            color: "bg-purple-500",
            border: "border-purple-500/20",
            prompt: "Take a string and reverse it using a stack-based approach."
        },
        {
            title: "Inorder Traversal",
            type: "Tree Traversal",
            difficulty: "Medium",
            icon: <Network />,
            color: "bg-teal-500",
            border: "border-teal-500/20",
            prompt: "Take the root of a binary tree and perform an inorder traversal of its nodes’ values."
        },
        {
            title: "Queue Operations",
            type: "Queue",
            difficulty: "Easy",
            icon: <GalleryHorizontalEnd />,
            color: "bg-pink-500",
            border: "border-pink-500/20",
            prompt: "Take a queue and implement basic operations such as enqueue, dequeue, and peek."
        }
    ];

    const handleProblemClick = (problem) => {
        if (problem.prompt) {
            navigate('/app', {
                state: {
                    autoFill: problem.prompt
                }
            });
        }
    };

    return (
        <section id="examples" className="py-24 bg-[#0B0F19]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Example <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Problems</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Explore fundamental algorithms through interactive visualizations.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            onClick={() => handleProblemClick(problem)}
                            className="group p-6 rounded-2xl bg-surface border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all duration-300 flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-xl ${problem.color.replace('bg-', 'bg-opacity-20 text-').replace('500', '400')}`}>
                                    {React.cloneElement(problem.icon, { size: 24 })}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{problem.type}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {problem.title}
                                    </h3>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-500 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all">
                                <ArrowRight size={18} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ExampleProblems;
