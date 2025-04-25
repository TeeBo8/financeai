"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    initialFrom?: Date;
    initialTo?: Date;
}

export function DatePickerWithRange({
  className,
  initialFrom,
  initialTo
}: DatePickerWithRangeProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialiser l'état local avec les valeurs initiales
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: initialFrom,
    to: initialTo
  })

  // Mettre à jour l'URL quand la plage de dates change
  const onDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    
    if (newDate?.from || newDate?.to) {
      // Créer une nouvelle instance de URLSearchParams à partir des paramètres actuels
      const params = new URLSearchParams(searchParams.toString())
      
      // Mettre à jour ou supprimer le paramètre 'from'
      if (newDate.from) {
        const fromDate = format(newDate.from, 'yyyy-MM-dd')
        params.set('from', fromDate)
      } else {
        params.delete('from')
      }
      
      // Mettre à jour ou supprimer le paramètre 'to'
      if (newDate.to) {
        const toDate = format(newDate.to, 'yyyy-MM-dd')
        params.set('to', toDate)
      } else {
        params.delete('to')
      }
      
      // Naviguer vers la même page avec les nouveaux paramètres
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: fr })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: fr })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: fr })
              )
            ) : (
              <span>Choisir une plage</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            locale={fr}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 