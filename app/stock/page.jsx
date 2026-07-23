'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const UNIDADES = ['Unidad', 'Barra', 'Metro', 'Kilo', 'm²', 'Caja', 'Plancha']

function StockContenido() {
  const searchParams = useSearchParams()
  const filtroBajo = searchParams.get('filtro') === 'bajo'

  const [productos, setProductos] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [reponiendo, setReponiendo] = useState(null)
  const [cantidadReponer, setCantidadReponer] = useState('')
  const [nuevo, setNuevo] = useState({ nombre: '', unidad: 'Unidad', stock_actual: '', stock_minimo: '', categoria: 'materia_prima', precio_sin_colocacion: '', precio_con_colocacion: '', grupo: '' })
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [stockEdit, setStockEdit] = useState({})
  const [guardandoStock, setGuardandoStock] = useState(null)
  const [minimoEdit, setMinimoEdit] = useState({})
  const [guardandoMinimo, setGuardandoMinimo] = useState(null)

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProductos(data)
  }

  async function agregarProducto() {
    if (!nuevo.nombre) {
      setMensaje('El nombre es obligatorio.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevo.nombre,
        unidad: nuevo.unidad,
        stock_actual: Number(nuevo.stock_actual) || 0,
        stock_minimo: Number(nuevo.stock_minimo) || 0,
        categoria: nuevo.categoria,
        precio_sin_colocacion: nuevo.precio_sin_colocacion,
        precio_con_colocacion: nuevo.precio_con_colocacion,
        grupo: nuevo.grupo
      })
    })
    if (res.ok) {
      const creado = await res.json()
      setProductos((prev) => [...prev, creado])
      setNuevo({ nombre: '', unidad: 'Unidad', stock_actual: '', stock_minimo: '', categoria: 'materia_prima', precio_sin_colocacion: '', precio_con_colocacion: '', grupo: '' })
      setMostrarFormulario(false)
      setMensaje('✓ Producto agregado')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function guardarEdicion() {
    if (!editando.nombre) {
      setMensaje('El nombre es obligatorio.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editando.id,
        nombre: editando.nombre,
        unidad: editando.unidad,
        stock_actual: editando.stock_actual,
        stock_minimo: editando.stock_minimo,
        categoria: editando.categoria,
        precio_sin_colocacion: editando.precio_sin_colocacion,
        precio_con_colocacion: editando.precio_con_colocacion,
        grupo: editando.grupo
      })
    })
    if (res.ok) {
      const actualizado = await res.json()
      setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
      setEditando(null)
      setMensaje('✓ Producto actualizado')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function reponerStock() {
    const cantidad = Number(cantidadReponer)
    if (!cantidad || cantidad <= 0) return
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reponiendo.id,
        cantidad: cantidad
      })
    })
    if (res.ok) {
      const actualizado = await res.json()
      setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
      setMensaje(`✓ Se agregaron ${cantidad} a ${reponiendo.nombre}`)
      setReponiendo(null)
      setCantidadReponer('')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function guardarStockDirecto(producto) {
    const valor = stockEdit[producto.id]
    if (valor === undefined || valor === '' || Number(valor) === Number(producto.stock_actual)) return
    setGuardandoStock(producto.id)
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: producto.id, set_stock: valor })
      })
      if (res.ok) {
        const actualizado = await res.json()
        setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
        setStockEdit((prev) => {
          const copia = { ...prev }
          delete copia[producto.id]
          return copia
        })
      }
    } finally {
      setGuardandoStock(null)
    }
  }

  async function guardarMinimoDirecto(producto) {
    const valor = minimoEdit[producto.id]
    if (valor === undefined || valor === '' || Number(valor) === Number(producto.stock_minimo)) return
    setGuardandoMinimo(producto.id)
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: producto.id, set_stock_minimo: valor })
      })
      if (res.ok) {
        const actualizado = await res.json()
        setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
        setMinimoEdit((prev) => {
          const copia = { ...prev }
          delete copia[producto.id]
          return copia
        })
      }
    } finally {
      setGuardandoMinimo(null)
    }
  }

  async function eliminarProducto(id, nombre) {
    if (!confirm(`¿Seguro que querés eliminar "${nombre}"?`)) return
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setProductos((prev) => prev.filter((p) => p.id !== id))
        setMensaje(`✓ "${nombre}" eliminado`)
      } else {
        setMensaje('No se pudo eliminar: el producto tiene compras o ventas registradas')
      }
    } catch (e) {
      setMensaje('No se pudo eliminar')
    } finally {
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  async function enviarAlerta() {
    const res = await fetch('/api/alertas', { method: 'POST' })
    const data = await res.json()
    setMensaje(data.mensaje || data.error)
    setTimeout(() => setMensaje(''), 4000)
  }

  function formatearPrecio(valor) {
    if (valor === null || valor === undefined || valor === '') return '-'
    return `$${Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }

  const productosFiltrados = productos.filter((p) => {
    // Si venimos del dashboard con ?filtro=bajo, mostrar solo los que están bajos
    if (filtroBajo && Number(p.stock_actual) > Number(p.stock_minimo)) return false

    const texto = busqueda.trim().toLowerCase()
    if (!texto) return true
    return (
      p.nombre?.toLowerCase().includes(texto) ||
      p.grupo?.toLowerCase().includes(texto)
    )
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stock / Inventario</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={enviarAlerta}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
          >
            🔔 Enviar alerta stock
          </button>
          <button
            onClick={() => { setMostrarFormulario(!mostrarFormulario); setEditando(null) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Agregar producto
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o grupo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border rounded-lg pl-10 pr-4 py-2 text-sm text-gray-800 bg-white w-full shadow-sm"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {mensaje && <p className="mb-4 text-green-600 text-sm font-medium">{mensaje}</p>}

      {filtroBajo && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-sm text-red-700 font-medium">⚠ Mostrando solo productos con stock bajo</span>
          <a href="/stock" className="text-sm text-blue-600 hover:underline">Ver todos</a>
        </div>
      )}

      <p className="text-xs text-gray-500 mb-3">
        💡 Tip: para cargar el stock real, tocá directamente el número en la columna "Stock" de la tabla, escribí la cantidad y presioná Enter o el botón 💾.
      </p>

      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nuevo producto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre del producto</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: Perfil ADR2200" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unidad de medida</label>
              <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock actual</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: 20" type="number" value={nuevo.stock_actual} onChange={(e) => setNuevo({ ...nuevo, stock_actual: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock mínimo</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: 5" type="number" value={nuevo.stock_minimo} onChange={(e) => setNuevo({ ...nuevo, stock_minimo: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Precio sin colocación</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: 15000" type="number" step="any" value={nuevo.precio_sin_colocacion} onChange={(e) => setNuevo({ ...nuevo, precio_sin_colocacion: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Precio con colocación</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: 18000" type="number" step="any" value={nuevo.precio_con_colocacion} onChange={(e) => setNuevo({ ...nuevo, precio_con_colocacion: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Grupo</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: Float incoloro, Perfiles..." value={nuevo.grupo} onChange={(e) => setNuevo({ ...nuevo, grupo: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
              <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}>
                <option value="materia_prima">🔧 Materia prima (aluminio, herrajes, etc.)</option>
                <option value="mercaderia">🪟 Mercadería para reventa (vidrio, etc.)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={agregarProducto} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Guardar</button>
            <button onClick={() => setMostrarFormulario(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      {editando && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6 border-l-4 border-yellow-400">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Editar producto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre del producto</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unidad de medida</label>
              <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={editando.unidad || 'Unidad'} onChange={(e) => setEditando({ ...editando, unidad: e.target.value })}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock actual</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="number" value={editando.stock_actual ?? ''} onChange={(e) => setEditando({ ...editando, stock_actual: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock mínimo</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="number" value={editando.stock_minimo ?? ''} onChange={(e) => setEditando({ ...editando, stock_minimo: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Precio sin colocación</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="number" step="any" value={editando.precio_sin_colocacion ?? ''} onChange={(e) => setEditando({ ...editando, precio_sin_colocacion: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Precio con colocación</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="number" step="any" value={editando.precio_con_colocacion ?? ''} onChange={(e) => setEditando({ ...editando, precio_con_colocacion: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Grupo</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={editando.grupo ?? ''} onChange={(e) => setEditando({ ...editando, grupo: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
              <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={editando.categoria || 'materia_prima'} onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}>
                <option value="materia_prima">🔧 Materia prima (aluminio, herrajes, etc.)</option>
                <option value="mercaderia">🪟 Mercadería para reventa (vidrio, etc.)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={guardarEdicion} className="bg-yellow-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-yellow-600">Guardar cambios</button>
            <button onClick={() => setEditando(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      {reponiendo && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Reponer stock — {reponiendo.nombre}</h2>
          <p className="text-sm text-gray-500 mb-4">Stock actual: <strong>{reponiendo.stock_actual}</strong> {reponiendo.unidad}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full sm:w-48"
              type="number"
              placeholder="Cantidad a agregar"
              value={cantidadReponer}
              onChange={(e) => setCantidadReponer(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={reponerStock} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Confirmar</button>
              <button onClick={() => { setReponiendo(null); setCantidadReponer('') }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full min-w-[1040px] text-xs">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Producto</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Grupo</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Categoría</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Unidad</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Stock</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Mínimo</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Sin coloc.</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Con coloc.</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Estado</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => {
              const valorStockEnEdicion = stockEdit[p.id]
              const hayEdicionPendiente = valorStockEnEdicion !== undefined && Number(valorStockEnEdicion) !== Number(p.stock_actual)
              return (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-800 whitespace-nowrap">{p.nombre}</td>
                  <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{p.grupo || '-'}</td>
                  <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">
                    {p.categoria === 'mercaderia' ? '🪟 Mercadería' : '🔧 M. prima'}
                  </td>
                  <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{p.unidad}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        value={valorStockEnEdicion !== undefined ? valorStockEnEdicion : p.stock_actual}
                        onChange={(e) => setStockEdit((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') guardarStockDirecto(p) }}
                        className={`border rounded px-2 py-1 text-xs w-20 bg-white ${hayEdicionPendiente ? 'border-blue-400 text-blue-700 font-medium' : 'border-gray-200 text-gray-800'}`}
                      />
                      {hayEdicionPendiente && (
                        <button
                          onClick={() => guardarStockDirecto(p)}
                          disabled={guardandoStock === p.id}
                          className="bg-blue-100 text-blue-600 px-1.5 py-1 rounded hover:bg-blue-200 disabled:bg-gray-200"
                          title="Guardar stock"
                        >
                          {guardandoStock === p.id ? '...' : '💾'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        value={minimoEdit[p.id] !== undefined ? minimoEdit[p.id] : p.stock_minimo}
                        onChange={(e) => setMinimoEdit((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') guardarMinimoDirecto(p) }}
                        className={`border rounded px-2 py-1 text-xs w-16 bg-white ${minimoEdit[p.id] !== undefined && Number(minimoEdit[p.id]) !== Number(p.stock_minimo) ? 'border-blue-400 text-blue-700 font-medium' : 'border-gray-200 text-gray-500'}`}
                      />
                      {minimoEdit[p.id] !== undefined && Number(minimoEdit[p.id]) !== Number(p.stock_minimo) && (
                        <button
                          onClick={() => guardarMinimoDirecto(p)}
                          disabled={guardandoMinimo === p.id}
                          className="bg-blue-100 text-blue-600 px-1.5 py-1 rounded hover:bg-blue-200 disabled:bg-gray-200"
                          title="Guardar mínimo"
                        >
                          {guardandoMinimo === p.id ? '...' : '💾'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{formatearPrecio(p.precio_sin_colocacion)}</td>
                  <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{formatearPrecio(p.precio_con_colocacion)}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {Number(p.stock_actual) <= Number(p.stock_minimo) ? (
                      <span className="bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">⚠ Bajo</span>
                    ) : (
                      <span className="bg-green-100 text-green-600 font-medium px-2 py-0.5 rounded-full">✓ Normal</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex gap-1 flex-nowrap">
                      <button
                        onClick={() => { setReponiendo(p); setCantidadReponer(''); setEditando(null); setMostrarFormulario(false) }}
                        className="bg-blue-100 text-blue-600 font-medium px-2 py-0.5 rounded-full hover:bg-blue-200 whitespace-nowrap"
                      >
                        + Reponer
                      </button>
                      <button
                        onClick={() => { setEditando(p); setReponiendo(null); setMostrarFormulario(false) }}
                        className="bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full hover:bg-yellow-200 whitespace-nowrap"
                      >
                        ✏ Editar
                      </button>
                      <button
                        onClick={() => eliminarProducto(p.id, p.nombre)}
                        className="bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full hover:bg-red-200 whitespace-nowrap"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-gray-400">
                  {busqueda ? `No se encontraron productos para "${busqueda}"` : filtroBajo ? 'No hay productos con stock bajo. ¡Todo en orden! ✓' : 'No hay productos cargados todavía.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {busqueda && productosFiltrados.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">{productosFiltrados.length} de {productos.length} productos</p>
      )}
    </div>
  )
}

export default function Stock() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Cargando...</div>}>
      <StockContenido />
    </Suspense>
  )
}