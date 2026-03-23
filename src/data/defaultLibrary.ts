import type { LibraryItem } from '../types/graph'

export const DEFAULT_ITEMS: LibraryItem[] = [
  // Math Constants
  { id: 'b-pi',    label: 'π (pi)',            category: 'Math Constants',  template: { label: 'π',     variant: 'constant', value: Math.PI } },
  { id: 'b-e',     label: 'e (Euler)',          category: 'Math Constants',  template: { label: 'e',     variant: 'constant', value: Math.E } },
  { id: 'b-sqrt2', label: '√2',                 category: 'Math Constants',  template: { label: '√2',   variant: 'constant', value: Math.SQRT2 } },
  { id: 'b-phi',   label: 'φ (golden ratio)',   category: 'Math Constants',  template: { label: 'φ',    variant: 'constant', value: 1.6180339887 } },
  { id: 'b-ln2',   label: 'ln(2)',              category: 'Math Constants',  template: { label: 'ln2',  variant: 'constant', value: Math.LN2 } },
  { id: 'b-ln10',  label: 'ln(10)',             category: 'Math Constants',  template: { label: 'ln10', variant: 'constant', value: Math.LN10 } },
  // Web Performance Measures
  { id: 'b-plt',   label: 'Page Load Time (ms)',       category: 'Web Performance', template: { label: 'Page Load Time',     variant: 'measure', sourceUrl: '/api/range?min=800&max=4000' } },
  { id: 'b-ttfb',  label: 'Time to First Byte (ms)',   category: 'Web Performance', template: { label: 'Time to First Byte', variant: 'measure', sourceUrl: '/api/range?min=100&max=800' } },
  { id: 'b-fcp',   label: 'First Contentful Paint (ms)',category: 'Web Performance', template: { label: 'First Contentful Paint', variant: 'measure', sourceUrl: '/api/range?min=500&max=3000' } },
  { id: 'b-lcp',   label: 'Largest Contentful Paint (ms)', category: 'Web Performance', template: { label: 'Largest Contentful Paint', variant: 'measure', sourceUrl: '/api/range?min=1000&max=5000' } },
  { id: 'b-cls',   label: 'Cumulative Layout Shift',   category: 'Web Performance', template: { label: 'CLS',              variant: 'measure', sourceUrl: '/api/range?min=0&max=0.5' } },
  { id: 'b-br',    label: 'Bounce Rate',               category: 'Web Performance', template: { label: 'Bounce Rate',      variant: 'measure', unit: 'percent', sourceUrl: '/api/range?min=0.2&max=0.8' } },
  { id: 'b-sd',    label: 'Session Duration (s)',       category: 'Web Performance', template: { label: 'Session Duration', variant: 'measure', sourceUrl: '/api/increment?start=120&rate=5' } },
  { id: 'b-pv',    label: 'Page Views',                category: 'Web Performance', template: { label: 'Page Views',       variant: 'measure', sourceUrl: '/api/increment?start=1000&rate=3' } },
  { id: 'b-cr',    label: 'Conversion Rate',           category: 'Web Performance', template: { label: 'Conversion Rate',  variant: 'measure', unit: 'percent', sourceUrl: '/api/range?min=0.01&max=0.08' } },
  { id: 'b-er',    label: 'Error Rate',                category: 'Web Performance', template: { label: 'Error Rate',       variant: 'measure', unit: 'percent', sourceUrl: '/api/range?min=0&max=0.05' } },
  { id: 'b-lat',   label: 'API Latency (ms)',          category: 'Web Performance', template: { label: 'API Latency',      variant: 'measure', sourceUrl: '/api/range?min=50&max=500' } },
  { id: 'b-au',    label: 'Active Users',              category: 'Web Performance', template: { label: 'Active Users',     variant: 'measure', sourceUrl: '/api/increment?start=50&rate=1' } },
]
