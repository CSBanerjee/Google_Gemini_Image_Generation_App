import React, { useState, useCallback, useEffect } from 'react';
import { AppSettings, ProductImage, GeneratedImage, AIAdvice, PromptMode, AspectRatio } from './types';
import { ControlPanel } from './components/ControlPanel';
import { CanvasPanel } from './components/CanvasPanel';
import { AdvisorPanel } from './components/AdvisorPanel';
import { generatePoster, getCreativeAdvice, describeImage } from './services/geminiService';
import { DEFAULT_JSON_PROMPT, PLACEHOLDER_ADVICE } from './constants';
import { THEMES } from './themes';

const App: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>({
        aspectRatio: '1:1',
        promptMode: PromptMode.TEXT,
        prompt: 'A photorealistic shot of the product on a marble slab, with dramatic studio lighting and a lush green plant in the background.',
        jsonPrompt: DEFAULT_JSON_PROMPT,
        creativity: 1.0,
    });
    const [productImage, setProductImage] = useState<ProductImage | null>(null);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdviceLoading, setIsAdviceLoading] = useState(false);
    const [isDescribing, setIsDescribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [advice, setAdvice] = useState<AIAdvice[]>(
        PLACEHOLDER_ADVICE.map((adv, index) => ({ id: index, advice: adv }))
    );
    const [theme, setTheme] = useState<string>(THEMES[0].id);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleSettingsChange = useCallback((newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);
    
    const handleProductImageChange = useCallback(async (imageData: Omit<ProductImage, 'description'> | null) => {
        setGeneratedImage(null);
        setError(null);

        if (!imageData) {
            setProductImage(null);
            return;
        }

        setIsDescribing(true);
        setProductImage({ ...imageData, description: 'Analyzing product...' });

        try {
            const description = await describeImage(imageData.base64, imageData.file.type);
            setProductImage({
                ...imageData,
                description,
            });
        } catch (e) {
            console.error("Failed to describe image", e);
            setProductImage({
                ...imageData,
                description: 'A product',
            });
        } finally {
            setIsDescribing(false);
        }
    }, []);

    const handleGenerate = async () => {
        if (!productImage) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const currentPrompt = settings.promptMode === PromptMode.TEXT ? settings.prompt : settings.jsonPrompt;
            const resultBase64 = await generatePoster(productImage, settings);
            if(resultBase64) {
                setGeneratedImage({
                    base64: resultBase64,
                    prompt: currentPrompt,
                });
            } else {
                throw new Error("The AI model did not return an image. Please try adjusting your prompt.");
            }
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetAdvice = async () => {
        if (!generatedImage || !productImage) return;

        setIsAdviceLoading(true);
        try {
            const adviceList = await getCreativeAdvice(generatedImage.prompt, productImage.description);
            setAdvice(adviceList.map((adv, index) => ({ id: Date.now() + index, advice: adv })));
        } catch (e: any) {
            console.error("Failed to get new advice:", e.message);
        } finally {
            setIsAdviceLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-bg flex flex-col lg:flex-row overflow-hidden">
            <ControlPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onProductImageChange={handleProductImageChange}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                productImage={productImage}
                isDescribing={isDescribing}
                theme={theme}
                onThemeChange={setTheme}
            />
            <CanvasPanel
                productImage={productImage}
                generatedImage={generatedImage}
                isLoading={isLoading}
                error={error}
            />
            <AdvisorPanel
                advice={advice}
                onGetAdvice={handleGetAdvice}
                isAdviceLoading={isAdviceLoading}
                hasGenerated={!!generatedImage}
            />
        </div>
    );
};

export default App;
