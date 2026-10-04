import { db } from '../db/database.js';
import type { MarketEvent, Sentiment, Severity } from '../types.js';
import { SUPPORTED_SYMBOLS } from './marketData.js';

const templates: Array<Omit<MarketEvent, 'id' | 'timestamp'>> = [
  { title: 'Earnings surprise changes the setup', description: 'Company reports earnings significantly above analyst expectations and raises forward guidance.', sourceType: 'EARNINGS_FEED', affectedSymbols: ['NVDA'], sentiment: 'BULLISH', estimatedImpact: 0.86, severity: 'HIGH' },
  { title: 'Rates may stay elevated for longer', description: 'Federal Reserve signals that interest rates may remain elevated for longer.', sourceType: 'MACRO_FEED', affectedSymbols: ['SPY', 'QQQ'], sentiment: 'BEARISH', estimatedImpact: 0.71, severity: 'HIGH' },
  { title: 'Inflation prints above expectations', description: 'Inflation data comes in above expectations, raising near-term policy uncertainty.', sourceType: 'ECONOMIC_CALENDAR', affectedSymbols: ['SPY', 'QQQ'], sentiment: 'BEARISH', estimatedImpact: 0.66, severity: 'MEDIUM' },
  { title: 'Semiconductor supply chain alert', description: 'Major semiconductor supply disruption is reported across key manufacturing hubs.', sourceType: 'SUPPLY_CHAIN_MONITOR', affectedSymbols: ['AMD', 'NVDA'], sentiment: 'BEARISH', estimatedImpact: 0.79, severity: 'HIGH' },
  { title: 'Technology regulation increases uncertainty', description: 'New technology regulation creates uncertainty for major technology companies.', sourceType: 'REGULATORY_WATCH', affectedSymbols: ['AAPL', 'MSFT', 'AMZN'], sentiment: 'BEARISH', estimatedImpact: 0.58, severity: 'MEDIUM' },
  { title: 'Product launch demand exceeds plan', description: 'Company announces a major new product launch with stronger-than-expected demand.', sourceType: 'PRODUCT_NEWS', affectedSymbols: ['TSLA', 'AAPL'], sentiment: 'BULLISH', estimatedImpact: 0.74, severity: 'HIGH' },
  { title: 'Risk-on rotation lifts crypto beta', description: 'Liquidity conditions improve as risk appetite rotates from defensive assets into digital assets.', sourceType: 'CROSS_ASSET_SIGNAL', affectedSymbols: ['BTC', 'ETH', 'SOL'], sentiment: 'BULLISH', estimatedImpact: 0.77, severity: 'HIGH' },
  { title: 'Crypto volatility regime expands', description: 'A sharp volatility expansion increases correlation risk across BTC, ETH, and high-beta altcoins.', sourceType: 'CRYPTO_VOLATILITY', affectedSymbols: ['BTC', 'ETH', 'XRP'], sentiment: 'BEARISH', estimatedImpact: 0.69, severity: 'HIGH' },
];

let sequence = 0;

export function generateDemoEvent(): MarketEvent {
  const template = templates[sequence++ % templates.length];
  const timestamp = new Date().toISOString();
  const event: MarketEvent = {
    ...template,
    id: `evt-${Date.now()}-${sequence}`,
    timestamp,
    affectedSymbols: template.affectedSymbols.filter((symbol) => SUPPORTED_SYMBOLS.includes(symbol)),
  };
  db.prepare(`INSERT INTO events (id, timestamp, title, description, source_type, affected_symbols, sentiment, estimated_impact, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(event.id, event.timestamp, event.title, event.description, event.sourceType, JSON.stringify(event.affectedSymbols), event.sentiment, event.estimatedImpact, event.severity);
  return event;
}

export function rowToEvent(row: Record<string, unknown>): MarketEvent {
  return {
    id: String(row.id), timestamp: String(row.timestamp), title: String(row.title), description: String(row.description),
    sourceType: String(row.source_type), affectedSymbols: JSON.parse(String(row.affected_symbols)) as string[],
    sentiment: String(row.sentiment) as Sentiment, estimatedImpact: Number(row.estimated_impact), severity: String(row.severity) as Severity,
  };
}
