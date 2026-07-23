'use client'

import { useState, useEffect } from 'react'

const UNIDADES = ['Unidad', 'Barra', 'Metro', 'Kilo', 'm²', 'Caja', 'Plancha']

function itemVacio() {
  return {
    producto_id: '',        // id del producto existente, o ''
    esNuevo: false,         // si es un producto a crear
    nuevo_producto: { nombre: '', unidad: 'Unidad', categoria: 'materia_prima', stock_minimo: '' },
    cantidad: '',
    precio_unitario: '',
    busquedaProducto: '',   // texto para filtrar el selector de este ítem
  }
}

export default function Compras() {
  const [productos, setProductos] = useState([])
  const [compras, setCompras] = useState([])
  const [proveedor, setProveedor] = useState('')
  const [tipo, setTipo] = useState('factura')
  const [observaciones, setObservaciones] = useState('')
  const [items, setItems] = useState([itemVacio()])
  const [mensaje, setMensaje] = useState('')
  const [busquedaHistorial, setBusquedaHistorial] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [prod, comp] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/compras').then(r => r.json()),
    ])
    setProductos(prod)
    setCompras(comp)
  }

  function actualizarItem(index, campo, valor) {
    const nuevos = [...items]
    nuevos[index][campo] = valor
    setItems(nuevos)
  }

  function actualizarNuevoProducto(index, campo, valor) {
    const nuevos = [...items]
    nuevos[index].nuevo_producto[campo] = valor
    setItems(nuevos)
  }

  // Cuando cambia el desplegable de producto
  function cambiarProducto(index, valor) {
    const nuevos = [...items]
    if (valor === '__nuevo__') {
      nuevos[index].esNuevo = true
      nuevos[index].producto_id = ''
    } else {
      nuevos[index].esNuevo = false
      nuevos[index].producto_id = valor
    }
    setItems(nuevos)
  }

  function agregarItem() {
    setItems([...items, itemVacio()])
  }

  function eliminarItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  // Productos filtrados para el selector de un ítem puntual, según su búsqueda
  function productosFiltradosPara(item) {
    const texto = item.busquedaProducto.trim().toLowerCase()
    if (!texto) return productos
    return productos.filter((p) =>
      p.nombre?.toLowerCase().includes(texto) || p.grupo?.toLowerCase().includes(texto)
    )
  }

  const total = items.reduce(
    (sum, item) => sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario) || 0),
    0
  )

  async function registrarCompra() {
    for (const item of items) {
      const tieneProducto = item.producto_id || (item.esNuevo && item.nuevo_producto.nombre)
      if (!tieneProducto || !item.cantidad || !item.precio_unitario) {
        setMensaje('Completá producto, cantidad y precio en todos los ítems.')
        setTimeout(() => setMensaje(''), 3000)
        return
      }
    }

    const itemsEnviar = items.map(item => ({
      producto_id: item.esNuevo ? null : Number(item.producto_id),
      nuevo_producto: item.esNuevo ? item.nuevo_producto : null,
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
    }))

    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proveedor, tipo, observaciones, items: itemsEnviar }),
    })

    if (res.ok) {
      setMensaje('✓ Compra registrada correctamente')
      setProveedor('')
      setTipo('factura')
      setObservaciones('')
      setItems([itemVacio()])
      cargarDatos()
      setTimeout(() => setMensaje(''), 3000)
    } else {
      const data = await res.json()
      setMensaje(data.error || 'No se pudo registrar la compra')
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  const comprasFiltradas = compras.filter((c) => {
    const texto = busquedaHistorial.trim().toLowerCase()
    if (!texto) return true
    const enProveedor = c.proveedor?.toLowerCase().includes(texto)
    const enProductos = c.items?.some((it) => it.nombre?.toLowerCase().includes(texto))
    return enProveedor || enProductos
  })

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Compras</h1>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Nueva compra</h2>

        {/* Datos generales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Proveedor</label>
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: Alucor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
            <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="factura">Factura (blanco)</option>
              <option value="remito">Remito (negro)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Observaciones</label>
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Opcional" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
        </div>

        {/* Ítems de la compra */}
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Productos comprados</h3>
        {items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Selector de producto con buscador */}
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Producto</label>

                {item.esNuevo ? (
                  // Modo "producto nuevo": no mostramos el listado, solo el aviso y la salida
                  <div className="flex items-center justify-between gap-2 border-2 border-blue-400 rounded-lg px-3 py-2 bg-blue-50">
                    <span className="text-sm font-medium text-blue-700">➕ Producto nuevo</span>
                    <button
                      onClick={() => cambiarProducto(index, '')}
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Elegir de la lista
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-1.5">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={item.busquedaProducto}
                        onChange={(e) => actualizarItem(index, 'busquedaProducto', e.target.value)}
                        className="border rounded-lg pl-7 pr-3 py-1.5 text-xs text-gray-800 bg-white w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white flex-1 min-w-0"
                        value={item.producto_id}
                        onChange={(e) => cambiarProducto(index, e.target.value)}
                      >
                        <option value="">Elegí un producto... ({productosFiltradosPara(item).length})</option>
                        {productosFiltradosPara(item).map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => cambiarProducto(index, '__nuevo__')}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap"
                        title="Crear un producto que no está en la lista"
                      >
                        + Nuevo
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Cantidad</label>
                <input className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white w-full" type="number" placeholder="0" value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Precio unitario</label>
                <input className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white w-full" type="number" placeholder="0" value={item.precio_unitario} onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)} />
              </div>
            </div>

            {/* Si es producto nuevo, mostrar campos para crearlo */}
            {item.esNuevo && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 bg-blue-50 rounded-lg p-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nombre del nuevo producto</label>
                  <input className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: Perfil ADR2200" value={item.nuevo_producto.nombre} onChange={(e) => actualizarNuevoProducto(index, 'nombre', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Unidad de medida</label>
                  <select className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white w-full" value={item.nuevo_producto.unidad} onChange={(e) => actualizarNuevoProducto(index, 'unidad', e.target.value)}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
                  <select className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white w-full" value={item.nuevo_producto.categoria} onChange={(e) => actualizarNuevoProducto(index, 'categoria', e.target.value)}>
                    <option value="materia_prima">🔧 Materia prima</option>
                    <option value="mercaderia">🪟 Mercadería</option>
                  </select>
                </div>
              </div>
            )}

            {items.length > 1 && (
              <button onClick={() => eliminarItem(index)} className="text-red-500 hover:text-red-700 text-xs mt-2">
                ✕ Quitar este ítem
              </button>
            )}
          </div>
        ))}

        <button onClick={agregarItem} className="text-blue-600 text-sm hover:underline mb-4">
          + Agregar otro producto
        </button>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-2">
          <p className="text-lg font-bold text-gray-800">
            Total: <span className="text-blue-600">${total.toLocaleString('es-AR')}</span>
          </p>
          <button onClick={registrarCompra} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">
            Registrar compra
          </button>
        </div>

        {mensaje && <p className="mt-3 text-green-600 text-sm font-medium">{mensaje}</p>}
      </div>

      {/* Historial de compras */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Historial de compras</h2>

      <div className="mb-4">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por proveedor o producto..."
            value={busquedaHistorial}
            onChange={(e) => setBusquedaHistorial(e.target.value)}
            className="border rounded-lg pl-10 pr-4 py-2 text-sm text-gray-800 bg-white w-full shadow-sm"
          />
          {busquedaHistorial && (
            <button
              onClick={() => setBusquedaHistorial('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full min-w-[750px]">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left px-6 py-3 text-sm">Fecha</th>
              <th className="text-left px-6 py-3 text-sm">Proveedor</th>
              <th className="text-left px-6 py-3 text-sm">Tipo</th>
              <th className="text-left px-6 py-3 text-sm">Productos</th>
              <th className="text-left px-6 py-3 text-sm">Total</th>
              <th className="text-left px-6 py-3 text-sm">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{c.proveedor}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.tipo === 'remito' ? 'Remito' : 'Factura'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {c.items && c.items.length > 0
                    ? c.items.map((it, i) => (
                        <div key={i}>{it.nombre} × {Number(it.cantidad)} {it.unidad}</div>
                      ))
                    : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">${parseFloat(c.total).toLocaleString('es-AR')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.observaciones || '-'}</td>
              </tr>
            ))}
            {comprasFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                  {busquedaHistorial ? `No se encontraron compras para "${busquedaHistorial}"` : 'No hay compras registradas todavía'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {busquedaHistorial && comprasFiltradas.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">{comprasFiltradas.length} de {compras.length} compras</p>
      )}
    </div>
  )
}