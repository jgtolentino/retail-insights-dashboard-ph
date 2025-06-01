import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, ArrowRight, Package, Tag, ShoppingBag } from "lucide-react"
import { supabase } from '@/integrations/supabase/client'

interface SubstitutionData {
  level: 'CATEGORY' | 'BRAND' | 'PRODUCT'
  originalCategory: string
  substituteCategory: string
  originalBrand?: string
  substituteBrand?: string
  originalProduct?: string
  substituteProduct?: string
  reason: string
  frequency: number
  substitutionRate: number
}

interface HierarchicalSubstitutionsProps {
  startDate?: string
  endDate?: string
  storeId?: number
  className?: string
}

export function HierarchicalSubstitutions({ 
  startDate, 
  endDate, 
  storeId, 
  className = "" 
}: HierarchicalSubstitutionsProps) {
  const [data, setData] = useState<SubstitutionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [currentLevel, setCurrentLevel] = useState<'CATEGORY' | 'BRAND' | 'PRODUCT'>('CATEGORY')

  useEffect(() => {
    fetchSubstitutionData()
  }, [startDate, endDate, storeId])

  const fetchSubstitutionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: substitutions, error } = await supabase.rpc('get_hierarchical_substitutions', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_store_id: storeId
      })

      if (error) throw error

      setData(substitutions || [])
    } catch (err) {
      console.error('Error fetching substitution data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load substitution data')
    } finally {
      setLoading(false)
    }
  }

  const categoryData = data.filter(d => d.level === 'CATEGORY')
  const brandData = data.filter(d => d.level === 'BRAND')
  const productData = data.filter(d => d.level === 'PRODUCT')

  const toggleCategoryExpansion = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey)
    } else {
      newExpanded.add(categoryKey)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleBrandExpansion = (brandKey: string) => {
    const newExpanded = new Set(expandedBrands)
    if (newExpanded.has(brandKey)) {
      newExpanded.delete(brandKey)
    } else {
      newExpanded.add(brandKey)
    }
    setExpandedBrands(newExpanded)
  }

  const getCategorySubstitutions = (originalCategory: string, substituteCategory: string) => {
    return brandData.filter(d => 
      d.originalCategory === originalCategory && 
      d.substituteCategory === substituteCategory
    )
  }

  const getBrandSubstitutions = (originalBrand: string, substituteBrand: string) => {
    return productData.filter(d => 
      d.originalBrand === originalBrand && 
      d.substituteBrand === substituteBrand
    )
  }

  const getSubstitutionColor = (reason: string) => {
    switch (reason?.toLowerCase()) {
      case 'out of stock': return 'bg-red-100 text-red-800 border-red-200'
      case 'price preference': return 'bg-green-100 text-green-800 border-green-200'
      case 'customer preference': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'promotion': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Substitution Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-8 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Substitution Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <Button onClick={fetchSubstitutionData} variant="outline" size="sm" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Substitution Analysis
          </CardTitle>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={currentLevel === 'CATEGORY' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentLevel('CATEGORY')}
              className="text-xs"
            >
              <Tag className="h-3 w-3 mr-1" />
              Categories
            </Button>
            <Button
              variant={currentLevel === 'BRAND' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentLevel('BRAND')}
              className="text-xs"
            >
              <ShoppingBag className="h-3 w-3 mr-1" />
              Brands
            </Button>
            <Button
              variant={currentLevel === 'PRODUCT' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentLevel('PRODUCT')}
              className="text-xs"
            >
              <Package className="h-3 w-3 mr-1" />
              Products
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Hierarchical view of product substitutions • Drill down from categories to specific products
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLevel === 'CATEGORY' && (
          <div className="space-y-3">
            {categoryData.map((item, index) => {
              const categoryKey = `${item.originalCategory}-${item.substituteCategory}-${item.reason}`
              const isExpanded = expandedCategories.has(categoryKey)
              const relatedBrands = getCategorySubstitutions(item.originalCategory, item.substituteCategory)
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {relatedBrands.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategoryExpansion(categoryKey)}
                          className="p-0 h-6 w-6"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-medium">
                          {item.originalCategory}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="font-medium">
                          {item.substituteCategory}
                        </Badge>
                      </div>
                      
                      <Badge className={getSubstitutionColor(item.reason)}>
                        {item.reason}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold">{item.frequency} substitutions</span>
                      <span className="text-gray-500">{item.substitutionRate}%</span>
                    </div>
                  </div>

                  {isExpanded && relatedBrands.length > 0 && (
                    <div className="mt-4 ml-8 space-y-2">
                      {relatedBrands.slice(0, 10).map((brand, brandIndex) => (
                        <div key={brandIndex} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {brand.originalBrand}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <Badge variant="secondary" className="text-xs">
                              {brand.substituteBrand}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{brand.frequency}x</span>
                            <span>({brand.substitutionRate}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {currentLevel === 'BRAND' && (
          <div className="space-y-3">
            {brandData.slice(0, 20).map((item, index) => {
              const brandKey = `${item.originalBrand}-${item.substituteBrand}-${item.reason}`
              const isExpanded = expandedBrands.has(brandKey)
              const relatedProducts = getBrandSubstitutions(item.originalBrand!, item.substituteBrand!)
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {relatedProducts.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBrandExpansion(brandKey)}
                          className="p-0 h-6 w-6"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">{item.originalCategory}</div>
                        <Badge variant="outline" className="font-medium">
                          {item.originalBrand}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="font-medium">
                          {item.substituteBrand}
                        </Badge>
                      </div>
                      
                      <Badge className={getSubstitutionColor(item.reason)}>
                        {item.reason}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold">{item.frequency} substitutions</span>
                      <span className="text-gray-500">{item.substitutionRate}%</span>
                    </div>
                  </div>

                  {isExpanded && relatedProducts.length > 0 && (
                    <div className="mt-4 ml-8 space-y-2">
                      {relatedProducts.slice(0, 10).map((product, productIndex) => (
                        <div key={productIndex} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">{product.originalProduct}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{product.substituteProduct}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{product.frequency}x</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {currentLevel === 'PRODUCT' && (
          <div className="space-y-3">
            {productData.slice(0, 30).map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500 space-x-1">
                        <span>{item.originalCategory}</span>
                        <span>•</span>
                        <span>{item.originalBrand}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-medium text-xs">
                        {item.originalProduct}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <Badge variant="outline" className="font-medium text-xs">
                        {item.substituteProduct}
                      </Badge>
                    </div>
                    
                    <Badge className={getSubstitutionColor(item.reason)}>
                      {item.reason}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">{item.frequency}x</span>
                    <span className="text-gray-500">{item.substitutionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No substitution data available for the selected period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}