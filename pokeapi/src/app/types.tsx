// In app/types.ts

export interface Pokemon {
  name: string;
  url: string;
}

// Interface นี้รองรับข้อมูลทั้งหมดจาก API ที่เราจะใช้
export interface PokemonDetail {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    back_default: string | null;
    front_shiny: string | null;
    back_shiny: string | null;
    other?: {
      'official-artwork': {
        front_default: string | null;
      }
    }
  };
  types?: { type: { name: string } }[];
  abilities?: { ability: { name: string }; is_hidden: boolean }[];
  stats?: { base_stat: number; stat: { name: string } }[];
  height?: number;
  weight?: number;
  base_experience?: number;
  moves?: { move: { name: string } }[];
}