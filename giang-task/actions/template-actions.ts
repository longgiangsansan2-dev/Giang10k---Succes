"use server";

import { getSupabaseClient } from "../lib/supabase/client";
import { TaskStatus } from "../types";

export async function getTemplates() {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from('task_template')
    .select('*')
    .eq('user_id', session.user.id)
    .order('order_index', { ascending: true });
    
  if (error) return [];
  return data;
}

export async function upsertTemplate(data: any) {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Bạn cần đăng nhập để thực hiện thao tác này");

  const payload = { 
    user_id: session.user.id,
    title: data.title, 
    quadrant: data.quadrant, 
    is_active: data.isActive !== undefined ? data.isActive : true, 
    order_index: data.orderIndex || 0 
  };

  if (data.id) {
    const { error } = await supabase
      .from('task_template')
      .update(payload)
      .eq('id', data.id)
      .eq('user_id', session.user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('task_template').insert([payload]);
    if (error) throw error;
  }
}

export async function deleteTemplate(id: string) {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  await supabase
    .from('task_template')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);
}

export async function ensureDailyTasksForDate(dateStr: string) {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  const userId = session.user.id;

  // 1. Kiểm tra xem ngày này đã được khởi tạo task từ template chưa
  const { data: existing, error: checkError } = await supabase
    .from('daily_task')
    .select('id')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .not('source_template_id', 'is', null)
    .limit(1);

  if (checkError || (existing && existing.length > 0)) return;

  // 2. Lấy danh sách template đang hoạt động của user này
  const { data: templates, error: tplError } = await supabase
    .from('task_template')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (tplError || !templates || templates.length === 0) return;

  // 3. Chuẩn bị dữ liệu task hàng ngày kèm theo user_id
  const dailyTasks = templates.map(tpl => ({
    user_id: userId,
    date: dateStr,
    title: tpl.title,
    quadrant: tpl.quadrant,
    source_template_id: tpl.id,
    order_index: tpl.order_index,
    status: 'pending'
  }));

  const { error: upsertError } = await supabase.from('daily_task').insert(dailyTasks);
  if (upsertError) console.error("[ENSURE_DAILY_ERROR]", upsertError);
}