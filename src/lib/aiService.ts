import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export interface AIResponse {
  content: string;
  confidence: number;
  sources?: string[];
}

// Fallback responses for when OpenAI is not available
const fallbackResponses = {
  'business kenya': "Kenya offers excellent business opportunities! Key considerations include: 1) Business registration through eCitizen portal, 2) Understanding the Kenya Revenue Authority (KRA) tax requirements, 3) Leveraging M-Pesa for digital payments, 4) Considering the growing tech sector in Nairobi's Silicon Savannah. Would you like specific guidance on any of these areas?",
  'investment funding': "African investment landscape is evolving rapidly! Consider these opportunities: 1) Fintech solutions addressing financial inclusion, 2) Agtech innovations for food security, 3) Renewable energy projects, 4) E-commerce platforms. Key funding sources include development finance institutions, impact investors, and local venture capital. What sector interests you most?",
  'market africa': "The African market presents immense potential with 1.4 billion people and growing middle class. Key insights: 1) Mobile-first approach is crucial, 2) Local partnerships are essential, 3) Understanding cultural nuances varies by region, 4) Regulatory frameworks differ significantly between countries. Which specific market are you targeting?",
  'legal regulation': "Legal frameworks across Africa vary significantly. General considerations: 1) Business registration requirements differ by country, 2) Tax obligations and incentives vary, 3) Employment laws have local nuances, 4) Intellectual property protection varies. I recommend consulting local legal experts. Which country's regulations are you interested in?"
};

export class AIService {
  static async generateResponse(
    userMessage: string,
    context: string = "You are Forward Africa, an AI-powered business coach specializing in African markets. Provide helpful, accurate advice about business opportunities, market dynamics, and legal frameworks across Africa."
  ): Promise<AIResponse> {
    // Check if OpenAI API key is available
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, using fallback responses');
      return this.generateFallbackResponse(userMessage);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: context
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return {
        content: completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
        confidence: 0.9,
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      console.log('Falling back to hardcoded responses');
      return this.generateFallbackResponse(userMessage);
    }
  }

  private static generateFallbackResponse(userInput: string): AIResponse {
    const input = userInput.toLowerCase();

    // Check for specific keywords and return appropriate responses
    if (input.includes('business') && input.includes('kenya')) {
      return {
        content: fallbackResponses['business kenya'],
        confidence: 0.7,
      };
    }

    if (input.includes('investment') || input.includes('funding')) {
      return {
        content: fallbackResponses['investment funding'],
        confidence: 0.7,
      };
    }

    if (input.includes('market') && input.includes('africa')) {
      return {
        content: fallbackResponses['market africa'],
        confidence: 0.7,
      };
    }

    if (input.includes('legal') || input.includes('regulation')) {
      return {
        content: fallbackResponses['legal regulation'],
        confidence: 0.7,
      };
    }

    // Default response for other queries
    return {
      content: "That's an interesting question about African business! Based on my knowledge of African markets, I'd recommend considering local market dynamics, regulatory requirements, and cultural factors. Could you provide more specific details about your business context or the particular African market you're interested in? This will help me give you more targeted advice.",
      confidence: 0.5,
    };
  }
}