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
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Describe the person in this image concisely but with key details for a caricature artist. Focus on: hair style/color, skin tone, facial hair, glasses, approximate age, gender, and distinctive facial features. Do not describe the background or clothes. Just the physical appearance." 
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
      max_tokens: 150
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(`OpenAI Vision Error: ${data.error.message}`);
  return data.choices[0].message.content;
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
      size: size, // "1024x1024" or "1024x1792"
      response_format: "b64_json",
      quality: "standard" // or "hd"
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
  // Note: DALL-E 3 doesn't support image-to-image directly for preserving identity in the same way.
  // We use GPT-4o to "see" the person and describe them to DALL-E.
  console.log("Analyzing image with GPT-4o...");
  const physicalDescription = await analyzeImageWithGPT4o(apiKey, imageBase64);
  console.log("Analysis:", physicalDescription);

  // 2. Build the Prompt
  const stylePrompt = style === ArtStyle.ThreeD
    ? `Style: 3D Pixar-style animation render, cute, vibrant, volumetric lighting.`
    : `Style: High-quality 2D digital illustration, smooth shading, semi-realistic caricature art.`;

  const finalPrompt = `A professional graduation caricature of ${physicalDescription}.
  
  CONTEXT & OUTFIT:
  - The character is wearing a black graduation gown (beca) and a mortarboard cap (capelo).
  - Holding a diploma with a ribbon.
  - Theme/Sash color based on the course: ${courseName}.
  - Background: Abstract festive studio background with bokeh.
  
  ARTISTIC STYLE:
  - ${stylePrompt}
  - Expression: Happy, proud, celebrating.
  - High detail, 8k resolution.`;

  // 3. Determine Size based on Framing
  // DALL-E 3 supports 1024x1024 (Square) or 1024x1792 (Portrait/Vertical)
  const size = framing === Framing.FullBody ? "1024x1792" : "1024x1024";

  // 4. Generate
  console.log("Generating with DALL-E 3...");
  return await generateWithDalle3(apiKey, finalPrompt, size);
};