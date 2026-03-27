const RAW_COMPANIES = [
  ["AAPL", "Apple Inc.", "US", 391, 25, 0.9, "Consumers, enterprise, education"],
  ["MSFT", "Microsoft Corporation", "US", 245, 36, 2.1, "Enterprise IT, cloud, SMB"],
  ["GOOGL", "Alphabet Inc.", "US", 350, 28, 1.4, "Advertisers, cloud customers"],
  ["AMZN", "Amazon.com, Inc.", "US", 638, 7, 0.8, "Retail consumers, sellers, AWS"],
  ["META", "Meta Platforms, Inc.", "US", 135, 29, 1.3, "Advertisers and social users"],
  ["NVDA", "NVIDIA Corporation", "US", 120, 49, 1.5, "AI, data center, gaming OEMs"],
  ["TSLA", "Tesla, Inc.", "US", 97, 14, 1.1, "EV buyers, fleet operators"],
  ["BRK.B", "Berkshire Hathaway Inc.", "US", 365, 12, 2.6, "Insurance, utilities, rail"],
  ["JPM", "JPMorgan Chase & Co.", "US", 161, 30, 2.9, "Retail and corporate banking"],
  ["V", "Visa Inc.", "US", 35, 54, 1.6, "Banks, merchants, cardholders"],
  ["MA", "Mastercard Incorporated", "US", 26, 45, 1.4, "Banks, fintechs, merchants"],
  ["WMT", "Walmart Inc.", "US", 648, 3, 0.7, "Retail shoppers, B2B buyers"],
  ["COST", "Costco Wholesale Corporation", "US", 254, 3, 0.8, "Membership retail consumers"],
  ["HD", "The Home Depot, Inc.", "US", 153, 11, 0.9, "Homeowners, contractors"],
  ["LOW", "Lowe's Companies, Inc.", "US", 86, 9, 0.9, "DIY and professional builders"],
  ["JNJ", "Johnson & Johnson", "US", 88, 18, 1.5, "Hospitals, pharmacies, consumers"],
  ["PFE", "Pfizer Inc.", "US", 58, 11, 1.2, "Healthcare providers, governments"],
  ["MRK", "Merck & Co., Inc.", "US", 60, 27, 1.3, "Hospitals, clinics, pharma partners"],
  ["ABBV", "AbbVie Inc.", "US", 55, 21, 1.3, "Healthcare systems and payers"],
  ["UNH", "UnitedHealth Group Incorporated", "US", 371, 6, 0.8, "Members, employers, providers"],
  ["CVS", "CVS Health Corporation", "US", 357, 3, 0.8, "Patients, insurers, pharmacies"],
  ["PEP", "PepsiCo, Inc.", "US", 91, 12, 1.0, "Retail channels and food service"],
  ["KO", "The Coca-Cola Company", "US", 46, 23, 1.1, "Bottlers, distributors, retail"],
  ["MCD", "McDonald's Corporation", "US", 26, 33, 0.9, "Franchisees and restaurant consumers"],
  ["NKE", "NIKE, Inc.", "US", 51, 12, 1.0, "Athletic consumers, retailers"],
  ["SBUX", "Starbucks Corporation", "US", 36, 10, 0.9, "Retail consumers and licensees"],
  ["DIS", "The Walt Disney Company", "US", 89, 8, 1.2, "Viewers, parks guests, advertisers"],
  ["NFLX", "Netflix, Inc.", "US", 39, 16, 1.0, "Streaming subscribers globally"],
  ["CMCSA", "Comcast Corporation", "US", 121, 14, 1.1, "Broadband users, advertisers"],
  ["T", "AT&T Inc.", "US", 122, 9, 1.1, "Wireless and enterprise telecom"],
  ["VZ", "Verizon Communications Inc.", "US", 134, 10, 1.1, "Wireless consumers and businesses"],
  ["ORCL", "Oracle Corporation", "US", 53, 22, 1.2, "Enterprise database and cloud clients"],
  ["ADBE", "Adobe Inc.", "US", 21, 30, 1.4, "Creative professionals and enterprises"],
  ["CRM", "Salesforce, Inc.", "US", 36, 16, 1.3, "Enterprise sales/service teams"],
  ["INTC", "Intel Corporation", "US", 54, 6, 1.2, "PC and server OEM partners"],
  ["AMD", "Advanced Micro Devices, Inc.", "US", 23, 9, 1.1, "Cloud, OEM and gaming customers"],
  ["QCOM", "QUALCOMM Incorporated", "US", 36, 21, 1.2, "OEM handset and IoT partners"],
  ["CSCO", "Cisco Systems, Inc.", "US", 53, 18, 1.1, "Enterprise networking buyers"],
  ["IBM", "International Business Machines Corporation", "US", 63, 11, 1.3, "Enterprise and government accounts"],
  ["GE", "GE Aerospace", "US", 67, 15, 1.0, "Airlines and aerospace customers"],
  ["CAT", "Caterpillar Inc.", "US", 67, 16, 0.9, "Construction and mining operators"],
  ["DE", "Deere & Company", "US", 61, 17, 0.9, "Farm and construction businesses"],
  ["BA", "The Boeing Company", "US", 78, 3, 0.9, "Commercial and defense customers"],
  ["HON", "Honeywell International Inc.", "US", 38, 15, 1.0, "Industrial and aerospace clients"],
  ["MMM", "3M Company", "US", 33, 12, 1.0, "Industrial and healthcare channels"],
  ["RTX", "RTX Corporation", "US", 74, 8, 1.0, "Defense and aerospace buyers"],
  ["LMT", "Lockheed Martin Corporation", "US", 68, 10, 0.9, "Government defense contracts"],
  ["NOC", "Northrop Grumman Corporation", "US", 39, 9, 0.9, "Government and defense programs"],
  ["UPS", "United Parcel Service, Inc.", "US", 91, 10, 0.9, "Ecommerce merchants and SMBs"],
  ["FDX", "FedEx Corporation", "US", 90, 5, 0.9, "Global logistics customers"],
  ["UBER", "Uber Technologies, Inc.", "US", 37, 8, 0.8, "Riders, couriers, merchants"],
  ["ABNB", "Airbnb, Inc.", "US", 11, 20, 1.0, "Hosts and travelers"],
  ["PYPL", "PayPal Holdings, Inc.", "US", 30, 14, 1.1, "Consumers, merchants, marketplaces"],
  ["XYZ", "Block, Inc.", "US", 23, 3, 0.9, "Sellers and Cash App users"],
  ["SHOP", "Shopify Inc.", "Canada", 8, 10, 1.2, "Ecommerce merchants and partners"],
  ["TD", "The Toronto-Dominion Bank", "Canada", 53, 20, 2.6, "Consumer and business banking"],
  ["RY", "Royal Bank of Canada", "Canada", 60, 22, 2.7, "Retail, wealth, commercial banking"],
  ["BNS", "The Bank of Nova Scotia", "Canada", 27, 19, 2.5, "Retail and commercial banking"],
  ["ENB", "Enbridge Inc.", "Canada", 33, 13, 1.4, "Utilities and energy shippers"],
  ["SU", "Suncor Energy Inc.", "Canada", 41, 12, 1.2, "Fuel distributors and refiners"],
  ["BABA", "Alibaba Group Holding Limited", "China", 130, 9, 1.1, "Merchants, buyers, cloud clients"],
  ["PDD", "PDD Holdings Inc.", "China", 37, 24, 1.2, "Value shoppers and merchants"],
  ["JD", "JD.com, Inc.", "China", 152, 3, 0.9, "Retail consumers and brands"],
  ["TCEHY", "Tencent Holdings Limited", "China", 88, 22, 1.5, "Gamers, advertisers, fintech users"],
  ["BIDU", "Baidu, Inc.", "China", 19, 15, 1.1, "Advertisers and AI cloud clients"],
  ["TSM", "Taiwan Semiconductor Manufacturing Company Limited", "Taiwan", 75, 38, 1.8, "Fabless chip designers"],
  ["005930.KS", "Samsung Electronics Co., Ltd.", "South Korea", 225, 12, 1.3, "Consumer electronics and OEMs"],
  ["SONY", "Sony Group Corporation", "Japan", 92, 10, 1.1, "Gamers, media, electronics customers"],
  ["TM", "Toyota Motor Corporation", "Japan", 312, 8, 1.2, "Automotive consumers and fleets"],
  ["HMC", "Honda Motor Co., Ltd.", "Japan", 132, 6, 1.1, "Automotive and mobility buyers"],
  ["NSANY", "Nissan Motor Co., Ltd.", "Japan", 89, 2, 1.0, "Vehicle consumers and fleets"],
  ["SAP", "SAP SE", "Germany", 38, 16, 1.3, "Enterprise software clients"],
  ["SIEGY", "Siemens AG", "Germany", 83, 9, 1.1, "Industrial and infrastructure clients"],
  ["VWAGY", "Volkswagen AG", "Germany", 348, 6, 1.1, "Automotive consumers and fleets"],
  ["BMWYY", "BMW AG", "Germany", 164, 7, 1.0, "Premium automotive customers"],
  ["DTEGY", "Deutsche Telekom AG", "Germany", 124, 8, 1.1, "Telecom consumers and enterprise"],
  ["ASML", "ASML Holding N.V.", "Netherlands", 30, 32, 1.5, "Semiconductor manufacturers"],
  ["SHEL", "Shell plc", "UK", 300, 7, 1.1, "Energy distributors and industrials"],
  ["BP", "BP p.l.c.", "UK", 214, 6, 1.0, "Energy and fuel buyers"],
  ["HSBC", "HSBC Holdings plc", "UK", 68, 18, 2.7, "Global retail and corporate banking"],
  ["UL", "Unilever PLC", "UK", 64, 11, 1.0, "Consumer goods retailers"],
  ["RIO", "Rio Tinto Group", "UK", 55, 21, 1.1, "Industrial metals customers"],
  ["GSK", "GSK plc", "UK", 38, 10, 1.1, "Healthcare providers and pharmacies"],
  ["NVO", "Novo Nordisk A/S", "Denmark", 37, 35, 1.4, "Healthcare providers and patients"],
  ["NVS", "Novartis AG", "Switzerland", 50, 22, 1.2, "Hospitals, clinics, pharmacies"],
  ["ROG", "Roche Holding AG", "Switzerland", 68, 23, 1.3, "Diagnostics and pharma buyers"],
  ["NESN.SW", "Nestle S.A.", "Switzerland", 105, 13, 1.1, "Retailers and food service"],
  ["TTE", "TotalEnergies SE", "France", 228, 9, 1.1, "Fuel and energy consumers"],
  ["MC.PA", "LVMH Moet Hennessy Louis Vuitton", "France", 93, 18, 1.2, "Luxury consumers worldwide"],
  ["OR.PA", "L'Oreal S.A.", "France", 46, 14, 1.1, "Beauty retailers and consumers"],
  ["SAN.PA", "Sanofi", "France", 47, 15, 1.1, "Healthcare providers and patients"],
  ["INFY", "Infosys Limited", "India", 19, 16, 1.0, "Enterprise IT outsourcing clients"],
  ["TCS.NS", "Tata Consultancy Services Limited", "India", 29, 19, 1.1, "Global enterprise IT clients"],
  ["HDB", "HDFC Bank Limited", "India", 28, 23, 2.6, "Retail and commercial banking"],
  ["IBN", "ICICI Bank Limited", "India", 24, 25, 2.5, "Retail and corporate banking"],
  ["RELIANCE.NS", "Reliance Industries Limited", "India", 110, 8, 1.2, "Energy, telecom, retail customers"],
  ["SBIN.NS", "State Bank of India", "India", 87, 14, 2.8, "Consumer and enterprise banking"],
  ["ITC.NS", "ITC Limited", "India", 10, 24, 1.1, "FMCG, hotels, paper consumers"],
  ["WIPRO", "Wipro Limited", "India", 11, 12, 1.0, "Enterprise IT services clients"],
  ["GRAB", "Grab Holdings Limited", "Singapore", 3, -4, 0.9, "Mobility and delivery users"],
  ["SE", "Sea Limited", "Singapore", 14, 5, 1.0, "Ecommerce and gaming users"],
  ["PETR4.SA", "Petroleo Brasileiro S.A. - Petrobras", "Brazil", 99, 14, 1.2, "Fuel and petrochemical buyers"],
  ["VALE", "Vale S.A.", "Brazil", 42, 19, 1.1, "Steel and industrial customers"],
  ["BBD", "Banco Bradesco S.A.", "Brazil", 19, 11, 2.5, "Retail and corporate banking"],
  ["MELI", "MercadoLibre, Inc.", "Argentina", 15, 10, 1.1, "Ecommerce shoppers and sellers"],
  ["YUM", "Yum! Brands, Inc.", "US", 7, 21, 0.8, "Franchisees and restaurant consumers"],
  ["DASH", "DoorDash, Inc.", "US", 9, 2, 0.8, "Delivery consumers and merchants"],
  ["SPOT", "Spotify Technology S.A.", "Sweden", 15, 6, 1.0, "Streaming subscribers and advertisers"],
  ["ADYEN.AS", "Adyen N.V.", "Netherlands", 2, 24, 1.2, "Enterprise merchants and platforms"],
];

const REVENUE_FACTORS = [1.0, 0.94, 0.89, 0.83];
const NET_MARGIN_ADJUST = [1.0, 0.97, 0.93, 0.9];
const ASSET_FACTORS = [1.0, 0.96, 0.92, 0.88];
const PERIODS = ["2024", "2023", "2022", "2021"];

function toUsd(billionValue) {
  return Math.round(billionValue * 1e9);
}

function buildSeries(baseRevenueB, marginPct, assetMultiplier) {
  const revenue = PERIODS.map((period, i) => ({
    period,
    value: toUsd(baseRevenueB * REVENUE_FACTORS[i]),
  }));
  const netIncome = PERIODS.map((period, i) => ({
    period,
    value: toUsd(baseRevenueB * REVENUE_FACTORS[i] * (marginPct / 100) * NET_MARGIN_ADJUST[i]),
  }));
  const assets = PERIODS.map((period, i) => ({
    period,
    value: toUsd(baseRevenueB * assetMultiplier * ASSET_FACTORS[i]),
  }));
  return { revenue, netIncome, assets };
}

function inferSector(name, customers) {
  const text = `${name} ${customers}`.toLowerCase();
  if (/(bank|insurance|visa|mastercard|paypal|payments|fintech)/.test(text)) return "Financial Services";
  if (/(cloud|software|ai|chip|semiconductor|it|platform|enterprise)/.test(text)) return "Technology";
  if (/(pharma|health|hospital|diagnostics|patients)/.test(text)) return "Healthcare";
  if (/(oil|energy|fuel|utilities|petrochemical)/.test(text)) return "Energy";
  if (/(retail|consumer|restaurant|food|ecommerce|shopping)/.test(text)) return "Consumer";
  if (/(telecom|wireless|broadband|media|streaming|advertisers)/.test(text)) return "Media & Telecom";
  if (/(industrial|aerospace|defense|construction|mining|automotive)/.test(text)) return "Industrials";
  return "Diversified";
}

export const SAMPLE_COMPANIES = RAW_COMPANIES.map(
  ([ticker, name, region, baseRevenueB, marginPct, assetMultiplier, customers]) => {
    const series = buildSeries(baseRevenueB, marginPct, assetMultiplier);
    return {
      ticker,
      name,
      region,
      sector: inferSector(name, customers),
      source: "Sample Dataset",
      customers,
      revenue: series.revenue,
      netIncome: series.netIncome,
      assets: series.assets,
    };
  },
);

