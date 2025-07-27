export interface SavedTool {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  description?: string;
  category?: string;
  savedAt: string;
}

export interface Folder {
  name: string;
  tools: SavedTool[];
  createdAt: string;
} 