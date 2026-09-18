import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import type { Notebook } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);

    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para sincronizar tus cuadernos con la nube." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const notebooks: Notebook[] = body.notebooks || [];

    if (!Array.isArray(notebooks)) {
      return NextResponse.json(
        { error: "Formato inválido. Se esperaba un arreglo de cuadernos." },
        { status: 400 }
      );
    }

    const safeNotebooks = notebooks.slice(0, 50);
    let syncedCount = 0;

    for (const nb of safeNotebooks) {
      if (typeof nb.id !== 'string' || nb.id.trim().length === 0) continue;

      const existing = await prisma.notebook.findUnique({ where: { id: nb.id } });
      if (existing && existing.userId !== session.userId) continue;

      const dataJson = JSON.stringify(nb);
      const title = nb.title || "Sin título";
      const category = nb.topic || "General";

      await prisma.notebook.upsert({
        where: { id: nb.id },
        update: {
          title,
          category,
          dataJson,
          status: nb.isArchived ? "archived" : "active",
        },
        create: {
          id: nb.id,
          userId: session.userId,
          title,
          category,
          dataJson,
          status: nb.isArchived ? "archived" : "active",
        },
      });

      syncedCount++;
    }

    return NextResponse.json(
      {
        success: true,
        message: `${syncedCount} cuadernos sincronizados exitosamente con el servidor.`,
        syncedCount,
        syncedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en sync:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar la sincronización en el servidor." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);

    if (!session) {
      return NextResponse.json(
        { error: "No autenticado." },
        { status: 401 }
      );
    }

    const remoteNotebooks = await prisma.notebook.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
    });

    const parsedNotebooks = remoteNotebooks.map((rn) => {
      try {
        return JSON.parse(rn.dataJson);
      } catch {
        return {
          id: rn.id,
          userId: rn.userId,
          title: rn.title,
          topic: rn.category,
          updatedAt: rn.updatedAt.toISOString(),
        };
      }
    });

    return NextResponse.json(
      {
        notebooks: parsedNotebooks,
        count: parsedNotebooks.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener backups remotos:", error);
    return NextResponse.json(
      { error: "Error al recuperar respaldos remotos." },
      { status: 500 }
    );
  }
}
