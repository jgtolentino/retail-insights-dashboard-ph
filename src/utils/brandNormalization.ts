// Brand normalization utility for consistent parent company reporting

export const brandMappings: Record<string, string> = {
  // Liwayway Group
  'Oishi': 'Liwayway',
  'Oishi Smart C': 'Liwayway',
  
  // Japan Tobacco
  'JTI': 'Japan Tobacco',
  'Mighty': 'Japan Tobacco',
  'Winston': 'Japan Tobacco',
  'Camel': 'Japan Tobacco',
  
  // Philip Morris
  'Marlboro': 'Philip Morris',
  'Fortune': 'Philip Morris',
  
  // Universal Robina Corporation
  'Jack n Jill': 'URC',
  'C2': 'URC',
  'Great Taste': 'URC',
  
  // San Miguel
  'San Miguel Beer': 'San Miguel Corporation',
  'Red Horse': 'San Miguel Corporation',
  'Ginebra San Miguel': 'San Miguel Corporation',
  
  // Coca-Cola
  'Coke': 'Coca-Cola',
  'Sprite': 'Coca-Cola',
  'Royal': 'Coca-Cola',
  
  // Pepsi
  'Mountain Dew': 'PepsiCo',
  'Gatorade': 'PepsiCo',
  '7-Up': 'PepsiCo',
  
  // Nestle brands
  'Nescafe': 'Nestle',
  'Milo': 'Nestle',
  'Bear Brand': 'Nestle',
  
  // P&G
  'Safeguard': 'Procter & Gamble',
  'Tide': 'Procter & Gamble',
  'Ariel': 'Procter & Gamble',
  
  // Unilever
  'Surf': 'Unilever',
  'Dove': 'Unilever',
  'Knorr': 'Unilever',
  'Close Up': 'Unilever'
}

export function normalizeBrandName(brand: string): string {
  // First check if it's already a parent company
  const parentCompanies = [...new Set(Object.values(brandMappings))]
  if (parentCompanies.includes(brand)) {
    return brand
  }
  
  // Otherwise map to parent company, or return original if not found
  return brandMappings[brand] || brand
}

export function getBrandOwnerType(brand: string): 'TBWA Client' | 'Competitor' {
  // Define TBWA clients (customize based on actual client list)
  const tbwaClients = [
    'Procter & Gamble',
    'Nestle',
    'Philip Morris',
    'San Miguel Corporation',
    'Globe',
    'Smart'
  ]
  
  const normalizedBrand = normalizeBrandName(brand)
  return tbwaClients.includes(normalizedBrand) ? 'TBWA Client' : 'Competitor'
}