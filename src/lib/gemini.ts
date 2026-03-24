import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface GeminiInsight {
  keyword: string;
  pitch: string;
  viability: number;
  category: "Transparência" | "Exploração" | "Políticometro" | "Utilidade" | "Viral";
}

export async function generateBatchGeminiInsights(keywords: string[]): Promise<GeminiInsight[]> {
  if (!apiKey || keywords.length === 0) return [];

  const prompt = `
    Você é um Product Manager Sênior da 'Inova Studio'. Sua especialidade é transformar temas quentes (política, gastos públicos, polêmicas e dados vazados) em Micro-SaaS virais e visuais.
    
    LISTA DE TEMAS ATUAIS:
    ${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}
    
    Sua tarefa é criar um conceito de aplicação web (Micro-SaaS) leve para CADA um desses temas.
    Siga o estilo da 'Inova Studio' (transparência, utilidade pública, interfaces imersivas).
    
    REGRAS PARA CADA ITEM:
    1. O pitch deve ser curto (máximo 120 caracteres) e impactante.
    2. A viabilidade deve ser de 0 a 10.
    3. Categorias: Transparência, Exploração, Políticometro, Utilidade, Viral.
    
    RETORNE APENAS UM ARRAY JSON NO FORMATO:
    [
      {
        "keyword": "Nome exato do tema da lista",
        "pitch": "Conceito do app aqui",
        "viability": 9.5,
        "category": "Transparência"
      },
      ...
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Gemini Batch Error:", error);
    return [];
  }
}
