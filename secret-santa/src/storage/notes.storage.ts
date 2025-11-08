import { createClient } from '@supabase/supabase-js';

type NotesAPI = {
  getNote: (groupId: string, personName: string) => Promise<string>;
  upsertNote: (
    groupId: string,
    personName: string,
    note: string
  ) => Promise<void>;
};

function makeLocal(): NotesAPI {
  const k = (g: string, p: string) => `ss:notes:${g}:${p}`;
  return {
    async getNote(groupId, personName) {
      try {
        return localStorage.getItem(k(groupId, personName)) || '';
      } catch {
        return '';
      }
    },
    async upsertNote(groupId, personName, note) {
      try {
        localStorage.setItem(k(groupId, personName), note);
      } catch {
        /* ignore */
      }
    },
  };
}

function makeSupabase(): NotesAPI | null {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as
    | string
    | undefined;
  if (!url || !anon) return null;

  const supabase = createClient(url, anon);

  return {
    async getNote(groupId, personName) {
      const { data, error } = await supabase
        .from('notes')
        .select('note')
        .eq('group_id', groupId)
        .eq('person_name', personName)
        .maybeSingle();
      if (error) {
        console.warn('[notes:getNote]', error.message);
        return '';
      }
      return data?.note ?? '';
    },
    async upsertNote(groupId, personName, note) {
      const { error } = await supabase
        .from('notes')
        .upsert(
          { group_id: groupId, person_name: personName, note },
          { onConflict: 'group_id,person_name' }
        );
      if (error) console.warn('[notes:upsertNote]', error.message);
    },
  };
}

// Factory: Supabase if configured, else localStorage
export async function getNotesAPI(): Promise<NotesAPI> {
  const supa = makeSupabase();
  return supa ?? makeLocal();
}
