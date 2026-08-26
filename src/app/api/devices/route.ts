import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

function hasPostgres() {
  return !!process.env.POSTGRES_URL || !!process.env.POSTGRES_PRISMA_URL || !!process.env.POSTGRES_URL_NON_POOLING;
}

async function ensureTable() {
  if (!hasPostgres()) return;
  await sql`
    CREATE TABLE IF NOT EXISTS active_devices (
      device_id VARCHAR(255) PRIMARY KEY,
      device_name TEXT NOT NULL,
      sync_id VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      last_seen BIGINT NOT NULL
    );
  `;
}

// In-memory fallback if no postgres
let memoryDevices: Map<string, { deviceId: string; deviceName: string; syncId: string; role: string; lastSeen: number }> = new Map();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const syncId = searchParams.get('syncId') || '';

    if (!hasPostgres()) {
      const now = Date.now();
      const list = Array.from(memoryDevices.values()).filter(d => (!syncId || d.syncId === syncId) && now - d.lastSeen < 20000);
      return NextResponse.json(list);
    }

    await ensureTable();
    const now = Date.now();
    const threshold = now - 20000; // seen in last 20 seconds

    // Clean up old devices
    await sql`DELETE FROM active_devices WHERE last_seen < ${threshold}`;

    const { rows } = syncId 
      ? await sql`SELECT device_id as "deviceId", device_name as "deviceName", sync_id as "syncId", role, last_seen as "lastSeen" FROM active_devices WHERE sync_id = ${syncId}`
      : await sql`SELECT device_id as "deviceId", device_name as "deviceName", sync_id as "syncId", role, last_seen as "lastSeen" FROM active_devices`;

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching devices:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deviceId, deviceName, syncId, role } = body;
    if (!deviceId || !syncId) {
      return NextResponse.json({ error: 'Missing deviceId or syncId' }, { status: 400 });
    }

    const now = Date.now();

    if (!hasPostgres()) {
      memoryDevices.set(deviceId, { deviceId, deviceName: deviceName || 'Device', syncId, role: role || 'pc', lastSeen: now });
      const list = Array.from(memoryDevices.values()).filter(d => d.syncId === syncId && now - d.lastSeen < 20000);
      return NextResponse.json({ success: true, devices: list });
    }

    await ensureTable();
    await sql`
      INSERT INTO active_devices (device_id, device_name, sync_id, role, last_seen)
      VALUES (${deviceId}, ${deviceName || 'Device'}, ${syncId}, ${role || 'pc'}, ${now})
      ON CONFLICT (device_id) DO UPDATE SET
        device_name = EXCLUDED.device_name,
        sync_id = EXCLUDED.sync_id,
        role = EXCLUDED.role,
        last_seen = EXCLUDED.last_seen;
    `;

    const threshold = now - 20000;
    const { rows } = await sql`
      SELECT device_id as "deviceId", device_name as "deviceName", sync_id as "syncId", role, last_seen as "lastSeen" 
      FROM active_devices 
      WHERE sync_id = ${syncId} AND last_seen >= ${threshold}
    `;

    return NextResponse.json({ success: true, devices: rows });
  } catch (error: any) {
    console.error('Error registering device:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
