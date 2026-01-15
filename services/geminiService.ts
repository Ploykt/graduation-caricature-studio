import { GoogleGenAI } from "@google/genai";
import { UserConfig, ArtStyle, Framing } from "../types";

const buildPrompt = (config: UserConfig): string => {
  const { style, framing, courseName } = config;

  const stylePrompt = style === ArtStyle.ThreeD
    ? `Style: 3D Animation Style (Pixar-esque). High fidelity, subsurface scattering, cute but recognizable features, cinematic lighting, 3D render.`
    : `Style: Professional Digital Caricature. Semi-realistic painting style, smooth brushwork, high detail, vibrant colors.`;

  const framingPrompt = framing === Framing.FullBody
    ? `Full body shot, showing the entire gown and shoes.`
    : `Portrait shot, focused on head and shoulders.`;

  return `You are a professional caricature artist. 
  Task: Create a graduation caricature based on the person in the attached image.
  
  CRITICAL INSTRUCTIONS:
  1. PRESERVE IDENTITY: The character MUST look like the person in the image (same hair, skin tone, glasses, facial hair, face shape).
  2. OUTFIT: The character MUST be wearing a Black Academic Graduation Gown (Beca) and a Mortarboard Cap (Capelo).
  3. ACCESSORIES: Holding a rolled diploma.
  4. THEME: Add a sash or details in colors representing the course: ${courseName}.
  
  ${stylePrompt}
  ${framingPrompt}
  
  Background: Elegant studio lighting, celebratory atmosphere, blurred bokeh.
  Expression: Proud, smiling, triumphant.
  Quality: 8k, masterpiece, highly detailed.`;
};

// Helper to handle Gemini Content Generation (Multimodal)
async function generateWithGemini(ai: GoogleGenAI, prompt: string, imageBase64: string, aspectRatio: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp', 
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64
          }
        }
      ]
    },
    config: {
      imageConfig: { aspectRatio: aspectRatio }
    }
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) throw new Error("Nenhum resultado retornado.");
  
  const parts = candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Nenhuma imagem encontrada na resposta.");
}

// Helper to handle Imagen Generation (Fallback)
async function generateWithImagen(ai: GoogleGenAI, prompt: string, aspectRatio: string) {
  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-001',
    prompt: prompt + " The character is a generic happy graduate student.",
    config: {
      numberOfImages: 1,
      aspectRatio: aspectRatio,
      outputMimeType: 'image/jpeg'
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
  }
  throw new Error("Nenhuma imagem gerada pelo Imagen.");
}

export const generateCaricature = async (
  apiKey: string,
  imageBase64: string,
  config: UserConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  // Ensure strict cleaning of base64
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const aspectRatio = config.framing === Framing.FullBody ? "9:16" : "1:1";
  const prompt = buildPrompt(config);

  try {
    // 1. Try Gemini 2.0 Flash (Multimodal - keeps facial identity better)
    console.log("Attempting generation with Gemini 2.0...");
    return await generateWithGemini(ai, prompt, cleanBase64, aspectRatio);

  } catch (error: any) {
    console.warn("Gemini 2.0 failed, trying fallback...", error.message);

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      try {
        console.log("Attempting fallback with Imagen 3.0...");
        return await generateWithImagen(ai, prompt, aspectRatio);
      } catch (imagenError: any) {
        console.error("Imagen fallback failed:", imagenError);
        throw new Error("⚠️ Alto Tráfego: Os servidores do Google estão ocupados. Aguarde 1 minuto.");
      }
    }
    
    if (error.status === 403 || error.message?.includes('403') || error.message?.includes('API key')) {
      throw new Error("INVALID_KEY");
    }

    throw new Error(error.message || "Falha na geração da imagem.");
  }
};