export type AssetType = "image" | "file" | "video";

export interface Asset {
  url: string;
  type: AssetType;
  isPrimary: boolean;
}
