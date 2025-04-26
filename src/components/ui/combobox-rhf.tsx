"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

// Type générique pour les options (doit avoir value et label)
export interface ComboboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode; // Optionnel: pour afficher une icône
}

// Nouveau type pour les options avec style (icône et couleur)
export interface ComboboxOptionWithStyle {
  value: string;
  label: string;
  icon?: string | null;
  color?: string | null;
}

interface ComboboxFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>; // Nom du champ dans RHF
  label: string;
  options: ComboboxOption[] | ComboboxOptionWithStyle[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  description?: React.ReactNode;
  allowNull?: boolean; // Pour la catégorie optionnelle
  nullLabel?: string; // Label pour l'option nulle
}

// Composant pour afficher l'icône et la couleur d'un compte
const RenderAccountStyle = ({ icon, color }: { icon?: string | null, color?: string | null }) => (
  <span
    className="mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs shrink-0"
    style={{
      backgroundColor: color ?? 'hsl(var(--muted))',
      color: color ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
    }}
    aria-hidden="true"
  >
    {icon && /\p{Emoji}/u.test(icon) ? <span>{icon}</span> : <Circle className="h-3 w-3" />}
  </span>
);

// Helper pour vérifier si une option a le format avec style
const hasStyle = (option: ComboboxOption | ComboboxOptionWithStyle): option is ComboboxOptionWithStyle => {
  return 'color' in option || (typeof option.icon === 'string' || option.icon === null);
};

export function ComboboxField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyText = "Aucun résultat.",
  description,
  allowNull = false,
  nullLabel = "-- Aucun --"
}: ComboboxFieldProps<TFieldValues>) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Ajoute l'option nulle si nécessaire, encapsulé dans useMemo
  const effectiveOptions = React.useMemo(() => {
    return allowNull
      ? [{ value: "", label: nullLabel }, ...options]
      : options;
  }, [allowNull, nullLabel, options]);

  // Filtrer les options en fonction de la recherche
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return effectiveOptions;
    
    return effectiveOptions.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [effectiveOptions, searchQuery]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Trouver l'option actuellement sélectionnée
        const selectedOption = effectiveOptions.find(option => option.value === field.value);
        
        // Gérer la sélection d'une option
        const handleSelect = (optionValue: string) => {
          // Déterminer la nouvelle valeur (null, undefined ou la valeur)
          const newValue = optionValue === "" 
            ? (allowNull ? null : undefined) 
            : optionValue;
          
          // Mettre à jour le champ
          field.onChange(newValue);
          
          // Fermer le popover
          setOpen(false);
          
          // Réinitialiser la recherche
          setSearchQuery("");
        };
        
        return (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                    type="button" // Important pour éviter de soumettre le formulaire
                    onClick={() => setOpen(!open)} // Contrôle explicite de l'ouverture
                  >
                    {selectedOption ? (
                      <div className="flex items-center">
                        {hasStyle(selectedOption) && (
                          <RenderAccountStyle 
                            icon={selectedOption.icon} 
                            color={selectedOption.color} 
                          />
                        )}
                        {selectedOption.label}
                      </div>
                    ) : (
                      placeholder
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <div>
                  {/* Champ de recherche personnalisé */}
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const firstOption = filteredOptions[0];
                          if (firstOption) {
                            handleSelect(firstOption.value);
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {/* Liste des options */}
                  <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                    {filteredOptions.length === 0 ? (
                      <div className="py-6 text-center text-sm">{emptyText}</div>
                    ) : (
                      <div className="overflow-hidden p-1">
                        {filteredOptions.map((option) => (
                          <div
                            key={option.value}
                            className={cn(
                              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                              field.value === option.value && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => handleSelect(option.value)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {hasStyle(option) ? (
                              <RenderAccountStyle icon={option.icon} color={option.color} />
                            ) : option.icon && (
                              <span className="mr-2">{option.icon}</span>
                            )}
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
} 