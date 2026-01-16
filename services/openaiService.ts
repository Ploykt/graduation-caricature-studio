import { UserConfig, ArtStyle, Framing, BackgroundOption } from "../types";

// 1. ANALYSIS STEP: GPT-4o Vision
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
          content: "You are an illustration assistant. Your goal is to help artists create fictional characters based on visual references."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Create a stylized cartoon caricature description inspired by the uploaded image.

Important rules:
- Do NOT identify or analyze the real person.
- Do NOT guess identity, age, ethnicity, or personal traits.
- Use the image ONLY as a loose visual reference for artistic inspiration.
- This is a fictional illustration description, not a real person analysis.

OUTPUT FORMAT (Character Design Sheet):
Please list the VISUAL TRAITS for the artist to draw:
1. Hair (Style, texture, color - be specific)
2. Facial Hair (Beard, mustache, stubble - crucial if present)
3. Glasses (Yes/No - describe shape if yes)
4. Face Shape & Features (Round/Square, specific nose/eye shape)
5. Skin Tone Description (e.g., 'Warm olive', 'Deep brown', 'Fair')

Keep it descriptive but purely visual.` 
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 400
    })
  });

  const data = await response.json();
  
  if (data.error) throw new Error(`OpenAI Vision Error: ${data.error.message}`);
  
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("A IA não retornou nenhuma descrição.");

  // Validation: Check for privacy refusal
  const refusalKeywords = ["I'm sorry", "I cannot", "I can't", "identify", "privacy", "unable to", "assist with this request", "policy"];
  if (refusalKeywords.some(keyword => content.toLowerCase().startsWith(keyword.toLowerCase()))) {
    console.warn("Vision Refusal detected:", content);
    throw new Error("PRIVACY_REFUSAL");
  }

  return content;
}

// 2. GENERATION STEP: DALL-E 3
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
      quality: "hd" 
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
  const { style, framing, courseName, background } = config;

  // 1. Analyze the face
  console.log("Analyzing image with GPT-4o...");
  const physicalDescription = await analyzeImageWithGPT4o(apiKey, imageBase64);
  console.log("Analysis Result:", physicalDescription);

  // 2. Style Definitions (Aggressive Differentiation)
  // Put style AT THE START of the prompt to ensure DALL-E adheres to it.
  const styleKeywords = style === ArtStyle.ThreeD
    ? "STYLE: 3D DISNEY/PIXAR ANIMATION STYLE. High-end CGI, Octane Render, Cute 3D character, smooth plastic/clay textures, volumetric studio lighting, 3D mesh."
    : "STYLE: 2D FLAT DIGITAL ILLUSTRATION. Vector art, clean thick outlines, flat vibrant colors, cel shading, hand-drawn look, NO 3D effects, 2D cartoon.";

  const framingKeywords = framing === Framing.FullBody
    ? "Full Body shot (Head to toe, visible shoes)"
    : "Portrait shot (Head and Shoulders only)";

  const bgDescription = {
    [BackgroundOption.Studio]: "Simple dark studio background with rim lighting.",
    [BackgroundOption.Campus]: "Blurred university campus background.",
    [BackgroundOption.Festive]: "Festive party background with gold bokeh and confetti."
  }[background];

  // 3. Construct Final Prompt
  // We explicitly tell DALL-E to use the description from Step 1
  const finalPrompt = `
  ${styleKeywords}
  
  SUBJECT CHARACTER (Must match these traits):
  ${physicalDescription}
  
  OUTFIT (Mandatory):
  - Black Graduation Gown (Beca) with wide sleeves.
  - Graduation Cap (Mortarboard) on head.
  - Sash/Stole with colors for ${courseName} course.
  - Holding a diploma.

  COMPOSITION:
  - ${framingKeywords}
  - ${bgDescription}
  - Expression: Big happy smile, proud.
  - High quality 8k image.
  `;

  // 4. Determine Size
  const size = framing === Framing.FullBody ? "1024x1792" : "1024x1024";

  // 5. Generate
  console.log("Generating with DALL-E 3...", finalPrompt);
  return await generateWithDalle3(apiKey, finalPrompt, size);
};