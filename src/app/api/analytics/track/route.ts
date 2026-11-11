import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Pool } from "pg";

let tableEnsured = false;

async function ensurePageViewTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PageViewLog" (
        "id" TEXT PRIMARY KEY,
        "path" TEXT NOT NULL,
        "userId" TEXT,
        "referrer" TEXT,
        "device" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "PageViewLog_path_idx" ON "PageViewLog"("path");
      CREATE INDEX IF NOT EXISTS "PageViewLog_createdAt_idx" ON "PageViewLog"("createdAt");
    `);
    tableEnsured = true;
  } catch (e) {
    console.warn("Could not ensure PageViewLog table:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensurePageViewTable();

    const body = await req.json().catch(() => ({}));
    let rawPath = typeof body.path === "string" ? body.path : "/";
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 300) : null;

    // Normalizar la ruta eliminando el prefijo de idioma (/es o /en) para unificar métricas de pantalla
    const cleanPath = rawPath.replace(/^\/(es|en)(\/|$)/, "/") || "/";

    // Detectar tipo de dispositivo desde el User-Agent
    const ua = req.headers.get("user-agent") || "";
    let device = "Desktop";
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      device = "Tablet";
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
      device = "Mobile";
    }

    // Identificar usuario si está autenticado
    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      userId = clerkId || null;
    } catch {}

    const id = `pv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "PageViewLog" ("id", "path", "userId", "referrer", "device", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      id,
      cleanPath,
      userId,
      referrer,
      device
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Falla silenciosa para no bloquear al usuario
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
