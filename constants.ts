
import { AspectRatio } from './types';

export const ASPECT_RATIOS: AspectRatio[] = ["9:16", "1:1", "16:9", "3:4", "4:3"];

export const DEFAULT_JSON_PROMPT = JSON.stringify(
  {
    concept: "futuristic luxury theme",
    style: "cinematic lighting, deep contrast",
    color_palette: ["#0D0D0D", "#FFB300", "#00B3FF"],
    composition: "center product with diagonal light beams",
    text_overlay: {
      headline: "LIMITED DROP",
      font: "Poppins Bold",
      color: "#FFD700"
    }
  },
  null,
  2
);

export const PLACEHOLDER_ADVICE = [
    "Try adding a cinematic rim light to the product edges.",
    "Reduce saturation for a more premium, sophisticated tone.",
    "Emphasize the product reflection to enhance realism.",
    "Add subtle motion blur to the background for focus depth."
];
