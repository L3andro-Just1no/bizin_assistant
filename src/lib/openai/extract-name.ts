import { getOpenAI } from './config'

/**
 * Uses GPT to intelligently extract a person's name from conversation messages
 * @param messages - Array of user messages (content strings)
 * @returns The extracted name or null if no name found
 */
export async function extractUserName(messages: string[]): Promise<string | null> {
  if (!messages || messages.length === 0) {
    return null
  }

  try {
    const openai = getOpenAI()
    
    // Combine first few messages for context
    const conversationText = messages.slice(0, 3).join('\n---\n')
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: `You are a name extraction assistant. Your task is to identify and extract the user's first name (and last name if provided) from conversation messages.

Rules:
- Extract ONLY the person's actual name (first name and optionally last name)
- Return just the name, nothing else
- If the person introduces themselves like "me chamo João", "my name is John", "soy Carlos", extract just "João", "John", "Carlos"
- Capitalize the first letter of each name part
- If no clear name is found, return "null"
- Maximum 2 words (first name + last name)
- Do not include greetings, extra words, or context
- Common patterns: "me chamo X", "my name is X", "I am X", "sou X", "je m'appelle X", "me llamo X"

Examples:
Input: "Olá, me chamo João Silva"
Output: João Silva

Input: "Hi! My name is Sarah and I need help"
Output: Sarah

Input: "Carlos"
Output: Carlos

Input: "I need information about funding"
Output: null`
        },
        {
          role: 'user',
          content: `Extract the person's name from these messages:\n\n${conversationText}`
        }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 20
    })

    const extractedName = response.choices[0]?.message?.content?.trim()
    
    // Validate the result
    if (!extractedName || 
        extractedName.toLowerCase() === 'null' || 
        extractedName.length < 2 || 
        extractedName.length > 30 ||
        extractedName.split(/\s+/).length > 2) {
      return null
    }

    // Additional validation: should only contain letters, spaces, and common name characters
    if (!/^[a-zà-ÿ\s'-]+$/i.test(extractedName)) {
      return null
    }

    return extractedName
  } catch (error) {
    console.error('Error extracting name with GPT:', error)
    return null
  }
}
