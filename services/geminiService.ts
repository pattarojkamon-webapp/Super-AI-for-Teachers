import { GoogleGenAI, Modality, GenerateContentResponse, Chat, GroundingChunk, Part } from "@google/genai";

// Utility to convert File -> base64
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

// --- API Functions ---

// 1. Chatbot
let chatInstance: Chat | null = null;
const getChatInstance = (ai: GoogleGenAI): Chat => {
    if (!chatInstance) {
        chatInstance = ai.chats.create({ model: 'gemini-2.5-flash' });
    }
    return chatInstance;
};

export async function* getChatResponseStream(message: string, file: File | null = null): AsyncGenerator<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = getChatInstance(ai);

    let streamResponse;

    if (file) {
        const base64 = await fileToBase64(file);
        const filePart: Part = { inlineData: { data: base64, mimeType: file.type } };
        
        // Construct proper Parts array
        const parts: Part[] = [];
        
        // Ensure there is always a text part if needed, or just pass file.
        // Some configurations prefer having some text context.
        const textContent = message.trim() || " "; // Default to space if empty with file
        parts.push({ text: textContent });
        parts.push(filePart);
        
        // Fix ContentUnion error: Pass object with message property
        streamResponse = await chat.sendMessageStream({ message: parts });
    } else {
        // Ensure message is not empty string
        const textContent = message.trim() || " ";
        // Fix ContentUnion error: Pass object with message property
        streamResponse = await chat.sendMessageStream({ message: textContent });
    }
    
    for await (const chunk of streamResponse) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
};

export const resetChat = () => {
    chatInstance = null;
};


// 2. Thinking Assistant
export const generateTextWithThinking = async (prompt: string, file: File | null = null): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let contents: any = prompt;

    if (file) {
        const base64 = await fileToBase64(file);
        const filePart = { inlineData: { data: base64, mimeType: file.type } };
        const textPart = { text: prompt };
        contents = { parts: [textPart, filePart] };
    }

    // Use gemini-3-pro-preview for complex thinking tasks
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text || "";
};


// 3. Image Generation
export const generateImage = async (prompt: string, aspectRatio: string = '1:1', negativePrompt: string = ''): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let finalPrompt = prompt;
    if (negativePrompt) {
        finalPrompt = `${prompt} (Negative prompt: ${negativePrompt})`;
    }

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// 4. Image Analysis
export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
    });
    return response.text || "";
};

// 5. Image Editor
export const editImage = async (prompt: string, imageBase64: string, mimeType: string, aspectRatio: string = '1:1', negativePrompt: string = ''): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    
    let textPrompt = prompt;
    if (negativePrompt) {
        textPrompt += `. Ensure the result does NOT contain: ${negativePrompt}`;
    }
    
    const textPart = { text: textPrompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio
            }
        }
    });

    // Robustly find the image part
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                // Ensure mimetype is valid or default to png if missing
                const mime = part.inlineData.mimeType || 'image/png';
                return `data:${mime};base64,${base64ImageBytes}`;
            }
        }
        // If no image found, check for text to throw a more informative error
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                throw new Error(part.text);
            }
        }
    }
    throw new Error("No image generated from edit. The model might have returned text instead.");
};

// 6. Video Generation
export const generateVideo = async (prompt: string, imageBase64: string, mimeType: string, aspectRatio: '16:9' | '9:16') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: {
            imageBytes: imageBase64,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

// 7. Text-to-Speech
export const generateSpeech = async (text: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("TTS generation failed.");
    }
    return base64Audio;
};

// 8. Info Search (Google Search Grounding)
export const searchWithGrounding = async (prompt: string, file: File | null = null): Promise<{ text: string, sources: GroundingChunk[] | undefined }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let contents: any = prompt;

    if (file) {
        const base64 = await fileToBase64(file);
        const filePart = { inlineData: { data: base64, mimeType: file.type } };
        const textPart = { text: prompt };
        contents = { parts: [textPart, filePart] };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return { text: response.text || "", sources };
};

// 9. Map Search (Google Maps Grounding)
export const searchMapsWithGrounding = async (prompt: string, latitude: number, longitude: number): Promise<{ text: string, sources: GroundingChunk[] | undefined }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: latitude,
                        longitude: longitude
                    }
                }
            }
        },
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return { text: response.text || "", sources };
};