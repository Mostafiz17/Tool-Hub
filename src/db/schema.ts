import type { ObjectId } from "mongodb";

export type ThemePreference = "light" | "dark" | "system";

export interface FavoriteDocument {
  toolSlug: string;
  createdAt: Date;
}

export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  favorites: FavoriteDocument[];
  preferences: {
    theme: ThemePreference;
    updatedAt: Date;
  };
}
