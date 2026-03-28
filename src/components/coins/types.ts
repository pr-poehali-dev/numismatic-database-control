export type Rarity = "обычная" | "редкая" | "очень редкая" | "уникальная";
export type Condition = "F" | "VF" | "XF" | "UNC" | "MS";
export type Section = "catalog" | "history" | "valuation" | "statistics" | "authors" | "search" | "import";

export interface PriceHistory {
  price: number;
  date: string;
  source: string;
  notes: string;
}

export interface Coin {
  id: number;
  name: string;
  year: number;
  country: string;
  metal: string;
  weight_g: number | null;
  diameter_mm: number | null;
  mintage: number | null;
  rarity: Rarity;
  condition: Condition;
  base_price: number | null;
  current_price: number | null;
  description: string | null;
  ruler: string | null;
  dynasty: string | null;
  mint: string | null;
  image_url: string | null;
  tags: string[];
  price_history: PriceHistory[];
}

export const API_URL = "https://functions.poehali.dev/8211e8f5-eeb5-4fe0-8565-54fb3d6db3a6";

export const PLACEHOLDER_1 = "https://cdn.poehali.dev/projects/15471631-b49f-4db9-b775-def9ad5b3830/files/7bb13e24-587d-42d0-8f72-0ffb6b3c8f54.jpg";
export const PLACEHOLDER_2 = "https://cdn.poehali.dev/projects/15471631-b49f-4db9-b775-def9ad5b3830/files/6d2e28f0-08f8-43b3-a1f1-f6e4b83fe803.jpg";

export const RARITY_CONFIG: Record<string, { color: string; label: string; score: number }> = {
  "обычная":      { color: "bg-slate-600 text-slate-200",   label: "Обычная",      score: 1 },
  "редкая":       { color: "bg-blue-900 text-blue-200",     label: "Редкая",       score: 2 },
  "очень редкая": { color: "bg-purple-900 text-purple-200", label: "Очень редкая", score: 3 },
  "уникальная":   { color: "bg-amber-900 text-amber-200",   label: "Уникальная",   score: 4 },
};

export const CONDITION_CONFIG: Record<string, { desc: string; multiplier: number }> = {
  "F":   { desc: "Удовлетворительное", multiplier: 0.4 },
  "VF":  { desc: "Очень хорошее",      multiplier: 0.65 },
  "XF":  { desc: "Превосходное",       multiplier: 0.85 },
  "UNC": { desc: "Не обращалась",      multiplier: 1.0 },
  "MS":  { desc: "Монетный блеск",     multiplier: 1.25 },
};

export const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: "catalog",    label: "Каталог" },
  { id: "history",    label: "История" },
  { id: "valuation",  label: "Стоимость" },
  { id: "statistics", label: "Статистика" },
  { id: "authors",    label: "Авторы" },
  { id: "search",     label: "Поиск" },
  { id: "import",     label: "Импорт" },
];

export function formatPrice(p: number | null) {
  if (!p) return "—";
  return new Intl.NumberFormat("ru-RU").format(p) + " ₽";
}

export function getPriceChange(coin: Coin) {
  const h = coin.price_history;
  if (!h || h.length < 2) return 0;
  const prev = h[h.length - 2].price;
  const curr = coin.current_price ?? h[h.length - 1].price;
  return ((curr - prev) / prev) * 100;
}

export function getCoinImage(coin: Coin) {
  if (coin.image_url) return coin.image_url;
  return coin.id % 2 === 0 ? PLACEHOLDER_2 : PLACEHOLDER_1;
}
