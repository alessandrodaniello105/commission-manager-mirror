import { supabase } from '../lib/supabase';
import { slugifyFilename } from './slugify';

/**
 * Uploads a file to Supabase Storage under the 'voices' bucket/folder, slugifies the filename, and returns the storage path and filename.
 * @param file File to upload
 * @param voiceId The voice id to namespace the file
 * @returns {Promise<{ file_url: string; file_name: string }>} The storage path and filename
 */
export async function uploadVoiceFile(file: File, voiceId: string): Promise<{ file_url: string; file_name: string }> {
  const slug = slugifyFilename(file.name);
  const path = `voices/${voiceId}/${slug}`;
  const { error } = await supabase.storage.from('voices').upload(path, file, {
    cacheControl: '3600',
    upsert: true
  });
  if (error) throw error;
  // file_url is the storage path, file_name is the slugified name
  return { file_url: path, file_name: slug };
}