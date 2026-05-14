import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

export async function enhanceLocationDescription(description: string, address: string) {
  if (!API_KEY) return description;
  
  const prompt = `Sei un assistente anagrafico per il New World State. 
  L'utente ha fornito questa descrizione per la sua posizione: "${description}" 
  L'indirizzo rilevato è: "${address}".
  
  Migliora la descrizione per renderla più formale, precisa e utile ai fini di un registro anagrafico mondiale. 
  Mantieni i punti di riferimento forniti dall'utente ma usa un tono istituzionale e chiaro.
  Rispondi solo con il testo migliorato, in italiano, tutto in MAIUSCOLO.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || description;
  } catch (error) {
    console.error("Gemini Error:", error);
    return description;
  }
}

export async function getFormAssistantTips(currentStep: number, formData: any) {
  if (!API_KEY) return null;

  const stepContext = [
    "Identità Individuale: assicurati che il nome corrisponda esattamente al documento.",
    "Cittadinanza: indica lo stato sovrano attuale, non il New World State.",
    "Residenza: il Plus Code è fondamentale per aree non mappate.",
    "Contatti: username e password sono necessari solo se non fornisci email o telefono.",
    "Documenti: carica immagini leggibili. Il retro è obbligatorio per le carte d'identità."
  ];

  const prompt = `Sei l'assistente AI del New World State. L'utente è al passo ${currentStep} della registrazione.
  Contesto attuale: ${stepContext[currentStep - 1]}
  Dati inseriti finora: ${JSON.stringify(formData)}
  
  Fornisci un solo consiglio breve, utile e rassicurante in italiano (massimo 15 parole) per aiutare l'utente a completare questo passo correttamente.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || null;
  } catch (error) {
    return null;
  }
}
