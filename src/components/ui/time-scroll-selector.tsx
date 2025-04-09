import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface TimeScrollSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  hourLabel?: string;
  minuteLabel?: string;
}

const TimeScrollSelector = ({
  value = "00:00",
  onChange,
  className,
  disabled = false,
  hourLabel = "Horas",
  minuteLabel = "Minutos",
}: TimeScrollSelectorProps) => {
  // Parse the initial value
  const [hours, setHours] = useState<number>(parseInt(value.split(":")[0], 10) || 0);
  const [minutes, setMinutes] = useState<number>(parseInt(value.split(":")[1], 10) || 0);

  // Generate arrays of hours (0-23) and minutes (0-59)
  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);

  // Update parent component when hours or minutes change
  useEffect(() => {
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    onChange(`${formattedHours}:${formattedMinutes}`);
  }, [hours, minutes, onChange]);

  // Update internal state when value prop changes
  useEffect(() => {
    try {
      const [hoursStr, minutesStr] = value.split(":");
      const parsedHours = parseInt(hoursStr, 10);
      const parsedMinutes = parseInt(minutesStr, 10);
      
      if (!isNaN(parsedHours) && parsedHours >= 0 && parsedHours <= 23) {
        setHours(parsedHours);
      }
      
      if (!isNaN(parsedMinutes) && parsedMinutes >= 0 && parsedMinutes <= 59) {
        setMinutes(parsedMinutes);
      }
    } catch (e) {
      // If parsing fails, set default values
      setHours(0);
      setMinutes(0);
    }
  }, [value]);

  // Helper functions to increment/decrement values
  const incrementHours = () => {
    setHours((prev) => (prev + 1) % 24);
  };

  const decrementHours = () => {
    setHours((prev) => (prev - 1 + 24) % 24);
  };

  const incrementMinutes = () => {
    setMinutes((prev) => (prev + 1) % 60);
  };

  const decrementMinutes = () => {
    setMinutes((prev) => (prev - 1 + 60) % 60);
  };

  // Format numbers with leading zeros
  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex justify-between gap-4">
        {/* Hours Column */}
        <div className="flex-1">
          <Label className="text-xs font-medium text-gray-500 mb-1 block">{hourLabel}</Label>
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-full rounded-md hover:bg-gray-100 focus:outline-none"
              onClick={incrementHours}
              disabled={disabled}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            
            <div className="relative w-full">
              <select
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value, 10))}
                disabled={disabled}
                className="block w-full py-2 text-center text-lg font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
              >
                {hoursArray.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatNumber(hour)}
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-full rounded-md hover:bg-gray-100 focus:outline-none"
              onClick={decrementHours}
              disabled={disabled}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center mt-7">
          <span className="text-2xl font-bold text-gray-500">:</span>
        </div>

        {/* Minutes Column */}
        <div className="flex-1">
          <Label className="text-xs font-medium text-gray-500 mb-1 block">{minuteLabel}</Label>
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-full rounded-md hover:bg-gray-100 focus:outline-none"
              onClick={incrementMinutes}
              disabled={disabled}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            
            <div className="relative w-full">
              <select
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                disabled={disabled}
                className="block w-full py-2 text-center text-lg font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
              >
                {minutesArray.map((minute) => (
                  <option key={minute} value={minute}>
                    {formatNumber(minute)}
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-full rounded-md hover:bg-gray-100 focus:outline-none"
              onClick={decrementMinutes}
              disabled={disabled}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeScrollSelector; 