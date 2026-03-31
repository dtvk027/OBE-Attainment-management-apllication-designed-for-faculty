import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;

let supabase = null;

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_BUCKET) {
    throw new Error('Missing Supabase configuration. Set SUPABASE_URL, SUPABASE_KEY, and SUPABASE_BUCKET.');
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
      global: { headers: { 'X-Client-Info': 'obe-portal-server' } }
    });
  }

  return supabase;
}

export async function uploadSubjectFile(path, fileBuffer, contentType = 'application/octet-stream') {
  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(SUPABASE_BUCKET)
    .upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

  return { data, error };
}

export async function createSignedDownloadUrl(path, expiresInSeconds = 60 * 60 * 24) {
  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(SUPABASE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  return { data, error };
}
