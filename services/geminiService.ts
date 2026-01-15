import { GoogleGenAI } from "@google/genai";
import { UserConfig, ArtStyle, Framing, BackgroundOption } from "../types";

const buildPrompt = (config: UserConfig): string => {
  const { style, framing, courseName, background } = config;

  const stylePrompt = style === ArtStyle.ThreeD
    ? `Semi-realistic 3D Pixar animation style. Smooth textures, soft lighting, subtle subsurface scattering, vibrant but natural colors.`
    : `High-end digital oil painting style. Visible brush strokes, artistic texture, painterly aesthetic.`;

  const framingPrompt = framing === Framing.FullBody
    ? `Full body shot showing academic gown from head to toe.`
    : `Head and shoulders portrait, tight framing.`;

  const backgroundPrompt = {
    [BackgroundOption.Studio]: "Professional photography studio with soft gradient background, subtle bokeh effect.",
    [BackgroundOption.Campus]: "University campus background, blurred architecture, academic atmosphere.",
    [BackgroundOption.Festive]: "Graduation-themed background with golden confetti, celebration lights."
  }[background];

  return `Create a professional graduation caricature portrait based on the attached image.

## CRITICAL RULES:
1. PRESERVE FACIAL IDENTITY: The character MUST look like the person in the image (same hair, skin tone, glasses, facial hair, face shape).
2. ACADEMIC ACCURACY: Wear Black Academic Graduation Gown (Beca) and Mortarboard Cap (Capelo).
3. COURSE THEME: Add sash/details in colors representing: ${courseName}.

## ART STYLE:
${stylePrompt}

## COMPOSITION:
${framingPrompt}

## BACKGROUND:
${backgroundPrompt}

Technical: 8k resolution, sharp focus, masterpiece.`;
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
    prompt: prompt,
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
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const aspectRatio = config.framing === Framing.FullBody ? "9:16" : "1:1";
  const prompt = buildPrompt(config);

  try {
    // 1. Try Gemini 2.0 Flash (Multimodal)
    console.log("Attempting generation with Gemini 2.0...");
    return await generateWithGemini(ai, prompt, cleanBase64, aspectRatio);

  } catch (error: any) {
    console.warn("Gemini 2.0 failed, trying fallback...", error.message);

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      try {
        console.log("Attempting fallback with Imagen 3.0...");
        return await generateWithImagen(ai, prompt, aspectRatio);
      } catch (imagenError: any) {
        throw new Error("⚠️ Alto Tráfego: Os servidores do Google estão ocupados.");
      }
    }
    
    if (error.status === 403 || error.message?.includes('403') || error.message?.includes('API key')) {
      throw new Error("INVALID_KEY");
    }

    throw new Error(error.message || "Falha na geração da imagem.");
  }
};