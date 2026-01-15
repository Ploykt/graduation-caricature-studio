import { GoogleGenAI } from "@google/genai";
import { UserConfig, ArtStyle, Framing } from "../types";

const buildPrompt = (config: UserConfig): string => {
  const { style, framing, courseName } = config;

  const stylePrompt = style === ArtStyle.ThreeD
    ? `Style: Semi-realistic 3D render, similar to modern animation films (Pixar/Disney style). High-quality textures, subsurface scattering on skin, vibrant colors, cinematic lighting.`
    : `Style: High-end Digital 2D Illustration. Smooth digital oil painting technique, clean semi-realistic lines, sophisticated shading.`;

  const framingPrompt = framing === Framing.FullBody
    ? `FULL BODY shot, showing the complete academic gown from head to toe.`
    : `PORTRAIT shot, focused on head and shoulders.`;

  return `Create a high-quality professional digital graduation caricature.
${stylePrompt}
${framingPrompt}
The person MUST be wearing a professional black academic graduation gown (beca) and a mortarboard (capelo) with a tassel.
Holding a rolled diploma with a red or gold ribbon.
Course Context (use for subtle details/colors if applicable): ${courseName}.
Background: Professional studio setting with elegant bokeh, subtle festive particles.
Friendly, triumphant, and proud expression.
Quality: 8k resolution, masterpiece.
NO text, NO watermarks.`;
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

// Helper to handle Imagen Generation (Text-to-Image mostly, but we pass prompt description of the person)
async function generateWithImagen(ai: GoogleGenAI, prompt: string, aspectRatio: string) {
  // Imagen 3 doesn't support image-to-image in the same way via the public SDK mostly, 
  // so we rely on a strong descriptive prompt.
  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-001',
    prompt: prompt + " The character should resemble a generic student fitting the description.",
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
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
  const aspectRatio = config.framing === Framing.FullBody ? "9:16" : "1:1";
  const prompt = buildPrompt(config);

  try {
    // 1. Try Gemini 2.0 Flash (Multimodal - keeps facial identity better)
    console.log("Attempting generation with Gemini 2.0...");
    return await generateWithGemini(ai, prompt, cleanBase64, aspectRatio);

  } catch (error: any) {
    console.warn("Gemini 2.0 failed, trying fallback...", error.message);

    // If quota exceeded or model overloaded, try Imagen
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      try {
        console.log("Attempting fallback with Imagen 3.0...");
        return await generateWithImagen(ai, prompt, aspectRatio);
      } catch (imagenError: any) {
        console.error("Imagen fallback failed:", imagenError);
        // Throw the original 'busy' error to show the friendly message
        throw new Error("⚠️ Alto Tráfego: Os servidores gratuitos do Google estão ocupados no momento. Por favor, aguarde 1 minuto e tente novamente.");
      }
    }
    
    // Pass through other errors (like Invalid Key)
    if (error.status === 403 || error.message?.includes('403') || error.message?.includes('API key')) {
      throw new Error("INVALID_KEY");
    }

    throw new Error(error.message || "Falha na geração da imagem.");
  }
};