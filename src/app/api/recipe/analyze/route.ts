import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a nutrition expert. When given a recipe (as text or an image of food/recipe),
you must analyze it and return a JSON object with this exact structure:

{
  "name": "Recipe name",
  "servings": 4,
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 200,
      "unit": "g",
      "calories": 150,
      "protein": 5,
      "carbs": 30,
      "fat": 2,
      "fiber": 1,
      "sugar": 5,
      "sodium": 10
    }
  ],
  "total_calories": 600,
  "total_protein": 20,
  "total_carbs": 120,
  "total_fat": 8,
  "total_fiber": 4,
  "per_serving_calories": 150,
  "per_serving_protein": 5,
  "per_serving_carbs": 30,
  "per_serving_fat": 2
}

All nutritional values should be numbers in standard units (calories in kcal, macros in grams, sodium in mg).
If you are unsure of an exact value, provide your best estimate based on nutritional knowledge.
Return ONLY the JSON object, no markdown, no explanation.`;

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  let messages: Anthropic.MessageParam[];

  if (contentType.includes('multipart/form-data')) {
    // Image upload
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const text = formData.get('text') as string | null;

    if (!image && !text) {
      return NextResponse.json({ error: 'No image or text provided' }, { status: 400 });
    }

    if (image) {
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mediaType = (image.type as Anthropic.Base64ImageSource['media_type']) || 'image/jpeg';

      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: text
                ? `Analyze this recipe image. Additional context: ${text}`
                : 'Analyze this recipe image and break down all nutritional values.',
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: 'user',
          content: `Analyze this recipe and break down nutritional values:\n\n${text}`,
        },
      ];
    }
  } else {
    // JSON text recipe
    const body = await request.json();
    const { text } = body;
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    messages = [
      {
        role: 'user',
        content: `Analyze this recipe and break down nutritional values:\n\n${text}`,
      },
    ];
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    // Strip any accidental markdown code fences
    const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const recipe = JSON.parse(cleaned);
    return NextResponse.json(recipe);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse recipe analysis', raw: rawText },
      { status: 422 }
    );
  }
}
