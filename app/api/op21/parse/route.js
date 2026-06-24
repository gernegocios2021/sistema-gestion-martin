// API que recibe el Word de OP 2.1 SUBIDO desde el navegador y devuelve los materiales.
// Ubicación en el proyecto:  app/api/op21/parse/route.js
//
// A diferencia de la ruta de prueba (que leía un archivo del disco), esta recibe
// el archivo que el usuario sube desde la pantalla. Se llama por POST.

import { NextResponse } from "next/server";
import { parsearArchivoOP21 } from "@/lib/parseOP21";
// Si tu proyecto NO tiene configurado el alias "@/", usá esta línea en su lugar:
// import { parsearArchivoOP21 } from "../../../../lib/parseOP21";

// Necesitamos el runtime de Node (mammoth no funciona en edge)
export const runtime = "nodejs";

export async function POST(request) {
  try {
    // El archivo viene dentro de un FormData, en el campo "archivo"
    const formData = await request.formData();
    const file = formData.get("archivo");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No se recibió ningún archivo." },
        { status: 400 }
      );
    }

    const nombre = file.name || "";
    if (!nombre.toLowerCase().endsWith(".docx")) {
      return NextResponse.json(
        { error: "El archivo debe ser un Word (.docx) exportado desde OP 2.1." },
        { status: 400 }
      );
    }

    // Convertimos el archivo a un Buffer que entiende mammoth
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resultado = await parsearArchivoOP21(buffer);

    return NextResponse.json(resultado, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Error al parsear el documento",
        detalle: String(err.message || err),
      },
      { status: 500 }
    );
  }
}