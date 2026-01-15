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
          content: "You are a Technical Art Director for an animation studio. Your job is to analyze reference photos to create character descriptions for 3D modelers. Focus strictly on physical visual traits. Do NOT attempt to identify the real person."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Create a detailed visual description of the person in this image to be used as a prompt for an AI image generator. \n\nFocus strictly on:\n1. Face Shape & Structure (e.g., round, oval, sharp jawline, high cheekbones)\n2. Skin Tone & Complexion (be specific, e.g., olive, fair, deep brown)\n3. Eyes (shape, color, eyebrows)\n4. Hair (exact style, texture, color, length)\n5. Facial Hair (beard/mustache style if any)\n6. Distinctive features (glasses style, freckles, dimples)\n7. Age approximation (e.g., young adult)\n\nDo NOT describe their current clothing. Do NOT mention the background. Output as a comma-separated descriptive list." 
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
      max_tokens: 300
    })
  });

  const data = await response.json();
  
  if (data.error) throw new Error(`OpenAI Vision Error: ${data.error.message}`);
  
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("A IA não retornou nenhuma descrição.");

  // Validation: Check for privacy refusal
  const refusalKeywords = ["I'm sorry", "I cannot", "I can't", "identify", "privacy", "unable to"];
  if (refusalKeywords.some(keyword => content.toLowerCase().startsWith(keyword.toLowerCase()))) {
    console.warn("Vision Refusal detected:", content);
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
      quality: "hd" // Changed to HD for better details
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
      // Fallback description if blocked, generic but safe
      physicalDescription = "A happy young adult graduate with a friendly smile";
      console.warn("Using fallback description due to privacy filter.");
    } else {
      throw error;
    }
  }

  // 2. Build the Prompt
  const stylePrompt = style === ArtStyle.ThreeD
    ? `Style: 3D Pixar/Disney style animation render. Cute proportions, big expressive eyes, smooth plastic-like skin texture, volumetric studio lighting, Octane render.`
    : `Style: High-end digital 2D painting, semi-realistic caricature, smooth shading, vibrant colors, clean lines, artstation quality.`;

  const framingPrompt = framing === Framing.FullBody
    ? `View: Full body shot, showing shoes and full gown.`
    : `View: Medium shot, head and torso.`;

  const finalPrompt = `Create a professional Graduation Caricature.
  
  CHARACTER VISUALS (Strictly follow this):
  ${physicalDescription}
  
  OUTFIT (Mandatory):
  - Wearing a traditional black academic Graduation Gown (Beca).
  - Wearing a Graduation Cap (Mortarboard/Capelo) with a tassel on the head.
  - The sash/stole accent color should represent the course: ${courseName}.
  - Holding a rolled diploma with a ribbon.
  
  SETTING:
  - Background: Abstract festive studio bokeh lights (gold and blurry).
  - Expression: Very happy, proud, big smile.
  
  TECHNICAL:
  - ${stylePrompt}
  - ${framingPrompt}
  - High resolution, masterpiece, sharp focus on the face.`;

  // 3. Determine Size
  const size = framing === Framing.FullBody ? "1024x1792" : "1024x1024";

  // 4. Generate
  console.log("Generating with DALL-E 3...", finalPrompt);
  return await generateWithDalle3(apiKey, finalPrompt, size);
};