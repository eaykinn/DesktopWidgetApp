const { ipcRenderer } = require('electron');

document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('close-widget', 'weather');
});

const searchInput = document.getElementById('city-search');
const searchResults = document.getElementById('search-results');
const weatherContent = document.getElementById('weather-content');
const emptyState = document.getElementById('empty-state');
const locationNameEl = document.getElementById('location-name');
const currentTempEl = document.getElementById('current-temp');
const currentDescEl = document.getElementById('current-desc');
const currentIconContainer = document.getElementById('current-icon-container');
const forecastContainer = document.getElementById('forecast-container');

// Simple debounce
let debounceTimer;

searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();
  if (query.length < 2) {
    searchResults.classList.add('hidden');
    return;
  }
  debounceTimer = setTimeout(() => {
    fetchCities(query);
  }, 400);
});

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.add('hidden');
  }
});

async function fetchCities(query) {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    const data = await res.json();
    
    searchResults.innerHTML = '';
    
    if (data.results && data.results.length > 0) {
      data.results.forEach(city => {
        const div = document.createElement('div');
        div.textContent = `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}, ${city.country}`;
        div.addEventListener('click', (e) => {
          e.preventDefault();
          searchInput.value = '';
          searchResults.classList.add('hidden');
          fetchWeather(city);
        });
        searchResults.appendChild(div);
      });
      searchResults.classList.remove('hidden');
    } else {
      searchResults.innerHTML = '<div style="padding: 10px 15px; color: var(--text-secondary);">No results found</div>';
      searchResults.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Failed to fetch cities', err);
  }
}

async function fetchWeather(city) {
  emptyState.classList.add('hidden');
  weatherContent.classList.remove('hidden');
  locationNameEl.textContent = city.name;
  currentTempEl.textContent = '...';
  currentDescEl.textContent = 'Fetching data...';
  forecastContainer.innerHTML = '';
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean&timezone=auto&forecast_days=5`;
    const res = await fetch(url);
    const data = await res.json();
    
    const current = data.current;
    const daily = data.daily;
    
    // Update current
    currentTempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    const wInfo = getWeatherInfo(current.weather_code);
    currentDescEl.textContent = wInfo.desc;
    currentIconContainer.innerHTML = wInfo.svg;
    
    // Update 5 day forecast
    for (let i = 0; i < daily.time.length; i++) {
      const dateStr = daily.time[i]; // e.g. "2023-08-10"
      const dateObj = new Date(dateStr);
      // "Today" for index 0
      const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      
      const max = Math.round(daily.temperature_2m_max[i]);
      const min = Math.round(daily.temperature_2m_min[i]);
      const avg = Math.round(daily.temperature_2m_mean[i]);
      const icon = getWeatherInfo(daily.weather_code[i]).svgSmall;
      
      const row = document.createElement('div');
      row.className = 'forecast-item';
      row.innerHTML = `
        <span style="width: 40px; font-weight: bold; font-size: 13px;">${dayName}</span>
        <div style="width: 24px; height: 24px; color: var(--accent-blue);">${icon}</div>
        <div style="flex: 1; text-align: right; display: flex; justify-content: flex-end; gap: 8px; font-size: 13px;">
          <span style="color: var(--text-secondary);" title="Min">↓${min}°</span>
          <span style="color: var(--text-primary); font-weight: 500;" title="Avg">~${avg}°</span>
          <span style="color: #f87171;" title="Max">↑${max}°</span>
        </div>
      `;
      forecastContainer.appendChild(row);
    }
    
  } catch (err) {
    console.error(err);
    currentDescEl.textContent = 'Error loading data';
  }
}

function getWeatherInfo(code) {
  // WMO Weather interpretation codes
  // 0: Clear
  // 1,2,3: Cloudy
  // 45,48: Fog
  // 51-67: Rain/Drizzle
  // 71-77: Snow
  // 95-99: Thunderstorm
  
  const icons = {
    clear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    cloudy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
    rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>`,
    snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><line x1="8" y1="15" x2="16" y2="15"></line><line x1="8" y1="9" x2="16" y2="9"></line><line x1="12" y1="2" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"></line></svg>`,
    fog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M4 14h16"></path><path d="M4 18h16"></path><path d="M4 22h16"></path><path d="M4 10h16"></path><path d="M4 6h16"></path></svg>`,
    thunder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
  };

  let desc = 'Clear';
  let svg = icons.clear;

  if (code === 0) { desc = 'Clear sky'; svg = icons.clear; }
  else if (code <= 3) { desc = 'Cloudy'; svg = icons.cloudy; }
  else if (code === 45 || code === 48) { desc = 'Fog'; svg = icons.fog; }
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { desc = 'Rain'; svg = icons.rain; }
  else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) { desc = 'Snow'; svg = icons.snow; }
  else if (code >= 95) { desc = 'Thunderstorm'; svg = icons.thunder; }

  return { desc, svg, svgSmall: svg };
}
