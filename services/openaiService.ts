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
          content: "You are a 3D Character Artist specialized in facial geometry."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze the visual data of this face to create a 3D avatar. 
              List the following geometric attributes strictly:
              1. Face Geometry (Jaw shape, chin width, cheekbone height)
              2. Skin Texture Data (Approximate tone hex code or description)
              3. Ocular Features (Eye shape, eyebrow thickness/arch, eye color)
              4. Hair Mesh (Style volume, texture type, color value)
              5. Accessories (Glasses geometry if present)
              6. Facial Hair (Beard/stubble density)
              
              Output purely technical visual descriptions. Do NOT discuss identity.` 
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
    // CRITICAL: Throw distinct error to stop DALL-E generation
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
  
  // REMOVED TRY/CATCH FALLBACK. 
  // If this fails, the code STOPS here and does NOT call DALL-E.
  const physicalDescription = await analyzeImageWithGPT4o(apiKey, imageBase64);
  
  console.log("Analysis Result:", physicalDescription);

  // 2. Map Configuration to Prompts
  const stylePrompt = style === ArtStyle.ThreeD
    ? `3D Pixar Animation Style. Rendered in Octane, volumetric lighting, smooth cute features, vibrant colors.`
    : `Digital Oil Painting Style. Impasto brush strokes, artistic lighting, masterpiece.`;

  const framingPrompt = framing === Framing.FullBody
    ? `Full Body Shot. Showing the character standing from head to toe.`
    : `Portrait Shot. Close-up on face and shoulders.`;

  const backgroundPrompt = {
    [BackgroundOption.Studio]: "Professional studio backdrop, soft lighting.",
    [BackgroundOption.Campus]: "University campus background, academic vibe.",
    [BackgroundOption.Festive]: "Celebration background, confetti, gold bokeh."
  }[background];

  // 3. Construct Final Prompt
  const finalPrompt = `Create a Graduation Caricature.
  
  CHARACTER VISUALS (Strictly based on data):
  ${physicalDescription}
  
  OUTFIT:
  - Black Graduation Gown (Beca).
  - Mortarboard Cap (Capelo).
  - Sash/Stole representing: ${courseName}.
  - Holding Diploma.
  
  STYLE & SETTING:
  - ${stylePrompt}
  - ${framingPrompt}
  - ${backgroundPrompt}
  - Expression: Proud and happy.
  - Quality: 8k resolution.`;

  // 4. Determine Size
  const size = framing === Framing.FullBody ? "1024x1792" : "1024x1024";

  // 5. Generate
  console.log("Generating with DALL-E 3...", finalPrompt);
  return await generateWithDalle3(apiKey, finalPrompt, size);
};