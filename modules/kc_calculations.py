"""
Модуль расчетов для компрессорных станций
СТО Газпром 3.3-2-1
"""

import math

class KCCalculator:
    """Калькулятор для компрессорных станций"""
    
    def __init__(self):
        self.R = 8.314462618
    
    # ========== ПУСКОВЫЕ ОПЕРАЦИИ ГПА ==========
    
    def gpa_startup(self, pipeline_volume: float, pressure: float,
                   temperature: float, z: float = 0.95,
                   n_starts: int = 1) -> float:
        """
        3.1 Количество газа, израсходованного на один пуск ГПА
        
        Args:
            pipeline_volume: Объем пускового газопровода, м³
            pressure: Давление пускового газа, МПа
            temperature: Температура, К
            z: Коэффициент сжимаемости
            n_starts: Количество пусков
        
        Returns:
            Расход газа, м³
        """
        # Количество вещества
        p_pa = pressure * 1e6
        n = (p_pa * pipeline_volume) / (z * self.R * temperature)
        
        # Объем при н.у.
        v0 = n * self.R * 293.15 / 101325
        
        return v0 * n_starts
    
    def compressor_venting(self, circuit_volume: float, pressure: float,
                         venting_percentage: float = 0.1) -> float:
        """
        3.2 Количество газа, стравливаемого из контура нагнетателя
        
        Args:
            circuit_volume: Объем контура, м³
            pressure: Рабочее давление, МПа
            venting_percentage: Доля стравливаемого газа
        
        Returns:
            Объем стравленного газа, м³
        """
        # Объем газа в контуре при рабочих условиях
        gas_volume = circuit_volume * (pressure / 0.101325)
        
        # Стравливаемый объем
        vented_volume = gas_volume * venting_percentage
        
        return vented_volume
    
    def air_displacement(self, system_volume: float, purge_pressure: float,
                        n_purges: int = 1) -> float:
        """
        3.3 Количество газа, использованного на вытеснение воздуха
        
        Args:
            system_volume: Объем системы, м³
            purge_pressure: Давление продувки, МПа
            n_purges: Количество продувок
        
        Returns:
            Расход газа, м³
        """
        # Объем газа для продувки (3 объема системы)
        gas_volume = 3 * system_volume * (purge_pressure / 0.101325)
        
        return gas_volume * n_purges
    
    # ========== ТЕХНИЧЕСКОЕ ОБСЛУЖИВАНИЕ ==========
    
    def seal_system_venting(self, seal_volume: float, pressure: float,
                           venting_rate: float, hours: float) -> float:
        """
        3.4 Количество газа, стравливаемого из системы уплотнений
        
        Args:
            seal_volume: Объем системы уплотнений, м³
            pressure: Давление, МПа
            venting_rate: Норма стравливания, м³/ч
            hours: Время работы, ч
        
        Returns:
            Расход газа, м³
        """
        # Постоянное стравливание
        continuous = venting_rate * hours
        
        # Разовое стравливание при остановке
        one_time = seal_volume * (pressure / 0.101325) * 0.5
        
        return continuous + one_time
    
    def oil_tank_purging(self, tank_volume: float, pressure: float,
                        n_purges_per_day: int, days: int = 30) -> float:
        """
        3.5 Количество газа, стравливаемого через свечи маслобаков
        
        Args:
            tank_volume: Объем маслобака, м³
            pressure: Давление продувки, МПа
            n_purges_per_day: Продувок в сутки
            days: Количество дней
        
        Returns:
            Расход газа, м³
        """
        # Объем газа на одну продувку
        gas_per_purge = tank_volume * (pressure / 0.101325)
        
        # Общий расход
        total_purges = n_purges_per_day * days
        total_gas = gas_per_purge * total_purges
        
        return total_gas
    
    def liquid_degassing(self, liquid_volume: float, gas_content: float,
                        pressure: float) -> float:
        """
        3.6 Количество газа дегазации дренируемой жидкости
        
        Args:
            liquid_volume: Объем жидкости, м³
            gas_content: Газосодержание, м³/м³
            pressure: Давление, МПа
        
        Returns:
            Объем газа, м³
        """
        # Объем растворенного газа
        dissolved_gas = liquid_volume * gas_content
        
        # Объем при стравливании
        gas_volume = dissolved_gas * (pressure / 0.101325)
        
        return gas_volume
    
    # ========== ЭКСПЛУАТАЦИОННЫЕ РАСХОДЫ ==========
    
    def gpa_enclosure_heating(self, enclosure_volume: float, 
                             heat_loss_coef: float, delta_t: float,
                             hours: float, efficiency: float = 0.8) -> float:
        """
        Расход газа на обогрев укрытий ГПА
        
        Args:
            enclosure_volume: Объем укрытия, м³
            heat_loss_coef: Коэффициент теплопотерь, Вт/(м³·°C)
            delta_t: Разница температур, °C
            hours: Часы работы
            efficiency: КПД обогрева
        
        Returns:
            Расход газа, м³
        """
        # Тепловая мощность
        heat_power = enclosure_volume * heat_loss_coef * delta_t
        
        # Тепловая энергия
        heat_energy = heat_power * hours * 3600  # Дж
        
        # Расход газа
        gas_consumption = heat_energy / (35e6 * efficiency)
        
        return gas_consumption
    
    def thermal_oxidation(self, waste_gas_flow: float, hours: float) -> float:
        """
        Расход газа на установки термического обезвреживания
        
        Args:
            waste_gas_flow: Расход сбрасываемого газа, м³/ч
            hours: Время работы, ч
        
        Returns:
            Расход газа на поддержание горения, м³
        """
        # Газ на поддержание горения (10% от расхода)
        support_gas = waste_gas_flow * 0.1 * hours
        
        return support_gas
    
    # ========== КОМПЛЕКСНЫЙ РАСЧЕТ ==========
    
    def calculate_all_kc(self, parameters: Dict) -> Dict:
        """Комплексный расчет всех расходов КС"""
        
        results = {
            'gpa_startup': 0,
            'compressor_venting': 0,
            'air_displacement': 0,
            'seal_venting': 0,
            'oil_tank_purging': 0,
            'liquid_degassing': 0,
            'enclosure_heating': 0,
            'thermal_oxidation': 0,
            'total': 0
        }
        
        # Расчеты на основе параметров
        
        return results