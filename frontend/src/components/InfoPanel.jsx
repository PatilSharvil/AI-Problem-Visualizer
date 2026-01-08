import React from 'react';
import { Info, Code, Lightbulb } from 'lucide-react';
import clsx from 'clsx';

const InfoPanel = ({ frame }) => {
    if (!frame) return null;

    return (
        <div className="flex flex-col h-full bg-surface/30">
            <div className="bg-surface/50 p-3 border-b border-white/5 flex items-center gap-2 font-semibold text-sm uppercase tracking-wide text-text-muted">
                <Info size={16} />
                <span>Algorithm Logic</span>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6 scrollbar-thin">
                {/* Explanation Section */}
                <div className="space-y-2">
                    <h3 className="text-primary font-medium flex items-center gap-2">
                        <Lightbulb size={18} />
                        Current Action
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed bg-surface/40 p-3 rounded-lg border border-white/5">
                        {frame.explanation || frame.description}
                    </p>
                </div>

                {/* State Variables Logic (if any specific logic state is exposed) */}
                {frame.state && (
                    <div className="space-y-2">
                        <h3 className="text-accent font-medium flex items-center gap-2">
                            <Code size={18} />
                            Internal State
                        </h3>
                        <div className="bg-black/20 p-3 rounded-lg font-mono text-xs space-y-1 border border-white/5">
                            {Object.entries(frame.state).map(([key, value]) => (
                                <div key={key} className="flex justify-between border-b border-white/5 last:border-0 pb-1 last:pb-0">
                                    <span className="text-text-muted opacity-80">{key}:</span>
                                    <span className="text-secondary font-bold truncate ml-4">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pattern Hint */}
                <div className="pt-4 border-t border-white/10 mt-auto">
                    <p className="text-xs text-text-muted italic">
                        Focus on how the variables change in relation to the data structure.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InfoPanel;
