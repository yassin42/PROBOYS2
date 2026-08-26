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

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS repairs (
      id VARCHAR(255) PRIMARY KEY,
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

export async function GET() {
  try {
    await ensureTable();
    const { rows } = await sql`SELECT * FROM repairs ORDER BY created_at DESC`;
    return NextResponse.json(rows.map(mapDbToRepair));
  } catch (error: any) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const body: Repair = await req.json();

    await sql`
      INSERT INTO repairs (id, customer, phone, device, issue, status, price, promised, notes, created_at, repaired_at)
      VALUES (${body.id}, ${body.customer}, ${body.phone || ''}, ${body.device}, ${body.issue}, ${body.status}, ${body.price}, ${body.promised || ''}, ${body.notes || ''}, ${body.createdAt || new Date().toISOString()}, ${body.repairedAt || null})
      ON CONFLICT (id) DO UPDATE SET
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

    return NextResponse.json({ success: true, repair: body });
  } catch (error: any) {
    console.error('Error saving repair:', error);
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

    await sql`DELETE FROM repairs WHERE id = ${id}`;
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
    repairedAt: row.repaired_at || undefined,
  };
}
