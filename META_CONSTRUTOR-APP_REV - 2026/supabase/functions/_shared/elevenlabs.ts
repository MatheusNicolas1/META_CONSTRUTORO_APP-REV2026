// ElevenLabs client wrapper for Edge Functions
// Centraliza chamadas TTS e STT com logging e tratamento de erro

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

export interface TtsOptions {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speed?: number;
  responseFormat?: string;
}

export interface SttOptions {
  audioBuffer: ArrayBuffer;
  modelId?: string;
}

export interface TtsResult {
  audioBuffer: ArrayBuffer;
  charsConsumed: number;
}

export interface SttResult {
  text: string;
  durationSeconds: number;
}

function getApiKey(): string {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY not configured in Supabase secrets");
  }
  return key;
}

export async function textToSpeech(options: TtsOptions): Promise<TtsResult> {
  const { text, voiceId, modelId = "eleven_multilingual_v2", stability = 0.5, similarityBoost = 0.75, style = 0, speed = 1.0, responseFormat = "mp3_44100_192" } = options;

  const apiKey = getApiKey();

  console.info(`[elevenlabs-tts] Calling TTS: voice=${voiceId}, model=${modelId}, chars=${text.length}`);

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          speed,
        },
        output_format: responseFormat,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${errorBody}`,
    );
  }

  const audioBuffer = await response.arrayBuffer();
  const charsConsumed = text.length;

  console.info(
    `[elevenlabs-tts] TTS success: ${audioBuffer.byteLength} bytes, ${charsConsumed} chars consumed`,
  );

  return { audioBuffer, charsConsumed };
}

export async function speechToText(
  options: SttOptions,
): Promise<SttResult> {
  const { audioBuffer, modelId = "eleven_multilingual_v2" } = options;

  const apiKey = getApiKey();

  console.info(
    `[elevenlabs-stt] Calling STT: model=${modelId}, size=${audioBuffer.byteLength} bytes`,
  );

  const formData = new FormData();
  formData.append("audio", new Blob([audioBuffer]));
  formData.append("model_id", modelId);

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/speech-to-text`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `ElevenLabs STT failed (${response.status}): ${errorBody}`,
    );
  }

  const result = await response.json();

  console.info(
    `[elevenlabs-stt] STT success: "${result.text?.substring(0, 80)}..."`,
  );

  return {
    text: result.text || "",
    durationSeconds: result.duration_seconds || 0,
  };
}

export function getDefaultVoices(): { label: string; voiceId: string }[] {
  return [
    { label: "Masculina", voiceId: "pqHfZKP75CvOlQylNhV4" }, // Bill
    { label: "Feminina", voiceId: "XrExE9yKIg1WjnnlVkGX" }, // Charlotte
  ];
}
