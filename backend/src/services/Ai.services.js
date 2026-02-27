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
    formData.append("model", "whisper-large-v3-turbo");
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


export const analyzeBestMoment = async (audioTranscript, noOfShorts, videoDuration) => {

  const prompt = `
You are an expert YouTube Shorts editor, content analyst and an expert YouTube Shorts creator.

Your task is to analyze the transcript and identify noOfShorts must be exactly equals to ${noOfShorts}, and these should be the most viral, engaging, factually engaging, and emotionally impactful 45–60 second segments.

Video Duration: ${videoDuration} seconds.

RULES:
- No of moments identified must be equals to ${noOfShorts}.
- Compare your identified best moments with ${noOfShorts}, if both are equal then return the response.
- Each segment must be within the video bounds (startTime >= 0, endTime <= ${videoDuration}).
- Start and end times must correspond to full sentences in the transcript.
- Avoid the first 60 seconds unless it is clearly the strongest moment in the entire video.
- Reason, Title, and Hook MUST accurately match the content of that specific segment, not from other segments.
- Ensure the segments are diverse and cover different parts of the video where possible.

OUTPUT JSON ONLY:

{
 "segments":[
   {
     "startTime": 0,
     "endTime": 0,
     "reason": "",
     "title": "",
     "hook": ""
   }
   ${Array.from({ length: noOfShorts - 1 }, () => `,
   {
     "startTime": 0,
     "endTime": 0,
     "reason": "",
     "title": "",
     "hook": ""
   }`).join('')}
 ]
}

Transcript:
${audioTranscript}
`;

// console.log(`My Prompt: ${prompt}\n\n`)
console.log(`Transcript: ${audioTranscript}`)

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return ONLY valid JSON." },
          { role: "user", content: prompt }
        ]
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "AI request failed");
  }

  // ---------- SAFE JSON PARSE ----------
  let parsed;

  try {
    parsed = JSON.parse(result.choices[0].message.content);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  // ---------- HARD VALIDATION ----------
  if (!parsed.segments || !Array.isArray(parsed.segments)) {
    throw new Error("AI returned no segments array");
  }

  if (parsed.segments.length !== noOfShorts) {
    console.warn("AI returned wrong count, continuing anyway...");
  }

  // ---------- SANITIZE NUMBERS ----------
  parsed.segments = parsed.segments.map(s => ({
    ...s,
    startTime: Number(s.startTime),
    endTime: Number(s.endTime)
  }));

  return parsed;
};