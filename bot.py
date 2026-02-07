import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import WebAppInfo, ReplyKeyboardMarkup, KeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import config

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация бота
bot = Bot(token=config.BOT_TOKEN)
dp = Dispatcher()

# ========== КОМАНДЫ БОТА ==========

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработчик команды /start"""
    welcome_text = """
    🧮 *Конвертер величин*
    
    Выберите действие:
    • /converter - Открыть конвертер
    • /categories - Категории величин
    • /help - Справка
    • /history - История конвертаций
    """
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Открыть конвертер", web_app=WebAppInfo(url=config.WEB_APP_URL))],
            [KeyboardButton(text="📊 Категории"), KeyboardButton(text="❓ Помощь")],
            [KeyboardButton(text="📜 История"), KeyboardButton(text="⭐ Избранное")]
        ],
        resize_keyboard=True,
        input_field_placeholder="Выберите действие..."
    )
    
    await message.answer(welcome_text, parse_mode="Markdown", reply_markup=keyboard)

@dp.message(Command("converter"))
async def cmd_converter(message: types.Message):
    """Открытие конвертера через inline-кнопку"""
    builder = InlineKeyboardBuilder()
    builder.button(
        text="🚀 Открыть конвертер",
        web_app=WebAppInfo(url=config.WEB_APP_URL)
    )
    
    await message.answer(
        "Нажмите кнопку ниже, чтобы открыть конвертер величин:",
        reply_markup=builder.as_markup()
    )

@dp.message(Command("categories"))
async def cmd_categories(message: types.Message):
    """Список категорий конвертации"""
    categories_text = """
    📁 *Категории величин:*
    
    🔹 *Длина*
    • Метры ↔ Километры
    • Мили ↔ Футы
    • Дюймы ↔ Сантиметры
    
    🔹 *Вес*
    • Килограммы ↔ Фунты
    • Граммы ↔ Унции
    • Тонны ↔ Караты
    
    🔹 *Температура*
    • Цельсий ↔ Фаренгейт
    • Цельсий ↔ Кельвин
    
    🔹 *Скорость*
    • км/ч ↔ м/с
    • мили/ч ↔ узлы
    
    🔹 *Объём*
    • Литр ↔ Галлон
    • Куб. метр ↔ Куб. фут
    
    🔹 *Площадь*
    • кв. метр ↔ гектар
    • акр ↔ сотка
    
    🔹 *Время*
    • Секунды ↔ Часы
    • Дни ↔ Недели
    """
    
    await message.answer(categories_text, parse_mode="Markdown")

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    """Справка по использованию"""
    help_text = """
    ❓ *Как пользоваться конвертером:*
    
    1. Нажмите кнопку *"📱 Открыть конвертер"*
    2. Выберите категорию величин
    3. Выберите единицы измерения
    4. Введите значение
    5. Получите результат мгновенно!
    
    *Особенности:*
    • История последних конвертаций
    • Избранные конвертации
    • Быстрый доступ к частым операциям
    • Поддержка научных вычислений
    
    *Команды бота:*
    /start - Главное меню
    /converter - Открыть конвертер
    /categories - Категории величин
    /history - История конвертаций
    /help - Эта справка
    """
    
    await message.answer(help_text, parse_mode="Markdown")

@dp.message(F.text == "📊 Категории")
async def button_categories(message: types.Message):
    await cmd_categories(message)

@dp.message(F.text == "❓ Помощь")
async def button_help(message: types.Message):
    await cmd_help(message)

# ========== WEB APP DATA HANDLER ==========

@dp.message(F.web_app_data)
async def handle_web_app_data(message: types.Message):
    """Обработка данных из мини-приложения"""
    try:
        data = message.web_app_data.data
        # data - строка JSON от веб-приложения
        
        import json
        result = json.loads(data)
        
        response_text = f"""
        📊 *Результат конвертации:*
        
        *Входные данные:*
        {result.get('value', 0)} {result.get('fromUnit', '')}
        
        *Результат:*
        {result.get('convertedValue', 0):.6f} {result.get('toUnit', '')}
        
        *Операция:*
        {result.get('category', 'Общая')} → {result.get('type', 'Конвертация')}
        """
        
        await message.answer(response_text, parse_mode="Markdown")
        
        # Можно сохранить в историю
        logger.info(f"Конвертация: {result}")
        
    except Exception as e:
        logger.error(f"Ошибка обработки web app data: {e}")
        await message.answer("❌ Произошла ошибка при обработке данных")

# ========== ОБРАБОТЧИК ТЕКСТОВЫХ СООБЩЕНИЙ ==========

@dp.message()
async def handle_other_messages(message: types.Message):
    """Обработчик прочих сообщений"""
    if message.text == "📜 История":
        await message.answer("🔄 История загружается...")
        # Здесь можно реализовать загрузку истории
    elif message.text == "⭐ Избранное":
        await message.answer("⭐ Избранные конвертации:\n\n1. км → мили\n2. кг → фунты")
    else:
        await message.answer("Используйте кнопки меню или команды")

# ========== ЗАПУСК БОТА ==========

async def main():
    logger.info("Бот запущен")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())