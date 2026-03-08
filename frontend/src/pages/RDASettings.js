import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getAdminRDA, updateRDA } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings } from "lucide-react";

const RDASettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rdaValues, setRDAValues] = useState({
    energy_kcal: 2000,
    protein_g: 60,
    carbs_g: 300,
    fibre_g: 25,
    fat_g: 65,
    sat_fat_g: 20,
    sodium_mg: 2300
  });

  useEffect(() => {
    loadRDA();
  }, []);

  const loadRDA = async () => {
    try {
      const data = await getAdminRDA();
      setRDAValues(data);
    } catch (error) {
      toast.error("Failed to load RDA settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRDA(rdaValues);
      toast.success("RDA settings updated successfully");
    } catch (error) {
      toast.error("Failed to update RDA settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRDAValues({
      energy_kcal: 2000,
      protein_g: 60,
      carbs_g: 300,
      fibre_g: 25,
      fat_g: 65,
      sat_fat_g: 20,
      sodium_mg: 2300
    });
    toast.info("Reset to default Indian RDA values");
  };

  const rdaFields = [
    { key: "energy_kcal", label: "Energy (kcal)", description: "Recommended daily energy intake" },
    { key: "protein_g", label: "Protein (g)", description: "Recommended daily protein intake" },
    { key: "carbs_g", label: "Carbohydrates (g)", description: "Recommended daily carbohydrate intake" },
    { key: "fibre_g", label: "Dietary Fibre (g)", description: "Recommended daily fibre intake" },
    { key: "fat_g", label: "Total Fat (g)", description: "Recommended daily total fat intake" },
    { key: "sat_fat_g", label: "Saturated Fat (g)", description: "Recommended daily saturated fat intake" },
    { key: "sodium_mg", label: "Sodium (mg)", description: "Recommended daily sodium intake" }
  ];

  return (
    <AdminLayout>
      <div data-testid="rda-settings-page">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-[#5D4037]" />
            <h1 className="text-4xl font-bold text-[#5D4037]">RDA Settings</h1>
          </div>
          <p className="text-[#795548]">
            Configure Recommended Daily Allowance (RDA) values used in nutrition label %RDA calculations. 
            These values are based on Indian dietary guidelines for adults.
          </p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8]/50 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {rdaFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-semibold text-[#5D4037]">
                    {field.label}
                  </Label>
                  <Input
                    id={field.key}
                    data-testid={`rda-${field.key}`}
                    type="number"
                    step="0.1"
                    value={rdaValues[field.key]}
                    onChange={(e) => setRDAValues({ ...rdaValues, [field.key]: parseFloat(e.target.value) || 0 })}
                    className="text-lg font-data"
                  />
                  <p className="text-xs text-[#795548]">{field.description}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-[#D7CCC8] pt-6">
              <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded-lg p-4 mb-6">
                <p className="text-sm text-[#795548]">
                  <strong>Note:</strong> Changes to RDA values will affect all nutrition labels displayed to customers. 
                  The %RDA calculations on existing and new nutrition labels will use these updated values.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  data-testid="save-rda-button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#5D4037] text-white hover:bg-[#4E342E] px-8"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  data-testid="reset-rda-button"
                  onClick={handleReset}
                  variant="outline"
                  className="border-[#5D4037] text-[#5D4037] hover:bg-[#EFEBE9]"
                >
                  Reset to Defaults
                </Button>
              </div>
            </div>

            <div className="mt-8 border-t border-[#D7CCC8] pt-6">
              <h3 className="text-lg font-semibold text-[#5D4037] mb-3">Current RDA Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {rdaFields.map((field) => (
                  <div key={field.key} className="bg-[#FAF9F6] p-3 rounded-lg">
                    <p className="text-xs text-[#795548] mb-1">{field.label}</p>
                    <p className="text-xl font-bold text-[#5D4037] font-data">{rdaValues[field.key]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RDASettings;
