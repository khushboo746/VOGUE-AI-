export type Occasion = 'casual' | 'office' | 'party' | 'wedding' | 'date' | 'gym';
export type Gender = 'male' | 'female' | 'non-binary';
export type Generation = 'alpha' | 'genz' | 'millennial' | 'genx';
export type BodyType = 'slim' | 'athletic' | 'average' | 'curvy' | 'plus-size';
export type Complexion = 'fair' | 'medium' | 'olive' | 'tan' | 'deep';
export type FabricPreference = 'cotton' | 'linen' | 'silk' | 'wool' | 'denim' | 'synthetic';

export interface UserPreferences {
  occasion: Occasion;
  gender: Gender;
  generation: Generation;
  bodyType: BodyType;
  complexion: Complexion;
  fabric: FabricPreference;
  countryStyle: string;
  weather?: string;
  analyzedData?: {
    detectedBodyType?: string;
    detectedComplexion?: string;
    detectedStyle?: string;
  };
}

export interface OutfitSuggestion {
  title: string;
  description: string;
  items: {
    category: string;
    item: string;
    reason: string;
  }[];
  stylingTips: string[];
  colorPalette: string[];
  imagePrompt: string;
}
