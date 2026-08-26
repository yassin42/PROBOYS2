import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { INITIAL_GLOBAL_INVENTORY, type InventoryItem } from '@/lib/inventory-data';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id VARCHAR(255) PRIMARY KEY,
      model_id VARCHAR(255),
      brand_id VARCHAR(255),
      category VARCHAR(255),
      name TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      retail_price NUMERIC DEFAULT 0,
      wholesale_cost NUMERIC DEFAULT 0,
      barcode VARCHAR(255),
      compatibility_note TEXT,
      compatible_models JSONB DEFAULT '[]'::jsonb
    );
  `;
}

export async function GET() {
  try {
    await ensureTable();
    const { rows } = await sql`SELECT * FROM inventory_items`;
    
    if (rows.length === 0) {
      for (const item of INITIAL_GLOBAL_INVENTORY) {
        const compJson = JSON.stringify(item.compatibleModels || []);
        await sql`
          INSERT INTO inventory_items (id, model_id, brand_id, category, name, stock, retail_price, wholesale_cost, barcode, compatibility_note, compatible_models)
          VALUES (${item.id}, ${item.modelId || null}, ${item.brandId || null}, ${item.category}, ${item.name}, ${item.stock}, ${item.retailPrice}, ${item.wholesaleCost}, ${item.barcode || null}, ${item.compatibilityNote || null}, ${compJson}::jsonb)
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      const { rows: seededRows } = await sql`SELECT * FROM inventory_items`;
      return NextResponse.json(seededRows.map(mapDbToItem));
    }

    return NextResponse.json(rows.map(mapDbToItem));
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(INITIAL_GLOBAL_INVENTORY, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const body: InventoryItem = await req.json();
    const compJson = JSON.stringify(body.compatibleModels || []);

    await sql`
      INSERT INTO inventory_items (id, model_id, brand_id, category, name, stock, retail_price, wholesale_cost, barcode, compatibility_note, compatible_models)
      VALUES (${body.id}, ${body.modelId || null}, ${body.brandId || null}, ${body.category}, ${body.name}, ${body.stock}, ${body.retailPrice}, ${body.wholesaleCost}, ${body.barcode || null}, ${body.compatibilityNote || null}, ${compJson}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        model_id = EXCLUDED.model_id,
        brand_id = EXCLUDED.brand_id,
        category = EXCLUDED.category,
        name = EXCLUDED.name,
        stock = EXCLUDED.stock,
        retail_price = EXCLUDED.retail_price,
        wholesale_cost = EXCLUDED.wholesale_cost,
        barcode = EXCLUDED.barcode,
        compatibility_note = EXCLUDED.compatibility_note,
        compatible_models = EXCLUDED.compatible_models;
    `;

    return NextResponse.json({ success: true, item: body });
  } catch (error: any) {
    console.error('Error saving inventory item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await sql`DELETE FROM inventory_items WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function mapDbToItem(row: any): InventoryItem {
  let compModels: string[] = [];
  try {
    if (typeof row.compatible_models === 'string') {
      compModels = JSON.parse(row.compatible_models);
    } else if (Array.isArray(row.compatible_models)) {
      compModels = row.compatible_models;
    }
  } catch {
    compModels = [];
  }

  return {
    id: row.id,
    modelId: row.model_id || undefined,
    brandId: row.brand_id || undefined,
    category: row.category,
    name: row.name,
    stock: Number(row.stock),
    retailPrice: Number(row.retail_price),
    wholesaleCost: Number(row.wholesale_cost),
    barcode: row.barcode || undefined,
    compatibilityNote: row.compatibility_note || undefined,
    compatibleModels: compModels,
  };
}
