"use client";

// Pantalla: Lista de materiales por obra
// Ubicación en el proyecto:  app/lista-materiales/page.jsx
//
// El usuario sube el Word de OP 2.1 y ve los materiales consolidados de toda la obra.
// Primera versión simple: solo materiales agrupados por código. La separación de
// vidrios (cortar vs. pedir) y la conversión a barras las agregamos en el próximo paso.

import { useState } from "react";

// Pequeño helper para mostrar números con coma decimal (formato argentino)
function num(n, decimales = 2) {
  return Number(n).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  });
}

export default function ListaMaterialesPage() {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  async function procesar() {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      // Ruta relativa (importante para que funcione también en producción)
      const res = await fetch("/api/op21/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detalle || data.error || "No se pudo procesar el archivo.");
        return;
      }

      setResultado(data);
    } catch (e) {
      setError("Error de conexión: " + String(e.message || e));
    } finally {
      setCargando(false);
    }
  }

  // Separamos los materiales por tipo para mostrarlos en tablas distintas
  const perfiles = resultado?.materiales.filter((m) => m.tipo === "perfil") || [];
  const vidrios = resultado?.materiales.filter((m) => m.tipo === "vidrio") || [];
  const camaras = resultado?.materiales.filter((m) => m.tipo === "camara") || [];
  const accesorios = resultado?.materiales.filter((m) => m.tipo === "accesorio") || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Lista de materiales por obra</h1>
      <p className="text-gray-500 mb-6">
        Subí el Parte de Producción (Word) que exportás desde OP 2.1 y el sistema
        consolida todos los materiales de la obra en una sola lista.
      </p>

      {/* Zona de carga */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 bg-gray-50">
        <input
          type="file"
          accept=".docx"
          onChange={(e) => {
            setArchivo(e.target.files?.[0] || null);
            setResultado(null);
            setError(null);
          }}
          className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
            file:text-sm file:font-semibold file:bg-blue-600 file:text-white
            hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
        />

        {archivo && (
          <p className="mt-3 text-sm text-gray-600">
            Archivo seleccionado: <span className="font-medium">{archivo.name}</span>
          </p>
        )}

        <button
          onClick={procesar}
          disabled={!archivo || cargando}
          className="mt-4 px-5 py-2 rounded-md bg-blue-600 text-white font-medium
            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {cargando ? "Procesando..." : "Procesar archivo"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="space-y-8">
          {/* Datos de la orden */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DatoOrden etiqueta="Cliente" valor={resultado.orden.cliente} />
            <DatoOrden etiqueta="N° de orden" valor={resultado.orden.numero} />
            <DatoOrden etiqueta="Fecha" valor={resultado.orden.fecha} />
            <DatoOrden etiqueta="Plazo de entrega" valor={resultado.orden.plazoEntrega} />
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tarjeta etiqueta="Aberturas" valor={resultado.resumen.aberturas} />
            <Tarjeta etiqueta="Perfiles (metros)" valor={num(resultado.resumen.perfilesMetrosTotales)} />
            <Tarjeta etiqueta="Barras a comprar (6 m)" valor={resultado.resumen.perfilesBarrasTotales} />
            <Tarjeta etiqueta="Vidrios (m²)" valor={num(resultado.resumen.vidriosM2Totales)} />
          </div>

          {/* Perfiles */}
          {perfiles.length > 0 && (
            <Seccion titulo="Perfiles">
              <Tabla columnas={["Código", "Descripción", "Piezas", "Metros totales", "Barras (6 m)"]}>
                {perfiles.map((m) => (
                  <tr key={m.codigo} className="border-t border-gray-100">
                    <Td className="font-mono">{m.codigo}</Td>
                    <Td>{m.descripcion}</Td>
                    <Td className="text-right">{m.piezas}</Td>
                    <Td className="text-right">{num(m.metros)} m</Td>
                    <Td className="text-right font-semibold">{m.barras}</Td>
                  </tr>
                ))}
              </Tabla>
            </Seccion>
          )}

          {/* Vidrios */}
          {vidrios.length > 0 && (
            <Seccion titulo="Vidrios">
              <Tabla columnas={["Código", "Descripción", "Paños", "Superficie"]}>
                {vidrios.map((m) => (
                  <tr key={m.codigo} className="border-t border-gray-100">
                    <Td className="font-mono">{m.codigo}</Td>
                    <Td>{m.descripcion}</Td>
                    <Td className="text-right">{m.panos}</Td>
                    <Td className="text-right">{num(m.m2Total)} m²</Td>
                  </tr>
                ))}
              </Tabla>
            </Seccion>
          )}

          {/* Cámara / separadores */}
          {camaras.length > 0 && (
            <Seccion titulo="Cámara (separador DVH)">
              <Tabla columnas={["Código", "Descripción", "Metros lineales"]}>
                {camaras.map((m) => (
                  <tr key={m.codigo} className="border-t border-gray-100">
                    <Td className="font-mono">{m.codigo}</Td>
                    <Td>{m.descripcion}</Td>
                    <Td className="text-right">{num(m.metrosLineales)} m</Td>
                  </tr>
                ))}
              </Tabla>
            </Seccion>
          )}

          {/* Accesorios */}
          {accesorios.length > 0 && (
            <Seccion titulo="Accesorios y burletes">
              <Tabla columnas={["Código", "Descripción", "Cantidad"]}>
                {accesorios.map((m) => (
                  <tr key={m.codigo} className="border-t border-gray-100">
                    <Td className="font-mono">{m.codigo}</Td>
                    <Td>{m.descripcion}</Td>
                    <Td className="text-right">{num(m.cantidad)}</Td>
                  </tr>
                ))}
              </Tabla>
            </Seccion>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- componentes auxiliares (en el mismo archivo para simplificar) ----------

function DatoOrden({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase">{etiqueta}</p>
      <p className="text-sm font-medium text-gray-800">{valor || "—"}</p>
    </div>
  );
}

function Tarjeta({ etiqueta, valor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-400 uppercase">{etiqueta}</p>
      <p className="text-2xl font-bold text-gray-800">{valor}</p>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{titulo}</h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Tabla({ columnas, children }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 text-gray-500">
          {columnas.map((c, i) => (
            <th
              key={c}
              className={`px-4 py-2 font-medium ${i >= 2 ? "text-right" : "text-left"}`}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-2 text-gray-700 ${className}`}>{children}</td>;
}