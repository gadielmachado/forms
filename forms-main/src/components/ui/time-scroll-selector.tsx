import React, { useState } from "react";

interface TimeScrollSelectorProps {
  value?: string;           // Exemplo: "10:33"
  onChange?: (value: string) => void;
}

const TimeScrollSelector: React.FC<TimeScrollSelectorProps> = ({
  value = "00:00",
  onChange,
}) => {
  // Quebra o "00:00" em hora e minuto
  const [hour, setHour] = useState(value.split(":")[0]);
  const [minute, setMinute] = useState(value.split(":")[1]);

  // Arrays para gerar as listas
  const hoursArray = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutesArray = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  // Função para atualizar a hora selecionada
  const handleSelectHour = (h: string) => {
    setHour(h);
    if (onChange) {
      onChange(`${h}:${minute}`);
    }
  };

  // Função para atualizar os minutos selecionados
  const handleSelectMinute = (m: string) => {
    setMinute(m);
    if (onChange) {
      onChange(`${hour}:${m}`);
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-gray-800 border border-gray-700 rounded-md w-fit">
      {/* Lista de Horas */}
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-300 mb-2">Horas (0-23)</p>
        <div className="h-40 w-16 overflow-y-auto border border-gray-700 rounded scrollbar-thin scrollbar-thumb-gray-600">
          {hoursArray.map((h) => (
            <div
              key={h}
              onClick={() => handleSelectHour(h)}
              className={`px-2 py-1 text-center cursor-pointer ${
                h === hour ? "bg-indigo-600 text-white font-semibold" : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Minutos */}
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-300 mb-2">Minutos (0-59)</p>
        <div className="h-40 w-16 overflow-y-auto border border-gray-700 rounded scrollbar-thin scrollbar-thumb-gray-600">
          {minutesArray.map((m) => (
            <div
              key={m}
              onClick={() => handleSelectMinute(m)}
              className={`px-2 py-1 text-center cursor-pointer ${
                m === minute ? "bg-indigo-600 text-white font-semibold" : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeScrollSelector; 