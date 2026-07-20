// ----- PANTALLA: celular vinculado -----
  if (estado === 'vinculado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl mx-auto mb-6">
            {empleadoVinculado?.nombre?.[0]}{empleadoVinculado?.apellido?.[0]}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Hola, {empleadoVinculado?.nombre}
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            {yaIngreso ? 'Tocá el botón para registrar tu salida' : 'Tocá el botón para registrar tu ingreso'}
          </p>

          {/* Checkbox solo si va a salir */}
          {yaIngreso && (
            <div className="bg-white rounded-lg p-4 mb-6 text-left border border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noAlmorzo}
                  onChange={(e) => setNoAlmorzo(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">No almorcé (+0.5h)</span>
              </label>
            </div>
          )}

          <button
            onClick={marcar}
            disabled={procesando}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {procesando ? 'Registrando...' : 'Marcar'}
          </button>
        </div>
      </div>
    )
  }