import { UserConfig, ArtStyle, Framing, BackgroundOption } from "../types";

// 1. ANALYSIS STEP: Technical Art Director Persona
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
              text: `Analyze this graduation photo and extract for caricature generation:
              1. FACE SHAPE: [oval, round, square, heart, diamond]
              2. SKIN TONE: [fair, light, medium, olive, tan, brown, dark] with undertones [cool, warm, neutral]
              3. EYES: [color] + [shape: almond, round, monolid, hooded] + [eyebrows]
              4. HAIR: [color] + [style: straight, wavy, curly, afro] + [length]
              5. DISTINCTIVE FEATURES: [glasses yes/no, beard yes/no, facial hair style, prominent nose, smile type]
              6. EXPRESSION: [neutral, smiling, serious, happy, confident]
              
              Return ONLY this structured data as a list. Do not write an intro or conclusion.` 
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
      max_tokens: 350
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

// 2. GENERATION STEP: DALL-E 3 with Template
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
  let physicalDescription = "";
  
  try {
    physicalDescription = await analyzeImageWithGPT4o(apiKey, imageBase64);
    console.log("Analysis Result:", physicalDescription);
  } catch (error: any) {
    if (error.message === "PRIVACY_REFUSAL") {
      physicalDescription = "FACE SHAPE: Oval\nSKIN TONE: Natural medium\nEYES: Happy, smiling\nHAIR: Neatly styled\nEXPRESSION: Proud and happy graduate";
      console.warn("Using fallback description due to privacy filter.");
    } else {
      throw error;
    }
  }

  // 2. Map Configuration to Prompts
  const stylePrompt = style === ArtStyle.ThreeD
    ? `Semi-realistic 3D Pixar animation style. Smooth textures, soft lighting, subtle subsurface scattering, vibrant but natural colors. Character should look like a high-end 3D render.`
    : `High-end digital oil painting style. Visible brush strokes, artistic texture, painterly aesthetic, subtle canvas texture. Impasto texture, blended color transitions.`;

  const framingPrompt = framing === Framing.FullBody
    ? `Full body shot showing academic gown from head to toe, natural standing pose.`
    : `Head and shoulders portrait, tight framing, emphasis on facial features and expression.`;

  const backgroundPrompt = {
    [BackgroundOption.Studio]: "Professional photography studio with soft gradient background, subtle bokeh effect.",
    [BackgroundOption.Campus]: "University campus background, blurred architecture (columns/library), academic atmosphere.",
    [BackgroundOption.Festive]: "Graduation-themed background with golden confetti, celebration lights, soft bokeh."
  }[background];

  // 3. Construct Final Prompt
  const finalPrompt = `Create a professional graduation caricature portrait.

## PERSON DESCRIPTION (from analysis):
${physicalDescription}

## ART STYLE:
${stylePrompt}

## COMPOSITION:
${framingPrompt}

## BACKGROUND:
${backgroundPrompt}

## ACADEMIC ELEMENTS:
- Black graduation gown (academic robe)
- Mortarboard cap with tassel
- Diploma scroll with ribbon
- Sash/Stole colors representing: ${courseName}
- Professional, proud, confident expression

## TECHNICAL SPECS:
- High resolution (8K quality)
- Sharp focus on face
- Consistent lighting from front
- Maintain person's identity and distinctive features
- NO text, NO watermarks`;

  // 4. Determine Size
  const size = framing === Framing.FullBody ? "1024x1792" : "1024x1024";

  // 5. Generate
  console.log("Generating with DALL-E 3...", finalPrompt);
  return await generateWithDalle3(apiKey, finalPrompt, size);
};