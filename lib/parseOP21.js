import mammoth from "mammoth";
import JSZip from "jszip";

const LARGO_BARRA_METROS = 6;

function aNumero(txt) {
  if (!txt) return 0;
  const limpio = String(txt).replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

function celdasDeFila(filaHtml) {
  const celdas = [];
  const re = /<td[^>]*>([\s\S]*?)<\/td>/g;
  let m;
  while ((m = re.exec(filaHtml)) !== null) {
    const texto = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    celdas.push(texto);
  }
  return celdas;
}

export function parsearHtmlOP21(html) {
  const textoPlano = html.replace(/<[^>]+>/g, " ");
  const numero = (textoPlano.match(/N°\s*([A-Za-z0-9-]+)/) || [])[1] || null;
  const fecha = (textoPlano.match(/Fecha\s+(\d{2}\/\d{2}\/\d{4})/) || [])[1] || null;
  const plazo = (textoPlano.match(/Plazo de Entrega:\s*([^.]+)\./) || [])[1]?.trim() || null;

  const filas = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
  let cliente = null;
  let vioSres = false;
  const aberturas = [];
  let aberturaActual = null;
  const mapa = new Map();

  function acumular(item) {
    const clave = item.codigo;
    if (!mapa.has(clave)) {
      mapa.set(clave, {
        codigo: item.codigo, descripcion: item.descripcion, tipo: item.tipo,
        piezas: 0, mmTotal: 0, panos: 0, m2Total: 0, metrosLineales: 0, cantidad: 0,
      });
    }
    const acc = mapa.get(clave);
    acc.piezas += item.piezas || 0;
    acc.mmTotal += item.mmTotal || 0;
    acc.panos += item.panos || 0;
    acc.m2Total += item.m2Total || 0;
    acc.metrosLineales += item.metrosLineales || 0;
    acc.cantidad += item.cantidad || 0;
  }

  for (const fila of filas) {
    const c = celdasDeFila(fila);
    const noVacias = c.filter((x) => x !== "");
    if (noVacias.length === 0) continue;
    const primera = c.find((x) => x !== "") || "";

    if (primera === "Sres.") { vioSres = true; continue; }
    if (vioSres && !cliente && /[A-Za-z]/.test(primera) && !/^Fecha|^N°|^Plazo|^P A R T E/.test(primera)) {
      cliente = primera.replace(/\s+\d{2}\s+\d{2}\s+\d{4}\s*$/, "").trim();
      continue;
    }
    if (/^\.\s/.test(primera)) continue;
    if (/^(KILOGRAMOS DE PERFILES|M2 DE REVESTIMIENTOS|SUPERFICIE DE REVESTIMIENTOS)/i.test(primera)) continue;

    const codigo = c[1] || "";
    const esItem = c[0] === "" && /^[A-Za-z0-9]+$/.test(codigo);

    if (!esItem) {
      const desc = c[2] || c[1] || c[0] || "";
      const esAbertura =
        /^[A-Z]{1,3}\d{1,3}$/.test(c[1] || "") ||
        /^[a-d]\)\s/.test(desc) ||
        /CORREDIZA|PAÑO FIJO|VENTILUZ|TAPAJUNTAS Y PREMARCOS|ACOPLES/i.test(desc);
      if (esAbertura && desc) {
        aberturaActual = { codigo: (c[1] || "").trim() || null, descripcion: desc, items: [] };
        aberturas.push(aberturaActual);
      }
      continue;
    }

    const descripcion = c[2] || "";
    const col3 = c[3] || "";
    const col4 = c[4] || "";
    const col5 = c[5] || "";
    if (/^KF/i.test(codigo)) continue;

    let item;
    if (/^\d+\/\d+$/.test(col5)) {
      const piezas = aNumero(col3);
      const largo = aNumero(col4);
      item = { codigo, descripcion, tipo: "perfil", piezas, mmTotal: piezas * largo };
    } else if (/^\d+\s*x\s*\d+$/i.test(col4)) {
      const panos = aNumero(col3);
      const [w, h] = col4.toLowerCase().split("x").map((s) => parseFloat(s));
      item = { codigo, descripcion, tipo: "vidrio", panos, m2Total: panos * (w * h) / 1_000_000 };
    } else if (/^cmr/i.test(codigo) || /Cám/i.test(descripcion)) {
      item = { codigo, descripcion, tipo: "camara", metrosLineales: aNumero(col3) };
    } else {
      item = { codigo, descripcion, tipo: "accesorio", cantidad: aNumero(col3) };
    }

    if (aberturaActual) aberturaActual.items.push(item);
    if (item.tipo !== "vidrio") acumular(item);
  }

  const materiales = [...mapa.values()];

  const vidriosCortarMap = new Map();
  const vidriosPedirMap = new Map();
  function acumularVidrio(map, it, destino) {
    if (!map.has(it.codigo)) {
      map.set(it.codigo, { codigo: it.codigo, descripcion: it.descripcion, destino, panos: 0, m2Total: 0 });
    }
    const acc = map.get(it.codigo);
    acc.panos += it.panos || 0;
    acc.m2Total += it.m2Total || 0;
  }
  for (const ab of aberturas) {
    const esDVH = ab.items.some((it) => it.tipo === "camara");
    for (const it of ab.items) {
      if (it.tipo !== "vidrio") continue;
      if (esDVH) acumularVidrio(vidriosPedirMap, it, "pedir");
      else acumularVidrio(vidriosCortarMap, it, "cortar");
    }
  }
  const vidriosACortar = [...vidriosCortarMap.values()];
  const vidriosAPedir = [...vidriosPedirMap.values()];

  for (const m of materiales) {
    if (m.tipo === "perfil") {
      m.metros = +(m.mmTotal / 1000).toFixed(2);
      m.barras = Math.ceil(m.metros / LARGO_BARRA_METROS);
    }
  }

  return {
    orden: { cliente, numero, fecha, plazoEntrega: plazo },
    resumen: {
      aberturas: aberturas.length,
      codigosDistintos: materiales.length,
      perfilesMetrosTotales: +(materiales.filter(m=>m.tipo==="perfil").reduce((s,m)=>s+m.mmTotal,0)/1000).toFixed(2),
      vidriosM2ACortar: +(vidriosACortar.reduce((s,m)=>s+m.m2Total,0)).toFixed(2),
      vidriosM2APedir: +(vidriosAPedir.reduce((s,m)=>s+m.m2Total,0)).toFixed(2),
      perfilesBarrasTotales: materiales.filter(m=>m.tipo==="perfil").reduce((s,m)=>s+Math.ceil((m.mmTotal/1000)/LARGO_BARRA_METROS),0),
    },
    materiales, vidriosACortar, vidriosAPedir, aberturas,
  };
}

// Lee el encabezado del .docx (word/headerN.xml), que mammoth no incluye.
async function leerEncabezado(buffer) {
  const datos = { cliente: null, numero: null, fecha: null, plazoEntrega: null };
  try {
    const zip = await JSZip.loadAsync(buffer);
    const nombresHeader = Object.keys(zip.files).filter((n) => /word\/header\d*\.xml$/i.test(n));
    let texto = "";
    for (const nombre of nombresHeader) {
      const xml = await zip.files[nombre].async("string");
      texto += " " + xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    }
    texto = texto.trim();
    if (texto) {
      datos.numero = (texto.match(/N°\s*([A-Za-z0-9-]+)/) || [])[1] || null;
      datos.fecha = (texto.match(/Fecha\s+(\d{2}\/\d{2}\/\d{4})/) || [])[1] || null;
      datos.plazoEntrega = (texto.match(/Plazo de Entrega:\s*([^.]+\))/) || [])[1]?.trim() || null;
      const m = texto.match(/N°\s*[A-Za-z0-9-]+\s+(.+?)\s+\d{2}\s+\d{2}\s+\d{4}/);
      if (m) datos.cliente = m[1].trim();
    }
  } catch {
    // si falla la lectura del encabezado, seguimos sin estos datos
  }
  return datos;
}

export async function parsearArchivoOP21(rutaOContenido) {
  const opciones = typeof rutaOContenido === "string"
    ? { path: rutaOContenido }
    : { buffer: rutaOContenido };
  const { value: html } = await mammoth.convertToHtml(opciones);
  if (!/<table>/.test(html)) {
    throw new Error("El documento no contiene tablas. Puede que OP 2.1 use otro formato; enviá el .docx real para ajustar el parser.");
  }
  const resultado = parsearHtmlOP21(html);

  // Completar datos de la orden desde el encabezado del Word
  let buffer = rutaOContenido;
  if (typeof rutaOContenido === "string") {
    const fs = await import("fs/promises");
    buffer = await fs.readFile(rutaOContenido);
  }
  const enc = await leerEncabezado(buffer);
  resultado.orden = {
    cliente: resultado.orden.cliente || enc.cliente,
    numero: resultado.orden.numero || enc.numero,
    fecha: resultado.orden.fecha || enc.fecha,
    plazoEntrega: resultado.orden.plazoEntrega || enc.plazoEntrega,
  };

  return resultado;
}