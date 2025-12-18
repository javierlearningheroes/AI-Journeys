
import { GoogleGenAI, Type, Part } from "@google/genai";
// @ts-ignore
import * as mammoth from "mammoth";
// @ts-ignore
import * as XLSX from "xlsx";
import {
  RoomType,
  DesignResult,
  FurnitureItem,
  ItemCategory,
  IkigaiAnalysis,
  DietType,
  GroceryListResponse,
  RecipeResponse,
  OptimizationResult,
  UploadedFile,
  BusinessAnalysisResult,
  StrategicPlan
} from "../types";

const getAI = () => {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  if (!key) {
    console.warn("GEMINI_API_KEY is not set. AI features will not work.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Initial instance - safely created
let ai: any;
try {
  ai = getAI();
} catch (e) {
  console.error("Failed to initialize GoogleGenAI:", e);
  // Create a dummy object to avoid top-level crashes
  ai = { models: { generateContent: async () => ({ text: "{}" }) } };
}

// --- UTILS ---

/**
 * Robust file processor that converts various formats to Gemini-compatible Parts.
 * - PDF/Images: Sent as inlineData (base64).
 * - Excel/Word/Text: Parsed into text to avoid binary confusion.
 */
const fileToPart = async (file: File): Promise<Part> => {
  const mimeType = file.type;

  // 1. PDF & Images - Supported natively as inlineData
  if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 2. Excel - Parse to CSV/Text
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')
  ) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          let text = `DOCUMENT: ${file.name}\nTYPE: Excel Spreadsheet\nCONTENT:\n`;

          workbook.SheetNames.forEach((sheetName: string) => {
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            if (csv.trim()) {
              text += `\n--- Sheet: ${sheetName} ---\n${csv}\n`;
            }
          });
          resolve({ text: text });
        } catch (err) {
          console.error("Excel parse error:", err);
          // Fallback to text if parsing fails
          resolve({ text: `Error parsing Excel file ${file.name}. Please upload as PDF.` });
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // 3. Word - Parse to Text
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = `DOCUMENT: ${file.name}\nTYPE: Word Document\nCONTENT:\n${result.value}`;
          resolve({ text: text });
        } catch (err) {
          console.error("Word parse error:", err);
          resolve({ text: `Error parsing Word file ${file.name}. Please upload as PDF.` });
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // 4. Text/JSON/Markdown - Read as Text
  if (mimeType.startsWith('text/') || mimeType === 'application/json' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve({ text: `DOCUMENT: ${file.name}\nCONTENT:\n${content}` });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // Fallback for unknown types
  return new Promise((resolve, reject) => {
    console.warn(`Unsupported file type: ${mimeType}. Trying to read as text.`);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve({ text: `DOCUMENT: ${file.name}\nCONTENT (Raw):\n${content}` });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// --- SERVICES ---

export const analyzeIkigai = async (responses: Record<string, string>): Promise<IkigaiAnalysis> => {
  const prompt = `Actúa como un experto coach de carrera y psicólogo especializado en el concepto Ikigai. 
  Analiza las siguientes respuestas del usuario que incluyen un perfil básico y las 13 áreas del diagrama de Ikigai.
  
  Respuestas del usuario:
  ${JSON.stringify(responses, null, 2)}
  
  Tu objetivo es proporcionar un análisis profundo y, sobre todo, RECOMENDAR uno de estos tres caminos profesionales:
  - 'empleado': Para perfiles que buscan estabilidad, crecimiento dentro de estructuras existentes o especialización técnica.
  - 'empresario': Para perfiles con visión de escala, gestión de equipos y optimización de negocios ya en marcha.
  - 'emprendedor': Para perfiles que necesitan crear desde cero, innovar y asumir riesgos altos para validar ideas nuevas.

  Debes devolver un JSON con la siguiente estructura exacta:
  {
    "resumen": "Análisis ejecutivo del perfil.",
    "proposito": "Una frase poderosa (máximo 15 palabras) que sintetice su Ikigai.",
    "diagnostico": "Análisis de fortalezas y debilidades en el equilibrio vital.",
    "recomendaciones": ["Pasos concretos para equilibrar su vida."],
    "caminoRecomendado": "empleado" | "empresario" | "emprendedor",
    "explicacionCamino": "Por qué este camino es el mejor según sus respuestas básicas y su Ikigai."
  }
  
  IMPORTANTE: Responde SOLO con el JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
};

const generateIsolatedImage = async (aiInstance: any, itemName: string): Promise<string> => {
  const prompt = `Isolated professional studio photography of a single ${itemName} on a pure solid white background. Product catalog style, high resolution, soft shadows. No other objects. High-end retail photography.`;
  const response = await aiInstance.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return '';
};

export const generateRedesign = async (
  image: string,
  roomType: RoomType,
  styleDescription: string,
  referenceImages: string[] = []
): Promise<DesignResult> => {
  const base64Data = image.split(',')[1] || image;
  const mimeType = image.split(';')[0].split(':')[1] || 'image/png';

  const redesignParts: any[] = [
    { inlineData: { data: base64Data, mimeType: mimeType } },
    ...referenceImages.map(img => ({
      inlineData: { data: img.split(',')[1], mimeType: 'image/png' }
    })),
    { text: `Act as an expert interior designer. Redecorate this ${roomType}. Style guidelines: ${styleDescription}. Use the provided reference images as inspiration for specific items, colors or aesthetics. Structural elements stay, furniture and decor are replaced. Result should be a high-end architecture magazine photo. NO ISOMETRIC VIEWS, keep realistic perspective. Ensure the output is a single high-quality image.` }
  ];

  const imageResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: redesignParts },
    config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
  });

  let redesignedImageUrl = '';
  for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) redesignedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
  }
  if (!redesignedImageUrl) throw new Error("No se pudo generar la imagen del rediseño.");

  const analysisPrompt = `Analyze the newly designed ${roomType} in this image. 
  1. Professional detailed interior analysis in ESPAÑOL (Markdown). Use # for main title and ## for sections. Include sections for: Estilo General, Paleta de Colores y Materiales, Distribución y Funcionalidad, and Elementos Clave por Categoría.
  2. Identify all key elements in categories: 'Mobiliario', 'Decoración', 'Iluminación', 'Vegetación'.
  3. For each item, use Google Search to find REAL products that match the design.
  
  CRITICAL PRICING RULES:
  - If a specific model exists, use that price.
  - If multiple similar products exist, YOU MUST PROVIDE A PRICE RANGE (e.g., "150€ - 300€").
  - Do NOT invent prices. If uncertain, provide a realistic estimated range based on market standards for the style.
  - Do not leave the price empty.
  
  IMPORTANT: You MUST end your response with the marker "FURNITURE_DATA:" followed by a VALID JSON ARRAY. 
  Each object MUST have: "name", "description" (mention if it's a specific model or a style recommendation), "shopName", "price" (string with currency, e.g. "199€" or "150€ - 250€"), "dimensions", "category" (one of: 'Mobiliario', 'Decoración', 'Iluminación', 'Vegetación'), and "links" (array of {title, uri}).
  
  FURNITURE_DATA:
  [{"name": "...", "description": "...", "shopName": "...", "price": "100€ - 200€", "dimensions": "...", "category": "Mobiliario", "links": [{"title": "...", "uri": "..."}]}]`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: redesignedImageUrl.split(',')[1], mimeType: 'image/png' } },
        { text: analysisPrompt }
      ]
    },
    config: { tools: [{ googleSearch: {} }] }
  });

  const fullText = searchResponse.text || "Diseño completado.";
  let furniture: FurnitureItem[] = [];

  const parts = fullText.split("FURNITURE_DATA:");
  const cleanedDescription = parts[0].trim();

  if (parts.length > 1) {
    try {
      const jsonStr = parts[1].trim();
      const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        furniture = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Error parsing FURNITURE_DATA JSON:", e);
    }
  }

  if (furniture.length === 0) {
    furniture = [{ name: "Elemento de diseño", description: "Consulte el análisis para más detalles.", category: 'Mobiliario', links: [] }];
  }

  const furnitureWithImages = await Promise.all(
    furniture.map(async (item) => ({
      ...item,
      isolatedImageUrl: await generateIsolatedImage(ai, item.name)
    }))
  );

  // Advanced Budget Calculation to handle ranges
  let minTotal = 0;
  let maxTotal = 0;

  furniture.forEach(f => {
    if (f.price) {
      // Find all sequences of digits, potentially with decimals
      const matches = f.price.match(/(\d+[.,]?\d*)/g);
      if (matches && matches.length > 0) {
        // Convert to numbers, replacing comma with dot if European format
        const numbers = matches.map(n => parseFloat(n.replace(',', '.')));

        if (numbers.length === 1) {
          // Single price
          minTotal += numbers[0];
          maxTotal += numbers[0];
        } else {
          // Range detected (take the lowest and highest found in the string)
          minTotal += Math.min(...numbers);
          maxTotal += Math.max(...numbers);
        }
      }
    }
  });

  // Format the total string
  const totalBudgetStr = minTotal === maxTotal
    ? `${Math.round(minTotal)}€`
    : `${Math.round(minTotal)}€ - ${Math.round(maxTotal)}€`;

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    imageUrl: redesignedImageUrl,
    description: cleanedDescription,
    furniture: furnitureWithImages,
    totalEstimatedBudget: totalBudgetStr === "0€" ? "Por determinar" : totalBudgetStr
  };
};

export const generateGroceryList = async (diet: DietType, preferences: string): Promise<GroceryListResponse> => {
  const prompt = `Actúa como un nutricionista experto. Crea una lista de la compra optimizada para una dieta de tipo "${diet}" basada en las siguientes preferencias o necesidades del usuario: "${preferences}".
  La lista debe estar organizada por categorías lógicas de supermercado (ej: FRUTAS, VERDURAS, PROTEÍNAS, etc.).
  
  Devuelve la lista organizada por categorías con el nombre del producto y la cantidad recomendada.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      quantity: { type: Type.STRING },
                    },
                    required: ["name", "quantity"],
                  },
                },
              },
              required: ["name", "items"],
            },
          },
        },
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const suggestRecipes = async (ingredients: string, image?: string): Promise<RecipeResponse> => {
  const parts: Part[] = [
    {
      text: `Actúa como un chef profesional creativo experto en cocina de aprovechamiento. 
    ${ingredients ? `El usuario dice tener estos ingredientes: "${ingredients}".` : ""}
    ${image ? "Analiza la imagen de la nevera/despensa adjunta para identificar TODOS los ingredientes visibles." : ""}
    
    Tu tarea:
    1. Si se proporciona una imagen, es CRUCIAL que identifiques todos los productos alimenticios visibles y los listes en 'identifiedIngredients'.
    2. Sugiéreme 3 recetas deliciosas que pueda preparar principalmente con lo que tengo (o lo que ves).
  
    Devuelve un JSON válido siguiendo estrictamente el esquema.` }
  ];

  if (image) {
    const base64Data = image.split(',')[1] || image;
    parts.unshift({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identifiedIngredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de ingredientes detectados visualmente en la imagen proporcionada (si existe)."
          },
          recipes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                time: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                ingredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "description", "time", "difficulty", "ingredients", "instructions"]
            }
          }
        },
        required: ["recipes"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateRecipeImage = async (recipeTitle: string): Promise<string | null> => {
  const prompt = `Professional gourmet food photography of a dish called "${recipeTitle}". The image must show this specific recipe plated beautifully in a high-end restaurant style. Soft natural lighting, shallow depth of field, high resolution, 4k.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {
    console.error("Error generating recipe image:", e);
  }
  return null;
};

// --- CARRERA IA (OPTIMIZACIÓN CV) ---

export const optimizeCV = async (jobDescription: string, cvFile: File): Promise<OptimizationResult> => {
  let extractedText = "";

  // Optimize logic: Try to parse docx immediately to text to save context window
  if (cvFile.name.endsWith(".docx")) {
    try {
      const arrayBuffer = await cvFile.arrayBuffer();
      // @ts-ignore
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
    } catch (e) {
      console.warn("Error leyendo DOCX con mammoth:", e);
    }
  }

  const parts: Part[] = [];

  if (extractedText) {
    parts.push({ text: `CONTENIDO CV CANDIDATO:\n${extractedText}` });
  } else {
    try {
      // Use robust fileToPart which handles PDFs and images correctly
      const part = await fileToPart(cvFile);
      parts.push(part);
    } catch (e) {
      console.error("Error leyendo archivo:", e);
      throw new Error("No se pudo leer el archivo adjunto.");
    }
  }

  const prompt = `
    Actúa como un experto reclutador de alto nivel y coach de carrera.
    Analiza el CV del candidato (adjunto o en texto) comparándolo con la siguiente Descripción de Vacante (JD).

    DESCRIPCIÓN VACANTE:
    "${jobDescription}"

    TU TAREA ES GENERAR UN JSON CON UN ANÁLISIS PROFUNDO:
    1. matchPercentage: 0 a 100.
    2. matchAnalysis: Explicación DETALLADA y PROFUNDA del ajuste. No seas superficial.
    3. interviewQuestions: 5 preguntas difíciles (técnicas o situacionales) y sus respuestas modelo (STAR).
    4. structuredPlan: Un plan de preparación detallado dividido en días y categorías.
    5. markdown: Una versión REESCRITA y OPTIMIZADA del CV en formato Markdown, resaltando experiencia relevante para la JD de forma estratégica.
  `;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchPercentage: { type: Type.NUMBER },
          matchAnalysis: { type: Type.STRING },
          interviewQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                starAnswer: { type: Type.STRING },
              },
              required: ["question", "starAnswer"]
            }
          },
          structuredPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                category: { type: Type.STRING, enum: ["investigacion", "tecnico", "practica", "logistica"] },
                task: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["day", "category", "task", "description"]
            }
          },
          markdown: { type: Type.STRING }
        },
        required: ["matchPercentage", "matchAnalysis", "interviewQuestions", "structuredPlan", "markdown"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

// --- NEGOCIO IA (EMPRESARIO) ---

export const analyzeBusiness = async (files: UploadedFile[], urls: string[], context: string): Promise<BusinessAnalysisResult> => {
  const parts: Part[] = [];

  parts.push({
    text: `Actúa como un consultor estratégico de negocios experto (nivel MBB - McKinsey/Bain/BCG).
  Analiza la siguiente información del negocio (contexto, documentos y urls) para generar un plan de crecimiento PROFUNDO y EXTENSO.
  
  CONTEXTO DEL NEGOCIO: "${context}"
  URLS RELEVANTES: ${urls.join(", ")}
  
  OBJETIVOS DEL ANÁLISIS:
  1. Identificar palancas de crecimiento detalladas.
  2. Analizar competidores y clientes potenciales (ICP) con profundidad.
  3. Crear un plan de implementación detallado (Gantt) y un plan de 90 días con acciones tácticas específicas.
  4. Redactar una conclusión estratégica EXTENSA y bien fundamentada.
  
  Devuelve un JSON válido cumpliendo estrictamente el esquema.` });

  files.forEach(f => {
    parts.push({
      inlineData: {
        data: f.content, // content is base64 from UploadedFile
        mimeType: f.type
      }
    });
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conclusion: { type: Type.STRING },
          levers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                area: { type: Type.STRING, enum: ['Ingresos', 'Costos', 'Productividad', 'Retención', 'Pricing', 'Otro'] },
                impact: { type: Type.STRING, enum: ['Alto', 'Medio', 'Bajo'] },
                complexity: { type: Type.STRING, enum: ['Alta', 'Media', 'Baja'] },
                priority: { type: Type.NUMBER },
                rationale: { type: Type.STRING }
              },
              required: ["name", "description", "area", "impact", "complexity", "priority", "rationale"]
            }
          },
          implementationPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                activity: { type: Type.STRING },
                owner: { type: Type.STRING },
                details: { type: Type.STRING },
                relatedLever: { type: Type.STRING },
                startWeek: { type: Type.INTEGER },
                durationWeeks: { type: Type.INTEGER }
              },
              required: ["activity", "owner", "details", "relatedLever", "startWeek", "durationWeeks"]
            }
          },
          competitors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                differentiation: { type: Type.STRING }
              },
              required: ["name", "description", "differentiation"]
            }
          },
          potentialClients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                profile: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["profile", "rationale"]
            }
          },
          ninetyDayPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                focus: { type: Type.STRING },
                actions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayRange: { type: Type.STRING },
                      task: { type: Type.STRING },
                      outcome: { type: Type.STRING }
                    },
                    required: ["dayRange", "task", "outcome"]
                  }
                }
              },
              required: ["month", "focus", "actions"]
            }
          }
        },
        required: ["conclusion", "levers", "implementationPlan", "competitors", "potentialClients", "ninetyDayPlan"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

// --- EMPRENDEDOR IA ---

export const generateBusinessPlan = async (context: string, urls: string, files: File[]): Promise<StrategicPlan> => {
  const parts: Part[] = [];

  // 1. Process files ROBUSTLY to text/parts
  try {
    const fileParts = await Promise.all(files.map(f => fileToPart(f)));
    parts.push(...fileParts);
  } catch (error: any) {
    console.error("Error processing files:", error);
    // Proceed without failed files rather than blocking everything
  }

  // 2. Define JSON Structure for Prompt-based enforcement (Faster/Simpler for Flash)
  const jsonStructure = JSON.stringify({
    criticalActions: [{ priority: 1, title: "Action Title", description: "Short description", context: "Why", suggestion: "Next step" }],
    swot: {
      strengths: [{ title: "", description: "Short desc", strategy: "Actionable strategy" }],
      weaknesses: [{ title: "", description: "Short desc", strategy: "Actionable strategy" }],
      opportunities: [{ title: "", description: "Short desc", strategy: "Actionable strategy" }],
      threats: [{ title: "", description: "Short desc", strategy: "Actionable strategy" }]
    },
    came: {
      correct: [{ title: "", description: "", strategy: "" }],
      adapt: [{ title: "", description: "", strategy: "" }],
      maintain: [{ title: "", description: "", strategy: "" }],
      explore: [{ title: "", description: "", strategy: "" }]
    },
    bmc: {
      keyPartners: [{ title: "", description: "", strategy: "" }],
      keyActivities: [{ title: "", description: "", strategy: "" }],
      valuePropositions: [{ title: "", description: "", strategy: "" }],
      customerRelationships: [{ title: "", description: "", strategy: "" }],
      customerSegments: [{ title: "", description: "", strategy: "" }],
      keyResources: [{ title: "", description: "", strategy: "" }],
      channels: [{ title: "", description: "", strategy: "" }],
      costStructure: [{ title: "", description: "", strategy: "" }],
      revenueStreams: [{ title: "", description: "", strategy: "" }]
    },
    icp: {
      description: "Ideal customer summary",
      demographics: "Age, role, etc.",
      painPoints: [{ title: "", description: "", strategy: "" }],
      objectives: [{ title: "", description: "", strategy: "" }]
    },
    financials: {
      initialInvestment: [{ concept: "Item", amount: "1000€", type: "investment" }],
      monthlyCosts: [{ concept: "Item", amount: "200€", type: "fixed" }],
      revenueProjections: "Summary of revenue...",
      breakEvenPoint: "Estimated month..."
    },
    networking: [{ role: "CEO", organizationType: "Tech", reason: "Partnership", strategy: "LinkedIn outreach..." }]
  }, null, 2);

  const prompt = `
    Eres un experto Consultor Estratégico de Negocios. Analiza el contexto, URLs y documentos para generar un plan maestro.
    
    CONTEXTO: "${context}"
    URLS: "${urls}"

    TU OBJETIVO: Generar un plan estratégico integral en formato JSON.
    
    INSTRUCCIONES CLAVE:
    1. **AGILIDAD Y CONCISIÓN**: Usa descripciones breves y directas. No generes bloques de texto masivos.
    2. **INVESTIGACIÓN**: Usa Google Search para validar datos sobre las URLs o el sector.
    3. **ESTRUCTURA EXACTA**: Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido siguiendo estrictamente la estructura de abajo.
    4. **NO DEJES CAMPOS VACÍOS**: Infiere datos lógicos si faltan.
    5. **Financials**: Estima costos reales en EUROS para una micro-empresa/startup inicial.
    6. **Strategy**: El campo 'strategy' es obligatorio en todos los objetos de listas (SWOT, BMC, etc.).

    ESTRUCTURA JSON REQUERIDA:
    ${jsonStructure}
  `;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using 2.5 Flash for speed and stability with tools + large context
      contents: [{ parts }],
      config: {
        tools: [{ googleSearch: {} }], // Enable search for real-time info
        // Note: We DO NOT use responseSchema here to allow the model to use tools freely and then output JSON as text.
      }
    });

    if (response.text) {
      let jsonStr = response.text.trim();
      // Clean up markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '');
      }
      return JSON.parse(jsonStr) as StrategicPlan;
    }
    throw new Error("No response generated");

  } catch (error: any) {
    console.error("Error generating plan:", error);
    throw error;
  }
};
