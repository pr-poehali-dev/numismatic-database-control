import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = "https://functions.poehali.dev/8211e8f5-eeb5-4fe0-8565-54fb3d6db3a6";

const PLACEHOLDER_1 = "https://cdn.poehali.dev/projects/15471631-b49f-4db9-b775-def9ad5b3830/files/7bb13e24-587d-42d0-8f72-0ffb6b3c8f54.jpg";
const PLACEHOLDER_2 = "https://cdn.poehali.dev/projects/15471631-b49f-4db9-b775-def9ad5b3830/files/6d2e28f0-08f8-43b3-a1f1-f6e4b83fe803.jpg";

function getCoinImage(coin: Coin) {
  if (coin.image_url) return coin.image_url;
  return coin.id % 2 === 0 ? PLACEHOLDER_2 : PLACEHOLDER_1;
}

type Rarity = "обычная" | "редкая" | "очень редкая" | "уникальная";
type Condition = "F" | "VF" | "XF" | "UNC" | "MS";

interface PriceHistory {
  price: number;
  date: string;
  source: string;
  notes: string;
}

interface Coin {
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

const RARITY_CONFIG: Record<string, { color: string; label: string; score: number }> = {
  "обычная":      { color: "bg-slate-600 text-slate-200",   label: "Обычная",      score: 1 },
  "редкая":       { color: "bg-blue-900 text-blue-200",     label: "Редкая",       score: 2 },
  "очень редкая": { color: "bg-purple-900 text-purple-200", label: "Очень редкая", score: 3 },
  "уникальная":   { color: "bg-amber-900 text-amber-200",   label: "Уникальная",   score: 4 },
};

const CONDITION_CONFIG: Record<string, { desc: string; multiplier: number }> = {
  "F":   { desc: "Удовлетворительное", multiplier: 0.4 },
  "VF":  { desc: "Очень хорошее",      multiplier: 0.65 },
  "XF":  { desc: "Превосходное",       multiplier: 0.85 },
  "UNC": { desc: "Не обращалась",      multiplier: 1.0 },
  "MS":  { desc: "Монетный блеск",     multiplier: 1.25 },
};

type Section = "catalog" | "history" | "valuation" | "statistics" | "authors" | "search" | "import";

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: "catalog",    label: "Каталог" },
  { id: "history",    label: "История" },
  { id: "valuation",  label: "Стоимость" },
  { id: "statistics", label: "Статистика" },
  { id: "authors",    label: "Авторы" },
  { id: "search",     label: "Поиск" },
  { id: "import",     label: "Импорт" },
];

function formatPrice(p: number | null) {
  if (!p) return "—";
  return new Intl.NumberFormat("ru-RU").format(p) + " ₽";
}

function getPriceChange(coin: Coin) {
  const h = coin.price_history;
  if (!h || h.length < 2) return 0;
  const prev = h[h.length - 2].price;
  const curr = coin.current_price ?? h[h.length - 1].price;
  return ((curr - prev) / prev) * 100;
}

function MiniChart({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const trend = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline points={points} fill="none" stroke={trend ? "#4ade80" : "#f87171"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoinCard({ coin, onClick }: { coin: Coin; onClick: () => void }) {
  const change = getPriceChange(coin);
  const rarityConf = RARITY_CONFIG[coin.rarity] ?? RARITY_CONFIG["обычная"];
  const prices = coin.price_history.map(h => h.price);
  return (
    <div className="coin-card bg-card border border-border rounded-sm cursor-pointer overflow-hidden" onClick={onClick}>
      <div className="relative h-44 overflow-hidden bg-black">
        <img src={getCoinImage(coin)} alt={coin.name} className="w-full h-full object-cover opacity-75 hover:opacity-90 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <span className={`absolute top-3 right-3 rarity-badge px-2 py-0.5 rounded-sm ${rarityConf.color}`}>{rarityConf.label}</span>
        <span className="absolute bottom-3 left-3 font-body text-xs text-white/60">{coin.year}</span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground leading-tight mb-1">{coin.name}</h3>
        <p className="font-body text-xs text-muted-foreground mb-3">{coin.country} · {coin.metal} · {coin.condition}</p>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-body text-xs text-muted-foreground mb-0.5">Текущая оценка</div>
            <div className="font-display text-xl font-semibold text-gold">{formatPrice(coin.current_price)}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {prices.length > 1 && <MiniChart data={prices} />}
            {prices.length > 1 && (
              <span className={`font-body text-xs font-medium ${change >= 0 ? "price-up" : "price-down"}`}>
                {change >= 0 ? "+" : ""}{change.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoinDetail({ coin, onClose }: { coin: Coin; onClose: () => void }) {
  const change = getPriceChange(coin);
  const rarityConf = RARITY_CONFIG[coin.rarity] ?? RARITY_CONFIG["обычная"];
  const conditionConf = CONDITION_CONFIG[coin.condition] ?? { desc: coin.condition, multiplier: 1 };
  const prices = coin.price_history.map(h => h.price);
  const rarityScore = rarityConf.score;
  const estimated = (coin.base_price ?? 0) * conditionConf.multiplier * (1 + (rarityScore - 1) * 0.3);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className="bg-card border border-border rounded-sm max-w-3xl w-full mt-8 mb-8 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="relative h-64 bg-black">
          <img src={getCoinImage(coin)} alt={coin.name} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-semibold text-white mb-1">{coin.name}</h2>
                <p className="font-body text-sm text-white/60">{coin.country} · {coin.year}</p>
              </div>
              <span className={`rarity-badge px-3 py-1 rounded-sm ${rarityConf.color}`}>{rarityConf.label}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
            {[
              { label: "Металл",   value: coin.metal },
              { label: "Вес",      value: coin.weight_g ? `${coin.weight_g} г` : "—" },
              { label: "Диаметр",  value: coin.diameter_mm ? `${coin.diameter_mm} мм` : "—" },
              { label: "Тираж",    value: coin.mintage ? coin.mintage.toLocaleString("ru-RU") + " экз." : "—" },
            ].map(item => (
              <div key={item.label}>
                <div className="font-body text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="font-body text-sm font-medium text-foreground">{item.value}</div>
              </div>
            ))}
          </div>

          {(coin.ruler || coin.dynasty || coin.mint) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
              {coin.ruler  && <div><div className="font-body text-xs text-muted-foreground mb-1">Правитель</div><div className="font-body text-sm font-medium text-foreground">{coin.ruler}</div></div>}
              {coin.dynasty && <div><div className="font-body text-xs text-muted-foreground mb-1">Династия</div><div className="font-body text-sm font-medium text-foreground">{coin.dynasty}</div></div>}
              {coin.mint   && <div><div className="font-body text-xs text-muted-foreground mb-1">Монетный двор</div><div className="font-body text-sm font-medium text-foreground">{coin.mint}</div></div>}
            </div>
          )}

          {coin.description && (
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6 pb-6 border-b border-border">{coin.description}</p>
          )}

          <div className="bg-secondary/50 rounded-sm p-4 mb-6">
            <h4 className="font-display text-lg font-semibold text-gold mb-3">Автоматическая оценка стоимости</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="font-body text-xs text-muted-foreground mb-1">Базовая цена</div>
                <div className="font-display text-base font-semibold text-foreground">{formatPrice(coin.base_price)}</div>
              </div>
              <div>
                <div className="font-body text-xs text-muted-foreground mb-1">Состояние ({coin.condition})</div>
                <div className="font-body text-sm text-foreground">{conditionConf.desc}</div>
                <div className="font-body text-xs text-muted-foreground">×{conditionConf.multiplier}</div>
              </div>
              <div>
                <div className="font-body text-xs text-muted-foreground mb-1">Расчётная оценка</div>
                <div className="font-display text-xl font-semibold text-gold">{formatPrice(Math.round(estimated))}</div>
              </div>
            </div>
          </div>

          {prices.length > 1 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-lg font-semibold text-foreground">Динамика цены</h4>
                <span className={`font-body text-sm font-medium ${change >= 0 ? "price-up" : "price-down"}`}>
                  {change >= 0 ? "+" : ""}{change.toFixed(1)}% за период
                </span>
              </div>
              <div className="bg-secondary/30 rounded-sm p-4 relative h-20">
                {(() => {
                  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
                  const pts = prices.map((v, i) => `${(i / (prices.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(" ");
                  const trend = prices[prices.length - 1] >= prices[0];
                  return (
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={trend ? "#4ade80" : "#f87171"} stopOpacity="0.2" />
                          <stop offset="100%" stopColor={trend ? "#4ade80" : "#f87171"} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polyline points={pts + ` 100,100 0,100`} fill="url(#cg)" stroke="none" />
                      <polyline points={pts} fill="none" stroke={trend ? "#4ade80" : "#f87171"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  );
                })()}
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-body text-xs text-muted-foreground">{formatPrice(prices[0])}</span>
                <span className="font-body text-xs text-gold font-medium">{formatPrice(coin.current_price)}</span>
              </div>
            </div>
          )}

          {coin.tags && coin.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {coin.tags.map(tag => (
                <span key={tag} className="font-body text-xs px-2 py-1 bg-secondary text-muted-foreground rounded-sm">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ValuationSection() {
  const [selectedMetal, setSelectedMetal] = useState("Золото");
  const [selectedRarity, setSelectedRarity] = useState<string>("редкая");
  const [selectedCondition, setSelectedCondition] = useState<string>("XF");
  const [basePrice, setBasePrice] = useState("50000");

  const rarityConf = RARITY_CONFIG[selectedRarity] ?? RARITY_CONFIG["редкая"];
  const conditionConf = CONDITION_CONFIG[selectedCondition] ?? CONDITION_CONFIG["XF"];
  const metalMult = selectedMetal === "Золото" ? 1.4 : selectedMetal === "Платина" ? 1.6 : 1.0;
  const estimated = parseFloat(basePrice || "0") * conditionConf.multiplier * (1 + (rarityConf.score - 1) * 0.3) * metalMult;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold text-foreground mb-2">Оценка стоимости</h2>
        <p className="font-body text-sm text-muted-foreground">Автоматический расчёт на основе редкости, состояния и металла</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-sm p-6">
          <h3 className="font-display text-xl font-semibold text-foreground mb-4">Параметры монеты</h3>
          <div className="space-y-4">
            <div>
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wider block mb-2">Базовая рыночная цена (₽)</label>
              <Input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="bg-secondary border-border font-body text-foreground" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wider block mb-2">Металл</label>
              <div className="flex flex-wrap gap-2">
                {["Золото", "Серебро", "Платина", "Медь", "Никель", "Бронза"].map(m => (
                  <button key={m} onClick={() => setSelectedMetal(m)} className={`font-body text-xs px-3 py-1.5 rounded-sm border transition-colors ${selectedMetal === m ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wider block mb-2">Редкость</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(RARITY_CONFIG).map(([key, conf]) => (
                  <button key={key} onClick={() => setSelectedRarity(key)} className={`font-body text-xs px-3 py-1.5 rounded-sm border transition-colors ${selectedRarity === key ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>{conf.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wider block mb-2">Состояние</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CONDITION_CONFIG).map(([key, conf]) => (
                  <button key={key} onClick={() => setSelectedCondition(key)} className={`font-body text-xs px-3 py-1.5 rounded-sm border transition-colors ${selectedCondition === key ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>{key} — {conf.desc}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-6 flex flex-col">
          <h3 className="font-display text-xl font-semibold text-foreground mb-4">Результат оценки</h3>
          <div className="space-y-3 mb-6 flex-1">
            {[
              ["Базовая цена", formatPrice(parseFloat(basePrice || "0"))],
              [`Коэффициент состояния (${selectedCondition})`, `×${conditionConf.multiplier}`],
              ["Коэффициент редкости", `×${(1 + (rarityConf.score - 1) * 0.3).toFixed(2)}`],
              [`Надбавка за металл (${selectedMetal})`, `×${metalMult}`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-body text-sm text-muted-foreground">{label}</span>
                <span className="font-body text-sm font-medium text-foreground">{val}</span>
              </div>
            ))}
          </div>
          <div className="bg-secondary/50 rounded-sm p-4 text-center">
            <div className="font-body text-xs text-muted-foreground mb-1 uppercase tracking-wider">Расчётная стоимость</div>
            <div className="font-display text-4xl font-semibold text-gold">{formatPrice(Math.round(estimated))}</div>
            <div className="font-body text-xs text-muted-foreground mt-2">Оценка носит справочный характер</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatisticsSection({ coins }: { coins: Coin[] }) {
  if (!coins.length) return <div className="text-center py-16 text-muted-foreground font-body">Загрузка данных...</div>;
  const totalValue = coins.reduce((s, c) => s + (c.current_price ?? 0), 0);
  const avgChange = coins.filter(c => c.price_history.length > 1).reduce((s, c) => s + getPriceChange(c), 0) / (coins.filter(c => c.price_history.length > 1).length || 1);
  const byMetal = coins.reduce((acc, c) => { acc[c.metal] = (acc[c.metal] || 0) + 1; return acc; }, {} as Record<string, number>);
  const byRarity = coins.reduce((acc, c) => { acc[c.rarity] = (acc[c.rarity] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold text-foreground mb-2">Статистика коллекции</h2>
        <p className="font-body text-sm text-muted-foreground">Аналитика по {coins.length} монетам в базе данных</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Монет в каталоге", value: coins.length + " экз." },
          { label: "Общая стоимость", value: formatPrice(totalValue) },
          { label: "Средний рост", value: (avgChange >= 0 ? "+" : "") + avgChange.toFixed(1) + "%" },
          { label: "Уникальных", value: coins.filter(c => c.rarity === "уникальная").length + " монет" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-sm p-4">
            <div className="font-body text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className="font-display text-2xl font-semibold text-gold">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-sm p-6">
          <h3 className="font-display text-xl font-semibold text-foreground mb-4">По металлу</h3>
          <div className="space-y-3">
            {Object.entries(byMetal).sort((a,b) => b[1]-a[1]).map(([metal, count]) => (
              <div key={metal}>
                <div className="flex justify-between font-body text-sm mb-1"><span className="text-foreground">{metal}</span><span className="text-muted-foreground">{count} монет</span></div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full" style={{ width: `${(count / coins.length) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-6">
          <h3 className="font-display text-xl font-semibold text-foreground mb-4">По редкости</h3>
          <div className="space-y-3">
            {Object.entries(byRarity).map(([rarity, count]) => (
              <div key={rarity}>
                <div className="flex justify-between font-body text-sm mb-1"><span className="text-foreground">{RARITY_CONFIG[rarity]?.label || rarity}</span><span className="text-muted-foreground">{count} монет</span></div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full" style={{ width: `${(count / coins.length) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-6 md:col-span-2">
          <h3 className="font-display text-xl font-semibold text-foreground mb-4">Топ монет по стоимости</h3>
          <div className="space-y-2">
            {[...coins].sort((a,b) => (b.current_price ?? 0) - (a.current_price ?? 0)).slice(0, 10).map(coin => {
              const change = getPriceChange(coin);
              const prices = coin.price_history.map(h => h.price);
              return (
                <div key={coin.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-sm text-foreground truncate">{coin.name}</div>
                    <div className="font-body text-xs text-muted-foreground">{coin.year} · {coin.country}</div>
                  </div>
                  {prices.length > 1 && <MiniChart data={prices} />}
                  <div className="text-right">
                    <div className="font-display text-sm font-semibold text-gold">{formatPrice(coin.current_price)}</div>
                    {prices.length > 1 && <div className={`font-body text-xs ${change >= 0 ? "price-up" : "price-down"}`}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistorySection() {
  const events = [
    { year: "IV в. до н.э.", title: "Первые монеты Александра Македонского", text: "Массовая чеканка золотых статеров, ставших первой международной резервной валютой древнего мира." },
    { year: "III в. н.э.", title: "Кризис монетного дела в Риме", text: "Инфляция и девальвация денария. Снижение содержания серебра с 90% до 5%, что привело к экономическому коллапсу." },
    { year: "XI в.", title: "Золотой расцвет Византии", text: "Солид (номисма) оставался стабильной валютой на протяжении 700 лет — непрецедентная монетарная стабильность." },
    { year: "1252", title: "Флорентийский флорин", text: "Первая стандартизированная золотая монета средневековой Европы, ставшая образцом для дукатов и других валют." },
    { year: "1816", title: "Золотой стандарт Великобритании", text: "Переход к монометаллизму. Фунт стерлингов привязан к золоту, что определило мировую финансовую систему на 100 лет." },
    { year: "1921–1924", title: "Советская монетная реформа", text: "Первые монеты РСФСР, затем СССР. Переход от царских серебряных рублей к новой советской денежной системе эпохи НЭПа." },
    { year: "1947", title: "Денежная реформа СССР", text: "Послевоенная реформа, изъявшая обесцененные деньги военных лет. Рублёвые монеты нового образца." },
    { year: "1971", title: "Отмена Бреттон-Вудской системы", text: "США отменяют конвертируемость доллара в золото. Нумизматические монеты становятся самостоятельным инвестиционным классом." },
  ];
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold text-foreground mb-2">История нумизматики</h2>
        <p className="font-body text-sm text-muted-foreground">Ключевые события в истории монетного дела</p>
      </div>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
        <div className="space-y-6">
          {events.map((ev, i) => (
            <div key={i} className="relative pl-16 animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="absolute left-4 top-1.5 w-4 h-4 rounded-full border-2 border-gold bg-background" />
              <div className="bg-card border border-border rounded-sm p-5">
                <span className="font-body text-xs font-semibold text-gold uppercase tracking-wider">{ev.year}</span>
                <h3 className="font-display text-xl font-semibold text-foreground mt-1 mb-2">{ev.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{ev.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthorsSection() {
  const authors = [
    { name: "Проф. Александр Зограф", role: "Специалист по античной нумизматике", period: "1889–1942", contribution: "Монументальный труд «Античные монеты» — основа русской нумизматической школы." },
    { name: "Иван Спасский", role: "Хранитель Эрмитажа", period: "1904–1990", contribution: "«Русская монетная система» — энциклопедический свод по отечественной нумизматике." },
    { name: "Владимир Уздеников", role: "Нумизмат, исследователь", period: "1929–2007", contribution: "Разработка каталога российских монет XVIII–XX веков, признанного международным стандартом." },
  ];
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold text-foreground mb-2">Авторы и эксперты</h2>
        <p className="font-body text-sm text-muted-foreground">Исследователи, внёсшие вклад в развитие нумизматики</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {authors.map((a, i) => (
          <div key={i} className="bg-card border border-border rounded-sm p-6">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Icon name="User" size={24} className="text-gold" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-1">{a.name}</h3>
            <div className="font-body text-xs text-gold mb-1">{a.period}</div>
            <div className="font-body text-xs text-muted-foreground mb-3">{a.role}</div>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">{a.contribution}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportSection() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold text-foreground mb-2">Импорт данных</h2>
        <p className="font-body text-sm text-muted-foreground">Загрузите данные о вашей коллекции из внешних источников</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border border-dashed rounded-sm p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gold/50 transition-colors">
          <Icon name="Upload" size={36} className="text-gold mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">CSV / Excel</h3>
          <p className="font-body text-sm text-muted-foreground mb-4">Загрузите таблицу с данными вашей коллекции</p>
          <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">Выбрать файл</Button>
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="FileText" size={18} className="text-gold" />
              <h4 className="font-body text-sm font-semibold text-foreground">Поддерживаемые форматы</h4>
            </div>
            <ul className="font-body text-sm text-muted-foreground space-y-1">
              <li>• CSV (разделитель — запятая или точка с запятой)</li>
              <li>• Excel (.xlsx, .xls)</li>
              <li>• JSON (формат каталога)</li>
            </ul>
          </div>
          <div className="bg-card border border-border rounded-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="Info" size={18} className="text-gold" />
              <h4 className="font-body text-sm font-semibold text-foreground">Обязательные поля</h4>
            </div>
            <div className="font-body text-xs text-muted-foreground grid grid-cols-2 gap-1">
              {["Название", "Год чеканки", "Страна", "Металл", "Состояние", "Цена"].map(f => (
                <span key={f} className="px-2 py-0.5 bg-secondary rounded-sm">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>("catalog");
  const [coins, setCoins] = useState<Coin[]>([]);
  const [metals, setMetals] = useState<string[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMetal, setFilterMetal] = useState("Все");
  const [filterRarity, setFilterRarity] = useState("Все");

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (filterMetal !== "Все") params.set("metal", filterMetal);
    if (filterRarity !== "Все") params.set("rarity", filterRarity);

    setLoading(true);
    setError(null);
    fetch(`${API_URL}?${params}`)
      .then(r => r.json())
      .then(data => {
        setCoins(data.coins ?? []);
        if (data.metals) setMetals(["Все", ...data.metals]);
        if (data.rarities) setRarities(["Все", ...data.rarities]);
      })
      .catch(() => setError("Не удалось загрузить каталог"))
      .finally(() => setLoading(false));
  }, [searchQuery, filterMetal, filterRarity]);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-gold flex items-center justify-center">
                <span className="font-display text-sm font-bold text-black">N</span>
              </div>
              <div>
                <div className="font-display text-lg font-semibold text-foreground leading-none">Нумизматика</div>
                <div className="font-body text-xs text-muted-foreground">Академический каталог</div>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`nav-link font-body text-xs uppercase tracking-wider transition-colors ${activeSection === item.id ? "text-gold active" : "text-muted-foreground hover:text-foreground"}`}>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="md:hidden border-t border-border overflow-x-auto">
          <div className="flex px-4 py-2 gap-5 min-w-max">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`font-body text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${activeSection === item.id ? "text-gold" : "text-muted-foreground"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {(activeSection === "catalog" || activeSection === "search") && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="font-display text-3xl font-semibold text-foreground mb-2">
                {activeSection === "search" ? "Поиск по каталогу" : "Каталог монет"}
              </h2>
              {!loading && !error && (
                <p className="font-body text-sm text-muted-foreground">{coins.length} позиций</p>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию, стране, тегам..."
                  className="pl-9 bg-card border-border font-body text-sm text-foreground placeholder:text-muted-foreground"
                  autoFocus={activeSection === "search"}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {metals.map(m => (
                  <button key={m} onClick={() => setFilterMetal(m)}
                    className={`font-body text-xs px-3 py-1.5 rounded-sm border transition-colors ${filterMetal === m ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {rarities.map(r => (
                  <button key={r} onClick={() => setFilterRarity(r)}
                    className={`font-body text-xs px-3 py-1.5 rounded-sm border transition-colors ${filterRarity === r ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                    {r === "Все" ? "Все" : RARITY_CONFIG[r]?.label || r}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-sm overflow-hidden animate-pulse">
                    <div className="h-44 bg-secondary" />
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                      <div className="h-6 bg-secondary rounded w-1/3 mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && <div className="text-center py-16 text-destructive font-body">{error}</div>}
            {!loading && !error && coins.length === 0 && (
              <div className="text-center py-16 text-muted-foreground font-body">Монеты не найдены</div>
            )}
            {!loading && !error && coins.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coins.map(coin => <CoinCard key={coin.id} coin={coin} onClick={() => setSelectedCoin(coin)} />)}
              </div>
            )}
          </div>
        )}

        {activeSection === "history"    && <HistorySection />}
        {activeSection === "valuation"  && <ValuationSection />}
        {activeSection === "statistics" && <StatisticsSection coins={coins} />}
        {activeSection === "authors"    && <AuthorsSection />}
        {activeSection === "import"     && <ImportSection />}
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-display text-sm text-muted-foreground">Нумизматика · Академический каталог монет</div>
          <div className="font-body text-xs text-muted-foreground">База содержит {coins.length} позиций</div>
        </div>
      </footer>

      {selectedCoin && <CoinDetail coin={selectedCoin} onClose={() => setSelectedCoin(null)} />}
    </div>
  );
}
