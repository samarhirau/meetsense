import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('Warning: GROQ_API_KEY is not defined in the environment variables.');
}

const groq = new Groq({ apiKey });

interface ExtractedTask {
  task: string;
  assignedTo: string;
  deadline: string;
}

export interface MeetingInsights {
  summary: string;
  decisions: string[];
  followUps: string[];
  tasks: ExtractedTask[];
}

/**
 * Extract structured summary, tasks, decisions, and follow-ups from raw transcript.
 * Uses JSON Mode with Llama-3.3-70b-versatile to ensure strict schema output.
 */
export const extractMeetingInsights = async (transcript: string): Promise<MeetingInsights> => {
  const cleanTranscript = transcript ? transcript.trim() : '';
  if (!cleanTranscript) {
    return {
      summary: 'No meeting content detected (empty transcript).',
      decisions: [],
      followUps: [],
      tasks: []
    };
  }

  try {
    const systemPrompt = `
You are an expert AI assistant specialized in parsing meeting transcripts.
Analyze the provided meeting transcript (which may contain a mix of English, Hindi, or Hinglish) and extract the following structured details.

You must return a valid, parseable JSON object matching the following structure:
{
  "summary": "A concise 2-4 sentence summary of the main topics discussed and general outcomes of the meeting.",
  "decisions": [
    "List of key decisions made or agreements reached during the meeting."
  ],
  "followUps": [
    "List of items explicitly deferred to future meetings or left open for later discussion."
  ],
  "tasks": [
    {
      "task": "A clear, actionable task description.",
      "assignedTo": "Name of the person assigned to the task. If not mentioned or unclear, use 'Unassigned'.",
      "deadline": "The timeline or deadline for the task. If not mentioned, use 'Not specified'."
    }
  ]
}

Instructions:
- The summary should capture the essence of the meeting in exactly 2 to 4 sentences.
- For decisions, follow-ups, and tasks: extract only what is actually present in the transcript. If none are mentioned, return an empty array.
- For assignedTo, try to identify the specific speaker or name referenced. Default to 'Unassigned' if not mentioned.
- If the transcript is silent, contains only noise/hallucinations, or has no meeting content, you MUST still return a valid JSON object matching the schema above, with the "summary" set to "No meeting content detected." and all other arrays empty.
- Do NOT wrap the JSON in markdown code blocks (do NOT use \`\`\`json ... \`\`\`).
- The response MUST be a raw JSON text starting with '{' and ending with '}' with no formatting before or after.
- Do not include any introductory or concluding text in your response.
`;

    const userPrompt = `
Transcript to analyze:
---
${transcript}
---
`;

    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Groq LLM returned an empty response.');
    }

    const insights: MeetingInsights = JSON.parse(responseText);
    
    // Fallbacks and schema validation
    return {
      summary: insights.summary || 'No summary generated.',
      decisions: Array.isArray(insights.decisions) ? insights.decisions : [],
      followUps: Array.isArray(insights.followUps) ? insights.followUps : [],
      tasks: Array.isArray(insights.tasks) 
        ? insights.tasks.map(t => ({
            task: t.task || 'Unnamed task',
            assignedTo: t.assignedTo || 'Unassigned',
            deadline: t.deadline || 'Not specified'
          }))
        : []
    };
  } catch (error: any) {
    console.error('Groq Insight Extraction API Error:', error);
    throw new Error(`AI processing failed: ${error.message || 'Unknown error'}`);
  }
};
