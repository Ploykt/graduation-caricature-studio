import { UserConfig, ArtStyle, Framing } from "../types";

// Helper to analyze facial features using GPT-4o Vision
async function analyzeImageWithGPT4o(apiKey: string, imageBase64: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert character designer for animation. Your task is to extract visual attributes from a reference photo to create a stylized avatar. Focus purely on physical traits. Do not attempt to identify the person."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze the visual features of the character in this image for an artistic caricature. Describe the following concisely: \n1. Hair (style, color, length)\n2. Skin tone and complexion\n3. Facial hair (beard/mustache) if any\n4. Glasses (if any)\n5. Gender and approximate age group\n6. Key facial structure (e.g., round face, sharp jawline)\n\nKeep it objective and descriptive for an artist." 
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 200
    })
  });

  const data = await response.json();
  
  if (data.error) throw new Error(`OpenAI Vision Error: ${data.error.message}`);
  
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("A IA não retornou nenhuma descrição.");

  // Check for privacy refusal
  const refusalKeywords = ["I'm sorry", "I cannot", "I can't", "identify", "privacy"];
  if (refusalKeywords.some(keyword => content.startsWith(keyword))) {
    console.warn("Vision Refusal:", content);
    throw new Error("PRIVACY_REFUSAL");
  }

  return content;
}

// Helper to generate image with DALL-E 3
async function generateWithDalle3(apiKey: string, prompt: string, size: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size, 
      response_format: "b64_json",
      quality: "standard"
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(`DALL-E 3 Error: ${data.error.message}`);
  return `data:image/png;base64,${data.data[0].b64_json}`;
}

export const generateOpenAICaricature = async (
  apiKey: string,
  imageBase64: string,
  config: UserConfig
): Promise<string> => {
  const { style, framing, courseName } = config;

  // 1. Analyze the face
  console.log("Analyzing image with GPT-4o...");
  let physicalDescription = "";
  
  try {
    physicalDescription = await analyzeImageWithGPT4o(apiKey, imageBase64);
    console.log("Analysis:", physicalDescription);
  } catch (error: any) {
    if (error.message === "PRIVACY_REFUSAL") {
      throw new Error("A IA de visão recusou analisar esta foto por motivos de privacidade. Tente uma foto diferente ou menos realista.");
    }
    throw error;
  }

  // 2. Build the Prompt
  const stylePrompt = style === ArtStyle.ThreeD
    ? `Style: 3D Pixar-style animation render, cute, vibrant, volumetric lighting, 3d render engine.`
    : `Style: High-quality 2D digital illustration, smooth shading, semi-realistic caricature art, digital painting.`;

  const finalPrompt = `Create a professional graduation caricature based on this description: ${physicalDescription}.
  
  IMPORTANT OUTFIT & THEME:
  - The character is wearing a black graduation gown (beca).
  - Wearing a mortarboard cap (capelo) on the head.
  - Holding a rolled diploma with a ribbon.
  - Theme/Sash color highlights: ${courseName} theme colors.
  
  SETTING:
  - Background: Festive abstract bokeh studio lighting.
  
  ART DIRECTION:
  - ${stylePrompt}
  - Expression: Happy, smiling, proud.
  - Resemblance: Try to match the description traits (hair, skin, glasses) as closely as possible.
  - Quality: 8k resolution, masterpiece.`;

  // 3. Determine Size
  const size = framing === Framing.FullBody ? "1024x1792" : "1024x1024";

  // 4. Generate
  console.log("Generating with DALL-E 3...");
  return await generateWithDalle3(apiKey, finalPrompt, size);
};