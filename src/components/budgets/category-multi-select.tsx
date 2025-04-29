"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon?: string | null;
}

interface CategoryMultiSelectProps {
  availableCategories: Category[];
  selectedCategoryIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function CategoryMultiSelect({
  availableCategories,
  selectedCategoryIds,
  onChange,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const handleSelect = (categoryId: string) => {
    console.log("--- handleSelect triggered for ID:", categoryId);
    console.log("Current selectedCategoryIds:", selectedCategoryIds);
    const newSelectedIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    console.log("New selectedCategoryIds:", newSelectedIds);
    onChange(newSelectedIds);
  };

  const filteredCategories = availableCategories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCategoryIds.length > 0
              ? `${selectedCategoryIds.length} catégorie(s) sélectionnée(s)`
              : "Sélectionner des catégories..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Rechercher une catégorie..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => {
                      console.log("CommandItem onSelect triggered for:", category.name);
                      handleSelect(category.id);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCategoryIds.includes(category.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {category.icon && <span className="mr-2">{category.icon}</span>}
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] border rounded-md p-2">
        {selectedCategoryIds.length > 0 ? (
          selectedCategoryIds.map((categoryId) => {
            const category = availableCategories.find((c) => c.id === categoryId);
            if (!category) return null;
            return (
              <Badge
                key={categoryId}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {category.icon && <span>{category.icon}</span>}
                {category.name}
                <button
                  onClick={() => handleSelect(categoryId)}
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })
        ) : (
          <span className="text-xs text-muted-foreground">
            Aucune catégorie sélectionnée
          </span>
        )}
      </div>
    </div>
  );
} 