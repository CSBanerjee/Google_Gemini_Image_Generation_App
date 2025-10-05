import React from 'react';
import { AIAdvice } from '../types';
import { LightBulbIcon, LoadingSpinner } from './icons';

interface AdvisorPanelProps {
    advice: AIAdvice[];
    onGetAdvice: () => void;
    isAdviceLoading: boolean;
    hasGenerated: boolean;
}

export const AdvisorPanel: React.FC<AdvisorPanelProps> = ({ advice, onGetAdvice, isAdviceLoading, hasGenerated }) => {
    return (
        <aside className="w-full lg:w-80 bg-surface p-6 flex flex-col space-y-4 border-l border-border">
            <div className="flex items-center gap-2">
                <LightBulbIcon className="w-6 h-6 text-brand-secondary" />
                <h3 className="text-xl font-bold text-text-primary">AI Creative Advisor</h3>
            </div>
            
            <p className="text-sm text-text-secondary">
                Get suggestions from our creative AI to improve your poster's composition, style, and impact.
            </p>

            <button
                onClick={onGetAdvice}
                disabled={isAdviceLoading || !hasGenerated}
                className="w-full flex justify-center items-center gap-2 bg-brand-secondary bg-opacity-20 text-brand-secondary font-semibold py-2 px-4 rounded-lg hover:bg-opacity-30 transition-all duration-200 disabled:bg-bg disabled:text-text-secondary disabled:cursor-not-allowed"
            >
                {isAdviceLoading ? (
                    <>
                        <LoadingSpinner className="w-5 h-5"/>
                        <span>Analyzing...</span>
                    </>
                ) : (
                    'Get New Suggestions'
                )}
            </button>

            <div className="flex-1 overflow-y-auto space-y-3 pt-4 border-t border-border">
                {advice.length === 0 && !isAdviceLoading && (
                    <div className="text-center text-text-secondary pt-10">
                        <p>Generate a poster first, then get creative advice here.</p>
                    </div>
                )}
                {advice.map((item) => (
                    <div key={item.id} className="bg-bg p-3 rounded-md border border-border hover:border-brand-secondary/50 transition-colors">
                        <p className="text-sm text-text-primary">{item.advice}</p>
                    </div>
                ))}
            </div>
        </aside>
    );
};