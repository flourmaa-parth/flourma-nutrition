import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getSKUs, createSKU, updateSKU, deleteSKU } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

const SKUManagement = () => {
  const [skus, setSKUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    sku_code: "",
    name: "",
    ingredients_text: "",
    nutrition: {
      energy_kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      sugars_g: 0,
      fibre_g: 0,
      fat_g: 0,
      sat_fat_g: 0,
      trans_fat_g: 0,
      sodium_mg: 0
    }
  });

  useEffect(() => {
    loadSKUs();
  }, []);

  const loadSKUs = async () => {
    try {
      const data = await getSKUs();
      setSKUs(data);
    } catch (error) {
      toast.error("Failed to load SKUs");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sku_code: "",
      name: "",
      ingredients_text: "",
      nutrition: {
        energy_kcal: 0,
        protein_g: 0,
        carbs_g: 0,
        sugars_g: 0,
        fibre_g: 0,
        fat_g: 0,
        sat_fat_g: 0,
        trans_fat_g: 0,
        sodium_mg: 0
      }
    });
    setEditingId(null);
  };

  const handleOpenDialog = (sku = null) => {
    if (sku) {
      setFormData(sku);
      setEditingId(sku.id);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateSKU(editingId, formData);
        toast.success("SKU updated successfully");
      } else {
        await createSKU(formData);
        toast.success("SKU created successfully");
      }
      setDialogOpen(false);
      resetForm();
      loadSKUs();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save SKU");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this SKU?")) {
      try {
        await deleteSKU(id);
        toast.success("SKU deleted successfully");
        loadSKUs();
      } catch (error) {
        toast.error("Failed to delete SKU");
      }
    }
  };

  return (
    <AdminLayout>
      <div data-testid="sku-management-page">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#5D4037] mb-2">SKU Management</h1>
            <p className="text-[#795548]">Manage your product SKUs and their nutrition information</p>
          </div>
          <Button
            data-testid="add-sku-button"
            onClick={() => handleOpenDialog()}
            className="bg-[#5D4037] text-white hover:bg-[#4E342E] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add SKU
          </Button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : skus.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#D7CCC8]/50">
            <Package className="w-16 h-16 text-[#D7CCC8] mx-auto mb-4" />
            <p className="text-[#795548]">No SKUs found. Add your first SKU to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skus.map((sku) => (
              <div
                key={sku.id}
                data-testid={`sku-card-${sku.sku_code}`}
                className="bg-white rounded-xl shadow-sm border border-[#D7CCC8]/50 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#8A9A5B] font-semibold">{sku.sku_code}</p>
                    <h3 className="text-xl font-semibold text-[#5D4037] mt-1">{sku.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      data-testid={`edit-sku-${sku.sku_code}`}
                      onClick={() => handleOpenDialog(sku)}
                      className="p-2 hover:bg-[#EFEBE9] rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[#5D4037]" />
                    </button>
                    <button
                      data-testid={`delete-sku-${sku.sku_code}`}
                      onClick={() => handleDelete(sku.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[#D32F2F]" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#795548] mb-3 line-clamp-2">{sku.ingredients_text}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FAF9F6] p-2 rounded">
                    <p className="text-[#795548]">Energy</p>
                    <p className="font-semibold text-[#5D4037]">{sku.nutrition.energy_kcal} kcal</p>
                  </div>
                  <div className="bg-[#FAF9F6] p-2 rounded">
                    <p className="text-[#795548]">Protein</p>
                    <p className="font-semibold text-[#5D4037]">{sku.nutrition.protein_g} g</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit SKU" : "Add New SKU"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU Code</Label>
                  <Input
                    data-testid="sku-code-input"
                    value={formData.sku_code}
                    onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
                    placeholder="e.g., WHEAT01"
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    data-testid="sku-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Whole Wheat Flour"
                  />
                </div>
              </div>
              <div>
                <Label>Ingredients</Label>
                <Textarea
                  data-testid="sku-ingredients-input"
                  value={formData.ingredients_text}
                  onChange={(e) => setFormData({ ...formData, ingredients_text: e.target.value })}
                  placeholder="e.g., Whole Wheat Flour (100%)"
                  rows={3}
                />
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-[#5D4037]">Nutrition per 100g</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Energy (kcal)</Label>
                    <Input
                      data-testid="sku-energy-input"
                      type="number"
                      step="0.1"
                      value={formData.nutrition.energy_kcal}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, energy_kcal: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Protein (g)</Label>
                    <Input
                      data-testid="sku-protein-input"
                      type="number"
                      step="0.1"
                      value={formData.nutrition.protein_g}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, protein_g: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carbs (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.nutrition.carbs_g}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, carbs_g: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sugars (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.nutrition.sugars_g}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, sugars_g: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fibre (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.nutrition.fibre_g}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, fibre_g: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fat (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.nutrition.fat_g}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, fat_g: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sat. Fat (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.nutrition.sat_fat_g}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, sat_fat_g: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Trans Fat (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.nutrition.trans_fat_g}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, trans_fat_g: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sodium (mg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.nutrition.sodium_mg}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, sodium_mg: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-testid="save-sku-button"
                onClick={handleSave}
                className="bg-[#5D4037] text-white hover:bg-[#4E342E]"
              >
                {editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default SKUManagement;
