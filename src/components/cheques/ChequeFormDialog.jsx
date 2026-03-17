import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChequeFormDialog({ open, onClose, onSave, cheque, isLoading, nextNumber }) {
  const [form, setForm] = useState(cheque || {
    numero_cheque: nextNumber || "", beneficiario: "", monto: "",
    fecha_emision: new Date().toISOString().slice(0, 10), concepto: "",
    estado: "emitido", banco: "", notas: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fecha = new Date(form.fecha_emision);
    onSave({
      ...form,
      numero_cheque: Number(form.numero_cheque),
      monto: Number(form.monto),
      mes: fecha.getMonth() + 1,
      anio: fecha.getFullYear(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cheque ? "Editar Cheque" : "Nuevo Cheque"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>No. Cheque *</Label>
              <Input type="number" value={form.numero_cheque} onChange={e => setForm({...form, numero_cheque: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm({...form, estado: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitido">Emitido</SelectItem>
                  <SelectItem value="cobrado">Cobrado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Beneficiario *</Label>
            <Input value={form.beneficiario} onChange={e => setForm({...form, beneficiario: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input type="number" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Fecha Emisión *</Label>
              <Input type="date" value={form.fecha_emision} onChange={e => setForm({...form, fecha_emision: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Concepto</Label>
              <Input value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input value={form.banco} onChange={e => setForm({...form, banco: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="h-20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{cheque ? "Actualizar" : "Guardar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}