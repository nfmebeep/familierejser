import React, { useState, useEffect } from "react";

// ─── AFFILIATE CONFIG ──────────────────────────────────────────────────────────
// Affiliate IDs — tilføj dine egne når du er godkendt
const MOMONDO_AFF    = ""; // fx "cd/xxxx" — Kayak affiliate
const BOOKING_AFF    = ""; // fx "123456" — Booking.com affiliate via extranet
const AIRALO_AFF     = ""; // fx "ABC123" — Airalo affiliate
const ERV_AFF        = ""; // fx "12345" — ERV/European via Adtraction.com
const RENTALCARS_AFF  = ""; // fx "ABC123" — Rentalcars.com via CJ Affiliate
const GETTRANSFER_AFF = ""; // fx "XXXXX" — GetTransfer.com airport transfers

// Lufthavn-navne lookup
const AIRPORT_NAMES = {
  CPH: "København Kastrup", BLL: "Billund", AAL: "Aalborg", AAR: "Aarhus",
  PMI: "Palma de Mallorca", DBV: "Dubrovnik", HKT: "Phuket", LPA: "Gran Canaria",
  FAO: "Faro (Algarve)", DXB: "Dubai", RNN: "Bornholm", FLR: "Firenze",
  NRT: "Tokyo Narita", RAK: "Marrakech", RHO: "Rhodos", KGS: "Kos",
  ACE: "Lanzarote", SJO: "San José (Costa Rica)", AMM: "Amman Queen Alia",
  TGD: "Podgorica / Tivat", VAR: "Varna (Bulgarien)",
};

function momondoLink({ from, to, depart, returnDate, adults, children, flexibility = 3 }) {
  // Momondo/Kayak flight search URL format
  const childStr = children.length > 0 ? `/children-${children.join("-")}` : "";
  const flexStr = flexibility > 0 ? `?flexi=${flexibility}` : "";
  const aff = MOMONDO_AFF ? `${flexStr ? "&" : "?"}ref=${MOMONDO_AFF}` : "";
  return `https://www.kayak.dk/flights/${from}-${to}/${depart}/${returnDate}/${adults}adults${childStr}${flexStr}${aff}`;
}
function getTransferLink({ airport, date }) {
  const aff = GETTRANSFER_AFF ? `?partner=${GETTRANSFER_AFF}` : "";
  return `https://www.gettransfer.com/da/airport-transfer/${encodeURIComponent(airport)}${aff}`;
}
function rentalcarsLink({ destination, iata, pickup, dropoff, drivers }) {
  const aff = RENTALCARS_AFF ? `&affiliateCode=${RENTALCARS_AFF}` : "";
  return `https://www.rentalcars.com/SearchResults.do?affiliateCode=kayak&preflang=da&country=dk&location=${encodeURIComponent(destination)}&locationId=${iata}&puDay=${pickup.slice(8,10)}&puMonth=${pickup.slice(5,7)}&puYear=${pickup.slice(0,4)}&doDay=${dropoff.slice(8,10)}&doMonth=${dropoff.slice(5,7)}&doYear=${dropoff.slice(0,4)}&driverAge=30${aff}`;
}
function ervLink({ depart, returnDate, adults, children }) {
  const total = adults + children.length;
  const aff = ERV_AFF ? `&affiliateId=${ERV_AFF}` : "";
  return `https://www.erv.dk/rejseforsikring/enkeltrejse/?startdate=${depart}&enddate=${returnDate}&adults=${adults}&children=${children.length}${aff}`;
}
function bookingLink({ destination, checkin, checkout, adults, children, flexibility = 3 }) {
  const ages = children.map(a => `age=${a}`).join("&");
  const flex = flexibility > 0 ? `&flex_window=${flexibility}` : "";
  const aff = BOOKING_AFF ? `&aid=${BOOKING_AFF}` : "";
  return `https://www.booking.com/searchresults.da.html?ss=${encodeURIComponent(destination)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&group_children=${children.length}&${ages}${flex}${aff}&lang=da`;
}


// ─── HISTORISK VEJRDATA (gennemsnit per måned) ────────────────────────────────
// [jan,feb,mar,apr,maj,jun,jul,aug,sep,okt,nov,dec] — °C dagstemp + beskrivelse
const HIST_WEATHER = {
  'mallorca':        { temp: [14,14,16,18,22,26,29,30,27,22,17,14], desc: ['Kølig','Kølig','Mild','Mild','Varm','Varm','Varm sol','Varm sol','Varm','Mild','Kølig','Kølig'] },
  'kroatien':        { temp: [8,9,12,16,21,25,28,28,24,18,13,9],   desc: ['Kølig','Kølig','Mild','Mild','Varm','Varm','Varm sol','Varm sol','Varm','Mild','Kølig','Kølig'] },
  'thailand':        { temp: [31,33,34,34,33,32,31,31,31,31,30,30], desc: ['Sol','Sol','Sol','Varmt','Regn','Regn','Regn','Regn','Regn','Regn','Sol','Sol'] },
  'gran-canaria':    { temp: [19,19,20,21,23,25,26,27,26,24,22,20], desc: ['Mild','Mild','Mild','Mild','Varm','Varm','Varm sol','Varm sol','Varm sol','Varm','Mild','Mild'] },
  'portugal':        { temp: [15,16,18,20,23,27,29,29,27,22,17,15], desc: ['Mild','Mild','Mild','Varm','Varm','Varm sol','Varm sol','Varm sol','Varm','Mild','Mild','Mild'] },
  'dubai':           { temp: [20,21,24,28,33,35,37,38,35,31,26,21], desc: ['Mild','Mild','Varmt','Varmt','Meget varmt','Meget varmt','Meget varmt','Meget varmt','Varmt','Varmt','Varm','Mild'] },
  'bornholm':        { temp: [1,1,4,8,14,17,20,20,16,11,6,3],      desc: ['Koldt','Koldt','Kølig','Mild','Mild','Varm','Sol','Sol','Mild','Kølig','Kølig','Koldt'] },
  'italien-toscana': { temp: [7,8,11,15,19,23,27,27,23,17,11,7],   desc: ['Kølig','Kølig','Mild','Mild','Varm','Varm sol','Varm sol','Varm sol','Varm','Mild','Kølig','Kølig'] },
  'japan':           { temp: [6,7,10,15,20,23,27,28,24,18,13,8],   desc: ['Kølig','Kølig','Mild','Mild','Varm','Regn','Varm sol','Varm sol','Varm','Mild','Kølig','Kølig'] },
  'marokko':         { temp: [13,15,18,21,25,29,32,33,29,23,17,13], desc: ['Mild','Mild','Varm','Varm','Varm','Varm sol','Varmt','Varmt','Varm','Varm','Mild','Mild'] },
  'rhodos':          { temp: [13,14,16,19,23,28,30,30,27,22,18,14], desc: ['Kølig','Kølig','Mild','Mild','Varm','Varm sol','Varm sol','Varm sol','Varm','Mild','Mild','Kølig'] },
  'kos':             { temp: [13,14,16,19,23,28,30,30,27,22,17,14], desc: ['Kølig','Kølig','Mild','Mild','Varm','Varm sol','Varm sol','Varm sol','Varm','Mild','Mild','Kølig'] },
  'lanzarote':       { temp: [18,18,19,20,22,24,25,26,25,23,21,18], desc: ['Mild','Mild','Mild','Mild','Varm','Varm','Varm sol','Varm sol','Varm sol','Varm','Mild','Mild'] },
  'costa-rica':      { temp: [27,28,29,29,28,27,27,27,27,26,26,26], desc: ['Sol','Sol','Sol','Sol','Regn','Regn','Regn','Regn','Regn','Regn','Regn','Sol'] },
  'jordan':          { temp: [12,14,17,23,28,32,34,34,31,26,19,13], desc: ['Kølig','Mild','Mild','Varm','Varm','Varm sol','Varmt','Varmt','Varm','Varm','Mild','Kølig'] },
  'montenegro':      { temp: [7,8,11,15,20,24,28,28,23,17,12,8],   desc: ['Kølig','Kølig','Mild','Mild','Varm','Varm sol','Varm sol','Varm sol','Varm','Mild','Kølig','Kølig'] },
  'bulgarien':       { temp: [2,4,9,15,20,24,27,27,22,15,8,4],     desc: ['Koldt','Kølig','Mild','Mild','Varm','Varm sol','Varm sol','Varm sol','Varm','Mild','Kølig','Koldt'] },
};

const WMO_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',
  71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
};
const WMO_DA = {
  0:'Klar',1:'Næsten klar',2:'Delvis skyet',3:'Overskyet',45:'Tåge',
  51:'Let dryssel',53:'Dryssel',55:'Kraftig dryssel',61:'Let regn',63:'Regn',65:'Kraftig regn',
  71:'Let sne',73:'Sne',75:'Kraftig sne',80:'Let byger',81:'Byger',82:'Kraftige byger',
  95:'Tordenvejr',96:'Tordenvejr med hagl',99:'Kraftigt tordenvejr',
};
const MONTH_DA = ['januar','februar','marts','april','maj','juni','juli','august','september','oktober','november','december'];

function WeatherWidget({ dest, departDate }) {
  const [weather, setWeather] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const isWithin14Days = React.useMemo(() => {
    if (!departDate) return false;
    const diff = (new Date(departDate) - new Date()) / 86400000;
    return diff >= 0 && diff <= 14;
  }, [departDate]);

  React.useEffect(() => {
    if (!isWithin14Days || !dest.lat) return;
    setLoading(true);
    const end = departDate ? (() => { const d = new Date(departDate); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })() : '';
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${dest.lat}&longitude=${dest.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto&start_date=${departDate}&end_date=${end}`)
      .then(r => r.json())
      .then(data => { setWeather(data.daily); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dest.id, departDate, isWithin14Days]);

  if (!departDate) return null;

  const month = new Date(departDate).getMonth();
  const hist = HIST_WEATHER[dest.id];

  return (
    <div style={{ border: "1px solid #ede8e0", padding: "24px", marginBottom: 2, background: "#fff" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>
        🌤️ Vejr ved ankomst
      </div>

      {isWithin14Days ? (
        loading ? (
          <div style={{ fontSize: 13, color: "#b0a898" }}>Henter vejrudsigt...</div>
        ) : weather ? (
          <div>
            <div style={{ fontSize: 11, color: "#b85c2a", marginBottom: 12 }}>Aktuel vejrudsigt for {dest.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
              {weather.time.map((date, i) => (
                <div key={i} style={{ textAlign: "center", padding: "10px 4px", background: i === 0 ? "#fdf3ec" : "#faf8f4", border: `1px solid ${i === 0 ? "#f0d8c4" : "#ede8e0"}` }}>
                  <div style={{ fontSize: 10, color: "#b0a898", marginBottom: 4 }}>
                    {i === 0 ? "Ankomst" : new Date(date).toLocaleDateString("da-DK", { weekday: "short" })}
                  </div>
                  <div style={{ fontSize: 22 }}>{WMO_ICONS[weather.weathercode[i]] || '🌡️'}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a18", marginTop: 4 }}>
                    {Math.round(weather.temperature_2m_max[i])}°
                  </div>
                  <div style={{ fontSize: 10, color: "#b0a898" }}>
                    {Math.round(weather.temperature_2m_min[i])}°
                  </div>
                  {weather.precipitation_sum[i] > 0 && (
                    <div style={{ fontSize: 10, color: "#2471a3", marginTop: 2 }}>{weather.precipitation_sum[i]}mm</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#b0a898", marginTop: 10 }}>Kilde: Open-Meteo · Opdateres dagligt</div>
          </div>
        ) : null
      ) : hist ? (
        <div>
          <div style={{ fontSize: 11, color: "#8a8078", marginBottom: 12 }}>
            Historisk gennemsnit for <strong>{MONTH_DA[month]}</strong> i {dest.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", background: "#fdf3ec", border: "1px solid #f0d8c4" }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>
              {hist.temp[month] >= 28 ? '☀️' : hist.temp[month] >= 22 ? '🌤️' : hist.temp[month] >= 15 ? '⛅' : '🌥️'}
            </div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontStyle: "italic", color: "#b85c2a", lineHeight: 1 }}>
                {hist.temp[month]}°C
              </div>
              <div style={{ fontSize: 13, color: "#6a6058", marginTop: 4 }}>{hist.desc[month]}</div>
              <div style={{ fontSize: 11, color: "#b0a898", marginTop: 2 }}>Typisk dagstemp · historisk gennemsnit</div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
            {MONTH_DA.map((m, i) => (
              <div key={i} style={{ textAlign: "center", padding: "6px 2px", background: i === month ? "#fdf3ec" : "transparent", border: i === month ? "1px solid #f0d8c4" : "1px solid transparent" }}>
                <div style={{ fontSize: 9, color: i === month ? "#b85c2a" : "#b0a898", textTransform: "uppercase" }}>{m.slice(0,3)}</div>
                <div style={{ fontSize: 12, fontWeight: i === month ? 600 : 400, color: i === month ? "#b85c2a" : "#6a6058" }}>{hist.temp[i]}°</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}


// ─── CUSTOM DATO-RANGE-PICKER ────────────────────────────────────────────────
function getISOWeek(dateStr) {
  const d = new Date(dateStr);
  const j = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  j.setUTCDate(j.getUTCDate() + 4 - (j.getUTCDay() || 7));
  const y = j.getUTCFullYear();
  const w1 = new Date(Date.UTC(y, 0, 4));
  return 1 + Math.round(((j - w1) / 86400000 - 3 + (w1.getUTCDay() || 7)) / 7);
}

const UGEDAG = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];
const MAANED = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"];

function RangePicker({ departDate, returnDate, onSelect }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const initMonth = departDate ? new Date(departDate) : new Date(today.getFullYear(), today.getMonth(), 1);
  const [viewYear, setViewYear] = React.useState(initMonth.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initMonth.getMonth());
  const [selecting, setSelecting] = React.useState(departDate ? "return" : "depart"); // which end we're picking next
  const [hoverDate, setHoverDate] = React.useState(null);

  const toStr = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fromStr = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };

  const dep = departDate ? fromStr(departDate) : null;
  const ret = returnDate ? fromStr(returnDate) : null;

  function handleDayClick(d) {
    if (d < today) return;
    if (selecting === "depart" || !dep) {
      // Sæt afrejse — ryd hjemkomst, vent på at bruger vælger den
      onSelect(toStr(d), "");
      setSelecting("return");
    } else {
      // Setting return
      if (d <= dep) {
        // Klik før afrejse — sæt ny afrejse, ryd hjemkomst
        onSelect(toStr(d), "");
        setSelecting("return");
      } else {
        onSelect(departDate, toStr(d));
        setSelecting("depart");
      }
    }
  }

  // Build calendar grid for current view month
  function buildGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Mon=0 offset
    let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6;
    const days = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }

  // Show 2 months side by side (or stacked on narrow)
  const months = [
    { year: viewYear, month: viewMonth },
    { year: viewMonth === 11 ? viewYear + 1 : viewYear, month: (viewMonth + 1) % 12 },
  ];

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function isInRange(d) {
    if (!dep) return false;
    const end = hoverDate && selecting === "return" ? hoverDate : ret;
    if (!end) return false;
    return d > dep && d < end;
  }

  function isStart(d) { return dep && toStr(d) === toStr(dep); }
  function isEnd(d) {
    const end = hoverDate && selecting === "return" ? hoverDate : ret;
    return end && toStr(d) === toStr(end);
  }
  function isPast(d) { return d < today; }

  // Get week number for first day of each row
  function rowWeekNum(firstDayOfRow) {
    if (!firstDayOfRow) return null;
    return getISOWeek(toStr(firstDayOfRow));
  }

  return (
    <div>
      {/* Header: selected summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div onClick={() => setSelecting("depart")} style={{ padding: "12px 14px", border: `2px solid ${selecting === "depart" ? "#b85c2a" : "#ede8e0"}`, background: selecting === "depart" ? "#fdf3ec" : "#fff", cursor: "pointer" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b0a898", marginBottom: 4 }}>Afrejse</div>
          {dep ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a18" }}>{dep.toLocaleDateString("da-DK", { day: "numeric", month: "short" })}</div>
              <div style={{ fontSize: 11, color: "#b85c2a" }}>Uge {getISOWeek(toStr(dep))}</div>
            </>
          ) : <div style={{ fontSize: 13, color: "#b0a898" }}>Vælg dato</div>}
        </div>
        <div onClick={() => dep && setSelecting("return")} style={{ padding: "12px 14px", border: `2px solid ${selecting === "return" ? "#b85c2a" : "#ede8e0"}`, background: selecting === "return" ? "#fdf3ec" : "#fff", cursor: dep ? "pointer" : "default", opacity: dep ? 1 : 0.5 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b0a898", marginBottom: 4 }}>Hjemkomst</div>
          {ret ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a18" }}>{ret.toLocaleDateString("da-DK", { day: "numeric", month: "short" })}</div>
              <div style={{ fontSize: 11, color: "#b85c2a" }}>Uge {getISOWeek(toStr(ret))} · {Math.round((ret - dep) / 86400000)} nætter</div>
            </>
          ) : <div style={{ fontSize: 13, color: "#b0a898" }}>{dep ? "Vælg hjemkomst" : "—"}</div>}
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize: 11, color: "#b85c2a", marginBottom: 10, textAlign: "center" }}>
        {selecting === "depart" ? "Tryk på afrejsedato" : "Tryk på hjemkomstdato"}
      </div>

      {/* Calendar nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "1px solid #ede8e0", width: 32, height: 32, fontFamily: "inherit", fontSize: 16, color: "#6a6058", cursor: "pointer" }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18" }}>
          {MAANED[viewMonth]} {viewYear}
        </div>
        <button onClick={nextMonth} style={{ background: "none", border: "1px solid #ede8e0", width: 32, height: 32, fontFamily: "inherit", fontSize: 16, color: "#6a6058", cursor: "pointer" }}>›</button>
      </div>

      {/* Two month grids */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {months.map(({ year, month }, mi) => {
          const grid = buildGrid(year, month);
          // Chunk into weeks
          const weeks = [];
          for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
          // Pad last week
          while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

          return (
            <div key={mi}>
              <div style={{ fontSize: 11, color: "#8a8078", textAlign: "center", marginBottom: 6 }}>
                {mi === 1 ? `${MAANED[(viewMonth + 1) % 12]} ${viewMonth === 11 ? viewYear + 1 : viewYear}` : ""}
              </div>
              {/* Weekday headers + Uge col */}
              <div style={{ display: "grid", gridTemplateColumns: "24px repeat(7, 1fr)", gap: 1, marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: "#c0b8b0", textAlign: "center" }}>Uge</div>
                {UGEDAG.map(d => <div key={d} style={{ fontSize: 9, color: "#b0a898", textAlign: "center", fontWeight: 500 }}>{d}</div>)}
              </div>
              {/* Weeks */}
              {weeks.map((week, wi) => {
                const firstReal = week.find(d => d);
                const wn = firstReal ? rowWeekNum(firstReal) : null;
                return (
                  <div key={wi} style={{ display: "grid", gridTemplateColumns: "24px repeat(7, 1fr)", gap: 1, marginBottom: 1 }}>
                    <div style={{ fontSize: 9, color: "#c0b8b0", textAlign: "center", paddingTop: 6 }}>{wn}</div>
                    {week.map((d, di) => {
                      if (!d) return <div key={di} />;
                      const past = isPast(d);
                      const start = isStart(d);
                      const end = isEnd(d);
                      const inRange = isInRange(d);
                      return (
                        <button key={di}
                          onClick={() => !past && handleDayClick(d)}
                          onMouseEnter={() => !past && selecting === "return" && dep && d > dep && setHoverDate(d)}
                          onMouseLeave={() => setHoverDate(null)}
                          style={{
                            padding: "5px 0", border: "none", fontFamily: "inherit", fontSize: 12,
                            background: start || end ? "#b85c2a" : inRange ? "#fdf3ec" : "transparent",
                            color: start || end ? "#fff" : past ? "#d8d0c4" : "#1a1a18",
                            fontWeight: start || end ? 700 : 400,
                            cursor: past ? "default" : "pointer",
                            borderRadius: start ? "3px 0 0 3px" : end ? "0 3px 3px 0" : 0,
                            textAlign: "center",
                          }}>
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DESTINATION DATABASE ─────────────────────────────────────────────────────
const DESTINATIONS = [
  {
    id: "mallorca",
    lat: 39.5696, lon: 2.6502,
    image: "/images/mallorca.jpg",
    visual: { sky: "#4a9eda", sea: "#2980b9", sand: "#f4d03f", accent: "#e67e22", emoji: "🏖️", label: "Blå laguner" },
    segment: 'tryghed', allInclusive: true,  vibeScore: { tryghed: 95, opdagelse: 40 },
    name: "Mallorca",
    country: "Spanien",
    flag: "🇪🇸",
    iata: "PMI",
    region: "Middelhavet",
    tagline: "Klassikeren der aldrig skuffer",
    flightTime: 2.8,
    airports: ["CPH", "BLL", "AAL"],
    budgetLevel: [1, 2, 3],
    minChildAge: 0,
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    schoolHolidays: ["sommer", "efterår", "vinterferie"],
    highlights: ["Strand", "Vandpark", "Cykling", "Historisk by"],
    familyScore: 95,
    whyFamily: "Store sandstrande, lavt hav ved Alcudia, masser af vandparker og aktiviteter. Et af de nemmeste destinationer med småbørn.",
    priceFrom: 3200,
    hotelTypes: ["All-inclusive", "Ferielejlighed", "Familiehotel"],
    safety: 1,
    kidActivities: ["Aqualand vandpark", "Katamaran-sejltur", "Delfin-safari", "Go-kart", "Ridning"],
    tipFrom: "Vælg Alcudia eller Pollença frem for Magaluf — roligere og mere familievenligt.",
    driveFromBeach: 5,
    visa: false,
    currency: "EUR",
    weatherJuly: "30°C, sol",
  },
  {
    id: "kroatien",
    lat: 42.6507, lon: 18.0944,
    image: "/images/kroatien.jpg",
    visual: { sky: "#2471a3", sea: "#1a5276", sand: "#d5e8d4", accent: "#c0392b", emoji: "🏰", label: "Adriaterhav" },
    segment: 'begge',   allInclusive: false, vibeScore: { tryghed: 65, opdagelse: 88 },
    name: "Dubrovnik & Dalmatien",
    country: "Kroatien",
    flag: "🇭🇷",
    iata: "DBV",
    region: "Adriaterhavet",
    tagline: "Eventyrlig kystlinje for nysgerrige børn",
    flightTime: 2.5,
    airports: ["CPH", "BLL"],
    budgetLevel: [2, 3],
    minChildAge: 4,
    bestMonths: [5, 6, 7, 8, 9],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Øer", "Sejltur", "Snorkling", "Middelalderby"],
    familyScore: 88,
    whyFamily: "Krystalklart vand, masser af øer at udforske, og Dubrovnik er som en levende legoby for børn. Bedst for børn over 4 år.",
    priceFrom: 4100,
    hotelTypes: ["Ferielejlighed", "Boutique hotel", "Sejlcharter"],
    safety: 1,
    kidActivities: ["Ø-hopping med båd", "Snorkling i Biševo blå grotte", "Kayak", "Svømning fra klippestrande"],
    tipFrom: "Book øfærge til Hvar eller Brač tidligt — de er populære og fylder hurtigt.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJuly: "29°C, sol",
  },
  {
    id: "thailand",
    lat: 8.0863, lon: 98.3381,
    image: "/images/thailand.jpg",
    visual: { sky: "#f39c12", sea: "#16a085", sand: "#f9e79f", accent: "#27ae60", emoji: "🌴", label: "Tropisk paradis" },
    segment: 'begge',   allInclusive: false, vibeScore: { tryghed: 60, opdagelse: 90 },
    name: "Phuket & Khao Lak",
    country: "Thailand",
    flag: "🇹🇭",
    iata: "HKT",
    region: "Sydøstasien",
    tagline: "Den lange tur der giver minder for livet",
    flightTime: 11,
    airports: ["CPH"],
    budgetLevel: [2, 3],
    minChildAge: 3,
    bestMonths: [11, 12, 1, 2, 3, 4],
    schoolHolidays: ["vinter", "vinterferie"],
    highlights: ["Strand", "Elefanter", "Tempelbesøg", "Snorkling"],
    familyScore: 82,
    whyFamily: "Fantastisk valuta for pengene, venlige over for børn, og oplevelser du ikke finder i Europa. Khao Lak er roligere end Phuket.",
    priceFrom: 8500,
    hotelTypes: ["All-inclusive resort", "Strand-bungalows"],
    safety: 2,
    kidActivities: ["Elefant-sanctuary besøg", "Snorkling ved Similan Islands", "Thaikogeskole", "Thai-boksning for børn", "Natmarked"],
    tipFrom: "Rejsende vaccination anbefales (Hepatitis A/B, tyfus). Start tidligt med vaccination — minimum 6 uger før afrejse.",
    driveFromBeach: 0,
    visa: false,
    currency: "THB",
    weatherJan: "32°C, sol",
  },
  {
    id: "gran-canaria",
    lat: 27.9202, lon: -15.5474,
    image: "/images/gran-canaria.jpg",
    visual: { sky: "#f1c40f", sea: "#2e86c1", sand: "#e59866", accent: "#d35400", emoji: "🏜️", label: "Sandklitter" },
    segment: 'tryghed', allInclusive: true,  vibeScore: { tryghed: 92, opdagelse: 35 },
    name: "Gran Canaria",
    country: "Spanien",
    flag: "🇪🇸",
    iata: "LPA",
    region: "Atlanterhavet",
    tagline: "Helårssol tæt på Danmark",
    flightTime: 4.5,
    airports: ["CPH", "BLL", "AAL"],
    budgetLevel: [1, 2],
    minChildAge: 0,
    bestMonths: [1, 2, 3, 4, 10, 11, 12],
    schoolHolidays: ["vinter", "vinterferie", "efterår"],
    highlights: ["Strand", "Sanddyner", "Vandpark", "Havn"],
    familyScore: 91,
    whyFamily: "Maspalomas-klitterne er som en miniature-Sahara — børn elsker det. Stabilt 22-24°C i vintersæsonen. Fantastisk til vinterferie.",
    priceFrom: 2900,
    hotelTypes: ["All-inclusive", "Ferielejlighed"],
    safety: 1,
    kidActivities: ["Maspalomas sanddyner", "Palmitos Park zoologisk have", "Holiday World forlystelsespark", "Kamelridning"],
    tipFrom: "Playa del Inglés og Maspalomas er bedst for familier. Undgå Las Palmas by til stranden.",
    driveFromBeach: 2,
    visa: false,
    currency: "EUR",
    weatherDec: "22°C, sol",
  },
  {
    id: "portugal",
    lat: 37.1021, lon: -8.6754,
    image: "/images/portugal.jpg",
    visual: { sky: "#3498db", sea: "#1f618d", sand: "#f0e68c", accent: "#e74c3c", emoji: "🪨", label: "Atlanterhavet" },
    segment: 'begge',   allInclusive: false, vibeScore: { tryghed: 72, opdagelse: 82 },
    name: "Algarve",
    country: "Portugal",
    flag: "🇵🇹",
    iata: "FAO",
    region: "Sydvesteuropa",
    tagline: "Europas smukkeste familiestrande",
    flightTime: 3.2,
    airports: ["CPH", "BLL"],
    budgetLevel: [2, 3],
    minChildAge: 0,
    bestMonths: [5, 6, 7, 8, 9],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Klipper", "Strand", "Surf", "Historisk by"],
    familyScore: 90,
    whyFamily: "Maravilhoso — dramatiske kystlandskaber, rent hav og fantastisk mad. Lagos er ideel base for familier med blandede aldersgrupper.",
    priceFrom: 4400,
    hotelTypes: ["Ferielejlighed", "Boutique resort"],
    safety: 1,
    kidActivities: ["Grottebesøg med båd", "Surfingtimer", "Dolphin watching", "Vandpark Slide & Splash", "Ridderfestival"],
    tipFrom: "Vest-Algarve (Sagres) er blæsere men smukkere. Øst-Algarve (Tavira) er roligere og lavvandet — perfekt til småbørn.",
    driveFromBeach: 8,
    visa: false,
    currency: "EUR",
    weatherJuly: "28°C, sol",
  },
  {
    id: "dubai",
    lat: 25.2048, lon: 55.2708,
    image: "/images/dubai.jpg",
    visual: { sky: "#e67e22", sea: "#2471a3", sand: "#f8c471", accent: "#8e44ad", emoji: "🌆", label: "Skyline" },
    segment: 'tryghed', allInclusive: true,  vibeScore: { tryghed: 85, opdagelse: 70 },
    name: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    iata: "DXB",
    region: "Mellemøsten",
    tagline: "Fremtidsbyen der imponerer hele familien",
    flightTime: 6.5,
    airports: ["CPH"],
    budgetLevel: [3],
    minChildAge: 3,
    bestMonths: [10, 11, 12, 1, 2, 3],
    schoolHolidays: ["vinter", "vinterferie"],
    highlights: ["Forlystelsesparker", "Shoppingcenter", "Ørken-safari", "Skyscraper"],
    familyScore: 85,
    whyFamily: "Verdens bedste forlystelsesparker, konstant sol i vintersæsonen, og alt er børnevenligt. Dyrt men giver en unik oplevelse.",
    priceFrom: 9500,
    hotelTypes: ["Luksus resort", "5-stjernet strandhotel"],
    safety: 1,
    kidActivities: ["IMG Worlds of Adventure", "Legoland Dubai", "Ørken-safari med kameler", "Ski Dubai indendørs", "Dubai Frame"],
    tipFrom: "Book hotellet med eget vandland — det sparer penge og børnene er tilfredse hele dagen. Atlantis The Palm er ikonisk men Sofitel er bedre pris/kvalitet.",
    driveFromBeach: 10,
    visa: false,
    currency: "AED",
    weatherDec: "26°C, sol",
  },
  {
    id: "bornholm",
    lat: 55.1007, lon: 14.9046,
    image: "/images/bornholm.jpg",
    visual: { sky: "#85c1e9", sea: "#2e86c1", sand: "#aed6f1", accent: "#1e8449", emoji: "🌿", label: "Solskinsøen" },
    segment: 'begge',   allInclusive: false, vibeScore: { tryghed: 78, opdagelse: 75 },
    name: "Bornholm",
    country: "Danmark",
    flag: "🇩🇰",
    iata: "RNN",
    region: "Østersøen",
    tagline: "Solskinsøen — Danmark på sit bedste",
    flightTime: 1.2,
    airports: ["CPH"],
    budgetLevel: [1, 2],
    minChildAge: 0,
    bestMonths: [5, 6, 7, 8],
    schoolHolidays: ["sommer"],
    highlights: ["Cykling", "Strand", "Røgerier", "Middelalderborge"],
    familyScore: 87,
    whyFamily: "Trygt, dansk, bilfrit i centrum. Børn kan cykle frit, strande med hvidt sand, og stemning der minder om Gotland. Ingen stressende grænser.",
    priceFrom: 1800,
    hotelTypes: ["Sommerhus", "Familiehotel", "Bed & Breakfast"],
    safety: 1,
    kidActivities: ["Cykelruter for familier", "Hammershus slot", "Bornholms Middelaldercenter", "Lystsejlads fra Allinge", "Røgeri-besøg"],
    tipFrom: "Lej cykel fra dag 1. Book sommerhus frem for hotel — familierne der kommer igen og igen bor i hus. Book tidligt.",
    driveFromBeach: 5,
    visa: false,
    currency: "DKK",
    weatherJuly: "22°C, variabelt",
  },
  {
    id: "italien-toscana",
    lat: 43.7711, lon: 11.2486,
    image: "/images/italien.jpg",
    visual: { sky: "#5dade2", sea: "#1a5276", sand: "#f9e79f", accent: "#c0392b", emoji: "🎨", label: "Cinque Terre" },
    segment: 'opdagelse', allInclusive: false, vibeScore: { tryghed: 50, opdagelse: 90 },
    name: "Toscana & Cinque Terre",
    country: "Italien",
    flag: "🇮🇹",
    iata: "PSA",
    region: "Middelhavet",
    tagline: "Mad, kultur og eventyr i farverige fiskerlejer",
    flightTime: 2.8,
    airports: ["CPH"],
    budgetLevel: [2, 3],
    minChildAge: 5,
    bestMonths: [4, 5, 6, 9, 10],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Gastronomi", "Vandreture", "Kystby", "Kunst"],
    familyScore: 78,
    whyFamily: "Cinque Terre er magisk for børn over 5 — farverige huse, tog langs klippekysten, og iskrem overalt. Kombinér med en farmferie i Toscana.",
    priceFrom: 5200,
    hotelTypes: ["Agriturismo", "Boutique hotel", "Ferielejlighed"],
    safety: 1,
    kidActivities: ["Tog langs Cinque Terre", "Bål på stranden i Vernazza", "Vandreture med udsigt", "Gelatoworkshop", "Oliepresning på farm"],
    tipFrom: "Undgå juli-august i Cinque Terre — alt for overfyldt. Maj og september er perfekte: lunt, få turister, billigere.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherMay: "22°C, sol",
  },
  {
    id: "japan",
    lat: 35.6762, lon: 139.6503,
    image: "/images/japan.jpg",
    visual: { sky: "#f1948a", sea: "#6c3483", sand: "#fdfefe", accent: "#e74c3c", emoji: "⛩️", label: "Tokyo" },
    segment: 'opdagelse', allInclusive: false, vibeScore: { tryghed: 45, opdagelse: 98 },
    name: "Tokyo & Kyoto",
    country: "Japan",
    flag: "🇯🇵",
    iata: "NRT",
    region: "Østasien",
    tagline: "Den rejse børnene taler om resten af livet",
    flightTime: 11.5,
    airports: ["CPH"],
    budgetLevel: [3],
    minChildAge: 7,
    bestMonths: [3, 4, 10, 11],
    schoolHolidays: ["vinterferie", "efterår"],
    highlights: ["Anime", "Teknologi", "Templer", "Mad"],
    familyScore: 80,
    whyFamily: "Ekstremt sikkert, rent og børnevenligt. Japan overrasker alle — selv teenagere er fascinerede. Bedst for børn der kan gå meget.",
    priceFrom: 14000,
    hotelTypes: ["Kapshotel (teenagere elsker det)", "Ryokan (traditionelt), Byhotel"],
    safety: 1,
    kidActivities: ["DisneySea Tokyo", "teamLab Planets (digitalt kunstmuseum)", "Shibuya Crossing", "Bullet train (Shinkansen)", "Ninja-museum"],
    tipFrom: "Køb IC Suica-kort til alle fra dag 1 — det bruges til alt. Bestil ramen ved automat, det er sjovt for børn.",
    driveFromBeach: 60,
    visa: false,
    currency: "JPY",
    weatherApr: "18°C, kirsebærblomst",
  },
  {
    id: "marokko",
    lat: 31.6295, lon: -7.9811,
    image: "/images/marokko.jpg",
    visual: { sky: "#e59866", sea: "#2471a3", sand: "#f0b27a", accent: "#c0392b", emoji: "🐪", label: "Nordafrika" },
    segment: 'opdagelse', allInclusive: false, vibeScore: { tryghed: 40, opdagelse: 85 },
    name: "Marrakech & Agadir",
    country: "Marokko",
    flag: "🇲🇦",
    iata: "RAK",
    region: "Nordafrika",
    tagline: "Et sanseindtryk der åbner børnenes øjne",
    flightTime: 3.8,
    airports: ["CPH"],
    budgetLevel: [1, 2],
    minChildAge: 4,
    bestMonths: [3, 4, 10, 11],
    schoolHolidays: ["vinterferie", "efterår"],
    highlights: ["Suk", "Sahara", "Håndværk", "Kamelridning"],
    familyScore: 75,
    whyFamily: "Fantastisk pris, korte flyvninger og en verden børnene aldrig har set. Marrakech + Agadir-strand giver det bedste af begge verdener.",
    priceFrom: 2600,
    hotelTypes: ["Riad i medina", "Strandhotel i Agadir"],
    safety: 2,
    kidActivities: ["Kamelridning", "Sahara-overnatning i telt", "Jemaa el-Fna tætpakket markedsplads", "Arabisk kogeskole", "Slangecharmering"],
    tipFrom: "Agadir er trygt og vestligt — godt som base. Tag en dagstur til Marrakech derfra. Book altid guide til medina-vandring.",
    driveFromBeach: 0,
    visa: false,
    currency: "MAD",
    weatherOct: "26°C, sol",
  },
  {
    id: "rhodos",
    lat: 36.4341, lon: 28.2176,
    image: "/images/rhodos.jpg",
    visual: { sky: "#5dade2", sea: "#1f618d", sand: "#f9e79f", accent: "#e74c3c", emoji: "🏛️", label: "Grækenland" },
    segment: 'tryghed', allInclusive: true, vibeScore: { tryghed: 90, opdagelse: 45 },
    name: "Rhodos",
    country: "Grækenland",
    flag: "🇬🇷",
    iata: "RHO",
    region: "Ægæerhavet",
    tagline: "Den ultimative græske sommer for hele familien",
    flightTime: 3.5,
    airports: ["CPH", "BLL", "AAL", "AAR"],
    budgetLevel: [1, 2, 3],
    minChildAge: 0,
    bestMonths: [5, 6, 7, 8, 9],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Strand", "All-inclusive", "Vandpark", "Middelalderborg"],
    familyScore: 93,
    whyFamily: "Rhodos er den klassiske charter-destination med god grund — lang sæson, masser af familiehoteller, gode strande og direkte fly fra alle danske lufthavne.",
    priceFrom: 3000,
    hotelTypes: ["All-inclusive", "Familiehotel", "Ferielejlighed"],
    safety: 1,
    kidActivities: ["Water Park Faliraki", "Rhodos middelalderby", "Snorkling", "Pedalbåd", "Minigolf"],
    tipFrom: "Faliraki er festdestination — vælg Kolymbia eller Lindos-området for en roligere familieferie.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJuly: "30°C, sol",
  },
  {
    id: "kos",
    lat: 36.8938, lon: 27.2877,
    image: "/images/kos.jpg",
    visual: { sky: "#85c1e9", sea: "#2471a3", sand: "#fdebd0", accent: "#27ae60", emoji: "🌿", label: "Grækenland" },
    segment: 'tryghed', allInclusive: false, vibeScore: { tryghed: 85, opdagelse: 55 },
    name: "Kos",
    country: "Grækenland",
    flag: "🇬🇷",
    iata: "KGS",
    region: "Ægæerhavet",
    tagline: "Den rolige græske ø der passer perfekt til familier",
    flightTime: 3.8,
    airports: ["CPH", "BLL"],
    budgetLevel: [1, 2],
    minChildAge: 0,
    bestMonths: [5, 6, 7, 8, 9],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Strand", "Cykling", "Antikke ruiner", "Lavvandet hav"],
    familyScore: 89,
    whyFamily: "Kos er fladere og roligere end Rhodos — perfekt til familier med cykelglade børn. Det lavvandede hav ved Tigaki er ideelt til de mindste.",
    priceFrom: 2800,
    hotelTypes: ["Familiehotel", "Ferielejlighed", "All-inclusive"],
    safety: 1,
    kidActivities: ["Cykling på flade cykelstier", "Tigaki strand med lavvandet hav", "Asklepion antikke ruiner", "Vandscooter", "Bådtur til Nisyros vulkan-ø"],
    tipFrom: "Tigaki på vestkysten har det laveste og roligste hav — ideelt til børn under 6 år.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJuly: "29°C, sol",
  },
  {
    id: "lanzarote",
    lat: 28.9635, lon: -13.5477,
    image: "/images/lanzarote.jpg",
    visual: { sky: "#e67e22", sea: "#2980b9", sand: "#c0392b", accent: "#f39c12", emoji: "🌋", label: "Vulkansk ø" },
    segment: 'begge', allInclusive: true, vibeScore: { tryghed: 80, opdagelse: 70 },
    name: "Lanzarote",
    country: "Spanien",
    flag: "🇪🇸",
    iata: "ACE",
    region: "Kanariske Øer",
    tagline: "Vulkaner, sol og garanteret sommervejr hele året",
    flightTime: 4.2,
    airports: ["CPH", "BLL", "AAL"],
    budgetLevel: [1, 2, 3],
    minChildAge: 0,
    bestMonths: [1, 2, 3, 4, 10, 11, 12],
    schoolHolidays: ["vinter", "vinterferie", "efterår"],
    highlights: ["Vulkansk natur", "All-inclusive", "Surfing", "Strand"],
    familyScore: 88,
    whyFamily: "Lanzarote er anderledes end de andre kanariske øer — det vulkanske landskab giver børnene en naturfaglig oplevelse. Og vejret er godt hele året.",
    priceFrom: 3400,
    hotelTypes: ["All-inclusive resort", "Ferielejlighed"],
    safety: 1,
    kidActivities: ["Timanfaya vulkanpark med kamelridning", "Jameos del Agua grotte", "Surfskole for børn", "Rancho Texas dyrepark", "Submarine safari"],
    tipFrom: "Playa Blanca i syd er roligst og bedst for familier. Puerto del Carmen er mere livligt.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJan: "21°C, sol",
  },
  {
    id: "costa-rica",
    lat: 9.7489, lon: -83.7534,
    image: "/images/costa-rica.jpg",
    visual: { sky: "#27ae60", sea: "#1a5276", sand: "#f9e79f", accent: "#e74c3c", emoji: "🦋", label: "Jungel & strand" },
    segment: 'opdagelse', allInclusive: false, vibeScore: { tryghed: 50, opdagelse: 95 },
    name: "Costa Rica",
    country: "Costa Rica",
    flag: "🇨🇷",
    iata: "SJO",
    region: "Centralamerika",
    tagline: "Den ultimative naturoplevelse for eventyrlige familier",
    flightTime: 13,
    airports: ["CPH"],
    budgetLevel: [3],
    minChildAge: 5,
    bestMonths: [12, 1, 2, 3, 4],
    schoolHolidays: ["vinter", "vinterferie"],
    highlights: ["Jungel", "Vulkaner", "Surfing", "Dyreliv"],
    familyScore: 84,
    whyFamily: "Costa Rica er skabt til familier der vil have en rigtig oplevelse — aber, slanger, leguaner og vulkaner er hverdagen her. Børn glemmer det aldrig.",
    priceFrom: 14000,
    hotelTypes: ["Eco-lodge", "Jungle resort", "Strandbungalow"],
    safety: 2,
    kidActivities: ["Zip-line i junglen", "Sloth sanctuary besøg", "Surfskole i Tamarindo", "Vulkan Arenal vandring", "Hvide vandre med flodbåd"],
    tipFrom: "Kombiner Manuel Antonio nationalpark (aber + strand) med Arenal vulkan — det er den klassiske Costa Rica-rute for familier.",
    driveFromBeach: 30,
    visa: false,
    currency: "USD",
    weatherJan: "29°C, tropisk",
  },
  {
    id: "jordan",
    lat: 30.3285, lon: 35.4444,
    image: "/images/jordan.jpg",
    visual: { sky: "#e59866", sea: "#2471a3", sand: "#f0b27a", accent: "#8e44ad", emoji: "🏺", label: "Petra & ørken" },
    segment: 'opdagelse', allInclusive: false, vibeScore: { tryghed: 55, opdagelse: 92 },
    name: "Jordan",
    country: "Jordan",
    flag: "🇯🇴",
    iata: "AMM",
    region: "Mellemøsten",
    tagline: "Petra, Wadi Rum og Det Døde Hav — eventyr for hele familien",
    flightTime: 4.5,
    airports: ["CPH"],
    budgetLevel: [2, 3],
    minChildAge: 5,
    bestMonths: [3, 4, 10, 11],
    schoolHolidays: ["vinterferie", "efterår"],
    highlights: ["Petra", "Ørken", "Det Døde Hav", "Kultur"],
    familyScore: 81,
    whyFamily: "Jordan er det sikreste og mest turistvenlige land i Mellemøsten. Petra er som Indiana Jones for børn — og Det Døde Hav er en legeplads.",
    priceFrom: 7500,
    hotelTypes: ["Ørkenlejr", "Byhotel i Amman", "Resort ved Aqaba"],
    safety: 1,
    kidActivities: ["Petra — rose-rød klippeby", "Wadi Rum jeep-safari og ørkenovernatning", "Flyde i Det Døde Hav", "Snorkling i Rødehavet ved Aqaba", "Jerash antikke ruiner"],
    tipFrom: "Brug 2 nætter i Wadi Rum ørkenlejr — det er det der bliver husket. Book lejr med privat telt til familien.",
    driveFromBeach: 60,
    visa: true,
    currency: "JOD",
    weatherOct: "25°C, sol",
  },
  {
    id: "montenegro",
    lat: 42.4304, lon: 18.694,
    image: "/images/montenegro.jpg",
    visual: { sky: "#2980b9", sea: "#1a5276", sand: "#abebc6", accent: "#c0392b", emoji: "🏔️", label: "Adriaterhavet" },
    segment: 'begge', allInclusive: false, vibeScore: { tryghed: 70, opdagelse: 78 },
    name: "Montenegro",
    country: "Montenegro",
    flag: "🇲🇪",
    iata: "TGD",
    region: "Balkan",
    tagline: "Kroatiens billige nabo — uberørt og overraskende smukt",
    flightTime: 2.8,
    airports: ["CPH", "BLL"],
    budgetLevel: [1, 2],
    minChildAge: 3,
    bestMonths: [5, 6, 7, 8, 9],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Strand", "Bjerge", "Middelalderby", "Krystalklart vand"],
    familyScore: 85,
    whyFamily: "Montenegro er hvad Kroatien var for 15 år siden — smukt, uberørt og halvt så dyrt. Budva og Kotor Bay er fantastiske for familier.",
    priceFrom: 2400,
    hotelTypes: ["Strandhotel", "Ferielejlighed", "Boutique hotel"],
    safety: 1,
    kidActivities: ["Kotor middelalderby og kattene", "Kayak i Boka Bay", "Svømning fra klippestrande", "Svinge-zipline over bugten", "Bestigning af Lovćen bjerg"],
    tipFrom: "Becici og Rafailovici ved Budva er roligst for familier. Kotor Bay er magisk — tag en bådtur rundt i bugten.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJuly: "28°C, sol",
  },
  {
    id: "bulgarien",
    lat: 43.2784, lon: 28.0486,
    image: "/images/bulgarien.jpg",
    visual: { sky: "#5dade2", sea: "#1f618d", sand: "#f9e79f", accent: "#e67e22", emoji: "🌻", label: "Sortehavet" },
    segment: 'tryghed', allInclusive: true, vibeScore: { tryghed: 88, opdagelse: 40 },
    name: "Bulgarien",
    country: "Bulgarien",
    flag: "🇧🇬",
    iata: "VAR",
    region: "Sortehavet",
    tagline: "Europas billigste strandferie med direkte fly fra Danmark",
    flightTime: 3.2,
    airports: ["CPH", "BLL", "AAL"],
    budgetLevel: [1, 2],
    minChildAge: 0,
    bestMonths: [6, 7, 8],
    schoolHolidays: ["sommer"],
    highlights: ["All-inclusive", "Sandstrand", "Vandpark", "Billig øl"],
    familyScore: 86,
    whyFamily: "Albena og Sunny Beach er massive familieresort-områder med alt på stedet. Prisen er uset lav — du får 3-stjernet til 1-stjernet pris sammenlignet med Spanien.",
    priceFrom: 1800,
    hotelTypes: ["All-inclusive", "Familiehotel", "Ferielejlighed"],
    safety: 1,
    kidActivities: ["Action Aquapark vandpark", "Strand og lavvandet hav", "Minigolf", "Børneklub på hotellet", "Åben vogn-tog langs stranden"],
    tipFrom: "Albena er roligere og mere familievenligt end Sunny Beach. Vælg Albena med børn under 12 år.",
    driveFromBeach: 0,
    visa: false,
    currency: "BGN",
    weatherJuly: "29°C, sol",
  },

  // ── NYE FLY-DESTINATIONER ────────────────────────────────────────────────────
  {
    id: "tyrkiet",
    lat: 31.9984, lon: 31.1665,
    image: "/images/tyrkiet.jpg",
    visual: { sky: "#2980b9", sea: "#1a5276", sand: "#f9e79f", accent: "#e74c3c", emoji: "🌙", label: "Rivieraen" },
    segment: 'tryghed', allInclusive: true, vibeScore: { tryghed: 92, opdagelse: 38 },
    travelMode: "fly",
    name: "Tyrkiet (Alanya & Side)",
    country: "Tyrkiet",
    flag: "🇹🇷",
    iata: "AYT",
    region: "Middelhavet",
    tagline: "Europas bedste all-inclusive til familierne",
    flightTime: 3.8,
    airports: ["CPH", "BLL", "AAL"],
    budgetLevel: [1, 2],
    minChildAge: 0,
    bestMonths: [5, 6, 7, 8, 9, 10],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["All-inclusive", "Strand", "Vandpark", "Basarer"],
    familyScore: 91,
    whyFamily: "Tyrkiet giver mest mulig ferie for pengene — store all-inclusive resorts med vandlande, lange sandstrande og varm sø. Børnene elsker det.",
    priceFrom: 2800,
    hotelTypes: ["All-inclusive", "Familieresort"],
    safety: 2,
    kidActivities: ["Land of Legends forlystelsespark", "Alanya-borgen", "Dyksafari", "Vandscootere", "Bazar-besøg i Side"],
    tipFrom: "Side er mere autentisk og familievenligt end Alanya. Vælg et hotel med eget vandland — det er pengene værd med børn.",
    driveFromBeach: 0,
    visa: true,
    currency: "TRY",
    weatherJuly: "32°C, sol",
  },
  {
    id: "cypern",
    lat: 34.9174, lon: 33.6338,
    image: "/images/cypern.jpg",
    visual: { sky: "#f39c12", sea: "#2471a3", sand: "#f9e79f", accent: "#8e44ad", emoji: "🏛️", label: "Middelhavet" },
    segment: 'tryghed', allInclusive: false, vibeScore: { tryghed: 85, opdagelse: 55 },
    travelMode: "fly",
    name: "Cypern",
    country: "Cypern",
    flag: "🇨🇾",
    iata: "PFO",
    region: "Middelhavet",
    tagline: "Solrig ø med perfekt familievejr og rolige strande",
    flightTime: 4.2,
    airports: ["CPH"],
    budgetLevel: [2, 3],
    minChildAge: 0,
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Strand", "Klart vand", "Vandpark", "Antikke ruiner"],
    familyScore: 87,
    whyFamily: "Cypern har noget af Middelhavets klareste vand, gode familiehoteller og næsten garanteret sol. Engelsk er udbredt — nemt for familien.",
    priceFrom: 4200,
    hotelTypes: ["Familiehotel", "Ferielejlighed", "Resort"],
    safety: 1,
    kidActivities: ["Waterworld Ayia Napa — Europas største vandpark", "Nissi Beach", "Cape Greco snorkling", "Aphroditebjerget vandring", "Limassol Zoo"],
    tipFrom: "Paphos i vest er roligere og mere familievenligt end Ayia Napa. Waterworld vandpark er dog værd at tage en dagstur til.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJuly: "33°C, sol",
  },
  {
    id: "kreta",
    lat: 35.2401, lon: 25.1142,
    image: "/images/kreta.jpg",
    visual: { sky: "#5dade2", sea: "#1f618d", sand: "#fdebd0", accent: "#e74c3c", emoji: "🫒", label: "Kreta" },
    segment: 'begge', allInclusive: false, vibeScore: { tryghed: 80, opdagelse: 72 },
    travelMode: "fly",
    name: "Kreta",
    country: "Grækenland",
    flag: "🇬🇷",
    iata: "HER",
    region: "Ægæerhavet",
    tagline: "Grækenlands største ø — strande, bjerge og kultur",
    flightTime: 3.7,
    airports: ["CPH", "BLL", "AAL"],
    budgetLevel: [1, 2, 3],
    minChildAge: 0,
    bestMonths: [5, 6, 7, 8, 9, 10],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Strand", "Kløfter", "Antikke ruiner", "Bjerglandskab"],
    familyScore: 90,
    whyFamily: "Kreta er stor nok til at have noget for enhver smag — rolige familiebadestrande, vandreture i Samaria-kløften og autentisk græsk mad.",
    priceFrom: 3200,
    hotelTypes: ["All-inclusive", "Familiehotel", "Ferielejlighed"],
    safety: 1,
    kidActivities: ["Samaria-kløften vandring (voksne)", "Knossos minoisk palads", "Elafonisi pink sand strand", "Aquaworld Heraklion", "Bådudflugt til Spinalonga"],
    tipFrom: "Chania i vest er den smukkeste by. Rethymno er bedst for familier med yngre børn — lavt hav og gode sandstrande.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJuly: "28°C, sol",
  },
  {
    id: "santorini",
    lat: 36.3932, lon: 25.4615,
    image: "/images/santorini.jpg",
    visual: { sky: "#85c1e9", sea: "#1f618d", sand: "#f0f3f4", accent: "#e74c3c", emoji: "🌋", label: "Ægæerhavet" },
    segment: 'opdagelse', allInclusive: false, vibeScore: { tryghed: 55, opdagelse: 85 },
    travelMode: "fly",
    name: "Santorini & Kykladerne",
    country: "Grækenland",
    flag: "🇬🇷",
    iata: "JTR",
    region: "Ægæerhavet",
    tagline: "De ikoniske blå kupler — nu med børnene",
    flightTime: 3.5,
    airports: ["CPH"],
    budgetLevel: [3],
    minChildAge: 5,
    bestMonths: [5, 6, 9, 10],
    schoolHolidays: ["sommer", "efterår"],
    highlights: ["Ikonisk natur", "Vulkan", "Solnedgang", "Ø-hop"],
    familyScore: 76,
    whyFamily: "Santorini er en af verdens smukkeste oplevelser — og børn over 5 husker det for altid. Kombiner med Paros eller Naxos for strand og afslapning.",
    priceFrom: 7500,
    hotelTypes: ["Boutique hotel", "Ferielejlighed"],
    safety: 1,
    kidActivities: ["Vulkan-sejltur til Nea Kameni", "Røde og sorte vulkanstrande", "Oia solnedgang", "Ø-hop til Paros med færge", "Æselridning i Oia (omdiskuteret)"],
    tipFrom: "Juli-august er overfyldt og dyrt. Maj/juni eller september er bedst. Kombiner Santorini (2 nætter) med Naxos (5 nætter) — bedste strand i Kykladerne.",
    driveFromBeach: 10,
    visa: false,
    currency: "EUR",
    weatherJuly: "27°C, sol og vind",
  },

  // ── KØR-SELV DESTINATIONER ────────────────────────────────────────────────────
  {
    id: "sydfrankrig",
    lat: 43.6047, lon: 1.4442,
    image: "/images/sydfrankrig.jpg",
    visual: { sky: "#f39c12", sea: "#2471a3", sand: "#f9e79f", accent: "#8e44ad", emoji: "🌻", label: "Provence" },
    segment: 'begge', allInclusive: false, vibeScore: { tryghed: 72, opdagelse: 78 },
    travelMode: "bil",
    name: "Sydfrankrig",
    country: "Frankrig",
    flag: "🇫🇷",
    iata: "NCE",
    region: "Middelhavet",
    tagline: "Lavendelmarker, Côte d'Azur og autentisk Frankrig",
    flightTime: 0,
    driveFromCph: 17,
    airports: [],
    budgetLevel: [2, 3],
    minChildAge: 3,
    bestMonths: [6, 7, 8],
    schoolHolidays: ["sommer"],
    highlights: ["Lavendel", "Strand", "Mad", "Middelalderby"],
    familyScore: 87,
    whyFamily: "Sydfrankrig er en klassisk bil-destination — campingpladser, gîtes og ferielejligheder langs vejen. Børn elsker marchéerne og stranden.",
    priceFrom: 5000,
    hotelTypes: ["Gîte / ferielejlighed", "Campingplads", "Boutique hotel"],
    safety: 1,
    kidActivities: ["Pont du Gard romersk akvædukt", "Lavendelmarker i Valensole", "Strandene ved Marseille", "Nice Promenade", "Avignon paveslot"],
    tipFrom: "Provence er jul-august meget turistet. Kombiner en uge i Provence med en uge på Côte d'Azur. Book gîte tidligt — de bedste er udlejede i januar.",
    driveFromBeach: 60,
    visa: false,
    currency: "EUR",
    weatherJuly: "30°C, sol",
  },
  {
    id: "gardasoeen",
    lat: 45.6389, lon: 10.7196,
    image: "/images/gardasoeen.jpg",
    visual: { sky: "#5dade2", sea: "#2471a3", sand: "#abebc6", accent: "#27ae60", emoji: "⛵", label: "Norditalien" },
    segment: 'begge', allInclusive: false, vibeScore: { tryghed: 78, opdagelse: 70 },
    travelMode: "bil",
    name: "Gardasøen",
    country: "Italien",
    flag: "🇮🇹",
    iata: "VRN",
    region: "Norditalien",
    tagline: "Italiens smukkeste sø — perfekt til kør-selv-familien",
    flightTime: 0,
    driveFromCph: 14,
    airports: [],
    budgetLevel: [2, 3],
    minChildAge: 0,
    bestMonths: [5, 6, 7, 8, 9],
    schoolHolidays: ["sommer"],
    highlights: ["Sø", "Vandpark", "Citronplantager", "Bjerglandskab"],
    familyScore: 92,
    whyFamily: "Gardasøen er måske den bedste kør-selv-destination for danske familier — varmt klima, fantastisk sceneri og Gardaland forlystelsespark.",
    priceFrom: 4500,
    hotelTypes: ["Campingplads", "Ferielejlighed", "Hotel"],
    safety: 1,
    kidActivities: ["Gardaland forlystelsespark", "Canevaworld vandpark", "Sejltur på søen", "Windsurfing i Riva del Garda", "Verona dagstur"],
    tipFrom: "Nordbredden (Riva del Garda, Malcesine) er smukkest og koldest om natten. Sydbredden (Sirmione, Peschiera) er varmest og mest familievenlig.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJuly: "28°C, sol",
  },
  {
    id: "norge-fjorde",
    lat: 60.4720, lon: 8.4689,
    image: "/images/norge.jpg",
    visual: { sky: "#2980b9", sea: "#1a5276", sand: "#abebc6", accent: "#27ae60", emoji: "🏔️", label: "Fjordnorge" },
    segment: 'opdagelse', allInclusive: false, vibeScore: { tryghed: 60, opdagelse: 90 },
    travelMode: "bil",
    name: "Norge — Fjordlandet",
    country: "Norge",
    flag: "🇳🇴",
    iata: "BGO",
    region: "Skandinavien",
    tagline: "Verdens smukkeste natur — med familien i bilen",
    flightTime: 0,
    driveFromCph: 6,
    airports: [],
    budgetLevel: [2, 3],
    minChildAge: 3,
    bestMonths: [6, 7, 8],
    schoolHolidays: ["sommer"],
    highlights: ["Fjorde", "Vandfald", "Kajak", "Midnatssol"],
    familyScore: 88,
    whyFamily: "Norge er den ultimative naturoplevelse der er tilgængelig med bil. Børn der har set Nærøyfjord fra kajak glemmer det aldrig.",
    priceFrom: 8000,
    hotelTypes: ["Hytte / cabin", "Camping", "Familiehotel"],
    safety: 1,
    kidActivities: ["Nærøyfjord kajak", "Flåmsbanen tog", "Kjeragbolten vandring (voksne)", "Trolltunga (lange vandring)", "Laksefiskeri"],
    tipFrom: "Start i Bergen, kør Sognefjord-ruten og slut i Geiranger. Book hytter minimum 3 måneder i forvejen — de populære er udlejede tidligt.",
    driveFromBeach: 0,
    visa: false,
    currency: "NOK",
    weatherJuly: "20°C, variabelt",
  },
  {
    id: "sverige-bohuslan",
    lat: 58.2528, lon: 11.4542,
    image: "/images/bohuslan.jpg",
    visual: { sky: "#85c1e9", sea: "#2471a3", sand: "#f9e79f", accent: "#e74c3c", emoji: "🦞", label: "Bohuslän" },
    segment: 'tryghed', allInclusive: false, vibeScore: { tryghed: 88, opdagelse: 52 },
    travelMode: "bil",
    name: "Bohuslän & Vestkysten",
    country: "Sverige",
    flag: "🇸🇪",
    iata: "GOT",
    region: "Skandinavien",
    tagline: "Klipper, hummer og hygge — tæt på Danmark",
    flightTime: 0,
    driveFromCph: 2,
    airports: [],
    budgetLevel: [1, 2],
    minChildAge: 0,
    bestMonths: [6, 7, 8],
    schoolHolidays: ["sommer"],
    highlights: ["Klipper", "Fiskerleje", "Hummer", "Badning"],
    familyScore: 89,
    whyFamily: "Bohuslän er den nemme valg for danske familier — 2 timer fra Øresund, trygt, børnevenligt og utrolig smukt. Krabber, klipper og istider.",
    priceFrom: 3000,
    hotelTypes: ["Sommerhus / stuga", "Campingplads", "Vandrehjem"],
    safety: 1,
    kidActivities: ["Krabber og reje-fiskning fra bryggen", "Smøgen fiskerby", "Lysekil akvarium", "Pilane skulpturpark", "Kayak ved skærene"],
    tipFrom: "Smögen og Fjällbacka er de smukkeste fiskerlejer. Book stuga tidligt — det populære er udlejede allerede i vinter. Billiger end Danmark.",
    driveFromBeach: 0,
    visa: false,
    currency: "SEK",
    weatherJuly: "22°C, variabelt",
  },
  {
    id: "tyskland-bayern",
    lat: 48.1351, lon: 11.5820,
    image: "/images/bayern.jpg",
    visual: { sky: "#5dade2", sea: "#2471a3", sand: "#abebc6", accent: "#e74c3c", emoji: "🏰", label: "Bayern" },
    segment: 'opdagelse', allInclusive: false, vibeScore: { tryghed: 75, opdagelse: 80 },
    travelMode: "bil",
    name: "Bayern & Østrig",
    country: "Tyskland / Østrig",
    flag: "🇩🇪",
    iata: "MUC",
    region: "Centraleuropa",
    tagline: "Borge, alpesøer og forlystelsesparker",
    flightTime: 0,
    driveFromCph: 9,
    airports: [],
    budgetLevel: [2, 3],
    minChildAge: 3,
    bestMonths: [6, 7, 8],
    schoolHolidays: ["sommer"],
    highlights: ["Borge", "Alperne", "Forlystelsesparker", "Søer"],
    familyScore: 88,
    whyFamily: "Bayern er drømmemålet for bileventyrere — Neuschwanstein-borgen, Legoland Günzburg, Chiemsee-søen og Østrig lige om hjørnet.",
    priceFrom: 4000,
    hotelTypes: ["Hotel", "Ferielejlighed", "Campingplads"],
    safety: 1,
    kidActivities: ["Neuschwanstein-borgen", "Legoland Günzburg", "Chiemsee-søen badning", "Salzburg Mozart-byen", "Zugspitze med gondol"],
    tipFrom: "Kombiner 3 nætter ved Chiemsee med 2 nætter i Berchtesgaden og en dag i Salzburg. Legoland er kun 90 min fra München.",
    driveFromBeach: 0,
    visa: false,
    currency: "EUR",
    weatherJuly: "24°C, variabelt",
  },
  {
    id: "bornholm-bil",
    lat: 55.1007, lon: 14.9046,
    image: "/images/bornholm.jpg",
    visual: { sky: "#85c1e9", sea: "#2471a3", sand: "#f9e79f", accent: "#e74c3c", emoji: "🌞", label: "Bornholm" },
    segment: 'tryghed', allInclusive: false, vibeScore: { tryghed: 92, opdagelse: 45 },
    travelMode: "bil",
    name: "Bornholm",
    country: "Danmark",
    flag: "🇩🇰",
    iata: "RNN",
    region: "Danmark",
    tagline: "Solens ø — cykling, røgeri og hvide sandstrande",
    flightTime: 0,
    driveFromCph: 2,
    airports: [],
    budgetLevel: [1, 2],
    minChildAge: 0,
    bestMonths: [6, 7, 8],
    schoolHolidays: ["sommer"],
    highlights: ["Cykling", "Strand", "Røgeri", "Klippekysten"],
    familyScore: 90,
    whyFamily: "Bornholm er den perfekte intro til kør-selv-ferien med børn — trygt, dansk, smuk natur og masser af aktiviteter. Færge fra Ystad.",
    priceFrom: 2000,
    hotelTypes: ["Sommerhus", "Camping", "Hotel"],
    safety: 1,
    kidActivities: ["Cykling på øens cykelstier", "Dueodde hvide sandstrand", "Hammershus", "Middelaldercentret", "Røgeri-besøg og sildemad"],
    tipFrom: "Tag færgen fra Ystad (2 timer) — langt nemmere end Køge. Book sommerhus tidligt. Lej cykler lokalt — der er cykelstier overalt.",
    driveFromBeach: 0,
    visa: false,
    currency: "DKK",
    weatherJuly: "22°C, sol",
  },
];


// ─── SEGMENT-SPECIFIKKE TEKSTER ─────────────────────────────────────────────
const SEGMENT_WHY = {'rhodos': {"tryghed": 'Rhodos er charter-klassikeren med god grund — all-inclusive, garanteret sol og strande der er skabt til børnefamilier. Alt er nemt og forudsigeligt.', "opdagelse": 'Rhodos har en af Middelhavets bedste middelalderborge og masser af natur ud over stranden — godt for familier der vil have begge dele.'}, 'kos': {"tryghed": 'Kos er den rolige græske ø — fladere end de fleste, lavvandet hav ved Tigaki og en afslappet stemning der giver ro i familien.', "opdagelse": 'Vulkaner, antikke ruiner og cykelture til fiskerlandsbyer — Kos er mere end sol og strand for dem der vil udforske.'}, 'lanzarote': {"tryghed": 'Lanzarote er sol og all-inclusive med garanteret vejr hele året. Perfekt til vinterferie når resten af Europa er gråt.', "opdagelse": 'Vulkansk månelandskab, kamelridning på lavaleje og grottebesøg — Lanzarote er den mest anderledes af de kanariske øer.'}, 'costa-rica': {"tryghed": 'Costa Rica er det sikreste land i Centralamerika med velfungerende turistinfrastruktur. Selv tryghedsfamilier kan klare det her.', "opdagelse": 'Aber, jaguarer, vulkaner og zip-line — Costa Rica er opdagelsesfamiliens drøm. Børn vokser op på denne tur.'}, 'jordan': {"tryghed": 'Jordan er overraskende trygt og velfungerende. Petra og Det Døde Hav er let tilgængelige med børn — og guider gør det hele nemt.', "opdagelse": 'Petra ved fakkelskær, Wadi Rum under stjernerne, snorkling i Rødehavet — Jordan er tre verdener i ét land.'}, 'montenegro': {"tryghed": 'Montenegro er trygt, europæisk og nemt. Strande, god mad og korte afstande giver en afslappet ferie uden overraskelser.', "opdagelse": 'Kotor Bay er en af Europas mest dramatiske bugter. Kajak, klippesving og bjergvandring for familier der vil mere end strand.'}, 'bulgarien': {"tryghed": 'Bulgarien er Europas bedste tilbud på den klassiske all-inclusive strandferie. Alt er på stedet, og prisen er uset lav.', "opdagelse": 'Sortehavskysten gemmer på mere end resort-hoteller — klippekyst, vinbyer og Nesebar UNESCO-by er lette dagstursture.'},
  'tyrkiet': {"tryghed": 'Tyrkiet er all-inclusive-paradiset — store resorts med alt inkluderet, varm sø og lange sandstrande. Familien kan slappe helt af.', "opdagelse": 'Historiske ruiner, livlige basarer og autentisk tyrkisk mad venter uden for hotellet — Tyrkiet er mere end pool og strand.'},
  'cypern': {"tryghed": 'Cypern er trygt, engelsk-venligt og organiseret. Klart vand, gode familiehoteller og næsten garanteret sol fra april til oktober.', "opdagelse": 'Vandring i Troodos-bjergene, antikke ruiner og autentiske cypriotiske landsbyer — Cypern overrasker dem der leder.'},
  'kreta': {"tryghed": 'Kreta er stor nok til at finde ro — rolige sandstrande, gode familiehoteller og grækernes varmeste gæstfrihed.', "opdagelse": 'Samaria-kløften, Knossos-paladset og det vildeste bjerglandskab i Ægæerhavet — Kreta er Grækenlands mest mangfoldige ø.'},
  'santorini': {"tryghed": 'Santorini er et trygt og velorganiseret rejsemål — bedst for familier med børn over 5 der kan opleve den unikke natur.', "opdagelse": 'Vulkanø, lavastrande, solnedgange og ø-hop til Paros og Naxos — Kykladerne er eventyret.'},
  'sydfrankrig': {"tryghed": 'Sydfrankrig byder på tryg europæisk ferie — campingpladser og gîtes med pool, gode veje og lækker mad i roligt tempo.', "opdagelse": "Lavendelmarker, middelalderby, Pont du Gard og Côte d'Azur — kør-selv Frankrig er en opdagelse for hele familien."},
  'gardasoeen': {"tryghed": 'Gardasøen er perfekt til tryghedsfamilien — campingpladser direkte ved søen, Gardaland for børnene og stabilt vejr.', "opdagelse": 'Windsurfing i Riva del Garda, cykling langs søen, dagsture til Verona — norditalien er eventyrligt.'},
  'norge-fjorde': {"tryghed": 'Norge er trygt og velorganiseret — gode veje, sikre hytter og naturen er imponerende uden at virke overvældende.', "opdagelse": 'Nærøyfjord fra kajak, Trolltunga og midnatssolen — Norge er den ultimative naturoplevelse tæt på Danmark.'},
  'sverige-bohuslan': {"tryghed": 'Bohuslän er den nemmeste kør-selv-ferie — trygt, billigt og klipper og hummer venter.', "opdagelse": 'Åbne klippekyster, fiskerlejer og Bohuslän-skovlandskab — Sverige overrasker altid.'},
  'tyskland-bayern': {"tryghed": 'Bayern er europæisk og organiseret — gode campingpladser, Legoland og velkendt kultur. Børn elsker slottene.', "opdagelse": 'Neuschwanstein, Zugspitze, Salzburg og alpesøer — en roadtrip through Bayern og Østrig er fuld af opdagelser.'},
  'bornholm-bil': {"tryghed": 'Bornholm er den tryggeste kør-selv-ferie — dansk, nemt og børnene kan cykle frit på øens cykelstier.', "opdagelse": 'Hammershus-ruinen, klippekysten og røgericultur — Bornholm gemmer på mere end sol og strand.'},
'mallorca': {"tryghed": 'Alt er enkelt og forudsigeligt — store sandstrande, lavvandet hav, og din all-inclusive pakke er klar fra dag 1. I kan slappe af fra første minut.', "opdagelse": 'Mallorca er mere end sol og strand — den nordøstlige kyst, bjergbyerne og sejlture tilbyder rigtige oplevelser.'}, 'kroatien': {"tryghed": 'Krystalklart vand og hyggelige havnebyer giver trygge rammer. Book en ferielejlighed og lad børnene styre tempoet.', "opdagelse": 'Øer at udforske, grotter, sejlture og Dubrovniks middelalderby — Kroatien er eventyr for hele familien.'}, 'thailand': {"tryghed": 'De store resort-hoteller i Khao Lak er skabt til familier — alt er inden for hegnet, maden er god, og stranden er tryg.', "opdagelse": 'Elefant-sanctuaries, tempelbesøg, natmarkeder og snorkling ved Similan Islands. Thailand åbner børnenes øjne.'}, 'gran-canaria': {"tryghed": 'Maspalomas er næsten garanteret sol 300 dage om året. All-inclusive, sandklitter og vandpark — perfekt til vinterferie uden bekymringer.', "opdagelse": 'Kamelridning i klitterne, Palmitos Park og dramatisk vulkansk natur — Gran Canaria er mere end sol og pool.'}, 'portugal': {"tryghed": 'Lagos og Albufeira har alt på plads — trygge strande, god mad og masser af aktiviteter. Rolig og velorganiseret ferie.', "opdagelse": 'Dramatiske klippekusten, surfing, grottebesøg med båd og autentiske fiskerlejer. Algarve overrasker.'}, 'dubai': {"tryghed": 'Alt er kontrolleret, rent og klimatiseret. Verdens bedste forlystelsesparker og luksuriøse familieresorts med eget vandland.', "opdagelse": 'Ørken-safari, souks, arkitektur fra en anden verden og kulturmøder der sætter perspektiv på hverdagen.'}, 'bornholm': {"tryghed": 'Dansk, trygt og nemt. Ingen sprogbarrierer, god mad og børn kan cykle frit i naturen. Den perfekte hjemlig ferie.', "opdagelse": 'Hammershus, middelaldercenteret, røgerier og en ø-natur der føles som et eventyr — Bornholm overrasker.'}, 'italien-toscana': {"tryghed": 'Agriturismo i Toscana er afslappet og børnevenligt — pool, dyr og simpelt liv. Ingen stramme programmer.', "opdagelse": 'Cinque Terre med tog langs klippekysten, Toscanas vinhøst, gelatoworkshops og levende middelalderhistorie.'}, 'japan': {"tryghed": 'Japan er verdens sikreste rejsemål. Alt er organiseret og præcist — perfekt for familier der vil have kontrol uden at gå på kompromis.', "opdagelse": 'Bullet trains, robotrestauranter, templer, animékultur og DisneySea — Japan er den ultimative opdagelsesrejse.'}, 'marokko': {"tryghed": 'Agadir er vestligt og trygt med gode strandhoteller. Tag en dagsudflugt til Marrakech med guide — det bedste af begge verdener.', "opdagelse": 'Sahara-overnatning, medina-labyrinter, kamelridning og arabisk kogeskole — Marokko er barnets første store verdensopdagelse.'}};

// ─── MATCH ENGINE ─────────────────────────────────────────────────────────────
// vibeScore: 0-100 mod for tryghed/opdagelse. Computed from 3 vibe questions.
function computeVibeScore(vibeAnswers) {
  // Each answer maps to 0 (tryghed) → 100 (opdagelse)
  const weights = { hvad: 0.4, hvem: 0.35, frygt: 0.25 };
  const vals = {
    hvad:  { afslapning: 0, begge_hvad: 50, opdagelse: 100 },
    hvem:  { born: 20, begge_hvem: 55, vi: 85 },
    frygt: { kedelig: 15, ingen: 50, stressende: 90 },
  };
  if (!vibeAnswers.hvad) return 50; // neutral default
  const score =
    (vals.hvad[vibeAnswers.hvad]  ?? 50) * weights.hvad +
    (vals.hvem[vibeAnswers.hvem]  ?? 50) * weights.hvem +
    (vals.frygt[vibeAnswers.frygt] ?? 50) * weights.frygt;
  return Math.round(score); // 0 = ren tryghed, 100 = ren opdagelse
}

function scoreDestination(dest, profile) {
  let score = dest.familyScore;
  const { children, budget, airports, period, maxFlightHours, vibeAnswers, travelMode } = profile;

  // Hard filters — travelMode
  const destMode = dest.travelMode || "fly"; // default to fly for existing destinations
  if (travelMode && destMode !== travelMode) return null;

  // For bil destinations skip flight/airport filters
  if (destMode === "bil") {
    if (budget === 1 && dest.budgetLevel[0] > 2) return null;
  } else {
    if (dest.flightTime > maxFlightHours) return null;
    if (airports.length > 0 && !airports.some(a => dest.airports.includes(a))) return null;
  }
  if (budget === 1 && dest.budgetLevel[0] > 2) return null;

  // Budget match
  if (!dest.budgetLevel.includes(budget)) score -= 20;

  // Child age
  const minAge = Math.min(...children.map(c => c.age));
  if (minAge < dest.minChildAge) score -= 15;

  // Period match
  if (period && dest.schoolHolidays.includes(period)) score += 10;

  // Children count bonus
  if (children.length >= 3) score += 5;

  // ── VIBE MATCH ──────────────────────────────────────────────────────────────
  // Blend destination's vibeScore against user's computed vibeScore
  if (vibeAnswers?.hvad) {
    const userVibe   = computeVibeScore(vibeAnswers);        // 0-100
    const destTryghed   = dest.vibeScore?.tryghed   ?? 70;
    const destOpdagelse = dest.vibeScore?.opdagelse ?? 70;

    // Weighted destination vibe score (how well it fits user's position on the axis)
    const destVibe = (destTryghed * (1 - userVibe / 100)) + (destOpdagelse * (userVibe / 100));

    // Strong pull: blend 50% base + 50% vibe fit
    score = Math.round(score * 0.45 + destVibe * 0.55);

    // Bonus for perfect segment match
    if (userVibe < 35 && dest.segment === "tryghed")    score += 8;
    if (userVibe > 65 && dest.segment === "opdagelse")  score += 8;
    if (dest.segment === "begge")                        score += 4;

    // All-inclusive boost for tryghed-users
    if (userVibe < 40 && dest.allInclusive) score += 6;
  }

  return Math.min(99, Math.max(40, score));
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]   = useState(0); // 0=splash, 1=transport, 2-6=onboarding, 7=results, 8=detail, 9=min-rejse
  const [travelMode, setTravelMode] = useState(null); // "fly" | "bil"
  const [heroIndex, setHeroIndex] = useState(0);

  // ── Min Rejse — gemt i localStorage ──
  const [myTrip, setMyTrip] = useState(() => {
    try { return JSON.parse(localStorage.getItem("familierejser_trip") || "null"); } catch { return null; }
  });
  const [savedMsg, setSavedMsg] = useState(false);
  const saveTrip = (tripData) => {
    localStorage.setItem("familierejser_trip", JSON.stringify(tripData));
    setMyTrip(tripData);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };
  const updateTripField = (field, value) => {
    const updated = { ...myTrip, [field]: value };
    localStorage.setItem("familierejser_trip", JSON.stringify(updated));
    setMyTrip(updated);
  };
  const deleteTrip = () => {
    localStorage.removeItem("familierejser_trip");
    setMyTrip(null);
  };
  const [selected, setSelected] = useState(null);
  const [results, setResults]   = useState([]);

  // Familieprofil state
  const [children, setChildren]       = useState([{ id: 1, age: 6 }]);
  const [budget, setBudget]           = useState(2);
  const [airports, setAirports]       = useState(["CPH"]);
  const [departDate, setDepartDate]   = useState("");
  const [returnDate, setReturnDate]   = useState("");
  const [flexibility, setFlexibility] = useState(3);
  const [maxFlight, setMaxFlight]     = useState(5);
  const [hotelPref, setHotelPref]     = useState([]);
  const [directOnly, setDirectOnly]   = useState(false);
  const [departWindow, setDepartWindow] = useState(null); // null = ingen præference
  const [vibeAnswers, setVibeAnswers] = useState({});

  const setVibe = (q, v) => setVibeAnswers(prev => ({ ...prev, [q]: v }));

  // Derive period from departDate for destination scoring
  const derivePeriod = (dateStr) => {
    if (!dateStr) return "sommer";
    const m = new Date(dateStr).getMonth() + 1;
    if (m >= 6 && m <= 8) return "sommer";
    if (m === 10) return "efterår";
    if (m === 2) return "vinterferie";
    if (m === 12 || m === 1) return "vinter";
    return "sommer";
  };
  const period = derivePeriod(departDate);

  const profile = { children, budget, airports, period, maxFlightHours: maxFlight, hotelPref, vibeAnswers, travelMode };

  const addChild    = () => setChildren(c => [...c, { id: Date.now(), age: 6 }]);
  const removeChild = (id) => setChildren(c => c.filter(x => x.id !== id));
  const updateAge   = (id, age) => setChildren(c => c.map(x => x.id === id ? { ...x, age } : x));

  const toggleAirport = (a) =>
    setAirports(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  // Derived vibe label for results page
  const userVibeScore = computeVibeScore(vibeAnswers);
  const vibeLabel = userVibeScore < 35 ? "tryghed" : userVibeScore > 65 ? "opdagelse" : "begge";

  const compute = () => {
    const scored = DESTINATIONS
      .map(d => ({ ...d, matchScore: scoreDestination(d, profile) }))
      .filter(d => d.matchScore !== null)
      .sort((a, b) => b.matchScore - a.matchScore);
    setResults(scored);
    setStep(7);
  };

  const dest = selected ? DESTINATIONS.find(d => d.id === selected) : null;
  const dates = { depart: departDate || "2025-07-05", ret: returnDate || "2025-07-19" };
  const [adults, setAdults] = useState(2);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#faf8f4", color: "#1a1a18" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,700;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #d8d0c4; border-radius: 99px; }
        @keyframes up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .appear { animation: up 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.12s; }
        .stagger-3 { animation-delay: 0.19s; }
        .stagger-4 { animation-delay: 0.26s; }
        .dest-card { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s; }
        .dest-card:hover { transform: translateY(-6px); box-shadow: 0 24px 64px rgba(0,0,0,0.14) !important; }
        .pill-btn { transition: all 0.15s; }
        .pill-btn:hover { background: #e8e0d4 !important; }
        input[type=range] { -webkit-appearance: none; height: 2px; border-radius: 1px; background: #e0d8ce; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #b85c2a; cursor: pointer; box-shadow: 0 2px 8px rgba(184,92,42,0.4); }
        button { cursor: pointer; }
        select { appearance: none; }

        /* ── MOBIL ── */
        @media (max-width: 640px) {
          .results-hero { grid-template-columns: 1fr !important; }
          .results-hero img { height: 220px !important; }
          .results-hero-content { padding: 24px !important; }
          .detail-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .detail-hero { height: 50vh !important; }
          .detail-hero-text { padding: 24px !important; }
          .book-btns { grid-template-columns: 1fr 1fr !important; }
          @media (max-width: 380px) { .book-btns { grid-template-columns: 1fr !important; } }
          .activities-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── TOPBAR ── */}
      {step > 0 && (
        <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,248,244,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #ede8e0", padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { setStep(0); setSelected(null); }}
            style={{ background: "none", border: "none", fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 400, fontStyle: "italic", color: "#b85c2a", letterSpacing: "-0.02em" }}>
            Familierejser
          </button>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {step >= 7 && step !== 8 && (
              <button onClick={() => { setStep(1); setSelected(null); }}
                style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 12, color: "#8a8078", letterSpacing: "0.04em" }}>
                Rediger profil
              </button>
            )}
            <button onClick={() => setStep(9)}
              style={{ background: myTrip ? "#fdf3ec" : "none", border: myTrip ? "1px solid #f0d8c4" : "1px solid #ede8e0", padding: "5px 12px", fontFamily: "inherit", fontSize: 12, color: myTrip ? "#b85c2a" : "#b0a898", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 6 }}>
              🗺️ Min Rejse{myTrip ? " ✓" : ""}
            </button>
          </div>
        </header>
      )}

      {/* ── SPLASH ── */}
      {step === 0 && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

          {/* Hero-billede øverst — fylder 45vh på mobil */}
          <div style={{ position: "relative", height: "45vh", minHeight: 260, flexShrink: 0, overflow: "hidden" }}>
            {DESTINATIONS.map((d, i) => (
              <img key={d.id} src={d.image} alt={d.name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block",
                  opacity: i === heroIndex ? 1 : 0, transition: "opacity 0.5s ease" }} />
            ))}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,26,24,0.15) 0%, rgba(26,26,24,0.65) 100%)" }} />
            {/* Logo øverst i hero */}
            <div style={{ position: "absolute", top: 24, left: 0, right: 0, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                Familierejser
              </div>
            </div>
            {/* Aktiv destination-navn over pills */}
            <div style={{ position: "absolute", bottom: 52, left: 20, right: 20 }}>
              <div style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 300, color: "#fff", fontStyle: "italic",
                textShadow: "0 1px 8px rgba(0,0,0,0.4)", transition: "opacity 0.3s" }}>
                {DESTINATIONS[heroIndex].name}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2, letterSpacing: "0.05em" }}>
                {DESTINATIONS[heroIndex].country} · {DESTINATIONS[heroIndex].flightTime} timers fly
              </div>
            </div>
            {/* Destination-preview pills — klikbare */}
            <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", gap: 6, padding: "0 20px", overflowX: "auto" }}>
              {DESTINATIONS.map((d, i) => (
                <button key={d.id} onClick={() => setHeroIndex(i)}
                  style={{ flexShrink: 0, background: i === heroIndex ? "rgba(184,92,42,0.85)" : "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)", border: `1px solid ${i === heroIndex ? "#b85c2a" : "rgba(255,255,255,0.2)"}`,
                    padding: "4px 12px", fontSize: 11, color: "#fff", whiteSpace: "nowrap",
                    fontFamily: "inherit", transition: "all 0.2s", animation: `up 0.4s ease ${i * 0.05}s both` }}>
                  {d.flag} {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Indhold — resten af skærmen */}
          <div className="appear" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 24px 40px", background: "#faf8f4" }}>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 16, fontWeight: 500 }}>
                Familierejser fra Danmark
              </div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(30px, 8vw, 56px)", fontWeight: 300, lineHeight: 1.1, color: "#1a1a18", marginBottom: 16 }}>
                Lad os finde{" "}
                <em style={{ fontStyle: "italic", color: "#b85c2a" }}>rejsen sammen</em>
              </h1>
              <p style={{ fontSize: 15, color: "#8a8078", lineHeight: 1.7, fontWeight: 300, marginBottom: 32 }}>
                Svar på et par spørgsmål om jeres familie — så finder vi de rejser der passer præcis til jer.
              </p>

              {/* 3 trust-punkter */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
                {[
                  { icon: "✓", text: "Tilpasset jeres børns alder og interesser" },
                  { icon: "✓", text: "Ægte anbefalinger — ingen køber sig til toppen" },
                  { icon: "✓", text: "Gratis · Ingen konto nødvendig" },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 18, height: 18, background: "#fdf3ec", border: "1px solid #f0d8c4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#b85c2a", flexShrink: 0 }}>{p.icon}</div>
                    <span style={{ fontSize: 13, color: "#6a6058" }}>{p.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA — stor og nem at trykke på */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setStep(1)}
                style={{ width: "100%", padding: "18px 24px", background: "#1a1a18", border: "none", color: "#faf8f4", fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.01em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Kom i gang →
              </button>
              <div style={{ textAlign: "center", fontSize: 11, color: "#b0a898", letterSpacing: "0.05em" }}>
                Tager 2 minutter · Gratis
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ONBOARDING TRIN 1: Børn ── */}

      {/* ── TRIN 1: TRANSPORTVALG ── */}
      {step === 1 && (
        <OnboardStep step={1} total={5} title="Hvordan rejser I?" sub="Det afgør hvilke destinationer vi finder til jer." onBack={() => setStep(0)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <button onClick={() => { setTravelMode("fly"); setStep(2); }}
              style={{ padding: "28px 16px", border: `2px solid ${travelMode === "fly" ? "#b85c2a" : "#ede8e0"}`, background: travelMode === "fly" ? "#fdf3ec" : "#fff", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 40 }}>✈️</span>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontStyle: "italic", color: "#1a1a18" }}>Fly</span>
              <span style={{ fontSize: 12, color: "#8a8078", lineHeight: 1.5, textAlign: "center" }}>Charter, lavpris eller langdistance — vi finder de bedste flygdestinationer</span>
            </button>
            <button onClick={() => { setTravelMode("bil"); setStep(2); }}
              style={{ padding: "28px 16px", border: `2px solid ${travelMode === "bil" ? "#b85c2a" : "#ede8e0"}`, background: travelMode === "bil" ? "#fdf3ec" : "#fff", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 40 }}>🚗</span>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontStyle: "italic", color: "#1a1a18" }}>Kør selv</span>
              <span style={{ fontSize: 12, color: "#8a8078", lineHeight: 1.5, textAlign: "center" }}>Bil, autocamper eller campingvogn — vi finder de bedste køreselvdestinationer</span>
            </button>
          </div>
          <div style={{ padding: "12px 16px", background: "#f5f0e8", fontSize: 12, color: "#6a6058", lineHeight: 1.7 }}>
            💡 Du kan altid skifte transportform og prøve igen bagefter.
          </div>
        </OnboardStep>
      )}

      {step === 2 && (
        <OnboardStep step={2} total={5} title="Hvem skal med?" sub="Alder afgør hvad der er de bedste aktiviteter og rejser." onBack={() => setStep(1)}>

          {/* Voksne */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 12, fontWeight: 500 }}>Voksne</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setAdults(n)}
                  style={{ flex: 1, padding: "12px 0", border: `1.5px solid ${adults === n ? "#b85c2a" : "#ede8e0"}`, background: adults === n ? "#fdf3ec" : "#fff", fontFamily: "inherit", fontSize: 16, color: adults === n ? "#b85c2a" : "#8a8078", fontWeight: adults === n ? 600 : 400 }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 12, fontWeight: 500 }}>Børn</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid #ede8e0" }}>
            {children.map((child, i) => (
              <div key={child.id} style={{ display: "flex", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #ede8e0", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#1a1a18", marginBottom: 6 }}>
                    Barn {i + 1}
                    {child.age <= 2 && <span style={{ marginLeft: 8, fontSize: 10, color: "#b85c2a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Spædbarn</span>}
                    {child.age >= 13 && <span style={{ marginLeft: 8, fontSize: 10, color: "#6b8f71", letterSpacing: "0.1em", textTransform: "uppercase" }}>Teenager</span>}
                  </div>
                  <input type="range" min={0} max={17} value={child.age}
                    onChange={e => updateAge(child.id, Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#b85c2a" }} />
                  <div style={{ fontSize: 12, color: "#8a8078", marginTop: 4 }}>{child.age === 0 ? "Under 1 år" : `${child.age} år`}</div>
                </div>
                {children.length > 1 && (
                  <button onClick={() => removeChild(child.id)}
                    style={{ background: "none", border: "1px solid #ede8e0", color: "#b0a898", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", fontSize: 16, flexShrink: 0 }}>×</button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addChild}
            style={{ marginTop: 16, background: "none", border: "1px solid #ede8e0", padding: "10px 20px", fontFamily: "inherit", fontSize: 13, color: "#8a8078", display: "flex", alignItems: "center", gap: 8 }}>
            + Tilføj barn
          </button>

          <div style={{ marginTop: 12, padding: "12px 16px", background: "#f5f0e8", fontSize: 12, color: "#8a8078", lineHeight: 1.7 }}>
            💡 Vi bruger alder til at filtrere rejser med passende aktiviteter, flyvetider og faciliteter.
          </div>

          <StepButton onClick={() => setStep(3)}>Næste →</StepButton>
        </OnboardStep>
      )}

      {/* ── ONBOARDING TRIN 2: Budget & Lufthavn ── */}
      {step === 3 && (
        <OnboardStep step={3} total={5} title="Budget & afrejse" sub="Hvad passer jeres familie?" onBack={() => setStep(2)}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>Budgetniveau</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { v: 1, label: "Spar på det", sub: "under 3.000 kr/pers", icon: "💰" },
                { v: 2, label: "Mellemklasse", sub: "3-6.000 kr/pers", icon: "✈️" },
                { v: 3, label: "Ingen grænser", sub: "6.000+ kr/pers", icon: "🥂" },
              ].map(b => (
                <button key={b.v} onClick={() => setBudget(b.v)}
                  style={{ padding: "16px 12px", border: `1.5px solid ${budget === b.v ? "#b85c2a" : "#ede8e0"}`, background: budget === b.v ? "#fdf3ec" : "#fff", fontFamily: "inherit", textAlign: "center", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{b.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: budget === b.v ? "#b85c2a" : "#1a1a18", marginBottom: 2 }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: "#b0a898" }}>{b.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>Afrejselufthavn</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { code: "CPH", name: "København" },
                { code: "BLL", name: "Billund" },
                { code: "AAL", name: "Aalborg" },
                { code: "AAR", name: "Aarhus" },
              ].map(a => (
                <button key={a.code} onClick={() => toggleAirport(a.code)} className="pill-btn"
                  style={{ padding: "9px 18px", border: `1.5px solid ${airports.includes(a.code) ? "#b85c2a" : "#ede8e0"}`, background: airports.includes(a.code) ? "#fdf3ec" : "#fff", fontFamily: "inherit", fontSize: 13, color: airports.includes(a.code) ? "#b85c2a" : "#4a4842", display: "flex", alignItems: "center", gap: 6 }}>
                  {airports.includes(a.code) && <span style={{ fontSize: 10 }}>✓</span>}
                  {a.code} {a.name}
                </button>
              ))}
            </div>
          </div>

          <StepButton onClick={() => setStep(3)}>Næste →</StepButton>
        </OnboardStep>
      )}

      {/* ── ONBOARDING TRIN 3: Datoer & Flyvetid ── */}
      {step === 4 && (
        <OnboardStep step={4} total={5} title="Hvornår skal I afsted?" sub="Vælg datoer — vi finder det bedste interval." onBack={() => setStep(3)}>

          {/* Dato-range-picker */}
          <div style={{ marginBottom: 28 }}>
            <RangePicker
              departDate={departDate}
              returnDate={returnDate}
              onSelect={(dep, ret) => { setDepartDate(dep); setReturnDate(ret); }}
            />
          </div>

          {/* Fleksibilitet */}
          <div style={{ marginBottom: 28, padding: "16px 18px", background: "#fdf3ec", borderLeft: "3px solid #b85c2a" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 12, fontWeight: 500 }}>
              Datofleksibilitet — vis mig også fly ±{flexibility} dage
            </div>
            <input type="range" min={0} max={5} value={flexibility} onChange={e => setFlexibility(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 12, color: "#b0a898" }}>Præcis dato</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#b85c2a" }}>
                {flexibility === 0 ? "Ingen fleksibilitet" : `±${flexibility} dage`}
              </span>
              <span style={{ fontSize: 12, color: "#b0a898" }}>±5 dage</span>
            </div>
            <div style={{ fontSize: 11, color: "#8a8078", marginTop: 8, lineHeight: 1.6 }}>
              {flexibility > 0
                ? `Momondo og Booking.com viser priser for alle datoer fra ${flexibility === 1 ? "dagen før/efter" : `${flexibility} dage før og efter`} — så I finder det billigste tidspunkt.`
                : "I ser kun priser for præcis de valgte datoer."}
            </div>
          </div>

          {/* Max flyvetid */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>Max flyvetid</div>
            <input type="range" min={1} max={13} value={maxFlight} onChange={e => setMaxFlight(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 12, color: "#b0a898" }}>1 time</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: "#b85c2a" }}>
                {maxFlight <= 1 ? "Op til 1 time" : maxFlight >= 13 ? "Ingen grænse" : `Op til ${maxFlight} timer`}
              </span>
              <span style={{ fontSize: 12, color: "#b0a898" }}>Ingen grænse</span>
            </div>
          </div>

          {/* Flytype & afgangsvindue */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>Flytype & afgang</div>

            {/* Direkte fly toggle */}
            <button onClick={() => setDirectOnly(v => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", marginBottom: 8, background: directOnly ? "#fdf3ec" : "#fff", border: `1.5px solid ${directOnly ? "#b85c2a" : "#ede8e0"}`, fontFamily: "inherit", textAlign: "left" }}>
              <div>
                <div style={{ fontSize: 14, color: directOnly ? "#b85c2a" : "#1a1a18", fontWeight: directOnly ? 500 : 400 }}>Kun direkte fly</div>
                <div style={{ fontSize: 12, color: "#8a8078", marginTop: 2 }}>Ingen mellemlandinger — nemmere med børn</div>
              </div>
              <div style={{ width: 20, height: 20, border: `2px solid ${directOnly ? "#b85c2a" : "#d8d0c4"}`, background: directOnly ? "#b85c2a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {directOnly && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
            </button>

            {/* Afgangsvindue */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
              {[
                { v: "morning",   label: "Morgen",    sub: "06–12" },
                { v: "midday",    label: "Middag",     sub: "09–15" },
                { v: "afternoon", label: "Eftermiddag", sub: "12–18" },
              ].map(w => (
                <button key={w.v} onClick={() => setDepartWindow(departWindow === w.v ? null : w.v)}
                  style={{ padding: "10px 8px", border: `1.5px solid ${departWindow === w.v ? "#b85c2a" : "#ede8e0"}`, background: departWindow === w.v ? "#fdf3ec" : "#fff", fontFamily: "inherit", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: departWindow === w.v ? "#b85c2a" : "#1a1a18", fontWeight: departWindow === w.v ? 500 : 400 }}>{w.label}</div>
                  <div style={{ fontSize: 11, color: "#8a8078", marginTop: 2 }}>{w.sub}</div>
                </button>
              ))}
            </div>
            {(directOnly || departWindow) && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f5f0e8", fontSize: 12, color: "#6a6058", lineHeight: 1.6 }}>
                💡 Husk at sætte disse filtre på Kayak efter du åbner søgningen — de kan ikke sættes på forhånd.
              </div>
            )}
          </div>

          <button onClick={() => setStep(4)}
            disabled={!departDate || !returnDate}
            style={{ marginTop: 8, width: "100%", padding: "16px", background: departDate && returnDate ? "#1a1a18" : "#d8d0c4", border: "none", color: departDate && returnDate ? "#faf8f4" : "#a09888", fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.01em", transition: "all 0.2s" }}>
            {departDate && returnDate ? "Næste →" : "Vælg datoer for at fortsætte"}
          </button>
        </OnboardStep>
      )}

      {/* ── ONBOARDING TRIN 4: Ferievibe ── */}
      {step === 6 && (
        <OnboardStep step={6} total={5} title="Hvad handler en god ferie om?" sub="Ingen rigtige svar — vi bruger det til at finde jeres type rejse." onBack={() => setStep(5)}>

          {/* Spørgsmål 1 */}
          <VibeQuestion
            question="Hvad er vigtigst for jer?"
            current={vibeAnswers.hvad}
            options={[
              { v: "afslapning", icon: "😌", label: "At slappe helt af", sub: "Sol, strand og ingen bekymringer" },
              { v: "begge_hvad", icon: "⚖️", label: "Lidt af begge", sub: "Afslapning og et par oplevelser" },
              { v: "opdagelse",  icon: "🌍", label: "At opleve noget nyt", sub: "Kulturer, steder og minder" },
            ]}
            onSelect={v => setVibe("hvad", v)}
          />

          {/* Spørgsmål 2 */}
          <VibeQuestion
            question="Hvem styrer programmet?"
            current={vibeAnswers.hvem}
            options={[
              { v: "born",      icon: "👦", label: "Børnene bestemmer", sub: "Vandpark, is og aktiviteter de vil have" },
              { v: "begge_hvem", icon: "👨‍👩‍👧", label: "Vi finder en balance", sub: "Noget for alle" },
              { v: "vi",        icon: "🗺️", label: "Vi planlægger det", sub: "Vi har en rute og mål" },
            ]}
            onSelect={v => setVibe("hvem", v)}
          />

          {/* Spørgsmål 3 */}
          <VibeQuestion
            question="Hvad frygter I mest ved en ferie?"
            current={vibeAnswers.frygt}
            options={[
              { v: "kedelig",    icon: "😴", label: "At der ikke er nok at lave", sub: "Vi vil have aktiviteter og action" },
              { v: "ingen",      icon: "🙂", label: "Ingen særlig frygt", sub: "Vi er fleksible" },
              { v: "stressende", icon: "😮‍💨", label: "At det bliver for stressende", sub: "Vi vil have ro og overblik" },
            ]}
            onSelect={v => setVibe("frygt", v)}
          />

          {/* Live vibe-indikator */}
          {vibeAnswers.hvad && (
            <div style={{ marginTop: 20, padding: "14px 18px", background: "#fdf3ec", borderLeft: "3px solid #b85c2a", animation: "up 0.3s ease both" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 6, fontWeight: 500 }}>
                {(() => {
                  const v = computeVibeScore(vibeAnswers);
                  if (v < 35) return "Vi ser I er en tryghedsfamilie";
                  if (v > 65) return "Vi ser I er en opdagelsesfamilie";
                  return "I er en balancefamilie";
                })()}
              </div>
              <div style={{ fontSize: 12, color: "#6a6058", lineHeight: 1.6 }}>
                {(() => {
                  const v = computeVibeScore(vibeAnswers);
                  if (v < 35) return "Vi fremhæver rejser med all-inclusive, trygge strande og velfungerende faciliteter — ferie der virker fra første dag.";
                  if (v > 65) return "Vi fremhæver rejser med autentiske oplevelser, kulturmøder og aktiviteter der giver jer noget at tale om hjemad.";
                  return "Vi finder rejser der balancerer afslappet hverdag med et par oplevelser der sætter sig fast.";
                })()}
              </div>
            </div>
          )}

          <button onClick={() => setStep(5)} disabled={!vibeAnswers.hvad || !vibeAnswers.hvem || !vibeAnswers.frygt}
            style={{ marginTop: 28, width: "100%", padding: "16px", background: vibeAnswers.hvad && vibeAnswers.hvem && vibeAnswers.frygt ? "#1a1a18" : "#d8d0c4", border: "none", color: vibeAnswers.hvad && vibeAnswers.hvem && vibeAnswers.frygt ? "#faf8f4" : "#a09888", fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.01em", transition: "all 0.2s" }}>
            {vibeAnswers.hvad && vibeAnswers.hvem && vibeAnswers.frygt ? "Næste →" : "Besvar alle spørgsmål for at fortsætte"}
          </button>
        </OnboardStep>
      )}

      {/* ── ONBOARDING TRIN 5: Hotelpræferencer ── */}
      {step === 5 && (
        <OnboardStep step={5} total={5} title="Hvad lægger I vægt på?" sub="Vi bruger det til at fremhæve de rigtige ting." onBack={() => setStep(4)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
            {[
              { v: "all-inclusive", label: "All-inclusive", icon: "🍽️", sub: "Alt betalt på forhånd" },
              { v: "pool",          label: "Pool & vandland", icon: "🏊", sub: "Vigtigt for børnene" },
              { v: "strand",        label: "Tæt på stranden", icon: "🏖️", sub: "Under 5 min til vand" },
              { v: "natur",         label: "Natur & oplevelser", icon: "🌿", sub: "Aktiviteter frem for sol" },
              { v: "kultur",        label: "Kultur & mad", icon: "🏛️", sub: "Lær noget nyt" },
              { v: "afslappet",     label: "Afslappet tempo", icon: "😌", sub: "Ingen stramme programmer" },
            ].map(p => {
              const on = hotelPref.includes(p.v);
              return (
                <button key={p.v} onClick={() => setHotelPref(prev => on ? prev.filter(x => x !== p.v) : [...prev, p.v])}
                  style={{ padding: "14px 12px", border: `1.5px solid ${on ? "#b85c2a" : "#ede8e0"}`, background: on ? "#fdf3ec" : "#fff", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: on ? "#b85c2a" : "#1a1a18", marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: "#b0a898" }}>{p.sub}</div>
                </button>
              );
            })}
          </div>

          <button onClick={compute}
            style={{ width: "100%", padding: "18px", background: "#b85c2a", border: "none", color: "#fff", fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.01em" }}>
            Find vores rejser →
          </button>
          <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "#b0a898" }}>
            Du kan altid justere profilen bagefter
          </div>
        </OnboardStep>
      )}

      {/* ── RESULTATER ── */}
      {step === 7 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>

          {/* Header */}
          <div className="appear" style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 16, fontWeight: 500 }}>
              {results.length} anbefalinger til jer
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 300, color: "#1a1a18", lineHeight: 1.1, marginBottom: 12 }}>
              {vibeLabel === "tryghed" && <>Trygge rejser, <em style={{ fontStyle: "italic" }}>skabt til jer</em></>}
              {vibeLabel === "opdagelse" && <>Oplevelser der <em style={{ fontStyle: "italic" }}>sætter sig fast</em></>}
              {vibeLabel === "begge" && <>Udvalgt til <em style={{ fontStyle: "italic" }}>jeres familie</em></>}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <p style={{ fontSize: 14, color: "#8a8078", lineHeight: 1.8, fontWeight: 300, margin: 0 }}>
                Baseret på {children.length} {children.length === 1 ? "barn" : "børn"} (
                {children.map(c => `${c.age} år`).join(", ")}){" · "}
                {departDate ? `${departDate} – ${returnDate}` : "sommerferie"}
                {" · "}{airports.join("/")}
              </p>
              {vibeAnswers.hvad && (
                <span style={{ padding: "4px 12px", background: "#fdf3ec", border: "1px solid #f0d8c4", fontSize: 11, color: "#b85c2a", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {vibeLabel === "tryghed" ? "🏖 Tryghedsfamilie" : vibeLabel === "opdagelse" ? "🌍 Opdagelsesfamilie" : "⚖️ Balancefamilie"}
                </span>
              )}
            </div>
          </div>

          {/* Topreklame: match #1 stor */}
          {results[0] && (
            <div className="appear stagger-1 dest-card results-hero" onClick={() => { setSelected(results[0].id); setStep(8); }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginBottom: 24, cursor: "pointer", background: "#fff", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
              <div style={{ position: "relative", minHeight: 320, maxHeight: 400 }}>
                <img src={results[0].image} alt={results[0].name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.2), transparent)" }} />
                <div style={{ position: "absolute", top: 20, left: 20 }}>
                  <div style={{ background: "#b85c2a", color: "#fff", padding: "4px 12px", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
                    Bedste match
                  </div>
                </div>
              </div>
              <div className="results-hero-content" style={{ padding: "40px 40px" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 12, fontWeight: 500 }}>
                  {results[0].flag} {results[0].country} · {results[0].region}
                </div>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 400, color: "#1a1a18", lineHeight: 1.1, marginBottom: 12 }}>
                  {results[0].name}
                </h3>
                <p style={{ fontSize: 15, color: "#6a6058", fontStyle: "italic", marginBottom: 20, lineHeight: 1.7, fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
                  "{results[0].tagline}"
                </p>
                <p style={{ fontSize: 14, color: "#8a8078", lineHeight: 1.8, marginBottom: 24, fontWeight: 300 }}>
                  {(SEGMENT_WHY[results[0].id]?.[vibeLabel === "begge" ? "tryghed" : vibeLabel]) || results[0].whyFamily}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b0a898", marginBottom: 3 }}>Fra</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: "#1a1a18" }}>{results[0].priceFrom.toLocaleString("da")} kr<span style={{ fontSize: 12, color: "#b0a898", fontWeight: 400 }}>/pers</span></div>
                  </div>
                  <div style={{ width: 1, height: 32, background: "#ede8e0" }} />
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b0a898", marginBottom: 3 }}>Flyvetid</div>
                    <div style={{ fontSize: 16, color: "#1a1a18" }}>{results[0].flightTime}t</div>
                  </div>
                  <div style={{ width: 1, height: 32, background: "#ede8e0" }} />
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b0a898", marginBottom: 3 }}>Match</div>
                    <div style={{ fontSize: 16, color: "#b85c2a", fontWeight: 600 }}>{results[0].matchScore}%</div>
                  </div>
                </div>
                <button style={{ padding: "13px 32px", background: "#1a1a18", border: "none", color: "#faf8f4", fontFamily: "inherit", fontSize: 13, letterSpacing: "0.05em" }}>
                  Se rejsen →
                </button>
              </div>
            </div>
          )}

          {/* Grid af resten */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {results.slice(1).map((d, i) => (
              <div key={d.id} className={`appear dest-card stagger-${Math.min(i + 1, 4)}`}
                onClick={() => { setSelected(d.id); setStep(8); }}
                style={{ background: "#fff", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ position: "relative", height: 200 }}>
                  <img src={d.image} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", color: "#fff", padding: "3px 10px", fontSize: 11, fontWeight: 600, borderRadius: 2 }}>
                    {d.matchScore}% match
                  </div>
                </div>
                <div style={{ padding: "20px 22px 24px" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b0a898", marginBottom: 8 }}>{d.flag} {d.country} · {(d.travelMode||'fly')==='bil' ? `🚗 ${d.driveFromCph}t kørsel` : `${d.flightTime}t fly`}</div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 400, marginBottom: 8, lineHeight: 1.2 }}>{d.name}</h3>
                  <p style={{ fontSize: 13, color: "#8a8078", lineHeight: 1.7, marginBottom: 16, fontWeight: 300 }}>{((SEGMENT_WHY[d.id]?.[vibeLabel === "begge" ? "tryghed" : vibeLabel]) || d.whyFamily).slice(0, 110)}…</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0ebe0", paddingTop: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#b0a898", marginBottom: 2 }}>Fra</div>
                      <div style={{ fontSize: 17, fontWeight: 600 }}>{d.priceFrom.toLocaleString("da")} kr <span style={{ fontSize: 11, fontWeight: 400, color: "#b0a898" }}>/ pers</span></div>
                    </div>
                    <span style={{ fontSize: 13, color: "#b85c2a" }}>Se rejsen →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DESTINATION DETAIL ── */}
      {step === 8 && dest && (
        <div>
          {/* Hero */}
          <div className="detail-hero" style={{ position: "relative", height: "60vh", minHeight: 360 }}>
            <img src={dest.image} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,26,24,0.85) 0%, rgba(26,26,24,0.2) 50%, transparent 100%)" }} />
            <div className="detail-hero-text" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 56px" }}>
              <button onClick={() => setStep(7)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontFamily: "inherit", fontSize: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.05em" }}>
                ← Alle anbefalinger
              </button>
              <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#d4957a", marginBottom: 10, fontWeight: 500 }}>
                {dest.flag} {dest.country} · {dest.region}
              </div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(32px, 5vw, 64px)", fontWeight: 300, color: "#fff", lineHeight: 1.05, marginBottom: 12 }}>
                {dest.name}
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 300 }}>
                {dest.tagline}
              </p>
            </div>
          </div>

          {/* Indhold */}
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px" }}>

            {/* ── AFFILIATE KNAPPER ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 56 }}>

              {/* Fly — Kayak: kun for fly-destinationer */}
              {(dest.travelMode || "fly") === "fly" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <a href={momondoLink({ from: airports[0], to: dest.iata, depart: dates.depart, returnDate: dates.ret, adults, children: children.map(c => c.age), flexibility })}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px", background: "#1a1a18", color: "#faf8f4", textDecoration: "none", gap: 3, minHeight: 90 }}>
                    <div style={{ fontSize: 18 }}>✈</div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic" }}>Fly — Kayak</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                      {airports[0]} → {dest.iata} · {children.length + adults} pers.
                    </div>
                  </a>
                  {(directOnly || departWindow) && (
                    <div style={{ padding: "7px 10px", background: "#fdf3ec", border: "1px solid #f0d8c4", fontSize: 10, color: "#8a6050", lineHeight: 1.6 }}>
                      💡 Filtrer på Kayak:{" "}
                      {directOnly && <span><strong>Direkte fly</strong>{departWindow ? " · " : ""}</span>}
                      {departWindow === "morning" && <span><strong>06–12</strong></span>}
                      {departWindow === "midday" && <span><strong>09–15</strong></span>}
                      {departWindow === "afternoon" && <span><strong>12–18</strong></span>}
                    </div>
                  )}
                </div>
              )}

              {/* Kør-selv info — kun for bil-destinationer */}
              {(dest.travelMode || "fly") === "bil" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px", background: "#f5f0e8", border: "1px solid #ede8e0", gap: 6, minHeight: 90 }}>
                  <div style={{ fontSize: 18 }}>🚗</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic", color: "#1a1a18" }}>Kør-selv ferie</div>
                  <div style={{ fontSize: 11, color: "#8a8078", textAlign: "center" }}>
                    Ca. {dest.driveFromCph} timers kørsel fra København
                  </div>
                </div>
              )}

              {/* Hotel — Booking.com */}
              <a href={bookingLink({ destination: dest.name, checkin: dates.depart, checkout: dates.ret, adults, children: children.map(c => c.age), flexibility })}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px", background: "#003580", color: "#fff", textDecoration: "none", gap: 3, minHeight: 90 }}>
                <div style={{ fontSize: 18 }}>🏨</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic" }}>
                  {(dest.travelMode || "fly") === "bil" ? "Overnatning — Booking" : "Hotel — Booking"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  {dest.name} · {children.length} børn + {adults} voksne
                </div>
              </a>

              {/* Billeje — kun for fly-destinationer */}
              {(dest.travelMode || "fly") === "fly" && (
                <a href={rentalcarsLink({ destination: dest.name, iata: dest.iata, pickup: dates.depart, dropoff: dates.ret, drivers: adults })}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px", background: "#2c7a4b", color: "#fff", textDecoration: "none", gap: 3, minHeight: 90 }}>
                  <div style={{ fontSize: 18 }}>🚗</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic" }}>Billeje — Rentalcars</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    {dates.depart} – {dates.ret} · {dest.name}
                  </div>
                </a>
              )}

              {/* Transfer — kun for bil-destinationer */}
              {(dest.travelMode || "fly") === "bil" && (
                <a href={`https://www.booking.com/searchresults.da.html?ss=${encodeURIComponent(dest.name + " camping")}&checkin=${dates.depart}&checkout=${dates.ret}&group_adults=${adults}&group_children=${children.length}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px", background: "#2c7a4b", color: "#fff", textDecoration: "none", gap: 3, minHeight: 90 }}>
                  <div style={{ fontSize: 18 }}>⛺</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic" }}>Camping — Booking</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    Campingpladser i {dest.name}
                  </div>
                </a>
              )}

              {/* Forsikring — ERV */}
              <a href={ervLink({ depart: dates.depart, returnDate: dates.ret, adults, children: children.map(c => c.age) })}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px", background: "#8e1e2f", color: "#fff", textDecoration: "none", gap: 3, minHeight: 90 }}>
                <div style={{ fontSize: 18 }}>🛡️</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic" }}>Forsikring — ERV</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  {children.length + adults} pers. · {dates.depart} – {dates.ret}
                </div>
              </a>

            </div>

            {/* Hvorfor passer det jer */}
            <div className="appear stagger-1 detail-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 48, marginBottom: 56 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 16, fontWeight: 500 }}>Derfor anbefaler vi {dest.name}</div>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 300, color: "#1a1a18", lineHeight: 1.65, fontStyle: "italic", marginBottom: 20 }}>
                  "{(SEGMENT_WHY[dest.id]?.[vibeLabel === "begge" ? "tryghed" : vibeLabel]) || dest.whyFamily}"
                </p>
                <div style={{ padding: "16px 20px", background: "#fdf3ec", borderLeft: "3px solid #b85c2a" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 6, fontWeight: 500 }}>Insider-tip</div>
                  <p style={{ fontSize: 13, color: "#6a6058", lineHeight: 1.7, margin: 0 }}>{dest.tipFrom}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[
                  { label: (dest.travelMode||"fly")==="bil" ? "Kørsel fra KBH" : "Flyvetid", value: (dest.travelMode||"fly")==="bil" ? `${dest.driveFromCph} timer` : `${dest.flightTime} timer` },
                  { label: "Valuta", value: dest.currency },
                  { label: "Vejr", value: dest.weatherJuly || dest.weatherDec || dest.weatherJan || dest.weatherOct || dest.weatherMay || dest.weatherApr || "–" },
                  { label: "Visum", value: dest.visa ? "Kræves" : "Ikke nødvendigt" },
                  { label: "Sikkerhed", value: dest.safety === 1 ? "Grønt — trygt" : "Gult — vær opmærksom" },
                  { label: "Til stranden", value: dest.driveFromBeach === 0 ? "Strandhotel" : `~${dest.driveFromBeach} min` },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #ede8e0" }}>
                    <span style={{ fontSize: 12, color: "#8a8078", letterSpacing: "0.02em" }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: "#1a1a18", fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vejrudsigt */}
            <WeatherWidget dest={dest} departDate={departDate} />

            {/* Aktiviteter for børnene */}
            <div className="appear stagger-2" style={{ marginBottom: 56 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 20, fontWeight: 500 }}>Hvad kan børnene lave?</div>
              <div className="activities-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {dest.kidActivities.map((act, i) => (
                  <div key={i} style={{ padding: "14px 18px", background: "#fff", border: "1px solid #ede8e0", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 4, height: 4, background: "#b85c2a", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#4a4842", lineHeight: 1.5 }}>{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hoteltyper */}
            <div className="appear stagger-3" style={{ marginBottom: 56 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 20, fontWeight: 500 }}>Anbefalede overnatningstyper</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {dest.hotelTypes.map(h => (
                  <span key={h} style={{ padding: "8px 16px", border: "1px solid #ede8e0", background: "#fff", fontSize: 13, color: "#4a4842" }}>{h}</span>
                ))}
              </div>
            </div>

            {/* eSIM */}
            {!["Danmark", "Spanien", "Portugal", "Kroatien", "Italien"].includes(dest.country) && (
              <div className="appear stagger-4" style={{ padding: "24px 28px", background: "#141410", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 56 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 8, fontWeight: 500 }}>Husk eSIM</div>
                  <div style={{ fontSize: 14, color: "#f0ede8", marginBottom: 4 }}>{dest.country} har ikke EU-roaming</div>
                  <div style={{ fontSize: 12, color: "#6a6a60" }}>Undgå chokregningen — køb eSIM fra {dest.iata} for hele familien</div>
                </div>
                <a href={`https://www.airalo.com/${dest.iata.toLowerCase()}?aff=${AIRALO_AFF}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "12px 24px", background: "#b85c2a", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", letterSpacing: "0.03em" }}>
                  Køb eSIM via Airalo →
                </a>
              </div>
            )}

            {/* Book-knapper igen i bunden */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <a href={momondoLink({ from: airports[0], to: dest.iata, depart: dates.depart, returnDate: dates.ret, adults, children: children.map(c => c.age), flexibility })}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "block", padding: "16px", background: "#1a1a18", color: "#faf8f4", textDecoration: "none", textAlign: "center", fontSize: 14, letterSpacing: "0.04em" }}>
                ✈ Find fly på Kayak
              </a>
              <a href={bookingLink({ destination: dest.name, checkin: dates.depart, checkout: dates.ret, adults, children: children.map(c => c.age), flexibility })}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "block", padding: "16px", background: "#003580", color: "#fff", textDecoration: "none", textAlign: "center", fontSize: 14, letterSpacing: "0.04em" }}>
                🏨 Find hotel på Booking.com
              </a>
            </div>

            {/* Gem til Min Rejse */}
            <div style={{ marginTop: 32, marginBottom: 8 }}>
              <button onClick={() => {
                saveTrip({
                  destination: dest.name,
                  country: dest.country,
                  flag: dest.flag,
                  iata: dest.iata,
                  image: dest.image,
                  departDate: dates.depart,
                  returnDate: dates.ret,
                  airport: airports[0],
                  adults,
                  children: children.map(c => c.age),
                  flightNumber: myTrip?.destination === dest.name ? (myTrip.flightNumber || "") : "",
                  hotelName: myTrip?.destination === dest.name ? (myTrip.hotelName || "") : "",
                  carRental: myTrip?.destination === dest.name ? (myTrip.carRental || false) : false,
                  notes: myTrip?.destination === dest.name ? (myTrip.notes || "") : "",
                  costs: myTrip?.destination === dest.name ? (myTrip.costs || {}) : {},
                  savedAt: new Date().toISOString(),
                });
              }}
                style={{ width: "100%", padding: "18px", background: savedMsg ? "#2c7a4b" : "#b85c2a", border: "none", color: "#fff", fontFamily: "'Fraunces', serif", fontSize: 18, fontStyle: "italic", letterSpacing: "0.01em", transition: "background 0.4s" }}>
                {savedMsg ? "✓ Gemt til Min Rejse!" : "Gem til Min Rejse →"}
              </button>
              {myTrip && myTrip.destination !== dest.name && (
                <div style={{ fontSize: 11, color: "#b0a898", textAlign: "center", marginTop: 8 }}>
                  Du har allerede gemt {myTrip.flag} {myTrip.destination} — denne rejse erstatter den
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#c0b8b0", fontStyle: "italic" }}>
              Vi modtager en lille kommission fra Momondo og Booking.com — det koster dig ingenting ekstra og hjælper os med at holde tjenesten gratis.
            </div>
          </div>
        </div>
      )}

      {/* ── MIN REJSE ── */}
      {step === 9 && (() => {
        const costs = myTrip?.costs || {};
        const costItems = [
          { key: "costFlight",     label: "Fly",         icon: "✈️" },
          { key: "costHotel",      label: "Hotel",       icon: "🏨" },
          { key: "costCar",        label: "Billeje",     icon: "🚗" },
          { key: "costInsurance",  label: "Forsikring",  icon: "🛡️" },
          { key: "costActivities", label: "Aktiviteter", icon: "🎡" },
          { key: "costOther",      label: "Andet",       icon: "📦" },
        ];
        const totalCost = costItems.reduce((s, { key }) => s + (parseFloat(costs[key]) || 0), 0);
        const hasFlightOut = (myTrip?.flightNumber || "").trim().length >= 3;
        const hasFlightHome = (myTrip?.flightNumberReturn || "").trim().length >= 3;
        const hasHotel = (myTrip?.hotelName || "").trim().length > 0;
        const isReadyToGo = hasFlightOut && hasHotel;
        const checklist = [
          { key: "chkInsurance",  label: "Rejseforsikring er tegnet" },
          { key: "chkPassports",  label: "Alle pas er gyldige (min. 6 mdr. efter hjemkomst)" },
          { key: "chkHealthCard", label: "Blåt EU-sygesikringskort er fundet frem" },
          { key: "chkVisa",       label: "Visum / indrejsekrav er tjekket" },
          { key: "chkVaccines",   label: "Vacciner og helbredstjek er klaret" },
          { key: "chkCurrency",   label: "Valuta / kontanter er ordnet" },
          { key: "chkEsim",       label: "Mobildata i udlandet er styr på (roaming / eSIM)" },
          { key: "chkTransport",  label: "Transport til/fra lufthavn er booket" },
        ];
        const chkState = myTrip?.checklist || {};
        const checkedCount = checklist.filter(c => chkState[c.key]).length;

        return (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>
          <div className="appear">

            <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 12, fontWeight: 500 }}>Din rejseplanlægning</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px,7vw,42px)", fontWeight: 300, color: "#1a1a18", marginBottom: 32, lineHeight: 1.1 }}>
              Min Rejse
            </h1>

            {!myTrip ? (
              <div style={{ textAlign: "center", padding: "64px 24px", background: "#faf8f4", border: "1px dashed #d8d0c4" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontStyle: "italic", color: "#6a6058", marginBottom: 12 }}>Ingen rejse gemt endnu</div>
                <p style={{ fontSize: 14, color: "#b0a898", marginBottom: 24 }}>Find en destination og tryk "Gem til Min Rejse" for at starte din planlægning.</p>
                <button onClick={() => setStep(results.length ? 6 : 1)}
                  style={{ padding: "14px 28px", background: "#b85c2a", border: "none", color: "#fff", fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic" }}>
                  {results.length ? "Se anbefalinger →" : "Find en rejse →"}
                </button>
              </div>
            ) : (
              <div>

                {/* ── Destination header ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", background: "#1a1a18", color: "#faf8f4", marginBottom: 2 }}>
                  <div style={{ fontSize: 36 }}>{myTrip.flag}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontStyle: "italic" }}>{myTrip.destination}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
                      {myTrip.airport} → {myTrip.iata} · {myTrip.departDate} – {myTrip.returnDate}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                      {myTrip.adults} voksne{myTrip.children.length > 0 ? ` + ${myTrip.children.length} barn${myTrip.children.length !== 1 ? "e" : ""}` : ""}
                    </div>
                  </div>
                </div>

                {/* ── Glæd dig-banner — vises når fly + hotel er udfyldt ── */}
                {isReadyToGo && (
                  <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #b85c2a 0%, #c97840 100%)", color: "#fff", marginBottom: 2 }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontStyle: "italic", marginBottom: 4 }}>
                      Nu er det officielt — I skal til {myTrip.destination}! 🎉
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                      {myTrip.flightNumber} letter fra {myTrip.airport} den {myTrip.departDate}
                      {myTrip.hotelName ? ` · Overnatning på ${myTrip.hotelName}` : ""}. Glæd jer!
                    </div>
                  </div>
                )}

                {/* ── Flydetaljer ── */}
                <div style={{ border: "1px solid #ede8e0", padding: "24px", marginBottom: 2, background: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>✈️ Flydetaljer</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#8a8078", display: "block", marginBottom: 5 }}>Flynummer (ud)</label>
                      <input value={myTrip.flightNumber || ""} onChange={e => updateTripField("flightNumber", e.target.value)}
                        placeholder="fx SK261"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#faf8f4", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#8a8078", display: "block", marginBottom: 5 }}>Flynummer (hjem)</label>
                      <input value={myTrip.flightNumberReturn || ""} onChange={e => updateTripField("flightNumberReturn", e.target.value)}
                        placeholder="fx SK262"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#faf8f4", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  {/* Udrejse-detaljer — vises når flynummer er tastet */}
                  {hasFlightOut && (
                    <div style={{ marginTop: 12, padding: "14px 16px", background: "#f5f0e8", borderLeft: "3px solid #b85c2a" }}>
                      <div style={{ fontSize: 11, color: "#b85c2a", fontWeight: 500, marginBottom: 10 }}>
                        {myTrip.departDate} · {AIRPORT_NAMES[myTrip.airport] || myTrip.airport} → {AIRPORT_NAMES[myTrip.iata] || myTrip.iata}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#b0a898", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Afgang</div>
                          <input value={myTrip.departTime || ""} onChange={e => updateTripField("departTime", e.target.value)}
                            placeholder="10:30" style={{ width: "100%", padding: "8px 10px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#fff", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#b0a898", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Gate</div>
                          <input value={myTrip.departGate || ""} onChange={e => updateTripField("departGate", e.target.value)}
                            placeholder="B12" style={{ width: "100%", padding: "8px 10px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#fff", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#b0a898", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Terminal</div>
                          <input value={myTrip.departTerminal || ""} onChange={e => updateTripField("departTerminal", e.target.value)}
                            placeholder="T2" style={{ width: "100%", padding: "8px 10px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#fff", boxSizing: "border-box" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {hasFlightHome && (
                    <div style={{ marginTop: 8, padding: "14px 16px", background: "#f0f5f0", borderLeft: "3px solid #2c7a4b" }}>
                      <div style={{ fontSize: 11, color: "#2c7a4b", fontWeight: 500, marginBottom: 10 }}>
                        {myTrip.returnDate} · {AIRPORT_NAMES[myTrip.iata] || myTrip.iata} → {AIRPORT_NAMES[myTrip.airport] || myTrip.airport}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#b0a898", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Afgang</div>
                          <input value={myTrip.returnTime || ""} onChange={e => updateTripField("returnTime", e.target.value)}
                            placeholder="15:45" style={{ width: "100%", padding: "8px 10px", border: "1px solid #d8e8d8", fontFamily: "inherit", fontSize: 14, background: "#fff", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#b0a898", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Gate</div>
                          <input value={myTrip.returnGate || ""} onChange={e => updateTripField("returnGate", e.target.value)}
                            placeholder="A05" style={{ width: "100%", padding: "8px 10px", border: "1px solid #d8e8d8", fontFamily: "inherit", fontSize: 14, background: "#fff", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#b0a898", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Terminal</div>
                          <input value={myTrip.returnTerminal || ""} onChange={e => updateTripField("returnTerminal", e.target.value)}
                            placeholder="T1" style={{ width: "100%", padding: "8px 10px", border: "1px solid #d8e8d8", fontFamily: "inherit", fontSize: 14, background: "#fff", boxSizing: "border-box" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Overnatning ── */}
                <div style={{ border: "1px solid #ede8e0", padding: "24px", marginBottom: 2, background: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>🏨 Overnatning</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#8a8078", display: "block", marginBottom: 5 }}>Hotel / lejlighed</label>
                        <input value={myTrip.hotelName || ""} onChange={e => updateTripField("hotelName", e.target.value)}
                          placeholder="fx Hotel Alcudia Beach"
                          style={{ width: "100%", padding: "10px 12px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#faf8f4", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#8a8078", display: "block", marginBottom: 5 }}>Booking-nummer</label>
                        <input value={myTrip.bookingRef || ""} onChange={e => updateTripField("bookingRef", e.target.value)}
                          placeholder="fx 4521897653"
                          style={{ width: "100%", padding: "10px 12px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#faf8f4", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    {/* Ekstra overnatninger */}
                    {(myTrip.extraHotels || []).map((hotel, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end" }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#8a8078", display: "block", marginBottom: 5 }}>Ekstra hotel {i + 1}</label>
                          <input value={hotel.name || ""} onChange={e => { const arr = [...(myTrip.extraHotels || [])]; arr[i] = { ...arr[i], name: e.target.value }; updateTripField("extraHotels", arr); }}
                            placeholder="Hotel navn"
                            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#faf8f4", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#8a8078", display: "block", marginBottom: 5 }}>Booking-nr.</label>
                          <input value={hotel.ref || ""} onChange={e => { const arr = [...(myTrip.extraHotels || [])]; arr[i] = { ...arr[i], ref: e.target.value }; updateTripField("extraHotels", arr); }}
                            placeholder="Booking-nummer"
                            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 14, background: "#faf8f4", boxSizing: "border-box" }} />
                        </div>
                        <button onClick={() => { const arr = (myTrip.extraHotels || []).filter((_, j) => j !== i); updateTripField("extraHotels", arr); }}
                          style={{ padding: "10px 12px", background: "none", border: "1px solid #ede8e0", color: "#b0a898", fontFamily: "inherit", marginBottom: 0 }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => updateTripField("extraHotels", [...(myTrip.extraHotels || []), { name: "", ref: "" }])}
                      style={{ alignSelf: "flex-start", padding: "8px 16px", background: "none", border: "1px solid #ede8e0", fontFamily: "inherit", fontSize: 12, color: "#8a8078" }}>
                      + Tilføj ekstra overnatning
                    </button>
                  </div>
                </div>

                {/* ── Udgiftsoverblik ── */}
                <div style={{ border: "1px solid #ede8e0", padding: "24px", marginBottom: 2, background: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>💰 Udgifter</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {costItems.map(({ key, label, icon }) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #ede8e0", background: "#faf8f4" }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: "#b0a898", marginBottom: 3 }}>{label}</div>
                          <input type="number" value={costs[key] || ""} onChange={e => updateTripField("costs", { ...costs, [key]: e.target.value })}
                            placeholder="0 kr."
                            style={{ width: "100%", border: "none", background: "transparent", fontFamily: "inherit", fontSize: 15, fontWeight: 500, color: "#1a1a18", padding: 0, outline: "none" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Samlet overblik */}
                  <div style={{ padding: "16px 20px", background: "#1a1a18", color: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: costItems.filter(({ key }) => costs[key]).length > 0 ? 12 : 0 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Samlet budget</span>
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontStyle: "italic", color: "#f0c896" }}>
                        {totalCost > 0 ? totalCost.toLocaleString("da-DK") + " kr." : "—"}
                      </span>
                    </div>
                    {totalCost > 0 && myTrip.children && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10 }}>
                        Pr. person: {Math.round(totalCost / (myTrip.adults + myTrip.children.length)).toLocaleString("da-DK")} kr.
                        {costItems.filter(({ key }) => costs[key]).map(({ key, label, icon }) => (
                          <span key={key} style={{ marginLeft: 12 }}>{icon} {parseFloat(costs[key]).toLocaleString("da-DK")} kr.</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Huskeliste ── */}
                <div style={{ border: "1px solid #ede8e0", padding: "24px", marginBottom: 2, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", fontWeight: 500 }}>✅ Huskeliste</div>
                    <div style={{ fontSize: 12, color: checkedCount === checklist.length ? "#2c7a4b" : "#b0a898" }}>
                      {checkedCount}/{checklist.length + (myTrip.customChecks || []).length} klaret
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {checklist.map(({ key, label }) => (
                      <button key={key} onClick={() => updateTripField("checklist", { ...chkState, [key]: !chkState[key] })}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f5f0e8", background: "none", border: "none", borderBottom: "1px solid #f5f0e8", fontFamily: "inherit", textAlign: "left", width: "100%" }}>
                        <div style={{ width: 22, height: 22, border: `2px solid ${chkState[key] ? "#2c7a4b" : "#d8d0c4"}`, background: chkState[key] ? "#2c7a4b" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                          {chkState[key] && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 14, color: chkState[key] ? "#8a8078" : "#1a1a18", textDecoration: chkState[key] ? "line-through" : "none" }}>{label}</span>
                      </button>
                    ))}
                    {/* Custom checklist items */}
                    {(myTrip.customChecks || []).map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f5f0e8" }}>
                        <button onClick={() => { const arr = [...(myTrip.customChecks || [])]; arr[i] = { ...arr[i], done: !arr[i].done }; updateTripField("customChecks", arr); }}
                          style={{ width: 22, height: 22, border: `2px solid ${item.done ? "#2c7a4b" : "#d8d0c4"}`, background: item.done ? "#2c7a4b" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                          {item.done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                        </button>
                        <input value={item.label} onChange={e => { const arr = [...(myTrip.customChecks || [])]; arr[i] = { ...arr[i], label: e.target.value }; updateTripField("customChecks", arr); }}
                          style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 14, color: item.done ? "#8a8078" : "#1a1a18", textDecoration: item.done ? "line-through" : "none", outline: "none", padding: "2px 0" }} />
                        <button onClick={() => { const arr = (myTrip.customChecks || []).filter((_, j) => j !== i); updateTripField("customChecks", arr); }}
                          style={{ background: "none", border: "none", color: "#c0b8b0", fontSize: 16, padding: "0 4px", fontFamily: "inherit" }}>×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => updateTripField("customChecks", [...(myTrip.customChecks || []), { label: "", done: false }])}
                    style={{ marginTop: 12, padding: "8px 16px", background: "none", border: "1px dashed #d8d0c4", fontFamily: "inherit", fontSize: 12, color: "#8a8078" }}>
                    + Tilføj eget punkt
                  </button>
                </div>

                {/* ── Kvitteringer ── */}
                <div style={{ border: "1px solid #ede8e0", padding: "24px", marginBottom: 2, background: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>🧾 Kvitteringer & dokumenter</div>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px", border: "1px dashed #d8d0c4", background: "#faf8f4", cursor: "pointer", fontSize: 13, color: "#8a8078" }}>
                    <span style={{ fontSize: 20 }}>📎</span>
                    <span>Upload kvittering, boardingkort eller dokument</span>
                    <input type="file" accept="image/*,application/pdf" multiple onChange={e => {
                      const files = Array.from(e.target.files);
                      files.forEach(file => {
                        if (file.size > 2 * 1024 * 1024) { alert(`${file.name} er for stor (max 2MB)`); return; }
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const newReceipt = { name: file.name, type: file.type, data: ev.target.result, addedAt: new Date().toISOString() };
                          updateTripField("receipts", [...(myTrip.receipts || []), newReceipt]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }} style={{ display: "none" }} />
                  </label>
                  {(myTrip.receipts || []).length > 0 && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                      {(myTrip.receipts || []).map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f5f0e8", border: "1px solid #ede8e0" }}>
                          <span style={{ fontSize: 16 }}>{r.type === "application/pdf" ? "📄" : "🖼️"}</span>
                          <span style={{ flex: 1, fontSize: 13, color: "#1a1a18", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                          <a href={r.data} download={r.name} style={{ fontSize: 11, color: "#b85c2a", textDecoration: "none" }}>Download</a>
                          <button onClick={() => updateTripField("receipts", (myTrip.receipts || []).filter((_, j) => j !== i))}
                            style={{ background: "none", border: "none", color: "#c0b8b0", fontSize: 16, padding: "0 2px", fontFamily: "inherit" }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 11, color: "#b0a898" }}>Filer gemmes lokalt på din enhed · Max 2MB pr. fil</div>
                </div>

                {/* ── Pro rejsetips ── */}
                <div style={{ border: "1px solid #ede8e0", padding: "24px", marginBottom: 24, background: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 16, fontWeight: 500 }}>💡 Pro rejsetips</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[
                      { icon: "💳", tip: "Kreditkort til billeje — ikke debitkort", detail: "De fleste biludlejningsselskaber kræver et Mastercard eller Visa KREDIT-kort (ikke debit) for at blokere et depositum. Har du kun debitkort risikerer du at skulle købe dyr ekstra forsikring på stedet eller blive afvist." },
                      { icon: "💱", tip: "Betal altid i lokal valuta", detail: "Når du betaler med kort i udlandet og kassedamen spørger 'DKK eller EUR?' — vælg altid den lokale valuta (EUR, GBP osv.). Det er næsten altid billigere end at lade din bank konvertere." },
                      { icon: "🚌", tip: "Book lufthavnstransport på forhånd", detail: "Har du ikke lejet bil? Book din transfer hjemmefra — det er billigere og langt mere afslappet end at jage taxa i ankomsthal med søvnige børn.", link: "https://www.gettransfer.com/da", linkLabel: "Book transfer via GetTransfer →" },
                      { icon: "📱", tip: "Tjek roaming med dit teleselskab", detail: "EU-roaming er gratis i alle EU/EØS-lande — men tjek alligevel din plan. Rejser du uden for EU (Jordan, Marokko, Dubai, Thailand) skal du enten aktivere en datapakke eller købe et lokalt eSIM." },
                      { icon: "💶", tip: "Hæv kontanter dér — ikke hjemme", detail: "Det er som regel billigere at hæve kontanter lokalt (fx EUR i Spanien) end at veksle hjemme i Danmark. Undgå vekselkontorer i lufthavne — kursen er generelt dårlig. Brug din banks hæveautomat." },
                      { icon: "🧾", tip: "Upload kvitteringer løbende", detail: "Gem boardingkort, hotelkvitteringer og lægeregninger i sektionen ovenfor. Forsikringsselskabet kræver dokumentation — det er nemt at glemme bagefter." },
                    ].map((t, i) => (
                      <div key={i} style={{ padding: "14px 0", borderBottom: i < 5 ? "1px solid #f5f0e8" : "none", display: "flex", gap: 14 }}>
                        <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{t.icon}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a18", marginBottom: 4 }}>{t.tip}</div>
                          <div style={{ fontSize: 13, color: "#6a6058", lineHeight: 1.65 }}>{t.detail}</div>
                          {t.link && <a href={t.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#b85c2a", textDecoration: "none", display: "inline-block", marginTop: 6 }}>{t.linkLabel}</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Handlinger ── */}
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <button onClick={() => { const d = DESTINATIONS.find(d => d.iata === myTrip.iata); if (d) { setSelected(d.id); setStep(8); } else setStep(7); }}
                    style={{ flex: 1, padding: "14px", background: "#b85c2a", border: "none", color: "#fff", fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic" }}>
                    ← Tilbage til {myTrip.destination}
                  </button>
                  <button onClick={() => { if (window.confirm("Slet denne rejse?")) deleteTrip(); }}
                    style={{ padding: "14px 20px", background: "none", border: "1px solid #ede8e0", color: "#b0a898", fontFamily: "inherit", fontSize: 12 }}>
                    Slet
                  </button>
                </div>

                {/* Planlæg ny rejse / arkiv */}
                <button onClick={() => {
                  const archived = JSON.parse(localStorage.getItem("familierejser_archived") || "[]");
                  archived.push({ ...myTrip, archivedAt: new Date().toISOString() });
                  localStorage.setItem("familierejser_archived", JSON.stringify(archived));
                  deleteTrip();
                  setStep(results.length ? 6 : 1);
                }} style={{ width: "100%", padding: "12px", background: "none", border: "1px dashed #d8d0c4", fontFamily: "inherit", fontSize: 13, color: "#8a8078", marginBottom: 16 }}>
                  + Planlæg en ny rejse (gemmer denne til arkiv)
                </button>

                {/* Arkiverede rejser */}
                {(() => { try {
                  const arr = JSON.parse(localStorage.getItem("familierejser_archived") || "[]");
                  if (!arr.length) return null;
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a898", marginBottom: 10, fontWeight: 500 }}>Tidligere rejser</div>
                      {arr.map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid #ede8e0", background: "#faf8f4", marginBottom: 4 }}>
                          <span style={{ fontSize: 20 }}>{t.flag}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: "#1a1a18" }}>{t.destination}</div>
                            <div style={{ fontSize: 11, color: "#b0a898" }}>{t.departDate} – {t.returnDate}</div>
                          </div>
                          <button onClick={() => { saveTrip(t); const updated = arr.filter((_, j) => j !== i); localStorage.setItem("familierejser_archived", JSON.stringify(updated)); }}
                            style={{ fontSize: 11, color: "#b85c2a", background: "none", border: "1px solid #f0d8c4", padding: "5px 10px", fontFamily: "inherit" }}>
                            Gendan
                          </button>
                        </div>
                      ))}
                    </div>
                  ); } catch { return null; } })()}

                <div style={{ fontSize: 11, color: "#c0b8b0", textAlign: "center" }}>
                  Gemt lokalt på denne enhed · Sidst opdateret {new Date(myTrip.savedAt).toLocaleDateString("da-DK")}
                </div>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* Footer */}
      {step !== 0 && (
        <footer style={{ borderTop: "1px solid #ede8e0", padding: "24px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontStyle: "italic", color: "#b0a898" }}>
            Familierejser fra Danmark — kurateret, ikke algoritmisk
          </div>
        </footer>
      )}
    </div>
  );
}

// ─── HJÆLPEKOMPONENTER ────────────────────────────────────────────────────────
function OnboardStep({ step, total, title, sub, onBack, children }) {
  return (
    <div style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div className="appear" style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
          <button onClick={onBack}
            style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 12, color: "#8a8078", letterSpacing: "0.04em" }}>
            ← Tilbage
          </button>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {Array.from({ length: total }, (_, i) => (
              <div key={i} style={{ width: i + 1 === step ? 24 : 6, height: 2, background: i + 1 <= step ? "#b85c2a" : "#ede8e0", borderRadius: 1, transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#b85c2a", marginBottom: 14, fontWeight: 500 }}>Trin {step} af {total}</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300, color: "#1a1a18", lineHeight: 1.1, marginBottom: sub ? 10 : 0 }}>
            {title}
          </h2>
          {sub && <p style={{ fontSize: 14, color: "#8a8078", margin: 0, lineHeight: 1.7, fontWeight: 300 }}>{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function DestImage({ visual, height = 200 }) {
  if (!visual) return <div style={{ width: "100%", height, background: "#e8e0d4" }} />;
  return (
    <div style={{ width: "100%", height: height === "100%" ? "100%" : height, position: "relative", overflow: "hidden", flexShrink: 0 }}>
      {/* Himmel */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${visual.sky} 0%, ${visual.sky}bb 40%, ${visual.sea}cc 65%, ${visual.sea} 100%)` }} />
      {/* Sol */}
      <div style={{ position: "absolute", top: "12%", right: "18%", width: 44, height: 44, borderRadius: "50%", background: "#fff9c4", boxShadow: `0 0 32px 12px ${visual.sky}88` }} />
      {/* Bølger */}
      <div style={{ position: "absolute", bottom: "28%", left: 0, right: 0, height: "35%", background: `linear-gradient(180deg, transparent 0%, ${visual.sea}99 40%, ${visual.sea} 100%)`, borderRadius: "60% 60% 0 0 / 20% 20% 0 0" }} />
      {/* Sand/jord i bunden */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "28%", background: `linear-gradient(180deg, ${visual.sand}cc 0%, ${visual.sand} 100%)` }} />
      {/* Accent-detalje (palmer, klippeformationer osv.) */}
      <div style={{ position: "absolute", bottom: "24%", left: "15%", width: 6, height: 40, background: visual.accent, borderRadius: 3 }} />
      <div style={{ position: "absolute", bottom: "24%", left: "12%", width: 6, height: 30, background: visual.accent, borderRadius: 3 }} />
      <div style={{ position: "absolute", bottom: "24%", right: "20%", width: 4, height: 50, background: `${visual.accent}aa`, borderRadius: 3 }} />
      {/* Stor emoji centreret */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={{ fontSize: 48, lineHeight: 1, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }}>{visual.emoji}</div>
        <div style={{ fontSize: 11, color: "#fff", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{visual.label}</div>
      </div>
    </div>
  );
}

function VibeQuestion({ question, options, current, onSelect }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 14, color: "#1a1a18", fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>{question}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map(opt => {
          const on = current === opt.v;
          return (
            <button key={opt.v} onClick={() => onSelect(opt.v)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `1.5px solid ${on ? "#b85c2a" : "#ede8e0"}`, background: on ? "#fdf3ec" : "#fff", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: on ? 500 : 400, color: on ? "#b85c2a" : "#1a1a18", marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: "#b0a898" }}>{opt.sub}</div>
              </div>
              <div style={{ marginLeft: "auto", width: 18, height: 18, border: `2px solid ${on ? "#b85c2a" : "#d8d0c4"}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {on && <div style={{ width: 8, height: 8, background: "#b85c2a", borderRadius: "50%" }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


function StepButton({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ marginTop: 32, width: "100%", padding: "16px", background: "#1a1a18", border: "none", color: "#faf8f4", fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.01em" }}>
      {children}
    </button>
  );
}
