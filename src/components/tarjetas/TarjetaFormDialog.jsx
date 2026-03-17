import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIAS = [
  { value: "gasolina", label: "Gasolina" },
  { value: "oficina", label: "Oficina" },
  { value: "materiales", label: "Materiales" },
  { value: "viajes", label: "Viajes" },
  { value: "comidas", label: "Comidas" },
  { value: "servicios", label: "Servicios" },
  { value: "otros", label: "Otros" },
];

export default function TarjetaFormDialog({ open, onClose, onSave, gasto, isLoading }) {
  const [form, setForm] = useState(gasto || {
    tarjeta: "", descripcion: "", categoria: "otros", monto: "",
    fecha: new Date().toISOString().slice(0, 10), comercio: "", notas: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fecha = new Date(form.fecha);
    onSave({
      ...form,
      monto: Number(form.monto),
      mes: fecha.getMonth() + 1,
      anio: fecha.getFullYear(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{gasto ? "Editar Gasto de Tarjeta" : "Nuevo Gasto de Tarjeta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarjeta *</Label>
              <Input placeholder="Ej: ****1234" value={form.tarjeta} onChange={e => setForm({...form, tarjeta: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={v => setForm({...form, categoria: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input type="number" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comercio</Label>
            <Input value={form.comercio} onChange={e => setForm({...form, comercio: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="h-20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{gasto ? "Actualizar" : "Guardar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}