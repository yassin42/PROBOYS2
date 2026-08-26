import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { INITIAL_GLOBAL_INVENTORY, type InventoryItem } from '@/lib/inventory-data';

function hasPostgres() {
  return !!process.env.POSTGRES_URL || !!process.env.POSTGRES_PRISMA_URL || !!process.env.POSTGRES_URL_NON_POOLING;
}

async function ensureTable() {
  if (!hasPostgres()) return;
  await sql`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id VARCHAR(255) PRIMARY KEY,
      sync_id VARCHAR(255) DEFAULT 'default-store',
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const syncId = searchParams.get('syncId') || 'default-store';

    if (!hasPostgres()) {
      return NextResponse.json(INITIAL_GLOBAL_INVENTORY);
    }
    await ensureTable();
    const { rows } = await sql`SELECT * FROM inventory_items WHERE sync_id = ${syncId}`;
    
    if (rows.length === 0) {
      for (const item of INITIAL_GLOBAL_INVENTORY) {
        const compJson = JSON.stringify(item.compatibleModels || []);
        await sql`
          INSERT INTO inventory_items (id, sync_id, model_id, brand_id, category, name, stock, retail_price, wholesale_cost, barcode, compatibility_note, compatible_models)
          VALUES (${item.id}, ${syncId}, ${item.modelId || null}, ${item.brandId || null}, ${item.category}, ${item.name}, ${item.stock}, ${item.retailPrice}, ${item.wholesaleCost}, ${item.barcode || null}, ${item.compatibilityNote || null}, ${compJson}::jsonb)
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      const { rows: seededRows } = await sql`SELECT * FROM inventory_items WHERE sync_id = ${syncId}`;
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
    const body = await req.json();
    const item: InventoryItem = body.item || body;
    const syncId = body.syncId || 'default-store';

    if (!hasPostgres()) {
      return NextResponse.json({ success: true, item });
    }
    await ensureTable();
    const compJson = JSON.stringify(item.compatibleModels || []);

    await sql`
      INSERT INTO inventory_items (id, sync_id, model_id, brand_id, category, name, stock, retail_price, wholesale_cost, barcode, compatibility_note, compatible_models)
      VALUES (${item.id}, ${syncId}, ${item.modelId || null}, ${item.brandId || null}, ${item.category}, ${item.name}, ${item.stock}, ${item.retailPrice}, ${item.wholesaleCost}, ${item.barcode || null}, ${item.compatibilityNote || null}, ${compJson}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        sync_id = EXCLUDED.sync_id,
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

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error saving inventory item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const syncId = searchParams.get('syncId') || 'default-store';
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    if (!hasPostgres()) {
      return NextResponse.json({ success: true });
    }

    await ensureTable();
    await sql`DELETE FROM inventory_items WHERE id = ${id} AND sync_id = ${syncId}`;
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
