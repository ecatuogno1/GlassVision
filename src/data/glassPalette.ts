export type LightTransmission = 'low' | 'medium' | 'high';
export type GlassCategory =
  | 'Architectural'
  | 'Art'
  | 'Laboratory'
  | 'Automotive'
  | 'Decorative';

export interface GlassColor {
  id: string;
  name: string;
  hueGroup: string;
  hex: string;
  lightTransmission: LightTransmission;
  reflectance: number;
  dominantElement: string;
  category: GlassCategory;
  description: string;
  applications: string[];
  tags: string[];
}

export const glassPalette: GlassColor[] = [
  {
    id: 'aqua-frost',
    name: 'Aqua Frost',
    hueGroup: 'Blue-Green',
    hex: '#8FD1D2',
    lightTransmission: 'high',
    reflectance: 9,
    dominantElement: 'Copper',
    category: 'Architectural',
    description:
      'A bright aqua glass with high clarity that gently diffuses light while preserving color fidelity.',
    applications: ['Skylights', 'Atrium facades', 'Retail partitions'],
    tags: ['cool', 'modern', 'daylighting']
  },
  {
    id: 'amber-veil',
    name: 'Amber Veil',
    hueGroup: 'Amber',
    hex: '#D7964B',
    lightTransmission: 'medium',
    reflectance: 14,
    dominantElement: 'Iron Oxide',
    category: 'Architectural',
    description:
      'Warm amber glass with subtle reflective qualities that enhances interior warmth and bronze tones.',
    applications: ['Hospitality lobbies', 'Curtain walls', 'Residential glazing'],
    tags: ['warm', 'sunset', 'bronze']
  },
  {
    id: 'cobalt-ice',
    name: 'Cobalt Ice',
    hueGroup: 'Blue',
    hex: '#1F4DA0',
    lightTransmission: 'low',
    reflectance: 22,
    dominantElement: 'Cobalt Oxide',
    category: 'Art',
    description:
      'Deep cobalt blue glass ideal for creating dramatic focal points and privacy partitions.',
    applications: ['Feature walls', 'Public art installations', 'Back-painted panels'],
    tags: ['bold', 'saturated', 'statement']
  },
  {
    id: 'smoke-haze',
    name: 'Smoke Haze',
    hueGroup: 'Gray',
    hex: '#7E868C',
    lightTransmission: 'medium',
    reflectance: 15,
    dominantElement: 'Nickel Oxide',
    category: 'Automotive',
    description:
      'Neutral gray glass that balances glare reduction with balanced daylight transmission.',
    applications: ['Automotive glazing', 'Corporate facades', 'Wayfinding signage'],
    tags: ['neutral', 'balanced', 'glare-control']
  },
  {
    id: 'forest-laminate',
    name: 'Forest Laminate',
    hueGroup: 'Green',
    hex: '#3F7153',
    lightTransmission: 'medium',
    reflectance: 18,
    dominantElement: 'Chromium Oxide',
    category: 'Architectural',
    description:
      'Laminated green glass that provides solar control and integrates seamlessly with biophilic palettes.',
    applications: ['Sunshades', 'Outdoor canopies', 'Transit stations'],
    tags: ['biophilic', 'solar-control', 'layered']
  },
  {
    id: 'opal-mist',
    name: 'Opal Mist',
    hueGroup: 'Opalescent',
    hex: '#ECE4D7',
    lightTransmission: 'high',
    reflectance: 6,
    dominantElement: 'Fluorine',
    category: 'Decorative',
    description:
      'Milky opalescent glass that produces a diffused glow, ideal for ambient feature lighting.',
    applications: ['Pendant fixtures', 'Glass sculptures', 'Retail displays'],
    tags: ['diffuse', 'soft', 'ambient']
  },
  {
    id: 'ruby-flare',
    name: 'Ruby Flare',
    hueGroup: 'Red',
    hex: '#B0122A',
    lightTransmission: 'low',
    reflectance: 25,
    dominantElement: 'Gold Chloride',
    category: 'Art',
    description:
      'Premium ruby red glass with intense saturation used for signage, accents, and ceremonial installations.',
    applications: ['Feature lighting', 'Brand signage', 'Lit backdrops'],
    tags: ['luxury', 'heritage', 'accent']
  },
  {
    id: 'sandstone-sheen',
    name: 'Sandstone Sheen',
    hueGroup: 'Neutral',
    hex: '#C9B59A',
    lightTransmission: 'high',
    reflectance: 11,
    dominantElement: 'Titanium Oxide',
    category: 'Decorative',
    description:
      'Neutral champagne glass suited for interiors seeking subtle warmth with low glare.',
    applications: ['Conference rooms', 'Retail shelving', 'Residential interiors'],
    tags: ['minimal', 'warm-neutral', 'low-glare']
  },
  {
    id: 'ultraviolet-shield',
    name: 'Ultraviolet Shield',
    hueGroup: 'Purple',
    hex: '#6C3C8C',
    lightTransmission: 'medium',
    reflectance: 19,
    dominantElement: 'Manganese Oxide',
    category: 'Laboratory',
    description:
      'Specialized violet glass that filters UV wavelengths, used to protect light-sensitive collections.',
    applications: ['Museums', 'Scientific storage', 'Premium retail displays'],
    tags: ['protective', 'filtering', 'specialty']
  },
  {
    id: 'pacific-horizon',
    name: 'Pacific Horizon',
    hueGroup: 'Teal',
    hex: '#3A8F9E',
    lightTransmission: 'high',
    reflectance: 13,
    dominantElement: 'Copper',
    category: 'Architectural',
    description:
      'Balanced teal glass that provides daylighting benefits while complementing coastal palettes.',
    applications: ['Airports', 'Marine centers', 'Educational facilities'],
    tags: ['coastal', 'vibrant', 'harmonious']
  }
];
