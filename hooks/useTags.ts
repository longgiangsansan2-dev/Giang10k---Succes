import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { Tag } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useTags = (category: 'task' | 'bucketlist' = 'task') => {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseClient();

  const fetchTags = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .order('name');
    
    if (!error && data) {
      setTags(data);
    }
    setLoading(false);
  }, [user, supabase, category]);

  useEffect(() => {
    fetchTags();
    
    const handleGlobalUpdate = () => fetchTags();
    window.addEventListener(`giang:tags-updated:${category}`, handleGlobalUpdate);
    return () => window.removeEventListener(`giang:tags-updated:${category}`, handleGlobalUpdate);
  }, [fetchTags, category]);

  const addTag = async (name: string, color: string, icon: string) => {
    if (!user || !name.trim()) return null;
    const { data, error } = await supabase
      .from('tags')
      .insert([{ 
        user_id: user.id, 
        name: name.trim(), 
        color, 
        icon,
        category 
      }])
      .select()
      .single();
    
    if (!error && data) {
      window.dispatchEvent(new CustomEvent(`giang:tags-updated:${category}`));
      return data;
    }
    return null;
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (!error) {
      window.dispatchEvent(new CustomEvent(`giang:tags-updated:${category}`));
      return true;
    }
    return false;
  };

  return { tags, loading, addTag, deleteTag, refreshTags: fetchTags };
};