export type Category =
  | "Produce"
  | "Dairy"
  | "Bakery"
  | "Meat & Seafood"
  | "Pantry"
  | "Frozen"
  | "Snacks"
  | "Beverages"
  | "Household"
  | "Personal Care"
  | "Pet Supplies"
  | "Other";

export interface ItemEmbedding {
  name: string;
  vector: number[]; // Normalized embedding vector (384 dimensions)
  category: Category;
}

export interface Neighbor {
  item: ItemEmbedding;
  similarity: number; // Cosine similarity score
}

export interface CategoryResult {
  category: Category;
  confidence: number; // 0-1, based on similarity scores
  neighbors: Neighbor[];
}

export interface Suggestion {
  name: string;
  category: Category;
  similarity: number;
}

