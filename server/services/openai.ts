import OpenAI from "openai";
import fs from "fs";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Audio transcription for interviews
export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    // Get file stats for duration estimation
    const stats = fs.statSync(audioFilePath);
    const fileSizeInBytes = stats.size;
    
    // Rough duration estimation (this would be more accurate with actual audio parsing)
    const estimatedDuration = Math.round(fileSizeInBytes / 16000); // rough estimate

    return {
      text: transcription.text,
      duration: estimatedDuration,
    };
  } catch (error: any) {
    console.error('OpenAI transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

// Analyze interview performance using AI
export async function analyzeInterviewPerformance(transcription: string): Promise<{
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert interview evaluator. Analyze the following interview transcription and provide scores and feedback. 
          
          Rate on a scale of 1-10:
          - Technical skills and knowledge
          - Communication clarity and effectiveness  
          - Problem-solving approach and methodology
          - Overall interview performance
          
          Also provide:
          - Key strengths (array of strings)
          - Areas for improvement (array of strings)
          - Hiring recommendation (hire, no_hire, maybe)
          
          Respond with JSON in this exact format:
          {
            "technicalScore": number,
            "communicationScore": number, 
            "problemSolvingScore": number,
            "overallScore": number,
            "strengths": ["strength1", "strength2"],
            "weaknesses": ["weakness1", "weakness2"],
            "recommendation": "hire|no_hire|maybe"
          }`
        },
        {
          role: "user",
          content: transcription,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      technicalScore: Math.max(1, Math.min(10, result.technicalScore)),
      communicationScore: Math.max(1, Math.min(10, result.communicationScore)),
      problemSolvingScore: Math.max(1, Math.min(10, result.problemSolvingScore)),
      overallScore: Math.max(1, Math.min(10, result.overallScore)),
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendation: result.recommendation || "maybe",
    };
  } catch (error: any) {
    console.error('OpenAI analysis error:', error);
    throw new Error(`Failed to analyze interview: ${error.message}`);
  }
}

// Generate interview summary
export async function generateInterviewSummary(transcription: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert at summarizing interviews. Create a concise, professional summary highlighting key discussion points, candidate responses, and notable observations."
        },
        {
          role: "user",
          content: `Please summarize this interview transcription:\n\n${transcription}`
        },
      ],
    });

    return response.choices[0].message.content || "Unable to generate summary";
  } catch (error: any) {
    console.error('OpenAI summary error:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}
