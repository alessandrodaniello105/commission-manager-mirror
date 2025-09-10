import { slugifyFilename } from './slugify';

/**
 * Uploads a file to Supabase Storage under the 'voices' bucket/folder, slugifies the filename, and returns the storage path and filename.
 * @param file File to upload
 * @param voiceId The voice id to namespace the file
 * @returns {Promise<{ file_url: string; file_name: string }>} The storage path and filename
 */
export async function uploadVoiceFile(file: File, voiceId: string): Promise<{ file_url: string; file_name: string }> {
  // Optional: pre-slugify for server-friendly name (server will also slugify)
  slugifyFilename(file.name);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('voiceId', voiceId);

  const res = await fetch('http://localhost:4000/api/upload/voice-file', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Upload failed');
  }
  return res.json();
}