import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trip_budget')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const body = await req.json();

  const payload = {
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    total_budget_ils: Number(body.total_budget_ils) || 0,
    exchange_rates: body.exchange_rates || { JPY: 0.024, USD: 3.7, EUR: 4.0, ILS: 1 },
    category_budgets: body.category_budgets || {
      food: 0, transport: 0, lodging: 0, shopping: 0, activities: 0, other: 0,
    },
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase.from('trip_budget').select('id').limit(1).maybeSingle();

  const query = existing
    ? supabase.from('trip_budget').update(payload).eq('id', existing.id)
    : supabase.from('trip_budget').insert(payload);

  const { data, error } = await query.select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
