export interface Brand {
  id: number
  name: string
  is_tbwa: boolean
  category: string
  created_at: string
}

export interface Product {
  id: number
  name: string
  brand_id: number
  price: number
  brand?: Brand
}

export interface TransactionItem {
  id: number
  product_id: number
  quantity: number
  price: number
  transaction_date: string
  product?: Product
}

export interface DashboardData {
  totalRevenue: number
  totalTransactions: number
  avgTransaction: number
  topBrands: Array<{
    name: string
    sales: number
    is_tbwa: boolean
  }>
}