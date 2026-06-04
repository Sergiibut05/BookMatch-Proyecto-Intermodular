import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || '';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim() || 'dzn3jdbcp';
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || 'bookmatch_playlists';

export function buildPlaylistCoverPrompt(
  title: string,
  genres?: string[],
  mood?: string,
): string {
  const parts = [
    'book collection cover art',
    title.trim().slice(0, 80),
    genres?.length ? genres.slice(0, 3).join(' ') : '',
    mood && mood !== 'no especificado' ? mood.slice(0, 60) : '',
    'stylized vibrant painterly minimalist no text no letters',
  ].filter(Boolean);
  return parts.join(', ').slice(0, 300);
}

/**
 * Genera una imagen de portada con OpenRouter (FLUX Schnell) y la sube
 * a Cloudinary con el upload preset sin firma. Devuelve la URL permanente
 * o `null` si algún paso falla (el caller decide el fallback).
 */
export async function generateAndUploadCover(prompt: string): Promise<string | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[cover-generation] OPENROUTER_API_KEY no configurada; saltando generación');
    return null;
  }

  try {
    const orRes = await axios.post(
      'https://openrouter.ai/api/v1/images/generations',
      { model: 'black-forest-labs/flux-schnell', prompt, n: 1, size: '512x512' },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 45_000,
      },
    );

    const imgData = orRes.data?.data?.[0];
    if (!imgData) return null;

    const uploadFile = imgData.b64_json
      ? `data:image/png;base64,${imgData.b64_json}`
      : imgData.url ?? null;
    if (!uploadFile) return null;

    const clRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { file: uploadFile, upload_preset: CLOUDINARY_UPLOAD_PRESET, folder: 'playlist-covers' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 },
    );

    return clRes.data?.secure_url ?? null;
  } catch (err: any) {
    console.error('[cover-generation] error generando portada:', err?.response?.data ?? err?.message ?? err);
    return null;
  }
}
