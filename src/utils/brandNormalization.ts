// Brand normalization utility for TBWA Philippines clients

export const brandMappings: Record<string, string> = {
  // Alaska Milk Corporation (TBWA Client)
  'Alaska Evaporated Milk': 'Alaska Milk Corporation',
  'Alaska Condensed Milk': 'Alaska Milk Corporation',
  'Alaska Powdered Milk': 'Alaska Milk Corporation',
  'Krem-Top': 'Alaska Milk Corporation',
  'Alpine': 'Alaska Milk Corporation',
  'Cow Bell': 'Alaska Milk Corporation',
  
  // Oishi - Liwayway Marketing Corporation (TBWA Client)
  'Oishi Prawn Crackers': 'Oishi',
  'Oishi Pillows': 'Oishi',
  'Oishi Martys': 'Oishi',
  'Oishi Ridges': 'Oishi',
  'Oishi Bread Pan': 'Oishi',
  'Gourmet Picks': 'Oishi',
  'Crispy Patata': 'Oishi',
  'Smart C+': 'Oishi',
  'Oaties': 'Oishi',
  'Hi-Ho': 'Oishi',
  'Rinbee': 'Oishi',
  'Deli Mex': 'Oishi',
  
  // Peerless Products Manufacturing Corporation (TBWA Client)
  'Champion Detergent': 'Champion',
  'Champion Fabric Conditioner': 'Champion',
  'Calla': 'Peerless Products',
  'Hana Shampoo': 'Peerless Products',
  'Cyclone': 'Peerless Products',
  'Pride Dishwashing': 'Peerless Products',
  'Care Plus': 'Peerless Products',
  
  // Del Monte Philippines (TBWA Client)
  'Del Monte Pineapple': 'Del Monte',
  'Del Monte Tomato Sauce': 'Del Monte',
  'Del Monte Ketchup': 'Del Monte',
  'Del Monte Spaghetti Sauce': 'Del Monte',
  'Del Monte Fruit Cocktail': 'Del Monte',
  'Del Monte Pasta': 'Del Monte',
  'S&W': 'Del Monte',
  'Todays': 'Del Monte',
  'Fit n Right': 'Del Monte',
  
  // Japan Tobacco International (TBWA Client)
  'Winston': 'JTI',
  'Camel': 'JTI',
  'Mevius': 'JTI',
  'LD': 'JTI',
  'Mighty': 'JTI',
  'Caster': 'JTI',
  'Glamour': 'JTI',
  
  // Competitors
  'Nestle': 'Nestle',
  'Bear Brand': 'Nestle',
  'Milo': 'Nestle',
  'Nescafe': 'Nestle',
  'Marlboro': 'Philip Morris',
  'Fortune': 'Philip Morris',
  'Lucky Strike': 'Philip Morris',
  'Jack n Jill': 'Universal Robina',
  'C2': 'Universal Robina',
  'Great Taste': 'Universal Robina',
  'Ariel': 'Procter & Gamble',
  'Tide': 'Procter & Gamble',
  'Safeguard': 'Procter & Gamble',
  'Surf': 'Unilever',
  'Knorr': 'Unilever',
  'Dove': 'Unilever'
}

export function normalizeBrandName(brand: string): string {
  // Return mapped brand or original if not found
  return brandMappings[brand] || brand
}

export function getBrandOwnerType(brand: string): 'TBWA Client' | 'Competitor' {
  // Define TBWA client brands (based on your confirmed list)
  const tbwaClientBrands = [
    // Alaska Milk Corporation
    'Alaska Milk Corporation',
    'Alaska Evaporated Milk',
    'Alaska Condensed Milk', 
    'Alaska Powdered Milk',
    'Krem-Top',
    'Alpine',
    'Cow Bell',
    
    // Oishi (Liwayway)
    'Oishi',
    'Oishi Prawn Crackers',
    'Oishi Pillows',
    'Oishi Martys',
    'Oishi Ridges',
    'Oishi Bread Pan',
    'Gourmet Picks',
    'Crispy Patata',
    'Smart C+',
    'Oaties',
    'Hi-Ho',
    'Rinbee',
    'Deli Mex',
    
    // Peerless Products
    'Champion',
    'Champion Detergent',
    'Champion Fabric Conditioner',
    'Peerless Products',
    'Calla',
    'Hana Shampoo',
    'Cyclone',
    'Pride Dishwashing',
    'Care Plus',
    
    // Del Monte Philippines
    'Del Monte',
    'Del Monte Pineapple',
    'Del Monte Tomato Sauce',
    'Del Monte Ketchup',
    'Del Monte Spaghetti Sauce',
    'Del Monte Fruit Cocktail',
    'Del Monte Pasta',
    'S&W',
    'Todays',
    'Fit n Right',
    
    // Japan Tobacco International
    'JTI',
    'Winston',
    'Camel',
    'Mevius',
    'LD',
    'Mighty',
    'Caster',
    'Glamour'
  ]
  
  const normalizedBrand = normalizeBrandName(brand)
  return tbwaClientBrands.includes(brand) || tbwaClientBrands.includes(normalizedBrand) 
    ? 'TBWA Client' 
    : 'Competitor'
}