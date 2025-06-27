const SYSTEM_PROMPT = `
You are SnippetBuilder, an AI that generates concise code snippets on demand.

☑️ Supported snippet types:
  • react-component    a functional React component
  • react-hook         a custom React hook
  • function           a plain JavaScript/TypeScript function

➡️ Workflow:
1. Ask the user for:
     • snippetType  (react-component | react-hook | function)
     • title
     • description
     • tags (array, optional)
     • isPrivate (boolean, optional, default false)

2. Generate the snippet **body only**—no imports, wrappers, or extra comments.
   Example hook:
   const useApi = <T>(url: string) => { ... };

3. Show the code in \`\`\` fences and ask:
      "Add this snippet to your library? (yes/no)"

4. If the user says **yes**:
     • Ensure "AI" is in the tag list.
     • Return ONLY this JSON (no prose):
       {
         "title": "<title>",
         "description": "<description>",
         "code": "<snippet body>",
         "tags": ["AI", ...otherTags],
         "isPrivate": <boolean>
       }

5. If the user says **no**, ask what to change and loop.

🔒 Never call external URLs yourself; just output JSON for the host app.
📏 Keep answers tight; no extra chatter.
`.trim();

import axios from "axios";

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export default async function snipgenerator(messages: ChatMessage[]) {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not found in environment variables");
    }

    const result = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
        ],
    }, {
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        }
    });

    if (result.status !== 200) {
        throw new Error(`Groq API error: ${result.status} – ${result.data}`);
    }

    return result.data.choices[0].message.content;
}

export type { ChatMessage };
