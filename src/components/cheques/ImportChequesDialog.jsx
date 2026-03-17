import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { CheckCircle, AlertCircle, Loader2, Sheet } from "lucide-react";

export default function ImportChequesDialog({ open, onClose, onImported }) {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const extractId = (input) => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    const id = extractId(spreadsheetId);
    const res = await base44.functions.invoke("importChequesFromSheets", { spreadsheetId: id, sheetName });
    setLoading(false);
    if (res.data.error) {
      setError(res.data.error);
    } else {
      setResult(res.data);
      if (res.data.imported > 0) onImported();
    }
  };

  const handleClose = () => {
    setSpreadsheetId("");
    setSheetName("Sheet1");
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sheet className="w-5 h-5 text-emerald-600" />
            Importar Cheques desde Google Sheets
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Columnas esperadas en la hoja:</p>
            <p><span className="font-medium">numero_cheque, beneficiario, monto, fecha_emision</span> (requeridos)</p>
            <p>Opcionales: concepto, estado, banco, notas</p>
          </div>

          <div className="space-y-1.5">
            <Label>URL o ID del Spreadsheet</Label>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={spreadsheetId}
              onChange={e => setSpreadsheetId(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nombre de la hoja</Label>
            <Input
              placeholder="Sheet1"
              value={sheetName}
              onChange={e => setSheetName(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm space-y-1">
              <p className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle className="w-4 h-4" /> Importación completada
              </p>
              <p className="text-emerald-600">{result.imported} cheque(s) importado(s)</p>
              {result.skipped > 0 && <p className="text-amber-600">{result.skipped} fila(s) omitida(s)</p>}
              {result.errors?.map((e, i) => <p key={i} className="text-xs text-muted-foreground">{e}</p>)}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>Cerrar</Button>
          <Button onClick={handleImport} disabled={loading || !spreadsheetId}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</> : "Importar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}