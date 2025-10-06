import React, { useState, useCallback } from 'react';
import { AppSettings, AspectRatio, ProductImage, PromptMode } from '../types';
import { ASPECT_RATIOS, DEFAULT_JSON_PROMPT } from '../constants';
import { UploadIcon, WandIcon, LoadingSpinner, PaletteIcon, SparklesIcon } from './icons';
import { THEMES } from '../themes';

interface ControlPanelProps {
    settings: AppSettings;
    onSettingsChange: (newSettings: Partial<AppSettings>) => void;
    onProductImageChange: (image: Omit<ProductImage, 'description'> | null) => void;
    onGenerate: () => void;
    isLoading: boolean;
    productImage: ProductImage | null;
    isDescribing: boolean;
    isRemovingBg: boolean;
    isBgRemovalEnabled: boolean;
    onBgRemovalToggle: (enabled: boolean) => void;
    theme: string;
    onThemeChange: (themeId: string) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
    settings,
    onSettingsChange,
    onProductImageChange,
    onGenerate,
    isLoading,
    productImage,
    isDescribing,
    isRemovingBg,
    isBgRemovalEnabled,
    onBgRemovalToggle,
    theme,
    onThemeChange
}) => {
    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                onProductImageChange({
                    file,
                    base64,
                    objectURL: URL.createObjectURL(file),
                });
            } catch (error) {
                console.error("Error converting file to base64:", error);
                onProductImageChange(null);
            }
        }
    }, [onProductImageChange]);

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onSettingsChange({ prompt: e.target.value });
    };
    
    const handleJsonPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onSettingsChange({ jsonPrompt: e.target.value });
    };

    return (
        <aside className="w-full lg:w-96 bg-surface p-6 flex flex-col space-y-6 overflow-y-auto border-r border-border">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">VisionCraft AI</h2>
            
            {/* Theme Selector */}
            <div className="space-y-2">
                <label htmlFor="theme-select" className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <PaletteIcon className="w-5 h-5" />
                    Platform Theme
                </label>
                <select
                    id="theme-select"
                    value={theme}
                    onChange={(e) => onThemeChange(e.target.value)}
                    className="w-full p-2 rounded-md bg-bg border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                    {THEMES.map((themeOption) => (
                        <option key={themeOption.id} value={themeOption.id}>
                            {themeOption.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* 1. Image Input */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">1. Product Image</label>
                <div className="relative w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col justify-center items-center text-text-secondary hover:border-brand-primary transition-colors duration-200">
                    <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        disabled={isDescribing || isRemovingBg}
                    />
                    {productImage && (
                        <div 
                            className="absolute inset-0 p-2"
                            style={productImage.file.type === 'image/png' ? {
                                backgroundImage: `
                                    linear-gradient(45deg, #ccc 25%, transparent 25%), 
                                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                                    linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                                backgroundSize: `20px 20px`,
                                backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`
                            } : {}}
                        >
                            <img src={productImage.objectURL} alt="Product Preview" className={`h-full w-full object-contain rounded-lg ${isDescribing || isRemovingBg ? 'opacity-30' : ''}`} />
                        </div>
                    )}
                    {!productImage && !isDescribing && !isRemovingBg && (
                        <>
                            <UploadIcon className="w-8 h-8 mb-2" />
                            <p className="text-sm text-center">Click or Drag & Drop</p>
                            <p className="text-xs text-center">JPG, PNG, WEBP</p>
                        </>
                    )}
                    {isDescribing && (
                        <div className="absolute inset-0 flex flex-col justify-center items-center bg-surface bg-opacity-80">
                            <LoadingSpinner className="w-8 h-8 text-brand-primary" />
                            <p className="text-sm mt-2 text-text-primary">Analyzing Image...</p>
                        </div>
                    )}
                    {isRemovingBg && (
                        <div className="absolute inset-0 flex flex-col justify-center items-center bg-surface bg-opacity-80">
                            <LoadingSpinner className="w-8 h-8 text-brand-primary" />
                            <p className="text-sm mt-2 text-text-primary">Removing Background...</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Background Removal Toggle */}
            <div className="flex items-center justify-between bg-bg p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-brand-secondary"/>
                    <label htmlFor="bg-removal-toggle" className="text-sm font-semibold text-text-primary cursor-pointer">
                        Remove Background
                    </label>
                </div>
                 <label htmlFor="bg-removal-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="bg-removal-toggle" 
                            className="sr-only" 
                            checked={isBgRemovalEnabled} 
                            onChange={(e) => onBgRemovalToggle(e.target.checked)}
                            disabled={isDescribing || isRemovingBg}
                        />
                        <div className="block bg-border w-12 h-6 rounded-full"></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isBgRemovalEnabled ? 'transform translate-x-6 bg-brand-primary' : 'bg-surface'}`}></div>
                    </div>
                </label>
            </div>

            {/* 2. Output Ratio */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">2. Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-2">
                    {ASPECT_RATIOS.map(ratio => (
                        <button
                            key={ratio}
                            onClick={() => onSettingsChange({ aspectRatio: ratio })}
                            className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                                settings.aspectRatio === ratio
                                    ? 'bg-brand-primary text-white font-semibold'
                                    : 'bg-bg hover:bg-border text-text-primary'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Prompt Input */}
            <div className="space-y-2 flex-grow flex flex-col min-h-0">
                <label className="text-sm font-semibold text-text-secondary">3. Creative Prompt</label>
                <div className="flex-grow flex flex-col bg-bg rounded-md border border-border">
                    <div className="flex border-b border-border">
                        <button 
                            onClick={() => onSettingsChange({promptMode: PromptMode.TEXT})}
                            className={`flex-1 p-2 text-sm transition-colors ${settings.promptMode === PromptMode.TEXT ? 'bg-border text-brand-primary font-semibold' : 'text-text-secondary'}`}>
                            Plain Text
                        </button>
                        <button 
                            onClick={() => onSettingsChange({promptMode: PromptMode.JSON})}
                            className={`flex-1 p-2 text-sm transition-colors ${settings.promptMode === PromptMode.JSON ? 'bg-border text-brand-primary font-semibold' : 'text-text-secondary'}`}>
                            JSON
                        </button>
                    </div>
                    <div className="p-2 flex-grow">
                        {settings.promptMode === PromptMode.TEXT ? (
                             <textarea
                                value={settings.prompt}
                                onChange={handlePromptChange}
                                placeholder="e.g., A futuristic scene with neon glow and a metallic background..."
                                className="w-full h-full bg-transparent text-sm text-text-primary placeholder-text-secondary resize-none focus:outline-none"
                            />
                        ) : (
                             <textarea
                                value={settings.jsonPrompt}
                                onChange={handleJsonPromptChange}
                                placeholder="Enter structured JSON..."
                                className="w-full h-full bg-transparent text-sm text-text-primary placeholder-text-secondary resize-none focus:outline-none font-mono"
                            />
                        )}
                    </div>
                </div>
            </div>
            
            {/* 4. AI Creativity Control */}
            <div className="space-y-3">
                 <label className="text-sm font-semibold text-text-secondary flex justify-between">
                    <span>4. Creativity Level</span>
                    <span>{settings.creativity.toFixed(2)}</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.creativity}
                    onChange={(e) => onSettingsChange({ creativity: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer range-lg accent-brand-primary"
                />
            </div>

            {/* 5. Generate Button */}
            <button
                onClick={onGenerate}
                disabled={isLoading || !productImage || isDescribing || isRemovingBg}
                className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed transform hover:scale-105"
            >
                <WandIcon className="w-5 h-5" />
                <span>{isLoading ? 'Crafting Vision...' : (isDescribing || isRemovingBg) ? 'Processing...' : 'Generate Poster'}</span>
            </button>
        </aside>
    );
};