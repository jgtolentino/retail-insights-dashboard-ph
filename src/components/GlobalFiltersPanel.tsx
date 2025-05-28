
import { useEffect, useState } from 'react'
import { useFilters }                 from '@/contexts/FilterContext'
import Select, { MultiValue, Options } from 'react-select'

const toOptions = (arr: string[]): Options<{label:string,value:string}> =>
  arr.map(v => ({ label: v, value: v }))

export function GlobalFiltersPanel() {
  const { filters, setFilters, resetFilters } = useFilters()
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [allBrands,     setAllBrands]     = useState<string[]>([])
  const [allProducts,   setAllProducts]   = useState<string[]>([])
  const [allLocations,  setAllLocations]  = useState<string[]>([])
  const [allIncomes,    setAllIncomes]    = useState<string[]>([])

  useEffect(() => {
    // replace these with real API calls if you have them
    setAllCategories(['Cigarettes','Beverages','Snacks','Personal Care'])
    setAllBrands(['Marlboro','UFC','Alaska','Max'])
    setAllProducts(['Yelo','Jack n Jill','Del Monte','Champion'])
    setAllLocations(['Metro Manila','Cebu City','Davao City','Iloilo'])
    setAllIncomes(['0-15000','15000-30000','30000-50000','50000-75000','75000+'])
  }, [])

  return (
    <div className="flex flex-wrap gap-6 items-start bg-white p-4 rounded shadow">
      <div className="w-56">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categories
        </label>
        <Select
          isMulti
          options={toOptions(allCategories)}
          value={toOptions(filters.categories)}
          onChange={(vals: MultiValue<any>) =>
            setFilters({ categories: vals.map(v => v.value) })
          }
          placeholder="All categories…"
        />
      </div>

      <div className="w-56">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Brands
        </label>
        <Select
          isMulti
          options={toOptions(allBrands)}
          value={toOptions(filters.brands)}
          onChange={(vals: MultiValue<any>) =>
            setFilters({ brands: vals.map(v => v.value) })
          }
          placeholder="All brands…"
        />
      </div>

      <div className="w-56">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Products
        </label>
        <Select
          isMulti
          options={toOptions(allProducts)}
          value={toOptions(filters.products)}
          onChange={(vals: MultiValue<any>) =>
            setFilters({ products: vals.map(v => v.value) })
          }
          placeholder="All products…"
        />
      </div>

      <div className="w-56">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Locations
        </label>
        <Select
          isMulti
          options={toOptions(allLocations)}
          value={toOptions(filters.locations)}
          onChange={(vals: MultiValue<any>) =>
            setFilters({ locations: vals.map(v => v.value) })
          }
          placeholder="All locations…"
        />
      </div>

      <div className="w-56">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Income Ranges
        </label>
        <Select
          isMulti
          options={toOptions(allIncomes)}
          value={toOptions(filters.incomeRanges)}
          onChange={(vals: MultiValue<any>) =>
            setFilters({ incomeRanges: vals.map(v => v.value) })
          }
          placeholder="All income ranges…"
        />
      </div>

      <button
        onClick={resetFilters}
        className="ml-auto mt-6 bg-red-50 text-red-700 px-3 py-1 rounded"
      >
        Reset All
      </button>
    </div>
  )
}
