import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Coin, RARITY_CONFIG, CONDITION_CONFIG, formatPrice, getPriceChange, getCoinImage } from "./types";

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
              { label: "Металл",  value: coin.metal },
              { label: "Вес",     value: coin.weight_g ? `${coin.weight_g} г` : "—" },
              { label: "Диаметр", value: coin.diameter_mm ? `${coin.diameter_mm} мм` : "—" },
              { label: "Тираж",   value: coin.mintage ? coin.mintage.toLocaleString("ru-RU") + " экз." : "—" },
            ].map(item => (
              <div key={item.label}>
                <div className="font-body text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="font-body text-sm font-medium text-foreground">{item.value}</div>
              </div>
            ))}
          </div>

          {(coin.ruler || coin.dynasty || coin.mint) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
              {coin.ruler   && <div><div className="font-body text-xs text-muted-foreground mb-1">Правитель</div><div className="font-body text-sm font-medium text-foreground">{coin.ruler}</div></div>}
              {coin.dynasty && <div><div className="font-body text-xs text-muted-foreground mb-1">Династия</div><div className="font-body text-sm font-medium text-foreground">{coin.dynasty}</div></div>}
              {coin.mint    && <div><div className="font-body text-xs text-muted-foreground mb-1">Монетный двор</div><div className="font-body text-sm font-medium text-foreground">{coin.mint}</div></div>}
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

interface CoinCatalogProps {
  activeSection: "catalog" | "search";
  coins: Coin[];
  metals: string[];
  rarities: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterMetal: string;
  filterRarity: string;
  onSearchChange: (v: string) => void;
  onMetalChange: (v: string) => void;
  onRarityChange: (v: string) => void;
  onCoinClick: (coin: Coin) => void;
  selectedCoin: Coin | null;
  onCoinClose: () => void;
}

export default function CoinCatalog({
  activeSection, coins, metals, rarities, loading, error,
  searchQuery, filterMetal, filterRarity,
  onSearchChange, onMetalChange, onRarityChange,
  onCoinClick, selectedCoin, onCoinClose,
}: CoinCatalogProps) {
  return (
    <>
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
            <Input value={searchQuery} onChange={e => onSearchChange(e.target.value)}
              placeholder="Поиск по названию, стране, тегам..."
              className="pl-9 bg-card border-border font-body text-sm text-foreground placeholder:text-muted-foreground"
              autoFocus={activeSection === "search"}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {metals.map(m => (
              <button key={m} onClick={() => onMetalChange(m)}
                className={`font-body text-xs px-3 py-1.5 rounded-sm border transition-colors ${filterMetal === m ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {rarities.map(r => (
              <button key={r} onClick={() => onRarityChange(r)}
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
            {coins.map(coin => <CoinCard key={coin.id} coin={coin} onClick={() => onCoinClick(coin)} />)}
          </div>
        )}
      </div>

      {selectedCoin && <CoinDetail coin={selectedCoin} onClose={onCoinClose} />}
    </>
  );
}
