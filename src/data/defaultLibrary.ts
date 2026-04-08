import type { LibraryItem, Unit } from '../types/graph'
import { METRIC_PORT_ID } from '../types/graph'

function metric(id: string, label: string, inputs: string[], formula: string, unit?: Unit): LibraryItem {
  return {
    id,
    label,
    template: {
      label,
      variant: 'metric',
      inputs: inputs.map(l => ({ id: l, label: l })),
      outputs: [{ id: METRIC_PORT_ID, label: 'value', formula, ...(unit ? { unit } : {}) }],
    },
  }
}

function expression(id: string, label: string, inputs: string[], formula: string): LibraryItem {
  return {
    id,
    label,
    template: {
      label,
      variant: 'expression',
      inputs: inputs.map(l => ({ id: l, label: l })),
      outputs: [{ id: 'out', label: 'out', formula }],
    },
  }
}

function measure(id: string, displayLabel: string, portLabel: string, sourceUrl: string, unit?: 'number' | 'money' | 'percent'): LibraryItem {
  return {
    id,
    label: displayLabel,
    category: 'Web Performance',
    template: {
      label: displayLabel,
      variant: 'measure',
      inputs: [{ id: 'src', label: portLabel, sourceUrl }],
      outputs: [{ id: 'out', label: portLabel, formula: portLabel, ...(unit && unit !== 'number' ? { unit } : {}) }],
    },
  }
}

export const DEFAULT_ITEMS: LibraryItem[] = [
  // Math Constants
  { id: 'b-pi',    label: 'π (pi)',            category: 'Math Constants',  template: { label: 'π (pi)',          variant: 'constant', value: Math.PI } },
  { id: 'b-e',     label: 'e (Euler)',          category: 'Math Constants',  template: { label: 'e (Euler)',        variant: 'constant', value: Math.E } },
  { id: 'b-sqrt2', label: '√2',                 category: 'Math Constants',  template: { label: '√2',              variant: 'constant', value: Math.SQRT2 } },
  { id: 'b-phi',   label: 'φ (golden ratio)',   category: 'Math Constants',  template: { label: 'φ (golden ratio)', variant: 'constant', value: 1.6180339887 } },
  { id: 'b-ln2',   label: 'ln(2)',              category: 'Math Constants',  template: { label: 'ln(2)',            variant: 'constant', value: Math.LN2 } },
  { id: 'b-ln10',  label: 'ln(10)',             category: 'Math Constants',  template: { label: 'ln(10)',           variant: 'constant', value: Math.LN10 } },
  // Web Performance Measures
  measure('b-plt',  'Page Load Time (ms)',             'pageLoadTime',         '/api/range?min=800&max=4000'),
  measure('b-ttfb', 'Time to First Byte (ms)',         'timeToFirstByte',      '/api/range?min=100&max=800'),
  measure('b-fcp',  'First Contentful Paint (ms)',     'firstContentfulPaint', '/api/range?min=500&max=3000'),
  measure('b-lcp',  'Largest Contentful Paint (ms)',   'largestContentfulPaint', '/api/range?min=1000&max=5000'),
  measure('b-cls',  'Cumulative Layout Shift',         'cls',                  '/api/range?min=0&max=0.5'),
  measure('b-br',   'Bounce Rate',                     'bounceRate',           '/api/range?min=0.2&max=0.8',    'percent'),
  measure('b-sd',   'Session Duration (s)',            'sessionDuration',      '/api/increment?start=120&rate=5'),
  measure('b-pv',   'Page Views',                      'pageViews',            '/api/increment?start=1000&rate=3'),
  measure('b-cr',   'Conversion Rate',                 'conversionRate',       '/api/range?min=0.01&max=0.08',  'percent'),
  measure('b-er',   'Error Rate',                      'errorRate',            '/api/range?min=0&max=0.05',     'percent'),
  measure('b-lat',  'API Latency (ms)',                'apiLatency',           '/api/range?min=50&max=500'),
  measure('b-au',   'Active Users',                    'activeUsers',          '/api/increment?start=50&rate=1'),
  // Expressions
  expression('b-clamp',     'Clamp',            ['value', 'min', 'max'],      'min(max(value, min), max)'),
  expression('b-safediv',   'Safe Divide',      ['numerator', 'denominator'], 'if(denominator == 0, 0, numerator / denominator)'),
  expression('b-roundstep', 'Round to Step',    ['value', 'step'],            'round(value / step) * step'),
  expression('b-log',       'Log Scale',        ['value', 'base'],            'log(value, base)'),
  expression('b-wavg',      'Weighted Average', ['a', 'b', 'weight'],         'a * weight + b * (1 - weight)'),
  // Metrics
  metric('b-m-revenue',  'Monthly Revenue',       ['conversions', 'avgOrderValue'],          'conversions * avgOrderValue',                    'money'),
  metric('b-m-ltv',      'Customer LTV',          ['avgRevenue', 'margin', 'lifespan'],       'avgRevenue * margin * lifespan',                 'money'),
  metric('b-m-cac',      'Acquisition Cost',      ['spend', 'acquired'],                     'if(acquired == 0, 0, spend / acquired)',          'money'),
  metric('b-m-churn',    'Retention Rate',        ['active', 'churned'],                     'if(active == 0, 0, 1 - churned / active)',        'percent'),
  metric('b-m-nps',      'Net Promoter Score',    ['promoters', 'detractors', 'total'],      'if(total == 0, 0, (promoters - detractors) / total)'),
]
