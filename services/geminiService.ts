
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { AppSettings, ProductImage } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const describeImage = async (base64Image: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "Describe the primary subject of this image in a concise phrase, suitable for a product marketing context. For example: 'a red sports car' or 'a pair of white sneakers'.",
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error describing image with Gemini API:", error);
        return "the user's uploaded product"; // Fallback
    }
};


export const generatePoster = async (
  productImage: ProductImage,
  settings: AppSettings
): Promise<string | null> => {
  try {
    const promptText = settings.promptMode === 'json' 
      ? `Using this JSON for creative direction, create a poster: ${settings.jsonPrompt}` 
      : settings.prompt;

    const fullPrompt = `Generate a poster for the following product: "${productImage.description}". Creative instructions: "${promptText}". The poster's aspect ratio must be ${settings.aspectRatio}. Creativity level: ${settings.creativity * 100}%. Adhere strictly to the creative instructions and aspect ratio.`;
    
    const imagePart = {
      inlineData: {
        data: productImage.base64,
        mimeType: productImage.file.type,
      },
    };

    const textPart = {
      text: fullPrompt,
    };
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart]
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        temperature: settings.creativity,
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating poster with Gemini API:", error);
    throw new Error("Failed to generate poster. Please check your API key and network connection.");
  }
};

export const getCreativeAdvice = async (
  prompt: string,
  productDescription: string
): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The user wants to create a poster for a product described as: "${productDescription}". Their current creative prompt is: "${prompt}". Provide 4 actionable, specific, and creative suggestions to improve their poster concept. Format the response as a JSON array of strings.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                },
                temperature: 0.8,
            }
        });

        const jsonStr = response.text.trim();
        const adviceList: string[] = JSON.parse(jsonStr);
        return adviceList;

    } catch (error) {
        console.error("Error getting creative advice from Gemini API:", error);
        throw new Error("Failed to get creative advice. Please check your API key and network connection.");
    }
};