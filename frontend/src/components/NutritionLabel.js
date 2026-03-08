import { useState, useEffect } from "react";
import { getRDA } from "@/lib/api";

const NutritionLabel = ({ data }) => {
  // RDA values fetched from backend
  const [RDA, setRDA] = useState({
    energy_kcal: 2000,
    protein_g: 60,
    carbs_g: 300,
    fibre_g: 25,
    fat_g: 65,
    sat_fat_g: 20,
    sodium_mg: 2300
  });

  useEffect(() => {
    const fetchRDA = async () => {
      try {
        const rdaData = await getRDA();
        setRDA(rdaData);
      } catch (error) {
        console.error("Failed to fetch RDA values, using defaults", error);
      }
    };
    fetchRDA();
  }, []);

  const calculateRDA = (value, rdaValue) => {
    return ((value / rdaValue) * 100).toFixed(0);
  };

  return (
    <div data-testid="nutrition-label" className="border-2 border-black bg-white p-4 font-sans text-black max-w-md mx-auto print:border-2 print:border-black">
      {/* Header */}
      <div className="border-b-8 border-black pb-2 mb-2">
        <h2 className="font-black text-3xl leading-none">Nutrition Facts</h2>
      </div>

      {/* Customer & Order Info */}
      <div className="mb-3 pb-3 border-b-2 border-black">
        <div className="text-sm">
          <p><strong>Customer:</strong> {data.customer_name}</p>
          <p><strong>Order:</strong> {data.order_number}</p>
          <p><strong>Product:</strong> {data.product_name}</p>
        </div>
      </div>

      {/* Serving Info */}
      <div className="mb-2 flex justify-between items-end">
        <p className="text-xs mb-1">Per 100 g</p>
        <p className="text-xs mb-1 font-bold">% RDA*</p>
      </div>

      {/* Nutrition Data */}
      <div className="space-y-0">
        {/* Energy */}
        <div className="flex justify-between border-b-4 border-black py-1 font-bold">
          <span className="font-black">Energy</span>
          <div className="flex gap-4">
            <span className="font-data font-bold">{data.nutrition.energy_kcal.toFixed(1)} kcal</span>
            <span className="font-data font-bold w-12 text-right">{calculateRDA(data.nutrition.energy_kcal, RDA.energy_kcal)}%</span>
          </div>
        </div>

        {/* Protein */}
        <div className="flex justify-between border-b border-black py-1">
          <span className="font-bold">Protein</span>
          <div className="flex gap-4">
            <span className="font-data font-bold">{data.nutrition.protein_g.toFixed(1)} g</span>
            <span className="font-data font-bold w-12 text-right">{calculateRDA(data.nutrition.protein_g, RDA.protein_g)}%</span>
          </div>
        </div>

        {/* Carbohydrate */}
        <div className="flex justify-between border-b border-black py-1">
          <span className="font-bold">Carbohydrate</span>
          <div className="flex gap-4">
            <span className="font-data font-bold">{data.nutrition.carbs_g.toFixed(1)} g</span>
            <span className="font-data font-bold w-12 text-right">{calculateRDA(data.nutrition.carbs_g, RDA.carbs_g)}%</span>
          </div>
        </div>

        {/* Sugars (indented) */}
        <div className="flex justify-between border-b border-black py-1 pl-4">
          <span className="text-sm">of which sugars</span>
          <div className="flex gap-4">
            <span className="font-data text-sm">{data.nutrition.sugars_g.toFixed(1)} g</span>
            <span className="w-12"></span>
          </div>
        </div>

        {/* Dietary Fibre */}
        <div className="flex justify-between border-b border-black py-1">
          <span className="font-bold">Dietary Fibre</span>
          <div className="flex gap-4">
            <span className="font-data font-bold">{data.nutrition.fibre_g.toFixed(1)} g</span>
            <span className="font-data font-bold w-12 text-right">{calculateRDA(data.nutrition.fibre_g, RDA.fibre_g)}%</span>
          </div>
        </div>

        {/* Total Fat */}
        <div className="flex justify-between border-b border-black py-1">
          <span className="font-bold">Total Fat</span>
          <div className="flex gap-4">
            <span className="font-data font-bold">{data.nutrition.fat_g.toFixed(1)} g</span>
            <span className="font-data font-bold w-12 text-right">{calculateRDA(data.nutrition.fat_g, RDA.fat_g)}%</span>
          </div>
        </div>

        {/* Saturated Fat (indented) */}
        <div className="flex justify-between border-b border-black py-1 pl-4">
          <span className="text-sm">Saturated Fat</span>
          <div className="flex gap-4">
            <span className="font-data text-sm">{data.nutrition.sat_fat_g.toFixed(1)} g</span>
            <span className="font-data text-sm w-12 text-right">{calculateRDA(data.nutrition.sat_fat_g, RDA.sat_fat_g)}%</span>
          </div>
        </div>

        {/* Trans Fat (indented) */}
        <div className="flex justify-between border-b border-black py-1 pl-4">
          <span className="text-sm">Trans Fat</span>
          <div className="flex gap-4">
            <span className="font-data text-sm">{data.nutrition.trans_fat_g.toFixed(1)} g</span>
            <span className="w-12"></span>
          </div>
        </div>

        {/* Sodium */}
        <div className="flex justify-between border-b-4 border-black py-1 font-bold">
          <span className="font-black">Sodium</span>
          <div className="flex gap-4">
            <span className="font-data font-bold">{data.nutrition.sodium_mg.toFixed(1)} mg</span>
            <span className="font-data font-bold w-12 text-right">{calculateRDA(data.nutrition.sodium_mg, RDA.sodium_mg)}%</span>
          </div>
        </div>
      </div>

      {/* RDA Note */}
      <div className="mt-3 pt-2 border-t border-black">
        <p className="text-xs italic">*Percent Recommended Daily Allowance (RDA) are based on a 2000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.</p>
      </div>

      {/* Ingredients */}
      <div className="mt-4 pt-3 border-t-2 border-black">
        <p className="text-xs font-bold mb-1">INGREDIENTS:</p>
        <p className="text-xs leading-relaxed">{data.ingredients_text}</p>
      </div>

      {/* Allergen Warning */}
      <div className="mt-3 pt-2 border-t border-black">
        <p className="text-xs font-bold mb-1">ALLERGEN INFORMATION:</p>
        <p className="text-xs leading-relaxed">Milled in a factory that also processes grains which contain gluten, soy, and nuts.</p>
      </div>
    </div>
  );
};

export default NutritionLabel;
