// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Развернуть на весь экран
tg.enableClosingConfirmation(); // Подтверждение закрытия

// Состояние приложения
let state = {
    currentCategory: 'length',
    history: JSON.parse(localStorage.getItem('conversionHistory') || '[]'),
    favorites: JSON.parse(localStorage.getItem('conversionFavorites') || '[]'),
    theme: localStorage.getItem('theme') || 'light'
};

// Единицы измерения по категориям
const units = {
    length: [
        { name: 'метр', value: 'm', factor: 1 },
        { name: 'километр', value: 'km', factor: 1000 },
        { name: 'сантиметр', value: 'cm', factor: 0.01 },
        { name: 'миллиметр', value: 'mm', factor: 0.001 },
        { name: 'миля', value: 'mile', factor: 1609.34 },
        { name: 'ярд', value: 'yard', factor: 0.9144 },
        { name: 'фут', value: 'foot', factor: 0.3048 },
        { name: 'дюйм', value: 'inch', factor: 0.0254 }
    ],
    weight: [
        { name: 'килограмм', value: 'kg', factor: 1 },
        { name: 'грамм', value: 'g', factor: 0.001 },
        { name: 'фунт', value: 'lb', factor: 0.453592 },
        { name: 'унция', value: 'oz', factor: 0.0283495 },
        { name: 'тонна', value: 'ton', factor: 1000 },
        { name: 'карат', value: 'carat', factor: 0.0002 }
    ],
    temperature: [
        { name: 'Цельсий', value: 'c' },
        { name: 'Фаренгейт', value: 'f' },
        { name: 'Кельвин', value: 'k' }
    ],
    volume: [
        { name: 'литр', value: 'l', factor: 1 },
        { name: 'миллилитр', value: 'ml', factor: 0.001 },
        { name: 'куб. метр', value: 'm3', factor: 1000 },
        { name: 'галлон', value: 'gallon', factor: 3.78541 },
        { name: 'пинта', value: 'pint', factor: 0.473176 }
    ],
    area: [
        { name: 'кв. метр', value: 'm2', factor: 1 },
        { name: 'кв. километр', value: 'km2', factor: 1000000 },
        { name: 'гектар', value: 'ha', factor: 10000 },
        { name: 'акр', value: 'acre', factor: 4046.86 },
        { name: 'сотка', value: 'sotka', factor: 100 }
    ],
    speed: [
        { name: 'метр/сек', value: 'm/s', factor: 1 },
        { name: 'километр/час', value: 'km/h', factor: 0.277778 },
        { name: 'миля/час', value: 'mph', factor: 0.44704 },
        { name: 'узел', value: 'knot', factor: 0.514444 }
    ],
    time: [
        { name: 'секунда', value: 's', factor: 1 },
        { name: 'минута', value: 'min', factor: 60 },
        { name: 'час', value: 'h', factor: 3600 },
        { name: 'день', value: 'day', factor: 86400 },
        { name: 'неделя', value: 'week', factor: 604800 }
    ],
    currency: [
        { name: 'Рубль (RUB)', value: 'RUB' },
        { name: 'Доллар (USD)', value: 'USD' },
        { name: 'Евро (EUR)', value: 'EUR' },
        { name: 'Фунт (GBP)', value: 'GBP' },
        { name: 'Йена (JPY)', value: 'JPY' }
    ]
};

// Быстрые конвертации
const quickConversions = {
    length: [
        { from: 'km', to: 'mile', label: 'км → мили' },
        { from: 'm', to: 'foot', label: 'м → футы' },
        { from: 'cm', to: 'inch', label: 'см → дюймы' }
    ],
    weight: [
        { from: 'kg', to: 'lb', label: 'кг → фунты' },
        { from: 'g', to: 'oz', label: 'г → унции' }
    ],
    temperature: [
        { from: 'c', to: 'f', label: '°C → °F' }
    ]
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    initCategoryButtons();
    loadUnits();
    updateHistory();
    updateFavorites();
    loadQuickConversions();
    
    // Автоматическая конвертация при изменении
    document.getElementById('inputValue').addEventListener('input', convert);
    document.getElementById('fromUnit').addEventListener('change', convert);
    document.getElementById('toUnit').addEventListener('change', convert);
});

// Применение темы
function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const icon = document.getElementById('theme-icon');
    icon.className = state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Переключение темы
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    applyTheme();
}

// Инициализация кнопок категорий
function initCategoryButtons() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убрать active у всех кнопок
            buttons.forEach(b => b.classList.remove('active'));
            // Добавить active текущей
            this.classList.add('active');
            
            // Обновить категорию
            const category = this.dataset.category;
            state.currentCategory = category;
            loadUnits();
            loadQuickConversions();
            convert(); // Автоконвертация
        });
    });
}

// Загрузка единиц измерения в select
function loadUnits() {
    const fromSelect = document.getElementById('fromUnit');
    const toSelect = document.getElementById('toUnit');
    const currentUnits = units[state.currentCategory] || [];
    
    // Очистить select
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Заполнить опциями
    currentUnits.forEach(unit => {
        const option1 = document.createElement('option');
        option1.value = unit.value;
        option1.textContent = unit.name;
        fromSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = unit.value;
        option2.textContent = unit.name;
        toSelect.appendChild(option2);
    });
    
    // Установить разные значения по умолчанию
    if (currentUnits.length > 1) {
        fromSelect.selectedIndex = 0;
        toSelect.selectedIndex = 1;
    }
}

// Загрузка быстрых конвертаций
function loadQuickConversions() {
    const container = document.querySelector('.quick-buttons');
    container.innerHTML = '';
    
    const conversions = quickConversions[state.currentCategory] || [];
    
    conversions.forEach(conv => {
        const button = document.createElement('button');
        button.className = 'quick-btn';
        button.textContent = conv.label;
        button.onclick = () => {
            document.getElementById('fromUnit').value = conv.from;
            document.getElementById('toUnit').value = conv.to;
            convert();
        };
        container.appendChild(button);
    });
}

// Основная функция конвертации
function convert() {
    const inputValue = parseFloat(document.getElementById('inputValue').value) || 0;
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    
    let result;
    
    // Особый случай: температура
    if (state.currentCategory === 'temperature') {
        result = convertTemperature(inputValue, fromUnit, toUnit);
    }
    // Особый случай: валюта (требуется API)
    else if (state.currentCategory === 'currency') {
        convertCurrency(inputValue, fromUnit, toUnit);
        return;
    }
    // Все остальные случаи
    else {
        result = convertStandard(inputValue, fromUnit, toUnit);
    }
    
    // Обновить поле результата
    document.getElementById('outputValue').value = result.toFixed(6).replace(/\.?0+$/, '');
    
    // Добавить в историю
    addToHistory(inputValue, fromUnit, result, toUnit);
}

// Стандартная конвертация
function convertStandard(value, from, to) {
    const currentUnits = units[state.currentCategory];
    const fromUnit = currentUnits.find(u => u.value === from);
    const toUnit = currentUnits.find(u => u.value === to);
    
    if (!fromUnit || !toUnit || !fromUnit.factor || !toUnit.factor) {
        return value;
    }
    
    // Конвертация через базовую единицу
    const inBase = value * fromUnit.factor;
    return inBase / toUnit.factor;
}

// Конвертация температуры
function convertTemperature(value, from, to) {
    let celsius;
    
    // Конвертация в Цельсии
    switch (from) {
        case 'c':
            celsius = value;
            break;
        case 'f':
            celsius = (value - 32) * 5/9;
            break;
        case 'k':
            celsius = value - 273.15;
            break;
        default:
            return value;
    }
    
    // Конвертация из Цельсиев
    switch (to) {
        case 'c':
            return celsius;
        case 'f':
            return (celsius * 9/5) + 32;
        case 'k':
            return celsius + 273.15;
        default:
            return value;
    }
}

// Конвертация валют (упрощенная, нужен реальный API)
async function convertCurrency(value, from, to) {
    // Здесь должен быть реальный API
    // Для примера - статические курсы
    const rates = {
        'USD': { 'RUB': 90, 'EUR': 0.92, 'GBP': 0.79, 'JPY': 148 },
        'EUR': { 'RUB': 98, 'USD': 1.09, 'GBP': 0.86, 'JPY': 161 },
        'RUB': { 'USD': 0.011, 'EUR': 0.0102, 'GBP': 0.0088, 'JPY': 1.64 }
    };
    
    if (from === to) {
        document.getElementById('outputValue').value = value.toFixed(2);
        return;
    }
    
    let result;
    if (rates[from] && rates[from][to]) {
        result = value * rates[from][to];
    } else if (rates[to] && rates[to][from]) {
        result = value / rates[to][from];
    } else {
        result = value;
        showModal('Курс для данной валюты не найден');
    }
    
    document.getElementById('outputValue').value = result.toFixed(2);
    addToHistory(value, from, result, to);
}

// Поменять единицы местами
function swapUnits() {
    const fromSelect = document.getElementById('fromUnit');
    const toSelect = document.getElementById('toUnit');
    
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;
    
    convert();
}

// Сброс конвертера
function resetConverter() {
    document.getElementById('inputValue').value = '';
    document.getElementById('outputValue').value = '';
    document.getElementById('fromUnit').selectedIndex = 0;
    document.getElementById('toUnit').selectedIndex = 1;
}

// Добавить в историю
function addToHistory(value, from, result, to) {
    const conversion = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        value,
        from,
        result,
        to,
        category: state.currentCategory
    };
    
    state.history.unshift(conversion);
    if (state.history.length > 10) {
        state.history.pop();
    }
    
    localStorage.setItem('conversionHistory', JSON.stringify(state.history));
    updateHistory();
}

// Обновить список истории
function updateHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';
    
    if (state.history.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">История пуста</p>';
        return;
    }
    
    state.history.slice(0, 5).forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const fromUnit = units[item.category]?.find(u => u.value === item.from)?.name || item.from;
        const toUnit = units[item.category]?.find(u => u.value === item.to)?.name || item.to;
        
        div.innerHTML = `
            <div>
                <strong>${item.value} ${fromUnit}</strong>
                <div style="font-size: 0.9em; color: var(--text-secondary)">
                    → ${item.result.toFixed(4)} ${toUnit}
                </div>
            </div>
            <div>
                <small>${item.date.split(' ')[1]}</small>
                <button onclick="addToFavorites(${item.id})" style="background: none; border: none; color: var(--warning-color); cursor: pointer;">
                    <i class="fas fa-star"></i>
                </button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// Добавить в избранное
function addToFavorites(id) {
    const item = state.history.find(h => h.id === id);
    if (!item) return;
    
    if (!state.favorites.some(f => f.id === id)) {
        state.favorites.unshift(item);
        localStorage.setItem('conversionFavorites', JSON.stringify(state.favorites));
        updateFavorites();
        showModal('Добавлено в избранное');
    } else {
        showModal('Уже в избранном');
    }
}

// Обновить список избранного
function updateFavorites() {
    const container = document.getElementById('favoritesList');
    container.innerHTML = '';
    
    if (state.favorites.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Нет избранных</p>';
        return;
    }
    
    state.favorites.slice(0, 5).forEach(item => {
        const div = document.createElement('div');
        div.className = 'favorite-item';
        
        const fromUnit = units[item.category]?.find(u => u.value === item.from)?.name || item.from;
        const toUnit = units[item.category]?.find(u => u.value === item.to)?.name || item.to;
        
        div.innerHTML = `
            <div>
                <strong>${item.value} ${fromUnit} → ${toUnit}</strong>
                <div style="font-size: 0.9em; color: var(--text-secondary)">
                    ${item.result.toFixed(4)} ${toUnit}
                </div>
            </div>
            <button onclick="useFavorite(${item.id})" style="background: var(--primary-color); color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer;">
                Использовать
            </button>
        `;
        
        container.appendChild(div);
    });
}

// Использовать избранное
function useFavorite(id) {
    const item = state.favorites.find(f => f.id === id);
    if (!item) return;
    
    // Найти нужную категорию
    const categoryBtn = document.querySelector(`[data-category="${item.category}"]`);
    if (categoryBtn) {
        categoryBtn.click();
    }
    
    // Установить значения
    setTimeout(() => {
        document.getElementById('inputValue').value = item.value;
        document.getElementById('fromUnit').value = item.from;
        document.getElementById('toUnit').value = item.to;
        convert();
    }, 100);
}

// Очистить историю
function clearHistory() {
    if (confirm('Очистить всю историю?')) {
        state.history = [];
        localStorage.removeItem('conversionHistory');
        updateHistory();
    }
}

// Отправить результат в Telegram
function sendToTelegram() {
    const inputValue = document.getElementById('inputValue').value;
    const fromUnit = document.getElementById('fromUnit').value;
    const outputValue = document.getElementById('outputValue').value;
    const toUnit = document.getElementById('toUnit').value;
    
    const fromName = units[state.currentCategory]?.find(u => u.value === fromUnit)?.name || fromUnit;
    const toName = units[state.currentCategory]?.find(u => u.value === toUnit)?.name || toUnit;
    
    const data = {
        action: 'conversion',
        value: parseFloat(inputValue),
        fromUnit: fromName,
        convertedValue: parseFloat(outputValue),
        toUnit: toName,
        category: state.currentCategory,
        timestamp: new Date().toISOString()
    };
    
    tg.sendData(JSON.stringify(data));
    showModal('Результат отправлен в Telegram!');
}

// Показать модальное окно
function showModal(text) {
    document.getElementById('modalText').textContent = text;
    document.getElementById('infoModal').style.display = 'flex';
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('infoModal').style.display = 'none';
}

// Закрыть по клику вне окна
window.onclick = function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target === modal) {
        closeModal();
    }
};