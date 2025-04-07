import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const TimePickerCustom = ({ value, onChange, className }: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  
  // Gerar horas de 00 a 23
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );
  
  // Gerar minutos de 00 a 55 (incrementos de 5)
  const minutes = Array.from({ length: 12 }, (_, i) => 
    (i * 5).toString().padStart(2, '0')
  );
  
  const handleSelect = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`);
    setOpen(false);
  };
  
  // Extrair hora e minuto do valor atual
  const [currentHour, currentMinute] = (value || "00:00").split(":");
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            type="text"
            value={value}
            readOnly
            placeholder="00:00"
            className="rounded-xl border-primary/30 focus-visible:ring-primary/30 pl-3 pr-10 transition-all"
          />
          <Clock className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex">
          {/* Coluna de horas */}
          <div className="w-1/2 max-h-60 overflow-y-auto border-r">
            <div className="p-2 font-medium text-center text-sm border-b">Horas</div>
            {hours.map((hour) => (
              <Button
                key={hour}
                variant="ghost"
                className={cn(
                  "w-full justify-center rounded-none",
                  hour === currentHour && "bg-primary/10 text-primary"
                )}
                onClick={() => handleSelect(hour, currentMinute || "00")}
              >
                {hour}
              </Button>
            ))}
          </div>
          
          {/* Coluna de minutos */}
          <div className="w-1/2 max-h-60 overflow-y-auto">
            <div className="p-2 font-medium text-center text-sm border-b">Minutos</div>
            {minutes.map((minute) => (
              <Button
                key={minute}
                variant="ghost"
                className={cn(
                  "w-full justify-center rounded-none",
                  minute === currentMinute && "bg-primary/10 text-primary"
                )}
                onClick={() => handleSelect(currentHour || "00", minute)}
              >
                {minute}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimePickerCustom;
