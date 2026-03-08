import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getSupplements, createSupplement, updateSupplement, deleteSupplement } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Leaf } from "lucide-react";

const SupplementManagement = () => {
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
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
    loadSupplements();
  }, []);

  const loadSupplements = async () => {
    try {
      const data = await getSupplements();
      setSupplements(data);
    } catch (error) {
      toast.error("Failed to load supplements");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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

  const handleOpenDialog = (supplement = null) => {
    if (supplement) {
      setFormData(supplement);
      setEditingId(supplement.id);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateSupplement(editingId, formData);
        toast.success("Supplement updated successfully");
      } else {
        await createSupplement(formData);
        toast.success("Supplement created successfully");
      }
      setDialogOpen(false);
      resetForm();
      loadSupplements();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save supplement");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplement?")) {
      try {
        await deleteSupplement(id);
        toast.success("Supplement deleted successfully");
        loadSupplements();
      } catch (error) {
        toast.error("Failed to delete supplement");
      }
    }
  };

  return (
    <AdminLayout>
      <div data-testid="supplement-management-page">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#5D4037] mb-2">Supplement Management</h1>
            <p className="text-[#795548]">Manage supplement add-ons and their nutrition contribution</p>
          </div>
          <Button
            data-testid="add-supplement-button"
            onClick={() => handleOpenDialog()}
            className="bg-[#8A9A5B] text-white hover:bg-[#7B8B50] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Supplement
          </Button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : supplements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#D7CCC8]/50">
            <Leaf className="w-16 h-16 text-[#D7CCC8] mx-auto mb-4" />
            <p className="text-[#795548]">No supplements found. Add your first supplement to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supplements.map((supplement) => (
              <div
                key={supplement.id}
                data-testid={`supplement-card-${supplement.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-xl shadow-sm border border-[#D7CCC8]/50 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#5D4037]">{supplement.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      data-testid={`edit-supplement-${supplement.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleOpenDialog(supplement)}
                      className="p-2 hover:bg-[#EFEBE9] rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[#5D4037]" />
                    </button>
                    <button
                      data-testid={`delete-supplement-${supplement.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleDelete(supplement.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[#D32F2F]" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#795548] mb-3 line-clamp-2">{supplement.ingredients_text}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FAF9F6] p-2 rounded">
                    <p className="text-[#795548]">Energy</p>
                    <p className="font-semibold text-[#5D4037]">{supplement.nutrition.energy_kcal} kcal</p>
                  </div>
                  <div className="bg-[#FAF9F6] p-2 rounded">
                    <p className="text-[#795548]">Protein</p>
                    <p className="font-semibold text-[#5D4037]">{supplement.nutrition.protein_g} g</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Supplement" : "Add New Supplement"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  data-testid="supplement-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Flax Seeds"
                />
              </div>
              <div>
                <Label>Ingredients Contribution</Label>
                <Textarea
                  data-testid="supplement-ingredients-input"
                  value={formData.ingredients_text}
                  onChange={(e) => setFormData({ ...formData, ingredients_text: e.target.value })}
                  placeholder="e.g., Flax Seeds (10%)"
                  rows={3}
                />
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-[#5D4037]">Nutrition per 100g</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Energy (kcal)</Label>
                    <Input
                      data-testid="supplement-energy-input"
                      type="number"
                      step="0.1"
                      value={formData.nutrition.energy_kcal}
                      onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, energy_kcal: parseFloat(e.target.value) || 0 } })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Protein (g)</Label>
                    <Input
                      data-testid="supplement-protein-input"
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
                data-testid="save-supplement-button"
                onClick={handleSave}
                className="bg-[#8A9A5B] text-white hover:bg-[#7B8B50]"
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

export default SupplementManagement;
