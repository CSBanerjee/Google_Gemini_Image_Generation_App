
export type AspectRatio = "9:16" | "1:1" | "16:9" | "3:4" | "4:3";

export enum PromptMode {
  TEXT = "plain_text",
  JSON = "json",
}

export interface AppSettings {
  aspectRatio: AspectRatio;
  promptMode: PromptMode;
  prompt: string;
  jsonPrompt: string;
  creativity: number; // 0.0 to 1.0
}

export interface ProductImage {
  file: File;
  base64: string;
  objectURL: string;
  description: string;
}

export interface GeneratedImage {
  base64: string;
  prompt: string;
}

export interface AIAdvice {
  id: number;
  advice: string;
}