import fs from 'fs';
import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('Warning: GROQ_API_KEY is not defined in the environment variables.');
}

const groq = new Groq({ apiKey });

/**
 * Transcribes audio file using Groq Whisper-large-v3.
 * Supports Hindi, English, and code-switched Hinglish.
 */
export const transcribeAudio = async (filePath: string): Promise<string> => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found at path: ${filePath}`);
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    
    const response = await groq.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-large-v3',
      prompt: 'This is a professional meeting transcript. It may contain mixed Hindi, English, and Hinglish/code-switched conversations. Transcribe accurately.',
      temperature: 0.0,
    });

    return response.text;
  } catch (error: any) {
    console.error('Groq Transcription API Error:', error);
    throw new Error(`Transcription failed: ${error.message || 'Unknown error'}`);
  }
};
