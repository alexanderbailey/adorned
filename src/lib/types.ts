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
}

// -------------------------------------------------------
// Supabase Database type (matches 0001_initial.sql)
// -------------------------------------------------------
// Each table needs Relationships, and each schema needs Views + Functions,
// to satisfy Supabase's GenericSchema / GenericTable constraints — otherwise
// `.from(...).insert(...)` collapses to `never`.

// Makes nullable Row fields optional in the Insert type (DB will accept null/default).
// `Defaults` lists additional columns that have SQL defaults (so callers can omit them).
type NullableKeys<T> = { [K in keyof T]: null extends T[K] ? K : never }[keyof T];
type InsertOf<
  Row,
  Omitted extends keyof Row = never,
  Defaults extends keyof Row = never,
> = Omit<Row, Omitted | NullableKeys<Row> | Defaults> &
  Partial<Pick<Row, Extract<NullableKeys<Row> | Defaults, keyof Row>>>;

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
        Insert: InsertOf<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at",
          "palette_swatches"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      inspo_images: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          position: number;
          created_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["inspo_images"]["Row"],
          "id" | "created_at",
          "position"
        >;
        Update: Partial<Database["public"]["Tables"]["inspo_images"]["Insert"]>;
        Relationships: [];
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
        Insert: InsertOf<
          Database["public"]["Tables"]["items"]["Row"],
          "created_at" | "updated_at",
          "id" | "archived" | "secondary_colors"
        >;
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>;
        Relationships: [];
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
          lookbook_url: string | null;
          created_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["outfits"]["Row"],
          "id" | "created_at",
          "prompt_chips" | "favorited"
        >;
        Update: Partial<Database["public"]["Tables"]["outfits"]["Insert"]>;
        Relationships: [];
      };
      outfit_items: {
        Row: {
          outfit_id: string;
          item_id: string;
          slot: number;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["outfit_items"]["Row"],
          never,
          "slot"
        >;
        Update: Partial<Database["public"]["Tables"]["outfit_items"]["Row"]>;
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string | null;
          created_at: string;
          provider: string;
          model: string;
          operation: string;
          input_tokens: number | null;
          output_tokens: number | null;
          cached_input_tokens: number | null;
          input_bytes: number | null;
          output_bytes: number | null;
          cost_usd: number | null;
          duration_ms: number | null;
          status: "success" | "error";
          error_message: string | null;
          metadata: Record<string, unknown>;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["ai_usage"]["Row"],
          "id" | "created_at",
          "metadata"
        >;
        Update: Partial<Database["public"]["Tables"]["ai_usage"]["Insert"]>;
        Relationships: [];
      };
      wear_log: {
        Row: {
          id: string;
          user_id: string;
          outfit_id: string;
          worn_on: string;
          created_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["wear_log"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["wear_log"]["Insert"]>;
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          user_id: string;
          tier: "standard" | "pro";
          status: "active" | "cancelled" | "past_due";
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          pending_tier_change: "standard" | "pro" | null;
          sub_tryon_credits: number;
          sub_wardrobe_credits: number;
          daily_outfit_count: number;
          daily_count_reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["user_subscriptions"]["Row"],
          "created_at" | "updated_at",
          | "status"
          | "current_period_start"
          | "cancel_at_period_end"
          | "sub_tryon_credits"
          | "sub_wardrobe_credits"
          | "daily_outfit_count"
          | "daily_count_reset_date"
        >;
        Update: Partial<
          Database["public"]["Tables"]["user_subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
      topup_purchases: {
        Row: {
          id: string;
          user_id: string;
          resource: "tryon" | "wardrobe_add";
          amount_granted: number;
          amount_remaining: number;
          price_cents: number;
          currency: string;
          purchased_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["topup_purchases"]["Row"],
          "id" | "purchased_at",
          "currency"
        >;
        Update: Partial<
          Database["public"]["Tables"]["topup_purchases"]["Insert"]
        >;
        Relationships: [];
      };
      billing_checkout_sessions: {
        Row: {
          id: string;
          user_id: string;
          mode: "subscription" | "payment";
          tier: "standard" | "pro" | null;
          pack: string | null;
          amount_cents: number;
          currency: string;
          status: "pending" | "completed" | "expired";
          created_at: string;
          completed_at: string | null;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["billing_checkout_sessions"]["Row"],
          "id" | "created_at",
          "amount_cents" | "currency" | "status"
        >;
        Update: Partial<
          Database["public"]["Tables"]["billing_checkout_sessions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      subscribe_tier: {
        Args: {
          p_user_id: string;
          p_tier: "standard" | "pro";
          p_initial_tryon: number;
          p_initial_wardrobe: number;
          p_period_days?: number;
        };
        Returns: Database["public"]["Tables"]["user_subscriptions"]["Row"];
      };
      schedule_tier_change: {
        Args: {
          p_user_id: string;
          p_new_tier: "standard" | "pro";
          p_pro_monthly_tryon: number;
          p_pro_initial_wardrobe: number;
        };
        Returns: Database["public"]["Tables"]["user_subscriptions"]["Row"];
      };
      cancel_subscription: {
        Args: { p_user_id: string };
        Returns: Database["public"]["Tables"]["user_subscriptions"]["Row"];
      };
      reactivate_subscription: {
        Args: { p_user_id: string };
        Returns: Database["public"]["Tables"]["user_subscriptions"]["Row"];
      };
      purchase_topup: {
        Args: {
          p_user_id: string;
          p_resource: "tryon" | "wardrobe_add";
          p_amount: number;
          p_price_cents: number;
          p_currency?: string;
        };
        Returns: Database["public"]["Tables"]["topup_purchases"]["Row"];
      };
      consume_tryon: {
        Args: { p_user_id: string };
        Returns: Record<string, unknown>;
      };
      consume_wardrobe: {
        Args: { p_user_id: string };
        Returns: Record<string, unknown>;
      };
      consume_outfit_with_cap: {
        Args: { p_user_id: string; p_cap: number };
        Returns: Record<string, unknown>;
      };
      refund_tryon: {
        Args: {
          p_user_id: string;
          p_source: string;
          p_topup_id?: string | null;
        };
        Returns: void;
      };
      refund_wardrobe: {
        Args: {
          p_user_id: string;
          p_source: string;
          p_topup_id?: string | null;
        };
        Returns: void;
      };
      refund_outfit: {
        Args: { p_user_id: string };
        Returns: void;
      };
      advance_billing_cycle: {
        Args: {
          p_user_id: string;
          p_target_tier: "standard" | "pro";
          p_monthly_tryon: number;
          p_monthly_wardrobe_drip: number;
          p_period_days?: number;
        };
        Returns: Database["public"]["Tables"]["user_subscriptions"]["Row"];
      };
    };
    Enums: {
      item_category: ItemCategory;
      subscription_tier: "standard" | "pro";
      subscription_status: "active" | "cancelled" | "past_due";
      topup_resource: "tryon" | "wardrobe_add";
      checkout_mode: "subscription" | "payment";
      checkout_status: "pending" | "completed" | "expired";
    };
  };
};
