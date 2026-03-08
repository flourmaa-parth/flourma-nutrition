import { useState } from "react";
import { lookupOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NutritionLabel from "@/components/NutritionLabel";
import { toast } from "sonner";
import { Wheat } from "lucide-react";

const CustomerLookup = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!orderNumber || !lastName) {
      toast.error("Please fill in both fields");
      return;
    }

    setLoading(true);
    try {
      const data = await lookupOrder(orderNumber, lastName);
      setNutritionData(data);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("Order not found. Please check your order number and last name.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
      setNutritionData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] relative overflow-hidden">
      {/* Flourma Branding - Top Bar */}
      <div className="relative z-20 bg-white border-b border-[#D7CCC8] no-print">
        <div className="container mx-auto px-4 py-4">
          <a 
            href="https://www.flourma.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block"
            data-testid="flourma-logo-link"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-[#5D4037] tracking-tight hover:text-[#4E342E] transition-colors">
              Flourma
            </h1>
          </a>
        </div>
      </div>

      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1692230335051-8cbb6a8c8a0e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHw0fHx3aGVhdCUyMGZpZWxkJTIwZ29sZGVuJTIwaG91cnxlbnwwfHx8fDE3NzI2Mzg5MjV8MA&ixlib=rb-4.1.0&q=85')"
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        {!nutritionData ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-8 md:p-12 border border-[#D7CCC8]/30">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5D4037] rounded-full mb-4">
                  <Wheat className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#5D4037] mb-3">
                  View Your Nutrition Label
                </h1>
                <p className="text-base text-[#795548] leading-relaxed">
                  Enter your order details below to view the complete nutrition information for your custom flour blend.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLookup} className="space-y-6">
                <div>
                  <Label htmlFor="orderNumber" className="text-sm font-medium uppercase tracking-wider text-[#5D4037] mb-2 block">
                    Order Number
                  </Label>
                  <Input
                    id="orderNumber"
                    data-testid="order-number-input"
                    type="text"
                    placeholder="e.g., ORD-2024-001"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="rounded-md border-[#D7CCC8] bg-white px-4 py-3 text-[#5D4037] placeholder:text-[#A1887F] focus:border-[#5D4037] focus:ring-1 focus:ring-[#5D4037] transition-all"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium uppercase tracking-wider text-[#5D4037] mb-2 block">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    data-testid="last-name-input"
                    type="text"
                    placeholder="e.g., Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-md border-[#D7CCC8] bg-white px-4 py-3 text-[#5D4037] placeholder:text-[#A1887F] focus:border-[#5D4037] focus:ring-1 focus:ring-[#5D4037] transition-all"
                  />
                </div>

                <Button
                  data-testid="view-nutrition-button"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md px-6 py-3 font-medium transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md bg-[#5D4037] text-white hover:bg-[#4E342E]"
                >
                  {loading ? "Searching..." : "View Nutrition Info"}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {nutritionData.items.map((item, index) => (
              <div key={index} className="nutrition-label-container bg-white rounded-xl shadow-2xl p-8 md:p-12">
                {nutritionData.items.length > 1 && (
                  <div className="mb-4 pb-4 border-b-2 border-[#D7CCC8] no-print">
                    <h3 className="text-2xl font-bold text-[#5D4037]">Item {index + 1} of {nutritionData.items.length}</h3>
                  </div>
                )}
                <NutritionLabel 
                  data={{
                    customer_name: nutritionData.customer_name,
                    order_number: nutritionData.order_number,
                    product_name: item.product_name,
                    ingredients_text: item.ingredients_text,
                    nutrition: item.nutrition
                  }} 
                />
              </div>
            ))}
            
            <div className="flex flex-col gap-4 no-print bg-white rounded-xl shadow-lg p-6">
              <div className="flex gap-4">
                <Button
                  data-testid="print-label-button"
                  onClick={handlePrint}
                  className="flex-1 rounded-md px-6 py-3 font-medium transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md bg-[#5D4037] text-white hover:bg-[#4E342E]"
                >
                  Print All Labels
                </Button>
                <Button
                  data-testid="new-search-button"
                  onClick={() => {
                    setNutritionData(null);
                    setOrderNumber("");
                    setLastName("");
                  }}
                  className="flex-1 rounded-md px-6 py-3 font-medium transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md border-2 border-[#5D4037] text-[#5D4037] hover:bg-[#5D4037] hover:text-white bg-transparent"
                >
                  New Search
                </Button>
              </div>
              <a
                href="https://www.flourma.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  data-testid="explore-more-button"
                  className="w-full rounded-md px-6 py-3 font-medium transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md bg-[#5D4037] text-white hover:bg-[#4E342E]"
                >
                  Explore More at Flourma
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLookup;
