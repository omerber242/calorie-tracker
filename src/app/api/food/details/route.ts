import { NextRequest, NextResponse } from 'next/server';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

// USDA nutrient IDs for the macros we care about
const NUTRIENT_MAP: Record<number, string> = {
  1008: 'calories',
  1003: 'protein',
  1005: 'carbs',
  1004: 'fat',
  1079: 'fiber',
  2000: 'sugar',
  1093: 'sodium',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fdcId = searchParams.get('id');
  const servingSize = parseFloat(searchParams.get('serving') ?? '100');

  if (!fdcId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const apiKey = process.env.USDA_API_KEY;
  const url = `${USDA_BASE}/food/${fdcId}?api_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: 'USDA API error' }, { status: res.status });

  const data = await res.json();

  // Build per-100g macros
  const per100g: Record<string, number> = {};
  for (const nutrient of data.foodNutrients ?? []) {
    const id = nutrient.nutrient?.id ?? nutrient.nutrientId;
    const key = NUTRIENT_MAP[id];
    if (key) {
      per100g[key] = nutrient.amount ?? nutrient.value ?? 0;
    }
  }

  // Scale to serving
  const scale = servingSize / 100;
  const scaled = Object.fromEntries(
    Object.entries(per100g).map(([k, v]) => [k, Math.round(v * scale * 10) / 10])
  );

  return NextResponse.json({
    fdcId: data.fdcId,
    description: data.description,
    brandOwner: data.brandOwner,
    servingSize,
    servingSizeUnit: 'g',
    per100g,
    ...scaled,
  });
}
