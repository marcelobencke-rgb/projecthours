'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Profile } from '@/lib/types';

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile not found, let's create a default one
      const defaultProfile: Partial<Profile> = {
        id: user.id,
        name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        work_hours: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }]
      };
      
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();
        
      return newProfile as Profile;
    }
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as Profile;
}

export async function updateUserProfile(profileData: Partial<Profile>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...profileData, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true, profile: data };
}
