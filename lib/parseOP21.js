import mammoth from "mammoth";

// Largo de cada barra de perfil, en metros (Opción A: división simple).
// Si en el futuro algún perfil viene en otra medida, se contempla por código.
const LARGO_BARRA_METROS = 6;

// ---------- utilidades ----------

// Convierte "5,24" -> 5.24 ; "9,58Kgs" -> 9.58 ; "" -> 0
function aNumero(txt) {
  if (!txt) return 0;
  const limpio = String(txt).replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

// Saca el texto de cada <td> de una fila <tr>
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

// ---------- parser principal ----------

export function parsearHtmlOP21(html) {
  // metadata de la orden (best-effort)
  const textoPlano = html.replace(/<[^>]+>/g, " ");
  const numero = (textoPlano.match(/N°\s*([A-Za-z0-9-]+)/) || [])[1] || null;
  const fecha = (textoPlano.match(/Fecha\s+(\d{2}\/\d{2}\/\d{4})/) || [])[1] || null;
  const plazo = (textoPlano.match(/Plazo de Entrega:\s*([^.]+)\./) || [])[1]?.trim() || null;

  const filas = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];

  let cliente = null;
  let vioSres = false;

  const aberturas = [];
  let aberturaActual = null;

  // acumulador de materiales por codigo
  const mapa = new Map();

  function acumular(item) {
    const clave = item.codigo;
    if (!mapa.has(clave)) {
      mapa.set(clave, {
        codigo: item.codigo,
        descripcion: item.descripcion,
        tipo: item.tipo,
        piezas: 0, mmTotal: 0,        // perfil
        panos: 0, m2Total: 0,          // vidrio
        metrosLineales: 0,             // camara / burletes
        cantidad: 0,                   // accesorio
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

    // 1) cliente: la fila siguiente a "Sres."
    if (primera === "Sres.") { vioSres = true; continue; }
    if (vioSres && !cliente && /[A-Za-z]/.test(primera) && !/^Fecha|^N°|^Plazo|^P A R T E/.test(primera)) {
      cliente = primera.replace(/\s+\d{2}\s+\d{2}\s+\d{4}\s*$/, "").trim();
      continue;
    }

    // 2) título de sección (empieza con ".")
    if (/^\.\s/.test(primera)) continue; // solo informativo, el tipo lo deducimos por fila

    // 3) líneas de totales
    if (/^(KILOGRAMOS DE PERFILES|M2 DE REVESTIMIENTOS|SUPERFICIE DE REVESTIMIENTOS)/i.test(primera)) {
      continue;
    }

    // 4) ¿es una fila de ítem? -> la celda 0 está vacía y la celda 1 tiene un código
    const codigo = c[1] || "";
    const esItem = c[0] === "" && /^[A-Za-z0-9]+$/.test(codigo);

    if (!esItem) {
      // ¿es cabecera de abertura?  ej: ["1","VC1","CORREDIZA..."] o ["","","b) PF2..."]
      const desc = c[2] || c[1] || c[0] || "";
      const esAbertura =
        /^[A-Z]{1,3}\d{1,3}$/.test(c[1] || "") ||              // VC1, PF2
        /^[a-d]\)\s/.test(desc) ||                              // a) b) c) d)
        /CORREDIZA|PAÑO FIJO|VENTILUZ|TAPAJUNTAS Y PREMARCOS|ACOPLES/i.test(desc);
      if (esAbertura && desc) {
        aberturaActual = { codigo: (c[1] || "").trim() || null, descripcion: desc, items: [] };
        aberturas.push(aberturaActual);
      }
      continue;
    }

    // ---- es un ítem: deducimos el tipo por la forma de la fila ----
    const descripcion = c[2] || "";
    const col3 = c[3] || ""; // cantidad
    const col4 = c[4] || ""; // largo (mm) o medida (WxH)
    const col5 = c[5] || ""; // angulo (90/90) o posición ([1] ViInter)

    // Mano de obra -> NO es stock, se ignora
    if (/^KF/i.test(codigo)) continue;

    let item;
    if (/^\d+\/\d+$/.test(col5)) {
      // PERFIL: tiene ángulo. cantidad x largo(mm)
      const piezas = aNumero(col3);
      const largo = aNumero(col4);
      item = { codigo, descripcion, tipo: "perfil",
               piezas, mmTotal: piezas * largo };
    } else if (/^\d+\s*x\s*\d+$/i.test(col4)) {
      // VIDRIO: medida WxH en mm
      const panos = aNumero(col3);
      const [w, h] = col4.toLowerCase().split("x").map((s) => parseFloat(s));
      item = { codigo, descripcion, tipo: "vidrio",
               panos, m2Total: panos * (w * h) / 1_000_000 };
    } else if (/^cmr/i.test(codigo) || /Cám/i.test(descripcion)) {
      // CÁMARA (separador DVH): metros lineales en col3
      item = { codigo, descripcion, tipo: "camara", metrosLineales: aNumero(col3) };
    } else {
      // ACCESORIO / burlete: cantidad en col3 (unidades o metros segun el item)
      item = { codigo, descripcion, tipo: "accesorio", cantidad: aNumero(col3) };
    }

    if (aberturaActual) aberturaActual.items.push(item);
    acumular(item);
  }

  const materiales = [...mapa.values()];

  // Para los perfiles, agregamos metros y barras (Opción A: metros / 6, redondeado para arriba)
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
      vidriosM2Totales: +(materiales.filter(m=>m.tipo==="vidrio").reduce((s,m)=>s+m.m2Total,0)).toFixed(2),
      perfilesBarrasTotales: materiales.filter(m=>m.tipo==="perfil").reduce((s,m)=>s+Math.ceil((m.mmTotal/1000)/LARGO_BARRA_METROS),0),
    },
    materiales,
    aberturas,
  };
}

export async function parsearArchivoOP21(rutaOContenido) {
  const opciones = typeof rutaOContenido === "string"
    ? { path: rutaOContenido }
    : { buffer: rutaOContenido };
  const { value: html } = await mammoth.convertToHtml(opciones);
  if (!/<table>/.test(html)) {
    throw new Error("El documento no contiene tablas. Puede que OP 2.1 use otro formato; enviá el .docx real para ajustar el parser.");
  }
  return parsearHtmlOP21(html);
}