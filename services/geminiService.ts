import { GoogleGenAI } from "@google/genai";
import { UserConfig, ArtStyle, Framing, BackgroundOption } from "../types";

const buildPrompt = (config: UserConfig): string => {
  const { style, framing, courseName, background } = config;

  const stylePrompt = style === ArtStyle.ThreeD
    ? `Style: 3D Pixar Animation Style. 
       - Look: High-end 3D render (Cinema4D/Octane).
       - Features: Smooth skin texture, subsurface scattering, cute proportions but RECOGNIZABLE.
       - Lighting: Studio lighting, rim lights.`
    : `Style: Digital Painting Caricature.
       - Look: High-quality digital art, semi-realistic.
       - Features: Artistic brush strokes, vibrant colors.`;

  const framingPrompt = framing === Framing.FullBody
    ? `Framing: Full Body Shot (Head to Toe). Ensure the gown and shoes are visible.`
    : `Framing: Head and Shoulders Portrait. Focus on the face.`;

  const backgroundPrompt = {
    [BackgroundOption.Studio]: "Background: Professional studio backdrop, soft lighting, neutral tones.",
    [BackgroundOption.Campus]: "Background: Blurred university campus, academic architecture.",
    [BackgroundOption.Festive]: "Background: Gold bokeh lights, falling confetti, celebratory atmosphere."
  }[background];

  return `You are a professional caricature artist.
  
  TASK:
  Generate a high-quality graduation caricature of the person in the input image.
  
  ⚠️ IDENTITY PRESERVATION (CRITICAL):
  - The output character MUST look exactly like the person in the provided image.
  - Match their specific: Hair style, Hair color, Skin tone, Eye shape, Facial hair, and Face structure.
  - If they wear glasses in the photo, include them.
  
  OUTFIT & THEME:
  - Subject is wearing a Black Academic Graduation Gown (Beca).
  - Subject is wearing a Mortarboard Cap (Capelo) on their head.
  - Subject has a Sash/Stole representing the course: "${courseName}" (Use appropriate colors for this course).
  - Subject is holding a Diploma scroll.
  
  VISUAL STYLE:
  ${stylePrompt}
  
  COMPOSITION:
  ${framingPrompt}
  ${backgroundPrompt}
  
  Expression: Happy, proud, smiling.
  Quality: 8k, Masterpiece, Sharp focus.`;
};

// Helper to handle Gemini Content Generation (Multimodal)
async function generateWithGemini(ai: GoogleGenAI, prompt: string, imageBase64: string, aspectRatio: string) {
  // Use gemini-3-pro-image-preview for high-quality image generation/editing tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview', 
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
      imageConfig: { 
        aspectRatio: aspectRatio,
        imageSize: "1K" // Supported by gemini-3-pro-image-preview
      }
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
  // Use imagen-4.0-generate-001 as per guidelines
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
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
  imageBase64: string,
  config: UserConfig
): Promise<string> => {
  // API key must be obtained exclusively from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const aspectRatio = config.framing === Framing.FullBody ? "9:16" : "1:1";
  const prompt = buildPrompt(config);

  try {
    // 1. Try Gemini 3 Pro (Multimodal)
    console.log("Attempting generation with Gemini 3 Pro...");
    return await generateWithGemini(ai, prompt, cleanBase64, aspectRatio);

  } catch (error: any) {
    console.warn("Gemini 3 Pro failed, trying fallback...", error.message);

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      try {
        console.log("Attempting fallback with Imagen 4.0...");
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