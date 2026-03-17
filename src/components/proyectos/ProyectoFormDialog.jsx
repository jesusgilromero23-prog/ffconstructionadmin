import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIPOS = [
  { value: "labor", label: "Labor" },
  { value: "material", label: "Material" },
  { value: "operativo", label: "Gasto Operativo" },
  { value: "labor_extra", label: "Labor Extra" },
];

export default function ProyectoFormDialog({ open, onClose, onSave, gasto, isLoading }) {
  const [form, setForm] = useState(gasto || {
    proyecto: "", tipo_gasto: "labor", descripcion: "", monto: "",
    fecha: new Date().toISOString().slice(0, 10), proveedor: "", notas: ""
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
          <DialogTitle>{gasto ? "Editar Gasto de Proyecto" : "Nuevo Gasto de Proyecto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proyecto *</Label>
              <Input value={form.proyecto} onChange={e => setForm({...form, proyecto: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Gasto *</Label>
              <Select value={form.tipo_gasto} onValueChange={v => setForm({...form, tipo_gasto: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
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
            <Label>Proveedor</Label>
            <Input value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})} />
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