import { useState, useEffect } from "react";
import { Coin, Section, NAV_ITEMS, API_URL } from "@/components/coins/types";
import CoinCatalog from "@/components/coins/CoinCatalog";
import { HistorySection, ValuationSection, StatisticsSection, AuthorsSection, ImportSection } from "@/components/coins/StaticSections";

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
          <CoinCatalog
            activeSection={activeSection}
            coins={coins}
            metals={metals}
            rarities={rarities}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            filterMetal={filterMetal}
            filterRarity={filterRarity}
            onSearchChange={setSearchQuery}
            onMetalChange={setFilterMetal}
            onRarityChange={setFilterRarity}
            onCoinClick={setSelectedCoin}
            selectedCoin={selectedCoin}
            onCoinClose={() => setSelectedCoin(null)}
          />
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
    </div>
  );
}
