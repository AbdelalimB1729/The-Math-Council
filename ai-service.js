const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      console.warn('Warning: OPENROUTER_API_KEY not set. AI responses will be simulated.');
    }
  }

  async generateResponse(personality, problem, debateHistory, difficulty) {
    if (!this.apiKey) {
      return this.generateSimulatedResponse(personality, problem, debateHistory);
    }

    try {
      const messages = this.buildMessages(personality, problem, debateHistory, difficulty);
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'gpt-3.5-turbo', // Using free model as specified
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://the-math-council.com',
          'X-Title': 'The Math Council'
        }
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error calling OpenRouter API:', error.message);
      return this.generateSimulatedResponse(personality, problem, debateHistory);
    }
  }

  buildMessages(personality, problem, debateHistory, difficulty) {
    const systemPrompt = this.generateSystemPrompt(personality, difficulty);
    const userPrompt = this.generateUserPrompt(problem, debateHistory);
    
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  generateSystemPrompt(personality, difficulty) {
    return `You are ${personality.name}, a mathematician participating in a debate about a mathematical problem.

${personality.description}

Your personality: ${personality.personality}
Your specialty: ${personality.specialty}

Problem difficulty: ${difficulty}

Instructions:
- Respond as your character would naturally speak
- Keep responses concise (2-3 sentences)
- Stay in character and use your specialty when relevant
- Be engaging and contribute meaningfully to the debate
- If you disagree with others, explain why respectfully
- Use mathematical reasoning appropriate for ${difficulty} level problems`;
  }

  generateUserPrompt(problem, debateHistory) {
    let prompt = `Mathematical Problem: ${problem}\n\n`;
    
    if (debateHistory && debateHistory.length > 0) {
      prompt += 'Current debate:\n';
      debateHistory.forEach((message, index) => {
        prompt += `${message.name}: ${message.content}\n`;
      });
      prompt += '\n';
    }
    
    prompt += 'Please provide your response to this problem, considering the current debate context.';
    
    return prompt;
  }

  generateSimulatedResponse(personality, problem, debateHistory) {
    const responses = {
      'Professor Euclid': [
        "From a geometric perspective, I believe we should approach this systematically with rigorous proof.",
        "Let me construct a formal argument using classical mathematical principles.",
        "The geometric intuition here suggests we need to establish clear axioms first."
      ],
      'Dr. Chaos': [
        "Looking at this probabilistically, I see interesting patterns emerging.",
        "From a statistical viewpoint, we should consider the distribution of possible outcomes.",
        "The randomness in this problem reveals some fascinating underlying structures."
      ],
      'Ms. Approximation': [
        "For practical purposes, let's start with a reasonable estimation.",
        "I'd suggest we approximate this first, then refine our approach.",
        "In real-world terms, we can get a good approximation quickly."
      ],
      'The Trickster': [
        "Hmm, but what if we consider the opposite approach?",
        "I'm going to challenge the conventional wisdom here...",
        "Wait, I think everyone is missing something obvious!"
      ],
      'The Philosopher': [
        "This raises deeper questions about the nature of mathematical truth.",
        "Let's contemplate the fundamental assumptions underlying this problem.",
        "What does this tell us about the relationship between form and content?"
      ],
      'Dr. Algorithm': [
        "Let me break this down into clear computational steps.",
        "We can solve this efficiently using a systematic algorithm.",
        "The computational complexity here is quite interesting."
      ],
      'Professor Infinity': [
        "In the abstract realm, this problem takes on infinite dimensions.",
        "Let's consider the theoretical implications of this mathematical structure.",
        "The infinite possibilities here are quite fascinating."
      ]
    };

    const personalityResponses = responses[personality.name] || responses['Professor Euclid'];
    const randomIndex = Math.floor(Math.random() * personalityResponses.length);
    
    return personalityResponses[randomIndex];
  }
}

module.exports = new AIService();
