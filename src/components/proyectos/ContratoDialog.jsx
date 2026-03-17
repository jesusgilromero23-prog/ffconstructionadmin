import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIPOS = [
  "drywall","pintura","piso","plomeria","electricidad",
  "estructura","acabados","techo","general","otros"
];

export default function ContratoDialog({ open, onClose, onSave, contrato, defaultProyecto, proyectos }) {
  const [form, setForm] = useState(contrato || {
    proyecto_nombre: defaultProyecto || "",
    tipo_contrato: "general",
    descripcion: "",
    monto_contrato: "",
    general_contractor: "",
    fecha_contrato: new Date().toISOString().slice(0, 10),
    estado: "activo",
    notas: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fecha = new Date(form.fecha_contrato);
    onSave({
      ...form,
      monto_contrato: Number(form.monto_contrato),
      mes: fecha.getMonth() + 1,
      anio: fecha.getFullYear(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contrato ? "Editar Contrato" : "Nuevo Contrato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Proyecto *</Label>
            <Select value={form.proyecto_nombre} onValueChange={v => setForm({...form, proyecto_nombre: v})}>
              <SelectTrigger><SelectValue placeholder="Seleccionar proyecto" /></SelectTrigger>
              <SelectContent>
                {(proyectos || []).map(p => <SelectItem key={p.id} value={p.nombre}>{p.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Contrato *</Label>
              <Select value={form.tipo_contrato} onValueChange={v => setForm({...form, tipo_contrato: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm({...form, estado: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
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
              <Label>Monto del Contrato *</Label>
              <Input type="number" step="0.01" value={form.monto_contrato} onChange={e => setForm({...form, monto_contrato: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Fecha del Contrato</Label>
              <Input type="date" value={form.fecha_contrato} onChange={e => setForm({...form, fecha_contrato: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>General Contractor</Label>
            <Input value={form.general_contractor} onChange={e => setForm({...form, general_contractor: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="h-16" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{contrato ? "Actualizar" : "Guardar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}