
    // Sprint 4 Demo Data - Injected for demonstration
    window.SPRINT4_DEMO_DATA = {
  "substitutionPatterns": [
    {
      "original_brand": "Coca-Cola",
      "substitute_brand": "Pepsi",
      "count": 45,
      "acceptance_rate": 0.78
    },
    {
      "original_brand": "Alaska",
      "substitute_brand": "Bear Brand",
      "count": 38,
      "acceptance_rate": 0.82
    },
    {
      "original_brand": "San Miguel",
      "substitute_brand": "Red Horse",
      "count": 32,
      "acceptance_rate": 0.65
    },
    {
      "original_brand": "Lucky Me",
      "substitute_brand": "Pancit Canton",
      "count": 28,
      "acceptance_rate": 0.85
    },
    {
      "original_brand": "Nestle",
      "substitute_brand": "Alpine",
      "count": 25,
      "acceptance_rate": 0.72
    },
    {
      "original_brand": "Palmolive",
      "substitute_brand": "Safeguard",
      "count": 22,
      "acceptance_rate": 0.68
    },
    {
      "original_brand": "Colgate",
      "substitute_brand": "Close Up",
      "count": 20,
      "acceptance_rate": 0.75
    },
    {
      "original_brand": "Ariel",
      "substitute_brand": "Tide",
      "count": 18,
      "acceptance_rate": 0.8
    }
  ],
  "requestBehaviors": [
    {
      "type": "branded",
      "percentage": 60,
      "avg_checkout_time": 65
    },
    {
      "type": "unbranded",
      "percentage": 30,
      "avg_checkout_time": 85
    },
    {
      "type": "pointing",
      "percentage": 10,
      "avg_checkout_time": 45
    }
  ],
  "paymentMethods": [
    {
      "method": "cash",
      "percentage": 40,
      "avg_transaction": 250
    },
    {
      "method": "gcash",
      "percentage": 30,
      "avg_transaction": 380
    },
    {
      "method": "maya",
      "percentage": 20,
      "avg_transaction": 420
    },
    {
      "method": "credit",
      "percentage": 10,
      "avg_transaction": 680
    }
  ],
  "checkoutDurations": [
    {
      "range": "0-30s",
      "percentage": 25
    },
    {
      "range": "30-60s",
      "percentage": 35
    },
    {
      "range": "1-2min",
      "percentage": 25
    },
    {
      "range": "2-5min",
      "percentage": 12
    },
    {
      "range": "5min+",
      "percentage": 3
    }
  ],
  "aiRecommendations": [
    {
      "title": "High Substitution Alert: Coca-Cola",
      "description": "Coca-Cola shows 45 substitutions to Pepsi with 78% acceptance. Consider inventory management.",
      "impact": "high",
      "potentialIncrease": 15
    },
    {
      "title": "Optimize Checkout Duration",
      "description": "15% of transactions take over 2 minutes. Streamline checkout process for efficiency.",
      "impact": "medium",
      "potentialIncrease": 8
    },
    {
      "title": "Digital Payment Adoption",
      "description": "GCash and Maya account for 50% of transactions. Promote digital payment incentives.",
      "impact": "high",
      "potentialIncrease": 12
    }
  ]
};
    
    console.log('✅ Sprint 4 demo data loaded successfully');
    console.log('📊 Available data:', Object.keys(window.SPRINT4_DEMO_DATA));
  