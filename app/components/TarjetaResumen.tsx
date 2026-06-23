interface TarjetaResumenProps {
  titulo: string
  valor: string | number
  color: string
}

export default function TarjetaResumen({ titulo, valor, color }: TarjetaResumenProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{valor}</p>
    </div>
  )
}