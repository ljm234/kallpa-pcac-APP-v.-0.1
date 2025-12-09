// lib/transcription.js
import Constants from 'expo-constants';

const OPENAI_TRANSCRIPTION_ENDPOINT =
  'https://api.openai.com/v1/audio/transcriptions';

const resolveApiKey = () => {
  const extraKey = Constants?.expoConfig?.extra?.openAiApiKey;
  if (extraKey) return extraKey;
  if (typeof process !== 'undefined') {
    return process.env?.EXPO_PUBLIC_OPENAI_KEY || null;
  }
  return null;
};

export const transcribeAudioRecording = async ({
  uri,
  fileName = `recording-${Date.now()}.m4a`,
  mimeType = 'audio/m4a',
  model = 'whisper-1',
}) => {
  if (!uri) {
    throw new Error('Missing audio URI to transcribe.');
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      'EXPO_PUBLIC_OPENAI_KEY is not configured. Add it to your environment to enable audio transcription.'
    );
  }

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  });
  formData.append('model', model);
  formData.append('response_format', 'verbose_json'); // Get detailed word-level timestamps
  formData.append('language', 'en'); // Specify English for better accuracy
  formData.append('temperature', '0'); // Use 0 for maximum accuracy (less creative, more precise)

  console.log('🎤 Starting OpenAI Whisper transcription with high-accuracy settings...');

  const response = await fetch(OPENAI_TRANSCRIPTION_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const payload = await response.text();
  if (!response.ok) {
    let reason;
    try {
      const parsed = JSON.parse(payload);
      reason = parsed?.error?.message ?? payload;
    } catch (_err) {
      reason = payload;
    }
    throw new Error(reason || 'Unable to transcribe audio file.');
  }

  try {
    const jsonPayload = JSON.parse(payload);
    console.log('✅ Transcription complete!');
    console.log(`   Text: "${jsonPayload.text?.substring(0, 100)}..."`);
    console.log(`   Duration: ${jsonPayload.duration}s`);
    console.log(`   Segments: ${jsonPayload.segments?.length || 0}`);
    
    // Return the full detailed response for better accuracy tracking
    return {
      text: jsonPayload.text || '',
      segments: jsonPayload.segments || [],
      duration: jsonPayload.duration || 0,
      language: jsonPayload.language || 'en'
    };
  } catch (_err) {
    console.log('⚠️  Fallback to plain text response');
    return { text: payload.trim(), segments: [], duration: 0 };
  }
};
