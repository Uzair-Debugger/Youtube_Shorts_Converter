import "dotenv/config";
import fs from "fs";

export const transcribe = async (audioPath) => {
  try {
    const buffer = fs.readFileSync(audioPath);

    const formData = new FormData();
    formData.append(
      "file",
      new File([buffer], "audio.mp3", { type: "audio/mpeg" })
    );
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "verbose_json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return await response.json();

  } catch (error) {
    console.error("Transcription Error:", error.message);
    throw error;
  }
};


export const analyzeBestMoment = async(audioTranscript, videoDuration) =>{

  try {
const prompt = `
You are an expert YouTube Shorts editor and content analyst.

Your task is to analyze the transcript and identify the SINGLE most viral, engaging, and emotionally impactful 45–60 second segment.

Video Duration: ${videoDuration} seconds

Transcript:
"${audioTranscript}"

CRITICAL RULES:
1. The segment must be EXACTLY between 45-60 seconds (endTime - startTime).
2. The segment must be within video bounds (0 to ${videoDuration}).
3. Avoid the first 60 seconds unless it is clearly the strongest moment in the entire video.
4. Choose the moment that has the highest viral potential based on:
   - a concrete revelation or fact
   - a strong emotional reaction
   - a surprising or controversial statement
   - a turning point in the story
   - a clear insight or lesson
5. Your reasoning MUST reference specific content from the transcript (not generic phrases).
6. Do NOT use vague language like:
   "surprising moment", "exciting part", "interesting segment", "unexpected consequence".
7. Do NOT use placeholders like [subject], [something], or generic hooks.
8. The title and hook must be directly tied to what is actually said in the transcript.
9. If multiple strong segments exist, choose the one with the highest emotional or informational impact.

OUTPUT FORMAT:
Return ONLY a valid JSON object. No explanation. No extra text. No markdown.

{
  "startTime": 0.0,
  "endTime": 0.0,
  "reason": "Explain precisely why this segment is the best, referencing specific events, statements, or ideas from the transcript.",
  "title": "A specific, concrete, and compelling title based on the exact content of the segment.",
  "hook": "A sharp, curiosity-driven hook that directly reflects what happens or is said in the segment."
}

QUALITY CHECK BEFORE RESPONDING:
- Is the reason specific and tied to transcript details? If not, rewrite.
- Is the title concrete and descriptive? If not, rewrite.
- Is the hook realistic and transcript-based? If not, rewrite.
- Is the time range exactly 45–60 seconds? If not, fix it.
`;

    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'Application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system', 
            content:'You are an expert video editor analyzing transcripts to find the most engaging segments. Always respond with a valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });
    const result = await response.json()
    if(!response.ok){
      const error = await response.text()
      throw new Error(error);
    }

    console.log("AI Response: ",result.choices[0].message)

    // return result.choices[0].message.content; // This will give you undefined. we need to parse it. why?

    const contentString = result.choices[0].message.content;
    const parsedContent = JSON.parse(contentString);
    // console.log("parsedContent: ", parsedContent)
    return parsedContent;
  } catch (error) {
    console.log("Analyzing Best Moment ERROR: ", error.message);
    throw error;
  }
}