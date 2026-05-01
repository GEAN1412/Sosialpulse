import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ContentGenerationParams {
  platform: string;
  topic: string;
  tone: string;
  targetAudience: string;
  contentType: string; // e.g., "Post", "Thread", "Script", "Caption"
}

export interface ContentAnalysisParams {
  content: string;
  platform: string;
}

export const GeminiService = {
  async generateContent(params: ContentGenerationParams) {
    const prompt = `
      Sebagai seorang Spesialis Media Sosial kelas dunia, buatlah konten berperforma tinggi untuk ${params.platform}.
      
      TOPIK: ${params.topic}
      NADA: ${params.tone}
      TARGET AUDIENS: ${params.targetAudience}
      TIPE KONTEN: ${params.contentType}
      
      Harap berikan:
      1. Headline/Hook yang menarik.
      2. Isi konten utama.
      3. 5-10 hashtag relevan.
      4. Call to Action (CTA).
      5. Tips untuk visual/media yang menyertai postingan ini.
      
      Format output dalam Markdown dan gunakan Bahasa Indonesia.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  },

  async analyzeContent(params: ContentAnalysisParams) {
    const prompt = `
      Sebagai Analis Media Sosial kelas dunia, analisa konten berikut untuk ${params.platform}:
      
      KONTEN:
      "${params.content}"
      
      Harap berikan analisis mendalam dalam format JSON dengan struktur berikut (Gunakan Bahasa Indonesia untuk nilai string):
      {
        "engagementScore": number (0-100),
        "toneAnalysis": "string",
        "strengths": ["string"],
        "weaknesses": ["string"],
        "suggestions": ["string"],
        "seoKeywords": ["string"],
        "estimatedReach": "string (Rendah/Sedang/Tinggi)"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            engagementScore: { type: Type.NUMBER },
            toneAnalysis: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedReach: { type: Type.STRING },
          },
          required: ["engagementScore", "toneAnalysis", "strengths", "weaknesses", "suggestions", "seoKeywords", "estimatedReach"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async getTrendingTopics() {
    const prompt = `
      Identifikasi 5 topik atau tema tren saat ini dalam pemasaran media sosial untuk April 2026.
      Berikan dalam array JSON berisi objek: [{ "topic": "string", "description": "string", "impact": "Tinggi/Sedang/Rendah" }]
      Gunakan Bahasa Indonesia.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING },
            },
            required: ["topic", "description", "impact"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  },

  async auditProfile(input: { url?: string, imageBase64?: string, platform: string }) {
    const parts: any[] = [
      { text: `Sebagai Pakar Strategi Media Sosial, audit profil ${input.platform} berikut. 
      Input bisa berupa URL atau Screenshot.
      
      Tugas Anda:
      1. Analisa identitas brand dan visual.
      2. Tentukan "Role Model" atau pilar konten yang cocok.
      3. Berikan rekomendasi model konten (Reels, Carousel, Single Post).
      4. Berikan contoh caption dan hashtag teroptimasi algoritma.
      5. Berikan rekomendasi ide video (Reels/TikTok) yang relevan dan berpotensi viral.
      
      Gunakan Bahasa Indonesia yang profesional dan mudah dipahami.
      Format output dalam Markdown.` }
    ];

    if (input.imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: input.imageBase64
        }
      });
    }

    if (input.url) {
      parts.push({ text: `URL Profil: ${input.url}` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
    });

    return response.text;
  },

  async auditProfileStructured(input: { url?: string, imageBase64?: string, platform: string }) {
    const parts: any[] = [
      { text: `Sebagai Pakar Strategi Media Sosial, audit profil ${input.platform} berikut.
      Berikan analisis mendalam dalam format JSON dengan struktur berikut (Gunakan Bahasa Indonesia):
      {
        "brandIdentity": "string",
        "visualAnalysis": "string",
        "strengths": ["string"],
        "weaknesses": ["string"],
        "contentPillars": ["string"],
        "recommendedFormats": ["string"],
        "overallScore": number (0-100),
        "summary": "string"
      }` }
    ];

    if (input.imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: input.imageBase64
        }
      });
    }

    if (input.url) {
      parts.push({ text: `URL Profil: ${input.url}` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brandIdentity: { type: Type.STRING },
            visualAnalysis: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentPillars: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedFormats: { type: Type.ARRAY, items: { type: Type.STRING } },
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
          },
          required: ["brandIdentity", "visualAnalysis", "strengths", "weaknesses", "contentPillars", "recommendedFormats", "overallScore", "summary"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async generateContentPlanFromAudit(auditResult: string) {
    const prompt = `
      Berdasarkan hasil audit profil media sosial berikut:
      "${auditResult}"
      
      Buatlah Rencana Konten (Content Plan) untuk 1 minggu ke depan (7 hari) dalam format TABEL MARKDOWN.
      Tabel harus memiliki kolom: Hari (1-7), Tema/Topik Konten, Tipe Konten, Hook/Headline, Ringkasan Isi, Waktu Posting Terbaik, Referensi Konten Viral.
      Gunakan Bahasa Indonesia yang profesional.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return response.text;
  },

  async generateSpreadsheetPlan(auditResult: string, businessName: string) {
    const prompt = `
      Berdasarkan hasil audit profil media sosial untuk bisnis "${businessName}" berikut:
      "${auditResult}"
      
      Buatlah Rencana Konten (Content Plan) mendalam untuk 1 bulan ke depan.
      Identifikasi pilar konten yang tepat dan buat jadwal yang bervariasi.
      
      Output harus dalam format JSON ARRAY dengan struktur berikut:
      {
        "week": string (e.g., "Minggu 1"),
        "date": string (e.g., "05 April"),
        "type": "Feed" | "Reel" | "Story" | "Carousel",
        "detailType": "Informative" | "Promo" | "Q&A" | "Behind the Scenes" | "Testimonial",
        "briefPlan": string (Detail rencana konten),
        "referenceLink": string (Link referensi internal/eksternal),
        "caption": string (Draft caption),
        "postDate": string (e.g., "April 5, 2026"),
        "pic": string (Default: "Specialist"),
        "status": "Draft"
      }
      
      Gunakan Bahasa Indonesia. Pastikan briefPlan sangat detail seperti pada contoh (Slide 1: ..., Slide 2: ...).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.STRING },
              date: { type: Type.STRING },
              type: { type: Type.STRING },
              detailType: { type: Type.STRING },
              briefPlan: { type: Type.STRING },
              referenceLink: { type: Type.STRING },
              caption: { type: Type.STRING },
              postDate: { type: Type.STRING },
              pic: { type: Type.STRING },
              status: { type: Type.STRING }
            },
            required: ["week", "date", "type", "detailType", "briefPlan", "postDate"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  },

  async analyzeLink(link: string) {
    const prompt = `
      Analisa performa/potensi konten media sosial dari link berikut: ${link}
      
      Tugas:
      1. Berikan estimasi metrik (Engagement, Reach, Viralitas).
      2. Analisa Hook, Visual, dan Konten.
      3. Berikan saran perbaikan (Improvement).
      4. Tentukan apakah konten ini 'Trending' atau 'Stable'.
      
      Gunakan Bahasa Indonesia dan tunjukkan metrik dalam format yang menarik.
      Output dalam Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return response.text;
  },

  async chatWithSpecialist(params: { input: string, businessType: string, auditMarkdown: string, history: any[] }) {
    const historyParts = params.history.map(m => ({
      role: m.role || 'user',
      parts: [{ text: m.content }]
    }));

    const systemPrompt = `
      Anda adalah seorang Pakar Strategi Media Sosial (Social Media Specialist) kelas dunia.
      Konteks Bisnis User: ${params.businessType}
      Analisa Profil User: ${params.auditMarkdown}
      
      Tugas Anda adalah membantu user melakukan scale up akun media sosial mereka. 
      Berikan saran yang praktis, trendi, dan berorientasi pada data.
      Gunakan Bahasa Indonesia yang santai namun profesional.
    `;

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...historyParts,
      { role: "user", parts: [{ text: params.input }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
    });

    return response.text;
  }
};
