import React, { useState } from 'react';
import { ProductImage, GeneratedImage } from '../types';
import { DownloadIcon, LoadingSpinner } from './icons';

interface CanvasPanelProps {
  productImage: ProductImage | null;
  generatedImage: GeneratedImage | null;
  isLoading: boolean;
  error: string | null;
}

const Placeholder = () => (
    <div className="w-full h-full flex flex-col justify-center items-center bg-black bg-opacity-5 rounded-lg p-8 text-center">
        <svg className="w-24 h-24 text-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-semibold text-text-primary">Your Vision Awaits</h3>
        <p className="text-text-secondary mt-2">Upload a product image and provide a creative prompt to begin.</p>
    </div>
);

const downloadImage = (base64Image: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Image}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const CanvasPanel: React.FC<CanvasPanelProps> = ({ productImage, generatedImage, isLoading, error }) => {
    const [showOriginal, setShowOriginal] = useState(false);

    const displayImage = showOriginal && productImage ? `data:${productImage.file.type};base64,${productImage.base64}` :
        generatedImage ? `data:image/png;base64,${generatedImage.base64}` :
        productImage ? `data:${productImage.file.type};base64,${productImage.base64}` : null;

    const currentImageLabel = showOriginal ? 'Original Product' : 'AI Generated Poster';

    return (
        <main className="flex-1 p-6 flex flex-col bg-bg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-secondary">{generatedImage ? currentImageLabel : 'Canvas'}</h2>
                {generatedImage && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                             <span className="text-sm text-text-secondary">Original</span>
                            <label htmlFor="toggle-switch" className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" id="toggle-switch" className="sr-only" checked={!showOriginal} onChange={() => setShowOriginal(!showOriginal)} />
                                    <div className="block bg-border w-12 h-6 rounded-full"></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${!showOriginal ? 'transform translate-x-6 bg-brand-primary' : 'bg-surface'}`}></div>
                                </div>
                            </label>
                            <span className="text-sm text-text-primary font-semibold">Generated</span>
                        </div>
                        <button onClick={() => downloadImage(generatedImage.base64, 'visioncraft-poster.png')} className="p-2 rounded-md bg-surface hover:bg-border transition-colors">
                            <DownloadIcon className="w-5 h-5 text-text-primary"/>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 w-full h-full bg-surface border border-border rounded-lg flex items-center justify-center relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 backdrop-blur-sm">
                        <LoadingSpinner className="w-16 h-16 text-brand-primary" />
                        <p className="text-lg font-semibold mt-4 text-white">AI is crafting your vision...</p>
                        <p className="text-sm text-gray-300">This can take a moment.</p>
                    </div>
                )}
                 {error && !isLoading && (
                    <div className="absolute inset-0 bg-red-900 bg-opacity-50 flex flex-col justify-center items-center z-10 p-4">
                        <h3 className="text-xl font-bold text-red-100">Generation Failed</h3>
                        <p className="text-center text-red-200 mt-2">{error}</p>
                    </div>
                )}
                {!displayImage && !isLoading && <Placeholder />}
                {displayImage && <img src={displayImage} alt={currentImageLabel} className="max-w-full max-h-full object-contain" />}
            </div>
        </main>
    );
};