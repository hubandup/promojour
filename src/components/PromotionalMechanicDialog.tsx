import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { PromotionalMechanic } from "@/hooks/use-promotional-mechanics";

interface Field {
  name: string;
  label: string;
  type: string;
}

interface PromotionalMechanicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanic?: PromotionalMechanic;
  onSave: (data: {
    name: string;
    code: string;
    fields: Field[];
    is_active: boolean;
  }) => void;
}

export const PromotionalMechanicDialog = ({
  open,
  onOpenChange,
  mechanic,
  onSave,
}: PromotionalMechanicDialogProps) => {
  const [name, setName] = useState(mechanic?.name || "");
  const [code, setCode] = useState(mechanic?.code || "");
  const [fields, setFields] = useState<Field[]>(mechanic?.fields || []);

  const handleAddField = () => {
    setFields([...fields, { name: "", label: "", type: "text" }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof Field, value: string) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const handleSubmit = () => {
    if (!name || !code || fields.length === 0) {
      return;
    }
    onSave({
      name,
      code: code.toLowerCase().replace(/\s+/g, "_"),
      fields,
      is_active: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mechanic ? "Modifier la mécanique" : "Nouvelle mécanique promotionnelle"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Nom de la mécanique</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Remise de prix"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Code (identifiant unique)</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: price_discount"
              className="rounded-xl"
              disabled={!!mechanic}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Champs associés</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddField}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un champ
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="p-4 border border-border/50 rounded-xl space-y-3 bg-card/50"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Champ {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nom technique</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                        placeholder="originalPrice"
                        className="rounded-lg text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Libellé</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                        placeholder="Prix d'origine"
                        className="rounded-lg text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => handleFieldChange(index, "type", value)}
                      >
                        <SelectTrigger className="rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texte</SelectItem>
                          <SelectItem value="number">Nombre</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl">
            {mechanic ? "Modifier" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
