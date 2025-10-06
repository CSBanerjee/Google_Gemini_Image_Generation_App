import React, { useState, useCallback, useEffect } from 'react';
import { AppSettings, ProductImage, GeneratedImage, AIAdvice, PromptMode, AspectRatio } from './types';
import { ControlPanel } from './components/ControlPanel';
import { CanvasPanel } from './components/CanvasPanel';
import { AdvisorPanel } from './components/AdvisorPanel';
import { generatePoster, getCreativeAdvice, describeImage, removeBackground } from './services/geminiService';
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
    const [productImageBgRemoved, setProductImageBgRemoved] = useState<ProductImage | null>(null);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdviceLoading, setIsAdviceLoading] = useState(false);
    const [isDescribing, setIsDescribing] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [isBgRemovalEnabled, setIsBgRemovalEnabled] = useState(false);
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
    
    const handleBgRemovalToggle = useCallback((enabled: boolean) => {
        setIsBgRemovalEnabled(enabled);
        if (enabled && productImage && !productImageBgRemoved) {
            setIsRemovingBg(true);
            setError(null);
            removeBackground(productImage)
                .then(bgRemovedBase64 => {
                     if (bgRemovedBase64) {
                        const byteString = atob(bgRemovedBase64);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        const blob = new Blob([ab], { type: 'image/png' });
                        const file = new File([blob], "product_bg_removed.png", { type: 'image/png' });

                        setProductImageBgRemoved({
                            file: file,
                            base64: bgRemovedBase64,
                            objectURL: URL.createObjectURL(file),
                            description: productImage.description,
                        });
                    } else {
                        throw new Error("Background removal model did not return an image.");
                    }
                })
                .catch(e => setError(e.message || "Background removal failed."))
                .finally(() => setIsRemovingBg(false));
        } else if (!enabled) {
            setProductImageBgRemoved(null);
        }
    }, [productImage, productImageBgRemoved]);

    const handleProductImageChange = useCallback(async (imageData: Omit<ProductImage, 'description'> | null) => {
        setGeneratedImage(null);
        setProductImageBgRemoved(null);
        setError(null);

        if (!imageData) {
            setProductImage(null);
            return;
        }

        setIsDescribing(true);
        setProductImage({ ...imageData, description: 'Analyzing product...' });

        try {
            const description = await describeImage(imageData.base64, imageData.file.type);
            const describedImage = {
                ...imageData,
                description,
            };
            setProductImage(describedImage);

            if (isBgRemovalEnabled) {
                setIsRemovingBg(true);
                try {
                    const bgRemovedBase64 = await removeBackground(describedImage);
                    if (bgRemovedBase64) {
                        const byteString = atob(bgRemovedBase64);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        const blob = new Blob([ab], { type: 'image/png' });
                        const file = new File([blob], "product_bg_removed.png", { type: 'image/png' });

                        setProductImageBgRemoved({
                            file: file,
                            base64: bgRemovedBase64,
                            objectURL: URL.createObjectURL(file),
                            description: description,
                        });
                    } else {
                        console.warn("Background removal failed to return an image.");
                    }
                } catch (e: any) {
                    setError(e.message || "Background removal failed.");
                } finally {
                    setIsRemovingBg(false);
                }
            }
        } catch (e: any) {
            setError(e.message || "Image description failed.");
            setProductImage({
                ...imageData,
                description: 'A product',
            });
        } finally {
            setIsDescribing(false);
        }
    }, [isBgRemovalEnabled]);

    const handleGenerate = async () => {
        const imageToUse = (isBgRemovalEnabled && productImageBgRemoved) ? productImageBgRemoved : productImage;
        if (!imageToUse) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const currentPrompt = settings.promptMode === PromptMode.TEXT ? settings.prompt : settings.jsonPrompt;
            const resultBase64 = await generatePoster(imageToUse, settings);
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
        const imageToUseForAdvice = (isBgRemovalEnabled && productImageBgRemoved) ? productImageBgRemoved : productImage;
        if (!generatedImage || !imageToUseForAdvice) return;

        setIsAdviceLoading(true);
        try {
            const adviceList = await getCreativeAdvice(generatedImage.prompt, imageToUseForAdvice.description);
            setAdvice(adviceList.map((adv, index) => ({ id: Date.now() + index, advice: adv })));
        } catch (e: any) {
            console.error("Failed to get new advice:", e.message);
        } finally {
            setIsAdviceLoading(false);
        }
    };

    const imageForControlPanel = (isBgRemovalEnabled && productImageBgRemoved) ? productImageBgRemoved : productImage;

    return (
        <div className="h-screen w-screen bg-bg flex flex-col lg:flex-row overflow-hidden">
            <ControlPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onProductImageChange={handleProductImageChange}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                productImage={imageForControlPanel}
                isDescribing={isDescribing}
                isRemovingBg={isRemovingBg}
                isBgRemovalEnabled={isBgRemovalEnabled}
                onBgRemovalToggle={handleBgRemovalToggle}
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