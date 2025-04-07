import React, { useState } from "react";

interface TimeSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ value = "12:00", onChange }) => {
  const [hours, setHours] = useState<number>(parseInt(value.split(":")[0], 10) || 12);
  const [minutes, setMinutes] = useState<number>(parseInt(value.split(":")[1], 10) || 0);

  const handleScroll = (type: "hour" | "minute", delta: number) => {
    if (type === "hour") {
      const newHours = (hours + delta + 24) % 24;
      setHours(newHours);
      updateTime(newHours, minutes);
    } else {
      const newMinutes = (minutes + delta + 60) % 60;
      setMinutes(newMinutes);
      updateTime(hours, newMinutes);
    }
  };

  const updateTime = (newHours: number, newMinutes: number) => {
    const formattedHours = newHours.toString().padStart(2, "0");
    const formattedMinutes = newMinutes.toString().padStart(2, "0");
    const newValue = `${formattedHours}:${formattedMinutes}`;
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg bg-white shadow">
      {/* Scroll de Horas */}
      <div className="relative flex flex-col items-center">
        <div
          className="cursor-pointer text-gray-600 hover:text-black"
          onClick={() => handleScroll("hour", 1)}
        >
          ▲
        </div>
        <div className="text-xl font-semibold">{hours.toString().padStart(2, "0")}</div>
        <div
          className="cursor-pointer text-gray-600 hover:text-black"
          onClick={() => handleScroll("hour", -1)}
        >
          ▼
        </div>
      </div>

      <div className="text-xl font-semibold">:</div>

      {/* Scroll de Minutos */}
      <div className="relative flex flex-col items-center">
        <div
          className="cursor-pointer text-gray-600 hover:text-black"
          onClick={() => handleScroll("minute", 5)}
        >
          ▲
        </div>
        <div className="text-xl font-semibold">{minutes.toString().padStart(2, "0")}</div>
        <div
          className="cursor-pointer text-gray-600 hover:text-black"
          onClick={() => handleScroll("minute", -5)}
        >
          ▼
        </div>
      </div>
    </div>
  );
};

export default TimeSelector; 