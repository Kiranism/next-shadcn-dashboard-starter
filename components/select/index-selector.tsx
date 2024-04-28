"use client";

import * as React from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
// } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWatch } from "react-hook-form";

const frameworks = [
  {
    value: "1",
    label: "45cc046b-a396-4e0b-98b5-42e042251b93",
  },
  {
    value: "2",
    label: "1e3e6ebe-6984-4702-b161-7ba8ae66b949",
  },

  {
    value: "3",
    label: "c",
  },
  {
    value: "4",
    label: "d",
  },
  {
    value: "5",
    label: "e",
  },
  {
    value: "6",
    label: "f",
  },
  {
    value: "7",
    label: "g",
  },
  {
    value: "8",
    label: "h",
  },
];

export type IndexSelectorProps = {
  value: string;
  onChange: (value: any) => void;
};

export function IndexSelector({ value, onChange }: IndexSelectorProps) {
  const [open, setOpen] = React.useState(false);
  console.log("value" + value);
  const v = frameworks.find((framework) => framework.value === value)?.label;
  console.log("v" + v);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select index..."}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-1">
        <div className="flex flex-col space-y-1">
          {frameworks.map((framework) => (
            <Button
              key={framework.value}
              variant="ghost"
              className={cn(
                "flex items-center justify-between overflow-hidden w-full px-3 h-9",
                value === framework.value && "bg-opacity-10",
              )}
              onClick={() => {
                console.log("select value" + framework.value);
                onChange(framework.value);
                setOpen(false);
              }}
            >
              {framework.label}
              <CheckIcon
                className={cn(
                  "h-4 w-4",
                  value === framework.value ? "opacity-100" : "opacity-0",
                )}
              />
            </Button>
          ))}
        </div>
        {/* <Command>
          <CommandInput placeholder="Search framework..." className="h-9" />
          <CommandEmpty>No framework found.</CommandEmpty>
          <CommandGroup>
            {frameworks.map((framework) => (
              <CommandItem
                key={framework.value}
                value={framework.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                {framework.label}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === framework.value ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command> */}
      </PopoverContent>
    </Popover>
  );
}
