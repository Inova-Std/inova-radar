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
  if (!apiKey) {
    console.warn("API Key do Gemini não configurada!");
    return [];
  }
  if (keywords.length === 0) return [];

  const prompt = `
    Você é um Product Manager Sênior da 'Inova Studio'. Sua especialidade é transformar temas quentes (política, gastos públicos, polêmicas e dados vazados) em Micro-SaaS virais e visuais.
    
    LISTA DE TEMAS ATUAIS:
    ${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}
    
    Sua tarefa é criar um conceito de aplicação web (Micro-SaaS) altamente focado para CADA um desses temas.
    
    ESTILO DE PRODUTOS DA 'INOVA STUDIO' (SEU DNA):
    - Pilar 1 (O Bote Salva-Vidas): Foco em caos e urgência. Ferramentas para sobreviver a greves, apagões e crises (ex: radares e alertas).
    - Pilar 2 (A Lupa no Bolso): Foco em indignação e transparência. Ferramentas que expõem gastos do governo e impostos de forma chocante (ex: contadores reais).
    - Pilar 3 (O Dossiê Interativo): Foco em curiosidade e voyeurismo. Interfaces para checar vazamentos ou escândalos (ex: dados densos virando experiência jogável).
    - Design e Escopo: Micro-SaaS de página única, sem a fricção de criar conta inicial. Interface imersiva, sombria ou neon.
    
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

  // DEBUG MODE MANTIDO: Imprime o prompt no console
  console.log("================ MODO DEBUG: REQUEST PARA O GEMINI ================");
  console.log(prompt);
  console.log("===================================================================");
  
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
