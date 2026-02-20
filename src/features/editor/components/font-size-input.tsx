import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FontSizeInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const FontSizeInput = ({ value, onChange }: FontSizeInputProps) => {
  const increment = () => onChange(value + 1);
  const decrement = () => onChange(Math.max(1, value - 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    const newValue = Number.isNaN(value) ? 1 : value;
    onChange(Math.max(1, newValue));
  };

  return (
    <div className="flex items-center">
      <Button
        onClick={decrement}
        variant="outline"
        className="p-2 rounder-r-none border-r-0"
        size="icon"
      >
        <Minus className="size-4" />
      </Button>
      <Input
        onChange={handleChange}
        value={value}
        className="w-[50px] h-8 focus-visible:ring-offset-0 focus-visible:ring-0 rounded-none"
      />
      <Button
        onClick={increment}
        variant="outline"
        className="p-2 rounder-l-none border-l-0"
        size="icon"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
};
