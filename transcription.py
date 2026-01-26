import whisper
import os

# 1️⃣ Load the model once (takes a few seconds)
#    Options: tiny, base, small, medium, large
model = whisper.load_model("base")

def transcribe_audio(audio_path: str, output_txt: str = "transcription.txt"):
    """
    Transcribes audio using Whisper and saves to a text file.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    print(f"Transcribing: {audio_path} ...")
    result = model.transcribe(audio_path)
    
    # Save transcription to file
    with open(output_txt, "w", encoding="utf-8") as f:
        f.write(result["text"])
    
    print(f"Transcription saved to {output_txt}")
    return result["text"]

def split_into_chunks(text: str, max_words: int = 30):
    """
    Splits a transcription into chunks of N words for shorts/subtitles.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), max_words):
        chunk = " ".join(words[i:i+max_words])
        chunks.append(chunk)
    return chunks

if __name__ == "__main__":
    audio_file = "audio.wav"  # replace with your file
    transcription = transcribe_audio(audio_file)
    
    print(transcription)

    # Optional: split into shorts-friendly chunks
    # chunks = split_into_chunks(transcription, max_words=20)
    # for i, chunk in enumerate(chunks, 1):
    #     print(f"Chunk {i}: {chunk}\n")
