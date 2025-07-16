'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, CalendarIcon, CurrencyDollarIcon, TagIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Disclosure } from '@headlessui/react'
import { 
  getTicketCount, 
  formatClienteLookup, 
  formatTipoClienteLookup,
  formatKGField,
  formatCurrency,
  formatUnitarios,
  getNumericValue
} from '@/lib/fieldMappings'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LineItemBadges } from '@/components/ui/LineItemBadges'
import { LinkedTicketBadges } from '@/components/ui/LinkedTicketBadges'
import Link from 'next/link';

interface OrdenRecord {
  id: string
  fields: {
    [key: string]: unknown
  }
  createdTime?: string
}

export default function OrdenDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [record, setRecord] = useState<OrdenRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecord = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const response = await fetch(`/api/airtable/ordenes/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Error fetching record')
        }

        const data = await response.json()
        setRecord(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading record')
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [params.id])

  // 🔑 TYPE-SAFE: Helper functions to safely extract values
  const safeString = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    return String(value)
  }

  const safeArrayToStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string')
    }
    return []
  }

  const safeArrayToMixedArray = (value: unknown): Array<string | number> => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string | number => 
        typeof item === 'string' || typeof item === 'number'
      )
    }
    return []
  }

  // Helper to format rollup fields with line breaks
  const formatRollupField = (value: unknown): string => {
    if (!value) return 'Sin datos'
    
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Sin datos'
      return value.map(v => String(v || '')).join('').trim() || 'Sin datos'
    }
    
    return String(value).trim() || 'Sin datos'
  }

  const formatFechaEmisionShort = (fechaArray: string[] | number[] | undefined): string => {
    if (!fechaArray || !Array.isArray(fechaArray) || fechaArray.length === 0) {
      return 'Sin fecha'
    }
    const firstDate = fechaArray[0]
    if (typeof firstDate === 'string') {
      try {
        return new Date(firstDate).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      } catch {
        return String(firstDate)
      }
    }
    return String(firstDate)
  }

  const getTipoClienteStyle = (tipo: string): string => {
    switch (tipo?.toLowerCase()) {
      case 'doméstico':
        return 'bg-green-100 text-green-800'
      case 'comercial':
        return 'bg-blue-100 text-blue-800'
      case 'industrial':
        return 'bg-purple-100 text-purple-800'
      case 'institucional':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoStyle = (estado: string): string => {
    switch (estado) {
      case 'Nueva':
        return 'bg-yellow-100 text-yellow-800'
      case 'En Proceso':
        return 'bg-blue-100 text-blue-800'
      case 'Completada':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver
          </button>
          
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-red-600 mb-4">
              <h2 className="text-xl font-semibold mb-2">Error al cargar la orden</h2>
              <p className="text-gray-600">{error || 'No se encontró la orden solicitada'}</p>
            </div>
            <button
              onClick={() => router.push('/ordenes')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Volver a Órdenes
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 🔑 TYPE-SAFE: Extract all field values safely
  const ordenNumber = safeString(record.fields['Orden'])
  const cliente = safeArrayToMixedArray(record.fields['Cliente'])
  const estado = safeString(record.fields['Estado'])
  const tipoCliente = safeArrayToMixedArray(record.fields['Tipo de Cliente (from Cliente) (from Servicios Facturados)'])
  const fechaEmision = safeArrayToMixedArray(record.fields['Fecha de emisión (from Servicios Facturados)'])
  const totalFacturado = record.fields['Total - Facturado']
  const serviciosFacturadosUI = record.fields['Servicios Facturados UI']
  const tickets = safeArrayToStringArray(record.fields['Tickets'])
  const kgContratados = getNumericValue(record.fields['KG contratados'])
  const kgRestante = getNumericValue(record.fields['KG Restante'])
  const unitariosContratados = formatUnitarios(record.fields['Unitarios contratados'])
  const unitariosRestantes = formatUnitarios(record.fields['Unitarios Restantes'])
  const isNula = Boolean(record.fields['Nula'])
  const clienteId = safeArrayToMixedArray(record.fields['ID Cliente'])
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver
          </button>
          <div className="h-4 border-l border-gray-300"></div>
          <nav className="text-sm text-gray-500">
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/ordenes')}>
              Órdenes
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">
              {ordenNumber || 'Sin orden'}
            </span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Enhanced Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            {/* Top Row: Order Number and Badges */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold">
                  Orden {ordenNumber || 'Sin número'}
                </h1>
              </div>
              
              {/* Badges positioned on the right */}
              <div className="flex flex-wrap gap-2 ml-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  getTipoClienteStyle(formatTipoClienteLookup(tipoCliente))
                }`}>
                  {formatTipoClienteLookup(tipoCliente)}
                </span>
                
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  getEstadoStyle(estado)
                }`}>
                  {estado || 'Sin estado'}
                </span>
              </div>
            </div>

            {/* Client name with dynamic link */}
              <div className="text-sm text-blue-100">Cliente</div>
              <div className="font-medium text-gray-900 pb-4">
                {cliente && clienteId ? (
                  <Link 
                    href={`/contactos/${clienteId}`}
                    className="text-3xl text-blue-100 hover:text-blue-100 hover:underline cursor-pointer font-bold"
                  >
                    {formatClienteLookup(cliente)}
                  </Link>
                ) : (
                  <span className="text-gray-500">Cliente no encontrado</span>
                )}
              </div>


            {/* Key Info Row - Always single row even on mobile */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-200 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-blue-200">Fecha de Emisión</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {formatFechaEmisionShort(fechaEmision as string[] | number[])}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-200 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-blue-200">Total Facturado</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {formatCurrency(totalFacturado)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-blue-200 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-blue-200">Tickets</p>
                  <p className="text-sm font-semibold text-white">
                    {getTicketCount(record)} ticket{getTicketCount(record) === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6">
            {/* Collapsible Detalles de la Orden */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de la Orden</h2>
              <div className="space-y-4">
                {/* Collapsible Servicios Facturados */}
                <Disclosure defaultOpen={true}>
                  {({ open }) => (
                    <div className="w-full border-l-4 border-teal-500 bg-teal-50 rounded-r-lg overflow-hidden">
                      <Disclosure.Button className="flex justify-between items-center w-full pl-4 pr-4 py-3 text-left hover:bg-teal-100 transition-colors">
                        <h3 className="font-medium text-teal-900">Servicios Facturados</h3>
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180 transform' : ''
                          } h-5 w-5 text-teal-600 transition-transform duration-200`}
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className="pl-4 pr-4 pb-4">
                        <LineItemBadges 
                          text={formatRollupField(serviciosFacturadosUI)}
                          colorScheme="teal"
                          size="md"
                        />
                      </Disclosure.Panel>
                    </div>
                  )}
                </Disclosure>

                {/* Collapsible Tickets - Using linked records */}
                <Disclosure defaultOpen={true}>
                  {({ open }) => (
                    <div className="w-full border-l-4 border-indigo-500 bg-indigo-50 rounded-r-lg overflow-hidden">
                      <Disclosure.Button className="flex justify-between items-center w-full pl-4 pr-4 py-3 text-left hover:bg-indigo-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-indigo-900">Tickets</h3>
                          <span className="bg-indigo-200 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                            {tickets.length}
                          </span>
                        </div>
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180 transform' : ''
                          } h-5 w-5 text-indigo-600 transition-transform duration-200`}
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className="pl-4 pr-4 pb-4">
                        <LinkedTicketBadges 
                          ticketIds={tickets}
                          colorScheme="indigo"
                          size="md"
                        />
                      </Disclosure.Panel>
                    </div>
                  )}
                </Disclosure>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Estado de los Servicios</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Servicios por KG</h3>
                  <div className="mb-4">
                    <p className="text-sm text-blue-700 mb-1">KG Contratados</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatKGField(record.fields['KG contratados'])}
                    </p>
                  </div>
                  <ProgressBar
                    current={kgRestante}
                    total={kgContratados}
                    label="KG Restante"
                    unit="KG"
                    showPercentage={true}
                    colorScheme={kgRestante < 0 ? 'red' : 'blue'}
                    warningMessage={kgRestante < 0 ? 'Según tickets, KG consumidos son más que los contratados.' : undefined}
                  />
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Servicios Unitarios</h3>
                  <div className="mb-4">
                    <p className="text-sm text-green-700 mb-1">Unitarios Contratados</p>
                    <p className="text-2xl font-bold text-green-800">
                      {unitariosContratados} unidades
                    </p>
                  </div>
                  <ProgressBar
                    current={unitariosRestantes}
                    total={unitariosContratados}
                    label="Unitarios Restantes"
                    unit="unidades"
                    showPercentage={true}
                    colorScheme={unitariosRestantes < 0 ? 'red' : 'green'}
                    warningMessage={unitariosRestantes < 0 ? 'Según tickets, unidades consumidas son más que las contratadas.' : undefined}
                  />
                </div>
              </div>
            </div>

            {isNula && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-medium text-red-900 mb-2">⚠️ Orden Nula</h3>
                <p className="text-sm text-red-700">
                  Esta orden ha sido marcada como nula
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.push('/ordenes')}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Volver a Lista de Órdenes
          </button>
        </div>
      </div>
    </div>
  )
}
