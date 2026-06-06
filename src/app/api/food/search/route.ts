import { NextRequest, NextResponse } from 'next/server';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageSize = searchParams.get('pageSize') ?? '10';

  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'USDA API key not configured' }, { status: 500 });

  const url = new URL(`${USDA_BASE}/foods/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', pageSize);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('dataType', 'Foundation,SR Legacy,Branded');

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json({ error: 'USDA API error' }, { status: res.status });
  }

  const data = await res.json();

  // Simplify the response
  const foods = (data.foods ?? []).map((f: any) => ({
    fdcId: f.fdcId,
    description: f.description,
    brandOwner: f.brandOwner,
    dataType: f.dataType,
    servingSize: f.servingSize,
    servingSizeUnit: f.servingSizeUnit,
    // Extract key nutrients
    calories: getNutrientValue(f.foodNutrients, 1008),
    protein: getNutrientValue(f.foodNutrients, 1003),
    carbs: getNutrientValue(f.foodNutrients, 1005),
    fat: getNutrientValue(f.foodNutrients, 1004),
    fiber: getNutrientValue(f.foodNutrients, 1079),
    sugar: getNutrientValue(f.foodNutrients, 2000),
    sodium: getNutrientValue(f.foodNutrients, 1093),
  }));

  return NextResponse.json({ foods });
}

function getNutrientValue(nutrients: any[], nutrientId: number): number | null {
  const n = nutrients?.find(
    (n: any) => n.nutrientId === nutrientId || n.nutrientNumber === String(nutrientId)
  );
  return n?.value ?? n?.amount ?? null;
}
