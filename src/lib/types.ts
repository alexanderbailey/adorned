export type ItemCategory =
  | "tops"
  | "bottoms"
  | "skirts"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "bags"
  | "accessories"
  | "jewellery";

export type ItemSeason = "spring" | "summer" | "fall" | "winter";
export type ItemFormality = "casual" | "smart-casual" | "formal";

export interface SecondaryColor {
  name: string;
  hex: string;
}

export interface PaletteSwatch {
  name: string;
  hex: string;
}

export interface PromptChips {
  occasion?: string;
  weather?: string;
  formality?: string;
  mood?: string;
}

// -------------------------------------------------------
// Supabase Database type (matches 0001_initial.sql)
// -------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          palette_preset: string | null;
          palette_swatches: PaletteSwatch[];
          style_description: string | null;
          style_summary: string | null;
          body_photo_url: string | null;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      inspo_images: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          position: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["inspo_images"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["inspo_images"]["Insert"]>;
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          original_image_url: string;
          cutout_image_url: string;
          thumb_image_url: string | null;
          category: ItemCategory;
          subcategory: string | null;
          primary_color_hex: string | null;
          primary_color_name: string | null;
          secondary_colors: SecondaryColor[];
          material: string | null;
          pattern: string | null;
          season: ItemSeason[] | null;
          formality: ItemFormality | null;
          palette_fit_tags: string[] | null;
          ai_description: string | null;
          user_notes: string | null;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["items"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>;
      };
      outfits: {
        Row: {
          id: string;
          user_id: string;
          source: "generated" | "manual";
          prompt: string | null;
          prompt_chips: PromptChips;
          ai_reasoning: string | null;
          favorited: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["outfits"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["outfits"]["Insert"]>;
      };
      outfit_items: {
        Row: {
          outfit_id: string;
          item_id: string;
          slot: number;
        };
        Insert: Database["public"]["Tables"]["outfit_items"]["Row"];
        Update: Partial<Database["public"]["Tables"]["outfit_items"]["Row"]>;
      };
      wear_log: {
        Row: {
          id: string;
          user_id: string;
          outfit_id: string;
          worn_on: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["wear_log"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["wear_log"]["Insert"]>;
      };
    };
    Enums: {
      item_category: ItemCategory;
    };
  };
};
