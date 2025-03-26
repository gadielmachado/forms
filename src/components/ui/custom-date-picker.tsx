import React, { useState, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  required = false,
  className = '',
}) => {
  // Estado para os valores de dia, mês e ano
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  // Ao receber um value no formato ISO (YYYY-MM-DD), separar em dia, mês e ano
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    }
  }, [value]);

  // Função para atualizar o valor quando qualquer parte da data mudar
  const updateValue = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      // Garantir que os valores tenham dois dígitos
      const paddedDay = newDay.padStart(2, '0');
      const paddedMonth = newMonth.padStart(2, '0');
      
      // Criar a data no formato ISO (YYYY-MM-DD) para armazenamento interno
      const isoDate = `${newYear}-${paddedMonth}-${paddedDay}`;
      onChange(isoDate);
    } else if (!newDay && !newMonth && !newYear) {
      // Se todos os campos estiverem vazios, limpar o valor
      onChange('');
    }
  };

  // Manipuladores para os inputs
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '');
    if (newValue === '' || (parseInt(newValue) >= 1 && parseInt(newValue) <= 31 && newValue.length <= 2)) {
      setDay(newValue);
      updateValue(newValue, month, year);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '');
    if (newValue === '' || (parseInt(newValue) >= 1 && parseInt(newValue) <= 12 && newValue.length <= 2)) {
      setMonth(newValue);
      updateValue(day, newValue, year);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '');
    if (newValue === '' || (newValue.length <= 4)) {
      setYear(newValue);
      updateValue(day, month, newValue);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Input para o dia */}
      <div className="w-16">
        <input
          type="text"
          value={day}
          onChange={handleDayChange}
          placeholder="DD"
          maxLength={2}
          required={required}
          className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
        />
      </div>
      
      <span className="text-white">/</span>
      
      {/* Input para o mês */}
      <div className="w-16">
        <input
          type="text"
          value={month}
          onChange={handleMonthChange}
          placeholder="MM"
          maxLength={2}
          required={required}
          className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
        />
      </div>
      
      <span className="text-white">/</span>
      
      {/* Input para o ano */}
      <div className="w-20">
        <input
          type="text"
          value={year}
          onChange={handleYearChange}
          placeholder="AAAA"
          maxLength={4}
          required={required}
          className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
        />
      </div>
    </div>
  );
};

export default CustomDatePicker; 