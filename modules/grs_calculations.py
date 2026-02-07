"""
Модуль расчетов для ГРС/ГРП
СТО Газпром 3.3-2-1
"""

import math
from typing import Dict, List, Tuple

class GRSCalculator:
    """Калькулятор для газораспределительных станций"""
    
    def __init__(self):
        self.R = 8.314462618  # Универсальная газовая постоянная
    
    # ========== ТЕХНОЛОГИЧЕСКИЕ ОПЕРАЦИИ ==========
    
    def blowdown_separator(self, volume: float, pressure: float, 
                          temperature: float, z: float = 0.95,
                          n_blowdowns: int = 1) -> float:
        """
        1.2.1 Продувка сепараторов и пылеуловителей ГРС
        
        Args:
            volume: Объем сепаратора, м³
            pressure: Давление, МПа
            temperature: Температура, К
            z: Коэффициент сжимаемости
            n_blowdowns: Количество продувок
        
        Returns:
            Объем газа при н.у., м³
        """
        # Перевод давления в Па
        p_pa = pressure * 1e6
        
        # Расчет количества вещества
        n = (p_pa * volume) / (z * self.R * temperature)
        
        # Объем при нормальных условиях
        p0 = 101325  # Па
        t0 = 293.15  # К
        v0 = n * self.R * t0 / p0
        
        return v0 * n_blowdowns
    
    def refuel_odorization(self, tank_volume: float, concentration: float,
                          pressure: float, days: int = 30) -> float:
        """
        1.2.2 Заправка одоризационных и метанольных установок
        
        Args:
            tank_volume: Объем бака, м³
            concentration: Концентрация, кг/м³
            pressure: Давление закачки, МПа
            days: Период работы, дней
        
        Returns:
            Расход газа на заправку, м³
        """
        # Объем заправки за период
        refuel_volume = tank_volume * (days / 30)  # Упрощенно
        
        # Расход газа на создание давления
        gas_volume = refuel_volume * (pressure / 0.1)  # Эмпирический коэффициент
        
        return gas_volume
    
    def diaphragm_replacement(self, pipe_diameter: float, pressure: float,
                             time_isolated: float) -> float:
        """
        1.2.3 Ревизия и замена диафрагм на пункте замера расхода газа
        
        Args:
            pipe_diameter: Диаметр трубопровода, мм
            pressure: Давление в трубопроводе, МПа
            time_isolated: Время отключения участка, ч
        
        Returns:
            Расход газа, м³
        """
        # Площадь сечения
        area = math.pi * (pipe_diameter / 1000) ** 2 / 4
        
        # Объем участка для продувки
        # Длина участка принимается 10 м (типовое значение)
        length = 10
        volume = area * length
        
        # Расход на продувку
        gas_consumption = volume * (pressure / 0.101325)  # Приведение к н.у.
        
        return gas_consumption
    
    def gas_heating_before_regulators(self, gas_flow: float, 
                                     temp_in: float, temp_out: float,
                                     hours: float = 24) -> float:
        """
        1.2.4 Расход газа на ГРС для обогрева газа перед регуляторами
        
        Args:
            gas_flow: Расход газа, м³/ч
            temp_in: Температура на входе, К
            temp_out: Температура на выходе, К
            hours: Время работы, ч
        
        Returns:
            Расход газа на обогрев, м³
        """
        # Теплоемкость газа (приближенно)
        cp = 2200  # Дж/(кг·К)
        
        # Плотность газа при н.у.
        rho = 0.7  # кг/м³
        
        # Тепловая мощность
        delta_t = temp_out - temp_in
        if delta_t <= 0:
            return 0
        
        # Массовый расход
        mass_flow = gas_flow * rho
        
        # Тепловая энергия
        q = mass_flow * cp * delta_t * hours
        
        # Расход газа (теплотворная способность ~35 МДж/м³)
        gas_for_heating = q / (35e6)
        
        return gas_for_heating
    
    # ========== ЭКСПЛУАТАЦИОННЫЕ РАСХОДЫ ==========
    
    def pneumatic_devices(self, n_devices: int, consumption_per_device: float,
                         hours_per_day: float, days: int = 30) -> float:
        """
        1.2.5 Эксплуатация пневморегуляторов и пневмоустройств КИП
        
        Args:
            n_devices: Количество устройств
            consumption_per_device: Расход на устройство, м³/ч
            hours_per_day: Часов работы в сутки
            days: Количество дней
        
        Returns:
            Расход газа, м³
        """
        total_hours = hours_per_day * days
        return n_devices * consumption_per_device * total_hours
    
    def household_appliances(self, n_appliances: Dict[str, int],
                            consumption_rates: Dict[str, float],
                            hours_usage: Dict[str, float]) -> float:
        """
        1.2.7 Расход газа бытовыми приборами
        
        Args:
            n_appliances: {тип_прибора: количество}
            consumption_rates: {тип_прибора: расход, м³/ч}
            hours_usage: {тип_прибора: часов_в_день}
        
        Returns:
            Месячный расход, м³
        """
        total = 0
        for appliance_type in n_appliances:
            if appliance_type in consumption_rates and appliance_type in hours_usage:
                daily = (n_appliances[appliance_type] * 
                        consumption_rates[appliance_type] * 
                        hours_usage[appliance_type])
                monthly = daily * 30
                total += monthly
        
        return total
    
    def heating_residential(self, area: float, heat_loss_coef: float,
                          degree_days: float, efficiency: float = 0.85) -> float:
        """
        Расход газа на отопление жилых помещений
        
        Args:
            area: Площадь помещений, м²
            heat_loss_coef: Коэффициент теплопотерь, Вт/(м²·°C)
            degree_days: Градусо-дни отопительного периода
            efficiency: КПД отопительной системы
        
        Returns:
            Расход газа за отопительный период, м³
        """
        # Теплопотери
        heat_loss = area * heat_loss_coef * degree_days * 0.024
        
        # Расход газа (теплотворная способность ~35 МДж/м³)
        gas_consumption = heat_loss / (35 * efficiency)
        
        return gas_consumption
    
    # ========== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ==========
    
    def calculate_all_grs(self, parameters: Dict) -> Dict:
        """Комплексный расчет всех расходов ГРС"""
        
        results = {
            'separator_blowdown': 0,
            'odorization_refuel': 0,
            'diaphragm_replacement': 0,
            'gas_heating': 0,
            'pneumatic_devices': 0,
            'household_appliances': 0,
            'heating': 0,
            'total': 0
        }
        
        # Расчеты
        if 'separator' in parameters:
            sep = parameters['separator']
            results['separator_blowdown'] = self.blowdown_separator(
                volume=sep.get('volume', 10),
                pressure=sep.get('pressure', 1.0),
                temperature=sep.get('temperature', 293),
                n_blowdowns=sep.get('n_blowdowns', 1)
            )
        
        if 'odorization' in parameters:
            odor = parameters['odorization']
            results['odorization_refuel'] = self.refuel_odorization(
                tank_volume=odor.get('tank_volume', 1),
                concentration=odor.get('concentration', 10),
                pressure=odor.get('pressure', 0.5)
            )
        
        if 'pneumatic' in parameters:
            pneu = parameters['pneumatic']
            results['pneumatic_devices'] = self.pneumatic_devices(
                n_devices=pneu.get('n_devices', 5),
                consumption_per_device=pneu.get('consumption', 0.1),
                hours_per_day=pneu.get('hours', 24)
            )
        
        # Итог
        results['total'] = sum(results.values())
        
        return results