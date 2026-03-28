import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Coin, RARITY_CONFIG, CONDITION_CONFIG, formatPrice, getPriceChange } from "./types";

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

export function ValuationSection() {
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

export function StatisticsSection({ coins }: { coins: Coin[] }) {
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
            {Object.entries(byMetal).sort((a, b) => b[1] - a[1]).map(([metal, count]) => (
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
            {[...coins].sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0)).slice(0, 10).map(coin => {
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

export function HistorySection() {
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

export function AuthorsSection() {
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

export function ImportSection() {
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
