import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

import { User } from '@/types';

// Server-side helper to get authenticated instance
export async function createServerClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('pb_auth')?.value;

  // Access via bracket notation to prevent build-time inlining and ensure runtime access
  const url = process.env['NEXT_PUBLIC_POCKETBASE_URL'];
  
  if (!url) {
    console.error("CRITICAL ERROR: NEXT_PUBLIC_POCKETBASE_URL is not set in the server environment.");
  }

  const serverPb = new PocketBase(url);
  
  if (token) {
    serverPb.authStore.loadFromCookie(`pb_auth=${token}`);
  }

  return serverPb;
}

export async function getCurrentUser() {
  const pb = await createServerClient();
  if (!pb.authStore.isValid) return null;
  try {
    return pb.authStore.model as unknown as User;
  } catch {
    return null;
  }
}

export async function createPrivilegedServerClient() {
  const url = process.env['NEXT_PUBLIC_POCKETBASE_URL'];
  const identity = process.env['POCKETBASE_ADMIN_EMAIL'];
  const password = process.env['POCKETBASE_ADMIN_PASSWORD'];
  if (!url || !identity || !password) throw new Error('POCKETBASE_ADMIN_CREDENTIALS_MISSING');
  const privilegedPb = new PocketBase(url);
  await privilegedPb.collection('_superusers').authWithPassword(identity, password, { autoRefreshThreshold: 0 });
  return privilegedPb;
}
