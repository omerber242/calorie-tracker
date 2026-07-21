import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const CATEGORIES = ['food', 'transport', 'lodging', 'shopping', 'activities', 'other'];
const PAYMENT_METHODS = ['cash', 'card'];

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const category = searchParams.get('category');

  let query = supabase.from('expenses').select('*');
  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);
  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('date', { ascending: false }).order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();

  if (!body.date || !body.amount_jpy || Number(body.amount_jpy) <= 0) {
    return NextResponse.json({ error: 'תאריך וסכום הם שדות חובה' }, { status: 400 });
  }
  if (body.category && !CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: 'קטגוריה לא תקינה' }, { status: 400 });
  }
  if (body.payment_method && !PAYMENT_METHODS.includes(body.payment_method)) {
    return NextResponse.json({ error: 'אמצעי תשלום לא תקין' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      date: body.date,
      category: body.category || 'other',
      amount_jpy: Number(body.amount_jpy),
      payment_method: body.payment_method || 'cash',
      description: body.description?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const body = await req.json();

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (!body.date || !body.amount_jpy || Number(body.amount_jpy) <= 0) {
    return NextResponse.json({ error: 'תאריך וסכום הם שדות חובה' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({
      date: body.date,
      category: body.category || 'other',
      amount_jpy: Number(body.amount_jpy),
      payment_method: body.payment_method || 'cash',
      description: body.description?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase.from('expenses').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
