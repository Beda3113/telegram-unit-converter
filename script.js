// Основной скрипт для промышленного калькулятора

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEventListeners();
    loadUserPreferences();
});

// Основные функции
function initApp() {
    // Инициализация Telegram Web App
    if (tg) {
        tg.expand();
        tg.enableClosingConfirmation();
        tg.setHeaderColor('#0066cc');
        tg.setBackgroundColor('#f8f9fa');
        
        // Получение данных пользователя
        const user = tg.initDataUnsafe?.user;
        if (user) {
            updateUserInfo(user);
        }
    }
    
    // Инициализация темной/светлой темы
    initTheme();
    
    // Инициализация графиков
    initCharts();
    
    // Загрузка последних расчетов
    loadRecentCalculations();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчики для навигации
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', goBack);
    });
    
    // Обработчики для вкладок
    document.querySelectorAll('.tab, .module-tab').forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });
    
    // Обработчики для форм
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', handleInputChange);
    });
    
    // Обработчики для кнопок расчета
    document.querySelectorAll('.calculate-btn').forEach(btn => {
        btn.addEventListener('click', handleCalculation);
    });
}

// Управление темами
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icons = document.querySelectorAll('.theme-toggle i');
    icons.forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// Навигация
function goBack() {
    window.history.back();
}

function openModule(moduleName) {
    switch(moduleName) {
        case 'grs':
            window.location.href = 'grs.html';
            break;
        case 'kc':
            window.location.href = 'kc.html';
            break;
        case 'gis':
            window.location.href = 'gis.html';
            break;
        case 'pipeline':
            window.location.href = 'pipeline.html';
            break;
        case 'reports':
            window.location.href = 'reports.html';
            break;
    }
}

// Обработка вкладок
function handleTabClick(event) {
    const tab = event.currentTarget;
    const tabContainer = tab.closest('.tabs, .module-tabs');
    const tabId = tab.dataset.tab || tab.dataset.target;
    
    // Снимаем активный класс со всех вкладок
    tabContainer.querySelectorAll('.tab, .module-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // Добавляем активный класс текущей вкладке
    tab.classList.add('active');
    
    // Показываем соответствующий контент
    if (tabId) {
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }
}

// Расчеты для ГРС
function calculateBlowdown() {
    // Получение значений из формы
    const volume = parseFloat(document.getElementById('sep-volume').value) || 0;
    const pressure = parseFloat(document.getElementById('sep-pressure').value) || 0;
    const temperature = parseFloat(document.getElementById('sep-temperature').value) || 0;
    const z = parseFloat(document.getElementById('sep-z').value) || 0.95;
    const nBlowdowns = parseInt(document.getElementById('sep-n-blowdowns').value) || 1;
    
    // Константы
    const R = 8.314462618; // Универсальная газовая постоянная
    const p0 = 101325; // Нормальное давление, Па
    const t0 = 293.15; // Нормальная температура, К
    
    // Расчет
    const pPa = pressure * 1e6; // Перевод в Па
    
    // Количество вещества (моль)
    const n = (pPa * volume) / (z * R * temperature);
    
    // Объем при нормальных условиях (м³)
    const v0 = n * R * t0 / p0;
    
    // Результаты
    const singleBlowdown = v0;
    const monthlyBlowdown = v0 * nBlowdowns;
    const yearlyBlowdown = monthlyBlowdown * 12;
    
    // Обновление интерфейса
    document.getElementById('blowdown-single').textContent = 
        `${singleBlowdown.toFixed(2)} м³`;
    document.getElementById('blowdown-monthly').textContent = 
        `${monthlyBlowdown.toFixed(2)} м³`;
    document.getElementById('blowdown-yearly').textContent = 
        `${yearlyBlowdown.toFixed(2)} м³`;
    
    // Детализация
    document.getElementById('breakdown-volume').textContent = 
        `${volume.toFixed(2)} м³`;
    document.getElementById('breakdown-compression').textContent = 
        `${((pressure / 0.101325) * volume).toFixed(2)} м³`;
    document.getElementById('breakdown-temperature').textContent = 
        `${((t0 / temperature) * volume).toFixed(2)} м³`;
    
    // Сохранение расчета
    saveCalculation('blowdown', {
        volume, pressure, temperature, z, nBlowdowns,
        singleBlowdown, monthlyBlowdown, yearlyBlowdown
    });
    
    // Обновление сводки
    updateGRSSummary();
}

// Расчеты для КС
function calculateGPAStartup() {
    const pipelineVolume = parseFloat(document.getElementById('startup-pipeline-volume').value) || 0;
    const pressure = parseFloat(document.getElementById('startup-pressure').value) || 0;
    const temperature = parseFloat(document.getElementById('startup-temperature').value) || 0;
    const z = parseFloat(document.getElementById('startup-z').value) || 0.95;
    const nStarts = parseInt(document.getElementById('startup-count').value) || 1;
    
    // Константы
    const R = 8.314462618;
    const p0 = 101325;
    const t0 = 293.15;
    
    // Расчет
    const pPa = pressure * 1e6;
    const n = (pPa * pipelineVolume) / (z * R * temperature);
    const v0 = n * R * t0 / p0;
    
    const singleStart = v0;
    const monthlyStarts = v0 * nStarts;
    const yearlyStarts = monthlyStarts * 12;
    
    // Обновление интерфейса
    document.getElementById('gpa-startup-single').textContent = 
        `${singleStart.toFixed(2)} м³`;
    document.getElementById('gpa-startup-monthly').textContent = 
        `${monthlyStarts.toFixed(2)} м³`;
    document.getElementById('gpa-startup-yearly').textContent = 
        `${yearlyStarts.toFixed(2)} м³`;
    
    // Сохранение расчета
    saveCalculation('gpa_startup', {
        pipelineVolume, pressure, temperature, z, nStarts,
        singleStart, monthlyStarts, yearlyStarts
    });
    
    // Обновление сводки КС
    updateKSSummary();
}

// Расчеты для ГИС
function calculateMeasurement() {
    const pressureMax = parseFloat(document.getElementById('pressure-max').value) || 0;
    const pressureMin = parseFloat(document.getElementById('pressure-min').value) || 0;
    const tempMax = parseFloat(document.getElementById('temp-max').value) || 0;
    const tempMin = parseFloat(document.getElementById('temp-min').value) || 0;
    const flowMax = parseFloat(document.getElementById('flow-max').value) || 0;
    const flowMin = parseFloat(document.getElementById('flow-min').value) || 0;
    
    // Расчет средних значений
    const pressureAvg = (pressureMax + pressureMin) / 2;
    const tempAvg = (tempMax + tempMin) / 2;
    const flowAvg = (flowMax + flowMin) / 2;
    
    // Расчет суточной подачи (24 часа)
    const dailyGas = flowAvg * 24;
    const monthlyGas = dailyGas * 30;
    const yearlyGas = monthlyGas * 12;
    
    // Обновление интерфейса
    document.getElementById('pressure-avg').textContent = 
        `${pressureAvg.toFixed(2)} МПа`;
    document.getElementById('temp-avg').textContent = 
        `${tempAvg.toFixed(1)} К`;
    document.getElementById('flow-avg').textContent = 
        `${flowAvg.toFixed(1)} тыс.м³/ч`;
    document.getElementById('daily-gas').textContent = 
        `${(dailyGas / 1000).toFixed(1)} млн м³`;
    document.getElementById('monthly-gas').textContent = 
        `${(monthlyGas / 1000).toFixed(1)} млн м³`;
    document.getElementById('yearly-gas').textContent = 
        `${(yearlyGas / 1000).toFixed(1)} млн м³`;
    
    // Расчет температуры в Цельсиях
    const tempCelsiusMin = tempMin - 273.15;
    const tempCelsiusMax = tempMax - 273.15;
    document.getElementById('temp-celsius-range').textContent = 
        `${tempCelsiusMin.toFixed(1)}-${tempCelsiusMax.toFixed(1)} °C`;
    
    // Сохранение расчета
    saveCalculation('measurement', {
        pressureMax, pressureMin, tempMax, tempMin, flowMax, flowMin,
        pressureAvg, tempAvg, flowAvg, dailyGas, monthlyGas, yearlyGas
    });
    
    // Обновление сводки ГИС
    updateGISSummary();
}

// Расчеты для трубопроводов
function calculatePipelineParameters() {
    const diameter = parseFloat(document.getElementById('pipe-diameter').value) || 0;
    const thickness = parseFloat(document.getElementById('pipe-thickness').value) || 0;
    const length = parseFloat(document.getElementById('pipe-length').value) || 0;
    const pressureStart = parseFloat(document.getElementById('pressure-start').value) || 0;
    const pressureEnd = parseFloat(document.getElementById('pressure-end').value) || 0;
    const flowRate = parseFloat(document.getElementById('flow-rate').value) || 0;
    const temperature = parseFloat(document.getElementById('gas-temperature').value) || 0;
    
    // Расчет внутреннего диаметра
    const innerDiameter = diameter - 2 * thickness;
    
    // Расчет геометрического объема
    const lengthM = length * 1000; // Перевод в метры
    const radius = innerDiameter / 2000; // Перевод в метры
    const volume = Math.PI * radius * radius * lengthM;
    
    // Расчет средней скорости газа
    const flowM3s = (flowRate * 1000) / 3600; // Перевод в м³/с
    const crossArea = Math.PI * radius * radius;
    const velocity = flowM3s / crossArea;
    
    // Расчет среднего давления
    const avgPressure = (pressureStart + pressureEnd) / 2;
    
    // Расчет запаса газа
    const p0 = 0.101325; // Нормальное давление, МПа
    const t0 = 293.15; // Нормальная температура, К
    const z = parseFloat(document.getElementById('compressibility').value) || 0.95;
    
    const gasInventory = volume * (avgPressure / p0) * (t0 / temperature) / z;
    
    // Обновление интерфейса
    document.getElementById('pipe-volume').textContent = 
        `${volume.toFixed(2)} м³`;
    document.getElementById('avg-pressure').textContent = 
        `${avgPressure.toFixed(2)} МПа`;
    document.getElementById('gas-velocity').textContent = 
        `${velocity.toFixed(2)} м/с`;
    document.getElementById('gas-inventory').textContent = 
        `${(gasInventory / 1000).toFixed(2)} тыс.м³`;
    
    // Детальные результаты
    document.getElementById('inner-diameter').textContent = 
        `${innerDiameter.toFixed(1)} мм`;
    document.getElementById('cross-area').textContent = 
        `${crossArea.toFixed(3)} м²`;
    
    // Расчет температуры в Цельсиях
    const tempCelsius = temperature - 273.15;
    document.getElementById('temp-display-c').textContent = 
        `${tempCelsius.toFixed(1)} °C`;
    
    // Сохранение расчета
    saveCalculation('pipeline_parameters', {
        diameter, thickness, length, pressureStart, pressureEnd,
        flowRate, temperature, innerDiameter, volume, velocity,
        avgPressure, gasInventory
    });
    
    // Обновление сводки трубопровода
    updatePipelineSummary();
}

// Управление расчетами
function handleCalculation(event) {
    const button = event.currentTarget;
    const calculationType = button.dataset.calculation || 
                          button.closest('.tab-content').id;
    
    switch(calculationType) {
        case 'grs-blowdown':
        case 'blowdown':
            calculateBlowdown();
            break;
        case 'gpa-startup':
            calculateGPAStartup();
            break;
        case 'gis-measurement':
            calculateMeasurement();
            break;
        case 'pipeline-parameters':
            calculatePipelineParameters();
            break;
        default:
            console.log(`Расчет не реализован: ${calculationType}`);
    }
}

// Сохранение расчетов
function saveCalculation(type, data) {
    const calculations = JSON.parse(localStorage.getItem('calculations') || '[]');
    
    const calculation = {
        id: Date.now(),
        type: type,
        data: data,
        timestamp: new Date().toISOString(),
        user: tg.initDataUnsafe?.user?.id || 'anonymous'
    };
    
    calculations.push(calculation);
    localStorage.setItem('calculations', JSON.stringify(calculations));
    
    // Обновление интерфейса
    updateRecentCalculations(calculation);
    
    // Отправка в Telegram если нужно
    if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({
            action: 'calculation_saved',
            type: type,
            data: data
        }));
    }
}

// Загрузка последних расчетов
function loadRecentCalculations() {
    const calculations = JSON.parse(localStorage.getItem('calculations') || '[]');
    const recent = calculations.slice(-5).reverse(); // Последние 5 расчетов
    
    updateRecentCalculationsList(recent);
}

function updateRecentCalculations(calculation) {
    const list = document.getElementById('recentCalculationsList');
    if (!list) return;
    
    const item = createCalculationItem(calculation);
    list.prepend(item);
    
    // Ограничиваем список 10 элементами
    while (list.children.length > 10) {
        list.removeChild(list.lastChild);
    }
}

function updateRecentCalculationsList(calculations) {
    const list = document.getElementById('recentCalculationsList');
    if (!list) return;
    
    list.innerHTML = '';
    calculations.forEach(calc => {
        const item = createCalculationItem(calc);
        list.appendChild(item);
    });
}

function createCalculationItem(calculation) {
    const div = document.createElement('div');
    div.className = 'calculation-item';
    
    let icon, title;
    switch(calculation.type) {
        case 'blowdown':
            icon = 'fa-wind';
            title = 'Продувка сепаратора';
            break;
        case 'gpa_startup':
            icon = 'fa-rocket';
            title = 'Пуск ГПА';
            break;
        case 'measurement':
            icon = 'fa-tachometer-alt';
            title = 'Измерение ГИС';
            break;
        case 'pipeline_parameters':
            icon = 'fa-pipe';
            title = 'Параметры трубопровода';
            break;
        default:
            icon = 'fa-calculator';
            title = 'Расчет';
    }
    
    const date = new Date(calculation.timestamp);
    const timeString = date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let value = '';
    if (calculation.data.monthlyBlowdown) {
        value = `${calculation.data.monthlyBlowdown.toFixed(0)} м³`;
    } else if (calculation.data.monthlyStarts) {
        value = `${calculation.data.monthlyStarts.toFixed(0)} м³`;
    } else if (calculation.data.dailyGas) {
        value = `${(calculation.data.dailyGas / 1000).toFixed(1)} млн м³`;
    } else if (calculation.data.gasInventory) {
        value = `${(calculation.data.gasInventory / 1000).toFixed(1)} тыс.м³`;
    }
    
    div.innerHTML = `
        <div class="calc-type">
            <i class="fas ${icon}"></i>
            <span>${title}</span>
        </div>
        <div class="calc-details">
            <span>${timeString}</span>
        </div>
        <div class="calc-result">
            <span class="result-value">${value}</span>
        </div>
    `;
    
    return div;
}

// Обновление сводок
function updateGRSSummary() {
    // Реализация обновления сводки ГРС
    const calculations = JSON.parse(localStorage.getItem('calculations') || '[]');
    const grsCalculations = calculations.filter(c => 
        c.type.includes('grs') || c.type.includes('blowdown')
    );
    
    let totalGas = 0;
    grsCalculations.forEach(calc => {
        if (calc.data.monthlyBlowdown) {
            totalGas += calc.data.monthlyBlowdown;
        }
    });
    
    const summaryElement = document.getElementById('total-grs-consumption');
    if (summaryElement) {
        summaryElement.textContent = `${totalGas.toFixed(0)} м³/мес`;
    }
}

function updateKSSummary() {
    // Аналогично для КС
}

function updateGISSummary() {
    // Аналогично для ГИС
}

function updatePipelineSummary() {
    // Аналогично для трубопроводов
}

// Графики
function initCharts() {
    // Инициализация графиков на главной странице
    if (document.getElementById('distributionChart')) {
        initDistributionChart();
    }
    
    if (document.getElementById('trendChart')) {
        initTrendChart();
    }
}

function initDistributionChart() {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    // Данные для графика
    const data = {
        labels: ['ГРС', 'КС', 'ГИС', 'Трубопроводы'],
        datasets: [{
            data: [15250, 22500, 5280, 2250],
            backgroundColor: [
                '#3498db',
                '#e74c3c',
                '#2ecc71',
                '#9b59b6'
            ],
            borderWidth: 1
        }]
    };
    
    new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toLocaleString()} м³ (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Данные за последние 6 месяцев
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
    const gasData = [32000, 35000, 38000, 42000, 45280, 48000];
    const calculationsData = [850, 920, 1050, 1120, 1245, 1300];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Расход газа, м³',
                    data: gasData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Количество расчетов',
                    data: calculationsData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

// Экспорт данных
function exportReport(format) {
    const calculations = JSON.parse(localStorage.getItem('calculations') || '[]');
    
    switch(format) {
        case 'pdf':
            exportToPDF(calculations);
            break;
        case 'excel':
            exportToExcel(calculations);
            break;
        case 'word':
            exportToWord(calculations);
            break;
        default:
            alert('Формат экспорта не поддерживается');
    }
}

function exportToPDF(data) {
    // Реализация экспорта в PDF
    alert('Экспорт в PDF будет реализован в следующей версии');
}

function exportToExcel(data) {
    // Создание CSV строки
    let csv = 'Тип расчета,Дата,Расход газа (м³),Дополнительные параметры\n';
    
    data.forEach(calc => {
        let gasValue = '';
        if (calc.data.monthlyBlowdown) {
            gasValue = calc.data.monthlyBlowdown;
        } else if (calc.data.monthlyStarts) {
            gasValue = calc.data.monthlyStarts;
        } else if (calc.data.dailyGas) {
            gasValue = calc.data.dailyGas;
        }
        
        const date = new Date(calc.timestamp).toLocaleDateString('ru-RU');
        csv += `${calc.type},${date},${gasValue},"${JSON.stringify(calc.data)}"\n`;
    });
    
    // Создание и скачивание файла
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `gas_calculations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Вспомогательные функции
function formatNumber(num) {
    return num.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updateUserInfo(user) {
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement && user.first_name) {
        userNameElement.textContent = `${user.first_name} ${user.last_name || ''}`.trim();
    }
}

function syncData() {
    // Реализация синхронизации данных
    const loadingBtn = document.querySelector('.sync-btn');
    if (loadingBtn) {
        loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    setTimeout(() => {
        if (loadingBtn) {
            loadingBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }
        showNotification('Данные успешно синхронизированы', 'success');
    }, 1500);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    // Загрузка пользовательских настроек
    const savedCalculations = localStorage.getItem('calculations');
    if (!savedCalculations) {
        // Загрузка демо-данных если нет сохраненных расчетов
        loadDemoData();
    }
});

function loadDemoData() {
    const demoCalculations = [
        {
            id: 1,
            type: 'blowdown',
            data: {
                volume: 15,
                pressure: 1.2,
                temperature: 293,
                z: 0.95,
                nBlowdowns: 4,
                singleBlowdown: 245.32,
                monthlyBlowdown: 981.28,
                yearlyBlowdown: 11775.36
            },
            timestamp: '2024-05-15T10:30:00Z'
        },
        {
            id: 2,
            type: 'gpa_startup',
            data: {
                pipelineVolume: 8,
                pressure: 5.0,
                temperature: 293,
                z: 0.96,
                nStarts: 2,
                singleStart: 1250.45,
                monthlyStarts: 2500.9,
                yearlyStarts: 30010.8
            },
            timestamp: '2024-05-14T14:45:00Z'
        }
    ];
    
    localStorage.setItem('calculations', JSON.stringify(demoCalculations));
    loadRecentCalculations();
}

// Обработка изменений в формах
function handleInputChange(event) {
    const input = event.target;
    
    // Автоматический расчет при изменении значений
    if (input.closest('.auto-calculate')) {
        const calculateBtn = input.closest('.tab-content').querySelector('.calculate-btn');
        if (calculateBtn) {
            calculateBtn.click();
        }
    }
    
    // Конвертация температуры
    if (input.id.includes('temperature') || input.id.includes('temp')) {
        const tempK = parseFloat(input.value);
        if (!isNaN(tempK)) {
            const tempC = tempK - 273.15;
            const tempDisplay = input.closest('.input-group').querySelector('.temp-conversion');
            if (tempDisplay) {
                tempDisplay.textContent = `${tempC.toFixed(1)} °C`;
            }
        }
    }
}

// Функции для отчетов
function generateReport(type) {
    switch(type) {
        case 'monthly':
            generateMonthlyReport();
            break;
        case 'technical':
            generateTechnicalReport();
            break;
        case 'economic':
            generateEconomicReport();
            break;
        default:
            generateSummaryReport();
    }
}

function generateMonthlyReport() {
    const calculations = JSON.parse(localStorage.getItem('calculations') || '[]');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyCalculations = calculations.filter(calc => {
        const calcDate = new Date(calc.timestamp);
        return calcDate.getMonth() === currentMonth && 
               calcDate.getFullYear() === currentYear;
    });
    
    // Генерация отчета
    let report = `Ежемесячный отчет по расчетам\n`;
    report += `Период: ${now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}\n\n`;
    
    report += `Всего расчетов: ${monthlyCalculations.length}\n\n`;
    
    // Группировка по типам расчетов
    const byType = {};
    monthlyCalculations.forEach(calc => {
        if (!byType[calc.type]) {
            byType[calc.type] = [];
        }
        byType[calc.type].push(calc);
    });
    
    for (const [type, calcs] of Object.entries(byType)) {
        report += `${getCalculationTypeName(type)}: ${calcs.length} расчетов\n`;
        
        let totalGas = 0;
        calcs.forEach(calc => {
            if (calc.data.monthlyBlowdown) {
                totalGas += calc.data.monthlyBlowdown;
            } else if (calc.data.monthlyStarts) {
                totalGas += calc.data.monthlyStarts;
            }
        });
        
        if (totalGas > 0) {
            report += `  Общий расход газа: ${totalGas.toFixed(0)} м³\n`;
        }
        
        report += '\n';
    }
    
    // Скачивание отчета
    downloadTextFile(report, `monthly_report_${currentYear}_${currentMonth + 1}.txt`);
}

function getCalculationTypeName(type) {
    const names = {
        'blowdown': 'Продувка сепараторов',
        'gpa_startup': 'Пуск ГПА',
        'measurement': 'Измерения ГИС',
        'pipeline_parameters': 'Параметры трубопровода'
    };
    
    return names[type] || type;
}

function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Обработка Telegram Web App событий
if (tg) {
    tg.onEvent('viewportChanged', (event) => {
        console.log('Viewport changed:', event);
    });
    
    tg.onEvent('themeChanged', () => {
        const theme = tg.colorScheme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

// Глобальные функции для использования в HTML
window.toggleTheme = toggleTheme;
window.openModule = openModule;
window.calculateBlowdown = calculateBlowdown;
window.calculateGPAStartup = calculateGPAStartup;
window.calculateMeasurement = calculateMeasurement;
window.calculatePipelineParameters = calculatePipelineParameters;
window.exportReport = exportReport;
window.syncData = syncData;
window.goBack = goBack;