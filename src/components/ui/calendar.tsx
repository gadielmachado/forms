import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useNavigation } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Componente personalizado para a capção do calendário com seletores de mês e ano
function CustomCaption({ displayMonth, onMonthChange }: { displayMonth: Date; onMonthChange: (date: Date) => void }) {
  const { goToMonth } = useNavigation();
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    // Detectar se está em um dispositivo móvel
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      return mobileRegex.test(userAgent.toLowerCase()) || touchEnabled || window.innerWidth < 768;
    };
    
    setIsMobile(checkMobile());
    
    // Atualizar quando a janela for redimensionada
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Meses em português
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  // Gerar array de anos de 1900 até 2050
  const years = Array.from({ length: 151 }, (_, i) => 1900 + i);
  
  // Handler para mudar o mês
  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(parseInt(monthIndex));
    onMonthChange(newDate);
    goToMonth(newDate);
  };
  
  // Handler para mudar o ano
  const handleYearChange = (year: string) => {
    const newDate = new Date(displayMonth);
    newDate.setFullYear(parseInt(year));
    onMonthChange(newDate);
    goToMonth(newDate);
  };
  
  // Componente alternativo para dispositivos móveis usando botões nativos
  if (isMobile) {
    return (
      <div className="flex justify-center items-center gap-2 py-2">
        <div className="flex flex-col w-[125px]">
          <label htmlFor="month-select" className="text-xs font-medium text-gray-500 mb-1">
            Mês
          </label>
          <select
            id="month-select"
            value={displayMonth.getMonth().toString()}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full h-10 px-2 py-1 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-auto"
          >
            {months.map((month, index) => (
              <option key={index} value={index.toString()}>
                {month}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col w-[100px]">
          <label htmlFor="year-select" className="text-xs font-medium text-gray-500 mb-1">
            Ano
          </label>
          <select
            id="year-select"
            value={displayMonth.getFullYear().toString()}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full h-10 px-2 py-1 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-auto"
          >
            {years.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
  
  // Versão original com SelectTrigger para desktop
  return (
    <div className="flex justify-center items-center gap-2 py-2">
      <Select
        value={displayMonth.getMonth().toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="w-[125px] h-10 text-sm touch-manipulation">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent className="max-h-80 overflow-y-auto" position="popper" sideOffset={4}>
          {months.map((month, index) => (
            <SelectItem 
              key={index} 
              value={index.toString()} 
              className="cursor-pointer py-2.5 px-2"
            >
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={displayMonth.getFullYear().toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="w-[100px] h-10 text-sm touch-manipulation">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent className="max-h-80 overflow-y-auto" position="popper" sideOffset={4}>
          {years.map((year) => (
            <SelectItem 
              key={year} 
              value={year.toString()} 
              className="cursor-pointer py-2.5 px-2"
            >
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [displayMonth, setDisplayMonth] = React.useState<Date>(props.defaultMonth || new Date());
  
  // Atualizar displayMonth quando o mês default mudar
  React.useEffect(() => {
    if (props.defaultMonth) {
      setDisplayMonth(props.defaultMonth);
    }
  }, [props.defaultMonth]);
  
  // Atualizar displayMonth quando o mês mudar pela navegação do calendário
  const handleMonthChange = (date: Date) => {
    setDisplayMonth(date);
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden", // Esconder o label padrão pois usaremos nosso componente personalizado
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100 touch-manipulation"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-6 w-6" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-6 w-6" />,
        Caption: ({ ...captionProps }) => (
          <CustomCaption 
            displayMonth={displayMonth} 
            onMonthChange={handleMonthChange}
          />
        ),
      }}
      onMonthChange={handleMonthChange}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
