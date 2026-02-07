"""
Модуль расчетов для магистральных газопроводов
СТО Газпром 2-3.5-051-2006
"""

import math

class PipelineCalculator:
    """Калькулятор для трубопроводов"""
    
    def __init__(self):
        self.R = 8.314462618
    
    # ========== ГЕОМЕТРИЧЕСКИЕ РАСЧЕТЫ ==========
    
    def pipeline_volume(self, diameter: float, length: float,
                       roughness: float = 0.0001) -> float:
        """
        Геометрический объем участка газопровода
        
        Args:
            diameter: Внутренний диаметр, мм
            length: Длина участка, км
            roughness: Шероховатость стенок, м
        
        Returns:
            Объем, м³
        """
        # Переводим в метры
        d_m = diameter / 1000
        l_m = length * 1000
        
        # Объем
        volume = math.pi * d_m**2 / 4 * l_m
        
        return volume
    
    # ========== РАСЧЕТЫ ПАРАМЕТРОВ ==========
    
    def pipeline_capacity(self, diameter: float, pressure_start: float,
                         pressure_end: float, length: float,
                         temperature: float, z: float = 0.95,
                         lambda_coef: float = 0.01) -> float:
        """
        Расчет пропускной способности газопровода
        
        Args:
            diameter: Диаметр, мм
            pressure_start: Начальное давление, МПа
            pressure_end: Конечное давление, МПа
            length: Длина, км
            temperature: Температура газа, К
            z: Коэффициент сжимаемости
            lambda_coef: Коэффициент гидравлического сопротивления
        
        Returns:
            Пропускная способность, млн м³/сут
        """
        # Переводим в метры и паскали
        d_m = diameter / 1000
        p1_pa = pressure_start * 1e6
        p2_pa = pressure_end * 1e6
        l_m = length * 1000
        
        # Формула для изотермического потока
        a = math.pi * d_m**2 / 4
        numerator = (p1_pa**2 - p2_pa**2) * d_m**5
        denominator = lambda_coef * z * self.R * temperature * l_m
        
        if denominator == 0:
            return 0
        
        q = 0.03848 * math.sqrt(numerator / denominator)
        
        # Переводим в млн м³/сут
        q_million = q * 3600 * 24 / 1e6
        
        return q_million
    
    def final_pressure(self, diameter: float, pressure_start: float,
                      flow_rate: float, length: float,
                      temperature: float, z: float = 0.95) -> float:
        """
        Расчет конечного давления в участке газопровода
        
        Args:
            diameter: Диаметр, мм
            pressure_start: Начальное давление, МПа
            flow_rate: Расход газа, млн м³/сут
            length: Длина, км
            temperature: Температура, К
            z: Коэффициент сжимаемости
        
        Returns:
            Конечное давление, МПа
        """
        # Переводим в м³/с
        q = flow_rate * 1e6 / (24 * 3600)
        
        # Переводим в метры и паскали
        d_m = diameter / 1000
        p1_pa = pressure_start * 1e6
        l_m = length * 1000
        
        # Формула
        lambda_coef = 0.01  # типовое значение
        a = math.pi * d_m**2 / 4
        
        p2_sq = p1_pa**2 - (lambda_coef * z * self.R * temperature * l_m * q**2) / d_m**5
        p2_sq = max(p2_sq, 0)
        
        p2_pa = math.sqrt(p2_sq)
        
        return p2_pa / 1e6
    
    # ========== РАСЧЕТЫ РАСХОДА ==========
    
    def gas_through_hole(self, hole_diameter: float, pressure: float,
                        temperature: float, z: float = 0.95,
                        discharge_coef: float = 0.62) -> float:
        """
        Расчет расхода газа через отверстие (свищ, микротрещина)
        Методика ВНИИГАЗ
        
        Args:
            hole_diameter: Диаметр отверстия, мм
            pressure: Давление в трубопроводе, МПа
            temperature: Температура, К
            z: Коэффициент сжимаемости
            discharge_coef: Коэффициент истечения
        
        Returns:
            Расход газа, м³/ч
        """
        # Площадь отверстия
        area = math.pi * (hole_diameter / 1000)**2 / 4
        
        # Давление в Па
        p_pa = pressure * 1e6
        
        # Плотность газа
        molar_mass = 16.04  # для метана
        rho = (p_pa * molar_mass) / (z * self.R * temperature)
        
        # Скорость истечения (критическое истечение)
        k = 1.3  # показатель адиабаты
        critical_pressure_ratio = (2 / (k + 1)) ** (k / (k - 1))
        
        if pressure / 0.101325 > 1 / critical_pressure_ratio:
            # Критическое истечение
            velocity = math.sqrt(k * self.R * temperature / molar_mass * 
                               (2 / (k + 1)) ** ((k + 1) / (k - 1)))
        else:
            # Докритическое истечение
            p0 = 101325  # атмосферное давление
            velocity = math.sqrt(2 * k / (k - 1) * self.R * temperature / molar_mass *
                               (1 - (p0 / p_pa) ** ((k - 1) / k)))
        
        # Расход
        mass_flow = discharge_coef * area * rho * velocity
        volume_flow = mass_flow / 0.7  # пересчет в объем при н.у.
        
        return volume_flow * 3600
    
    def gas_velocity(self, flow_rate: float, diameter: float,
                    pressure: float, temperature: float) -> float:
        """
        Расчет линейной скорости газа в трубопроводе
        
        Args:
            flow_rate: Расход газа, млн м³/сут
            diameter: Диаметр трубопровода, мм
            pressure: Давление, МПа
            temperature: Температура, К
        
        Returns:
            Скорость газа, м/с
        """
        # Переводим расход в м³/с при рабочих условиях
        q_norm = flow_rate * 1e6 / (24 * 3600)  # м³/с при н.у.
        
        # Объемный расход при рабочих условиях
        p_work = pressure  # МПа
        t_work = temperature  # К
        p_norm = 0.101325  # МПа
        t_norm = 293.15  # К
        
        q_work = q_norm * (p_norm / p_work) * (t_work / t_norm)
        
        # Площадь сечения
        area = math.pi * (diameter / 1000)**2 / 4
        
        # Скорость
        velocity = q_work / area
        
        return velocity
    
    # ========== ТЕХНОЛОГИЧЕСКИЕ ОПЕРАЦИИ ==========
    
    def hydrate_plug_removal(self, pipeline_volume: float, pressure: float,
                            n_injections: int = 3) -> float:
        """
        Расход газа на ликвидацию гидратных пробок
        
        Args:
            pipeline_volume: Объем участка, м³
            pressure: Давление продувки, МПа
            n_injections: Количество закачек ингибитора
        
        Returns:
            Расход газа, м³
        """
        # Продувка после каждой закачки
        gas_per_injection = pipeline_volume * (pressure / 0.101325)
        
        total_gas = gas_per_injection * n_injections
        
        return total_gas
    
    def pipeline_purging(self, volume: float, pressure: float,
                        n_purges: int = 1) -> float:
        """
        Расход газа на продувку участка трубопровода
        
        Args:
            volume: Объем участка, м³
            pressure: Давление перед продувкой, МПа
            n_purges: Количество продувок
        
        Returns:
            Расход газа, м³
        """
        # Объем газа для одной продувки
        gas_per_purge = volume * (pressure / 0.101325)
        
        return gas_per_purge * n_purges
    
    # ========== ТЕМПЕРАТУРА ТОЧКИ РОСЫ ==========
    
    def dew_point_conversion(self, dew_point_water: float, 
                            pressure: float, method: str = "ISO18453") -> float:
        """
        Перевод температуры точки росы по воде (ТПРв) при различных давлениях
        
        Args:
            dew_point_water: Точка росы по воде, °C
            pressure: Давление, МПа
            method: Методика расчета
        
        Returns:
            Точка росы по воде при заданном давлении, °C
        """
        # Упрощенный расчет по формуле Магнуса
        # Для точных расчетов нужны таблицы или сложные уравнения
        
        if method == "simplified":
            # Упрощенная поправка: -0.5°C на каждые 0.1 МПа сверх атмосферного
            pressure_correction = (pressure - 0.101325) / 0.1 * (-0.5)
            corrected_dew_point = dew_point_water + pressure_correction
            
            return corrected_dew_point
        else:
            # Более точная формула
            alpha = 17.27
            beta = 237.7
            
            # Давление насыщенного пара при заданной точке росы
            p_sat = 0.61094 * math.exp((alpha * dew_point_water) / (beta + dew_point_water))
            
            # Мольная доля воды
            x_water = p_sat / (pressure * 1000)  # давление в кПа
            
            # Новая точка росы при заданном давлении
            if x_water <= 0:
                return -100  # очень низкая температура
            
            p_sat_new = x_water * pressure * 1000
            dew_point_new = (beta * math.log(p_sat_new / 0.61094)) / (alpha - math.log(p_sat_new / 0.61094))
            
            return dew_point_new