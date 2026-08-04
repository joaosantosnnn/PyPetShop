import { supabase } from '../lib/supabase';

const BUCKET = 'pet-photos';
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadPetPhoto(file: File, companyId: string) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Selecione uma imagem JPG, PNG ou WebP.');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('A foto deve ter no máximo 5 MB.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${companyId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(path, 604800);
  if (signedError) throw new Error(signedError.message);
  return { path, signedUrl: data.signedUrl };
}
