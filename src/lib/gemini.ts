import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface GeminiInsight {
  pitch: string;
  viability: number;
  category: "Transparência" | "Exploração" | "Políticometro" | "Utilidade" | "Viral";
}

export async function generateGeminiInsight(keyword: string): Promise<GeminiInsight> {
  const prompt = `
    Você é um Product Manager Sênior da 'Inova Studio'. Sua especialidade é transformar temas quentes (política, gastos públicos, polêmicas e dados vazados) em Micro-SaaS virais e visuais.
    
    TEMA ATUAL: "${keyword}"
    
    Sua tarefa é criar um conceito de aplicação web (Micro-SaaS) leve e focado em transparência ou utilidade pública, seguindo o estilo do 'Janjômetro' (monitoramento de gastos) ou 'Epstein Phone Explorer' (interface imersiva de dados).
    
    REGRAS:
    1. O pitch deve ser curto (máximo 120 caracteres) e impactante.
    2. A viabilidade deve ser de 0 a 10 (baseada na facilidade de obter dados).
    3. Categorias permitidas: Transparência, Exploração, Políticometro, Utilidade, Viral.
    
    RETORNE APENAS UM JSON NO FORMATO:
    {
      "pitch": "Conceito do app aqui",
      "viability": 9.5,
      "category": "Transparência"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Extrai o JSON da resposta (Gemini às vezes coloca blocos de código)
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Falha ao parsear JSON do Gemini");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      pitch: `Monitor de dados sobre '${keyword}' com interface simplificada para transparência.`,
      viability: 7.0,
      category: "Utilidade"
    };
  }
}
