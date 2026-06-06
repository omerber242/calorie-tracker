import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateMacros } from '@/lib/calculations';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('nutrition_goals')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goals: data ?? null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // If user set a target protein, calculate the rest
  if (body.protein && !body.calories) {
    const calculated = calculateMacros({
      targetProtein: body.protein,
      weight_kg: body.weight_kg,
      height_cm: body.height_cm,
      age: body.age,
      sex: body.sex,
      activity: body.activity,
      goal_type: body.goal_type,
    });
    Object.assign(body, calculated);
  } else if (body.goal_type && body.goal_type !== 'custom' && !body.calories) {
    const calculated = calculateMacros({
      weight_kg: body.weight_kg,
      height_cm: body.height_cm,
      age: body.age,
      sex: body.sex,
      activity: body.activity,
      goal_type: body.goal_type,
    });
    Object.assign(body, calculated);
  }

  const payload = { ...body, user_id: user.id, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('nutrition_goals')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
