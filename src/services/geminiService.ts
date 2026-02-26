import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, OutfitSuggestion, BodyType, Complexion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateOutfit(prefs: UserPreferences): Promise<OutfitSuggestion> {
  const prompt = `
    As a world-class fashion stylist, suggest a complete outfit for a ${prefs.gender} from the ${prefs.generation} generation.
    Occasion: ${prefs.occasion}
    Body Type: ${prefs.bodyType}
    Complexion: ${prefs.complexion}
    Preferred Fabric: ${prefs.fabric}
    Cultural Style/Country: ${prefs.countryStyle}
    ${prefs.weather ? `Current Weather: ${prefs.weather}` : ""}

    Provide a detailed recommendation including specific items, why they work for this body type and complexion, and styling tips.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                item: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["category", "item", "reason"],
            },
          },
          stylingTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          colorPalette: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          imagePrompt: { type: Type.STRING, description: "A highly descriptive prompt for an AI image generator to visualize this outfit on a model." },
        },
        required: ["title", "description", "items", "stylingTips", "colorPalette", "imagePrompt"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function analyzeImage(base64Image: string): Promise<{
  bodyType: BodyType;
  complexion: Complexion;
  suggestedStyle: string;
}> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(",")[1],
        },
      },
      {
        text: "Analyze this person's photo for fashion styling. Identify their body type (slim, athletic, average, curvy, plus-size), complexion (fair, medium, olive, tan, deep), and suggest a regional style (e.g., Indian, Korean, American) that would suit them based on their features.",
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bodyType: { type: Type.STRING, enum: ["slim", "athletic", "average", "curvy", "plus-size"] },
          complexion: { type: Type.STRING, enum: ["fair", "medium", "olive", "tan", "deep"] },
          suggestedStyle: { type: Type.STRING },
        },
        required: ["bodyType", "complexion", "suggestedStyle"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function generateOutfitImage(imagePrompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-end fashion editorial photography of: ${imagePrompt}. Professional lighting, minimalist background, 8k resolution, vogue style.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed", error);
    return null;
  }
}
