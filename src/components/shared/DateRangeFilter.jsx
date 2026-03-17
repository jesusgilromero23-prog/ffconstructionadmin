import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DateRangeFilter({ desde, hasta, onDesdeChange, onHastaChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">Desde</Label>
        <Input
          type="date"
          value={desde}
          onChange={e => onDesdeChange(e.target.value)}
          className="h-8 text-sm w-36"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">Hasta</Label>
        <Input
          type="date"
          value={hasta}
          onChange={e => onHastaChange(e.target.value)}
          className="h-8 text-sm w-36"
        />
      </div>
    </div>
  );
}