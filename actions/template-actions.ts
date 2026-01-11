"use server";

import { getAuthenticatedClient } from "../lib/supabase/client";

export async function getTemplates() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const { data, error } = await supabase
      .from('task_template')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });
      
    if (error) return [];
    return data;
  } catch (err) {
    return [];
  }
}

export async function upsertTemplate(data: any) {
  const { supabase, user } = await getAuthenticatedClient();

  const payload = { 
    user_id: user.id,
    title: data.title, 
    quadrant: data.quadrant, 
    is_active: data.isActive !== undefined ? data.isActive : true, 
    order_index: data.orderIndex || 0,
    tag_id: data.tagId || null
  };

  if (data.id) {
    const { error } = await supabase
      .from('task_template')
      .update(payload)
      .eq('id', data.id)
      .eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('task_template').insert([payload]);
    if (error) throw error;
  }
}

export async function deleteTemplate(id: string) {
  const { supabase, user } = await getAuthenticatedClient();
  await supabase
    .from('task_template')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
}

const processingLocks: Record<string, boolean> = {};

export async function ensureDailyTasksForDate(dateStr: string) {
  const { supabase, user } = await getAuthenticatedClient();
  const userId = user.id;
  
  const lockKey = `${userId}-${dateStr}`;
  if (processingLocks[lockKey]) return;
  processingLocks[lockKey] = true;

  try {
    const { data: existingTasks } = await supabase
      .from('daily_task')
      .select('source_template_id')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .not('source_template_id', 'is', null);

    const createdTemplateIds = new Set(existingTasks?.map(t => t.source_template_id) || []);

    const { data: templates } = await supabase
      .from('task_template')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!templates || templates.length === 0) return;

    const tasksToInsert = templates
      .filter(tpl => !createdTemplateIds.has(tpl.id))
      .map(tpl => ({
        user_id: userId,
        date: dateStr,
        title: tpl.title,
        quadrant: tpl.quadrant,
        source_template_id: tpl.id,
        order_index: tpl.order_index,
        tag_id: tpl.tag_id,
        status: 'pending'
      }));

    if (tasksToInsert.length > 0) {
      console.log(`[ensureDailyTasks] Syncing for ${user.email}...`);
      const { error: insertError } = await supabase.from('daily_task').insert(tasksToInsert);
      if (insertError) {
        console.error("[RLS_VIOLATION_FIX]", insertError.message);
        throw insertError;
      }
    }
  } finally {
    setTimeout(() => { delete processingLocks[lockKey]; }, 2000);
  }
}