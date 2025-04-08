"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from 'date-fns/locale'
import { Calendar as CalendarIcon } from "lucide-react"
import type { SelectSingleEventHandler } from "react-day-picker"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    buttonProps?: React.ComponentProps<typeof Button>;
    calendarProps?: Omit<React.ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect'>;
}

export function DatePicker({ date, setDate, buttonProps, calendarProps }: DatePickerProps) {
    // Créer un gestionnaire compatible avec SelectSingleEventHandler
    const handleSelect: SelectSingleEventHandler = (day) => {
        setDate(day);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                    {...buttonProps}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    initialFocus
                    locale={fr}
                    {...calendarProps}
                />
            </PopoverContent>
        </Popover>
    )
} 