import { GoogleGenAI } from "@google/genai";
import { UserConfig, ArtStyle, Framing, BackgroundOption } from "../types";

const buildPrompt = (config: UserConfig, refinementInstruction?: string): string => {
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

  // Se houver instrução de refinação, ela ganha prioridade ALTA
  const refinementSection = refinementInstruction 
    ? `\n⚠️ USER ADJUSTMENT REQUEST (HIGHEST PRIORITY): "${refinementInstruction}". \nMake sure to apply this change while keeping the rest consistent.` 
    : "";

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
  ${refinementSection}
  
  Expression: Happy, proud, smiling.
  Quality: 8k, Masterpiece, Sharp focus.`;
};

// Helper to handle Gemini Content Generation (Multimodal)
async function generateWithGemini(ai: GoogleGenAI, prompt: string, imageBase64: string, aspectRatio: string) {
  // Use gemini-2.5-flash-image for cost efficiency/free tier compatibility
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', 
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
        aspectRatio: aspectRatio
      }
    }
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) throw new Error("Nenhum resultado retornado pelo Gemini.");
  
  const parts = candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("O modelo não retornou uma imagem. Tente novamente.");
}

export const generateCaricature = async (
  imageBase64: string,
  config: UserConfig,
  refinement?: string
): Promise<string> => {
  // API key must be obtained exclusively from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const aspectRatio = config.framing === Framing.FullBody ? "9:16" : "1:1";
  const prompt = buildPrompt(config, refinement);

  try {
    console.log("Gerando com Gemini. Refinamento:", refinement || "Nenhum");
    return await generateWithGemini(ai, prompt, cleanBase64, aspectRatio);

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    
    // Tratamento de erros amigável para o usuário
    if (error.status === 403 || error.message?.includes('403') || error.message?.includes('API key')) {
      throw new Error("Chave de API inválida ou expirada. Verifique suas configurações.");
    }
    
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      if (error.message?.includes('limit: 0')) {
        throw new Error("O modelo de imagem (Gemini 2.5) não está disponível no plano gratuito da sua conta ou região. Tente usar uma chave com faturamento ativado.");
      }
      throw new Error("Limite de requisições excedido (Quota). Tente novamente em alguns minutos.");
    }

    if (error.message?.includes('SAFETY')) {
       throw new Error("A imagem foi bloqueada pelos filtros de segurança. Tente uma foto diferente.");
    }

    throw new Error(error.message || "Falha na geração da imagem. Tente novamente.");
  }
};