import type { AuroraResponse, Mood } from "./types";
import { getPersonalityPrompt } from "./personality";
import type { PersonalityMode } from "./personality";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? "";

// ── Nutrition analysis ────────────────────────────────────────────────────────
export type NutritionAnalysis = {
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  insight: string;   // 1-2 sentence summary
  suggestions: string[];  // 2-3 actionable food suggestions
};

export async function analyzeNutrition(
  meals: { mealType: string; description: string }[]
): Promise<NutritionAnalysis> {
  const mealList = meals
    .map((m) => `${m.mealType}: ${m.description || "(logged, no description)"}`)
    .join("\n");

  const system = `You are a nutritionist. Estimate macros and give honest, brief feedback.

Respond ONLY as valid JSON:
{
  "calories": 1750,
  "protein": 85,
  "carbs": 200,
  "fat": 55,
  "rating": "Good",
  "insight": "Decent protein but carbs are high and veg is missing.",
  "suggestions": ["Add a handful of spinach to your next meal", "Swap white rice for quinoa for more protein", "Have a Greek yogurt as your next snack"]
}

Rating scale: "Excellent" = balanced, sufficient, varied · "Good" = mostly on track, minor gaps · "Fair" = imbalanced or low variety · "Poor" = very low intake or very unbalanced.
Estimate based on typical restaurant/home portions. Be realistic.
suggestions must be concrete, specific, and actionable — not generic.`;

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Today's meals:\n${mealList}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);

  const data = await res.json();
  try {
    return JSON.parse(data.choices[0].message.content) as NutritionAnalysis;
  } catch {
    return {
      calories: 0, protein: 0, carbs: 0, fat: 0,
      rating: "Fair",
      insight: "Add descriptions to your meals for a more accurate analysis.",
      suggestions: ["Log meal descriptions to get specific suggestions"],
    };
  }
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", { uri: audioUri, type: "audio/m4a", name: "recording.m4a" } as any);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "en");
    formData.append("response_format", "json");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${GROQ_BASE}/audio/transcriptions`);
    xhr.setRequestHeader("Authorization", `Bearer ${GROQ_KEY}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve((data.text ?? "").trim());
        } catch {
          reject(new Error("Failed to parse transcription response"));
        }
      } else {
        reject(new Error(`Whisper ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during transcription"));
    xhr.send(formData);
  });
}

export type ChatContext = {
  name: string;
  personality: PersonalityMode;
  waterMl: number;
  waterGoalMl: number;
  sleepHours: number | null;
  habitsCompleted: number;
  habitsTotal: number;
  habits: { name: string; completedToday: boolean }[];
  mealsLogged: number;
  mood: Mood | null;
};

export async function chatWithAurora(
  transcript: string,
  ctx: ChatContext,
  history: { role: "user" | "aurora"; text: string }[] = []
): Promise<AuroraResponse> {
  const pct = Math.round((ctx.waterMl / ctx.waterGoalMl) * 100);
  const pending = ctx.habits
    .filter((h) => !h.completedToday)
    .map((h) => h.name)
    .join(", ");

  const system = `${getPersonalityPrompt(ctx.personality)}

You are Aurora — a personal AI companion who can talk about ANYTHING, not just health.
Chat casually, give advice, discuss ideas, talk about life, answer questions, be a friend.
When health topics come up, use the snapshot below to give specific, personal insight.
You can also log health data if the user mentions it naturally in conversation.

Health snapshot for ${ctx.name}:
- Water: ${ctx.waterMl}ml / ${ctx.waterGoalMl}ml (${pct}%)
- Sleep last night: ${ctx.sleepHours !== null ? ctx.sleepHours + "h" : "not logged"}
- Habits: ${ctx.habitsCompleted}/${ctx.habitsTotal} done${pending ? ` (pending: ${pending})` : ""}
- Meals logged: ${ctx.mealsLogged}
- Mood: ${ctx.mood ?? "not set"}

Respond ONLY as valid JSON:
{
  "message": "your reply — conversational, 1-3 sentences. Short and natural for voice.",
  "action": {
    "type": "add_water | log_sleep | create_habit | log_meal | set_mood | none",
    "ml": 500,
    "hours": 7.5,
    "name": "Meditate",
    "icon": "🧘",
    "mealType": "breakfast",
    "description": "oats",
    "mood": "slaying"
  }
}

Include only fields relevant to the action type. For no action use type "none".
Natural language parsing: "a glass" = 250ml, "a bottle" = 500ml, "a liter" = 1000ml.
Mood values: dead_inside, sleepy, fine, slaying, unstoppable.
Only trigger an action if the user clearly intends to log something. Casual mentions don't count.`;

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        ...history.slice(-12).map((m) => ({
          role: m.role === "aurora" ? "assistant" : "user" as const,
          content: m.text,
        })),
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(content) as AuroraResponse;
  } catch {
    return { message: content, action: { type: "none" } };
  }
}
