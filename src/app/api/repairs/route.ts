import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

type Repair = {
  id: string;
  customer: string;
  phone: string;
  device: string;
  issue: string;
  status: "Received" | "In Progress" | "Repaired" | "Collected";
  price: number;
  promised: string;
  notes: string;
  createdAt: string;
  repairedAt?: string;
};

function hasPostgres() {
  return !!process.env.POSTGRES_URL || !!process.env.POSTGRES_PRISMA_URL || !!process.env.POSTGRES_URL_NON_POOLING;
}

async function ensureTable() {
  if (!hasPostgres()) return;
  await sql`
    CREATE TABLE IF NOT EXISTS repairs (
      id VARCHAR(255) PRIMARY KEY,
      sync_id VARCHAR(255) DEFAULT 'default-store',
      customer TEXT NOT NULL,
      phone VARCHAR(100),
      device TEXT NOT NULL,
      issue TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Received',
      price NUMERIC DEFAULT 0,
      promised VARCHAR(100),
      notes TEXT,
      created_at VARCHAR(100),
      repaired_at VARCHAR(100)
    );
  `;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const syncId = searchParams.get('syncId') || 'default-store';

    if (!hasPostgres()) {
      return NextResponse.json([]);
    }
    await ensureTable();
    const { rows } = await sql`SELECT * FROM repairs WHERE sync_id = ${syncId} ORDER BY created_at DESC`;
    return NextResponse.json(rows.map(mapDbToRepair));
  } catch (error: any) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const repair: Repair = body.repair || body;
    const syncId = body.syncId || 'default-store';

    if (!hasPostgres()) {
      return NextResponse.json({ success: true, repair });
    }
    await ensureTable();

    await sql`
      INSERT INTO repairs (id, sync_id, customer, phone, device, issue, status, price, promised, notes, created_at, repaired_at)
      VALUES (${repair.id}, ${syncId}, ${repair.customer}, ${repair.phone || ''}, ${repair.device}, ${repair.issue}, ${repair.status}, ${repair.price}, ${repair.promised || ''}, ${repair.notes || ''}, ${repair.createdAt || new Date().toISOString()}, ${repair.repairedAt || null})
      ON CONFLICT (id) DO UPDATE SET
        sync_id = EXCLUDED.sync_id,
        customer = EXCLUDED.customer,
        phone = EXCLUDED.phone,
        device = EXCLUDED.device,
        issue = EXCLUDED.issue,
        status = EXCLUDED.status,
        price = EXCLUDED.price,
        promised = EXCLUDED.promised,
        notes = EXCLUDED.notes,
        created_at = EXCLUDED.created_at,
        repaired_at = EXCLUDED.repaired_at;
    `;

    return NextResponse.json({ success: true, repair });
  } catch (error: any) {
    console.error('Error saving repair:', error);
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
    await sql`DELETE FROM repairs WHERE id = ${id} AND sync_id = ${syncId}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting repair:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function mapDbToRepair(row: any): Repair {
  return {
    id: row.id,
    customer: row.customer,
    phone: row.phone || '',
    device: row.device,
    issue: row.issue,
    status: row.status as any,
    price: Number(row.price),
    promised: row.promised || '',
    notes: row.notes || '',
    createdAt: row.created_at || '',
    repaired_at: row.repaired_at || undefined,
  };
}
