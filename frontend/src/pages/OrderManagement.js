import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getOrders, createOrder, updateOrder, deleteOrder, getSKUs, getSupplements } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, X } from "lucide-react";

const emptyItem = () => ({
  product_name: "",
  base_sku_id: "",
  supplement_ids: [],
  is_custom: false,
  custom_ingredients_text: "",
  custom_nutrition: {
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

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [skus, setSKUs] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    order_number: "",
    customer_first_name: "",
    customer_last_name: "",
    items: [emptyItem()]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersData, skusData, supplementsData] = await Promise.all([
        getOrders(),
        getSKUs(),
        getSupplements()
      ]);
      setOrders(ordersData);
      setSKUs(skusData);
      setSupplements(supplementsData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      order_number: "",
      customer_first_name: "",
      customer_last_name: "",
      items: [emptyItem()]
    });
    setEditingId(null);
  };

  const handleOpenDialog = (order = null) => {
    if (order) {
      setFormData({
        order_number: order.order_number,
        customer_first_name: order.customer_first_name,
        customer_last_name: order.customer_last_name,
        items: order.items.length > 0 ? order.items.map(item => ({
          product_name: item.product_name || "",
          base_sku_id: item.base_sku_id || "",
          supplement_ids: item.supplement_ids || [],
          is_custom: item.is_custom,
          custom_ingredients_text: item.custom_ingredients_text || "",
          custom_nutrition: item.custom_nutrition || emptyItem().custom_nutrition
        })) : [emptyItem()]
      });
      setEditingId(order.id);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (formData.items.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }

    try {
      if (editingId) {
        await updateOrder(editingId, formData);
        toast.success("Order updated successfully");
      } else {
        await createOrder(formData);
        toast.success("Order created successfully");
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save order");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(id);
        toast.success("Order deleted successfully");
        loadData();
      } catch (error) {
        toast.error("Failed to delete order");
      }
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, emptyItem()]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("Order must have at least one item");
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const toggleSupplement = (itemIndex, suppId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== itemIndex) return item;
        const supplements = item.supplement_ids.includes(suppId)
          ? item.supplement_ids.filter(id => id !== suppId)
          : [...item.supplement_ids, suppId];
        return { ...item, supplement_ids: supplements };
      })
    }));
  };

  return (
    <AdminLayout>
      <div data-testid="order-management-page">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#5D4037] mb-2">Order Management</h1>
            <p className="text-[#795548]">Create and manage customer orders with multiple items</p>
          </div>
          <Button
            data-testid="add-order-button"
            onClick={() => handleOpenDialog()}
            className="bg-[#5D4037] text-white hover:bg-[#4E342E] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Order
          </Button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#D7CCC8]/50">
            <FileText className="w-16 h-16 text-[#D7CCC8] mx-auto mb-4" />
            <p className="text-[#795548]">No orders found. Create your first order to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                data-testid={`order-card-${order.order_number}`}
                className="bg-white rounded-xl shadow-sm border border-[#D7CCC8]/50 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-[#5D4037]">{order.order_number}</h3>
                      <span className="text-xs px-3 py-1 bg-[#EFEBE9] text-[#5D4037] rounded-full">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-[#795548]">Customer</p>
                        <p className="font-medium text-[#5D4037]">{order.customer_first_name} {order.customer_last_name}</p>
                      </div>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-[#795548] font-semibold">Items:</p>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="bg-[#FAF9F6] p-3 rounded-lg text-sm">
                            <p className="font-medium text-[#5D4037]">{idx + 1}. {item.product_name}</p>
                            <p className="text-xs text-[#795548] mt-1">{item.final_nutrition?.energy_kcal?.toFixed(1)} kcal, {item.final_nutrition?.protein_g?.toFixed(1)}g protein</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      data-testid={`edit-order-${order.order_number}`}
                      onClick={() => handleOpenDialog(order)}
                      className="p-2 hover:bg-[#EFEBE9] rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[#5D4037]" />
                    </button>
                    <button
                      data-testid={`delete-order-${order.order_number}`}
                      onClick={() => handleDelete(order.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[#D32F2F]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Order" : "Create New Order"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Order Number</Label>
                  <Input
                    data-testid="order-number-input"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    placeholder="ORD-2024-001"
                  />
                </div>
                <div>
                  <Label>First Name</Label>
                  <Input
                    data-testid="customer-first-name-input"
                    value={formData.customer_first_name}
                    onChange={(e) => setFormData({ ...formData, customer_first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    data-testid="customer-last-name-input"
                    value={formData.customer_last_name}
                    onChange={(e) => setFormData({ ...formData, customer_last_name: e.target.value })}
                    placeholder="Smith"
                  />
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#5D4037]">Order Items</h3>
                  <Button
                    data-testid="add-item-button"
                    onClick={addItem}
                    size="sm"
                    className="bg-[#8A9A5B] text-white hover:bg-[#7B8B50]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {formData.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="mb-6 p-4 border border-[#D7CCC8] rounded-lg bg-[#FAF9F6]">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-[#5D4037]">Item {itemIndex + 1}</h4>
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(itemIndex)}
                          className="text-[#D32F2F] hover:bg-red-50 p-2 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Product Name (Optional)</Label>
                        <Input
                          value={item.product_name}
                          onChange={(e) => updateItem(itemIndex, 'product_name', e.target.value)}
                          placeholder="e.g., Premium Blend"
                        />
                      </div>

                      <div className="flex items-center gap-4 p-3 bg-white rounded-lg">
                        <Checkbox
                          checked={item.is_custom}
                          onCheckedChange={(checked) => updateItem(itemIndex, 'is_custom', checked)}
                          id={`custom-${itemIndex}`}
                        />
                        <Label htmlFor={`custom-${itemIndex}`} className="cursor-pointer">
                          Custom Blend (manually enter nutrition)
                        </Label>
                      </div>

                      {!item.is_custom ? (
                        <>
                          <div>
                            <Label>Select Base SKU</Label>
                            <Select
                              value={item.base_sku_id}
                              onValueChange={(value) => updateItem(itemIndex, 'base_sku_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a SKU" />
                              </SelectTrigger>
                              <SelectContent>
                                {skus.map((sku) => (
                                  <SelectItem key={sku.id} value={sku.id}>
                                    {sku.sku_code} - {sku.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="mb-3 block">Add Supplements (Optional - 5% each)</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {supplements.map((supp) => (
                                <div key={supp.id} className="flex items-center gap-2 p-2 bg-white rounded">
                                  <Checkbox
                                    checked={item.supplement_ids.includes(supp.id)}
                                    onCheckedChange={() => toggleSupplement(itemIndex, supp.id)}
                                    id={`${itemIndex}-${supp.id}`}
                                  />
                                  <Label htmlFor={`${itemIndex}-${supp.id}`} className="cursor-pointer text-sm">
                                    {supp.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label>Ingredients</Label>
                            <Textarea
                              value={item.custom_ingredients_text}
                              onChange={(e) => updateItem(itemIndex, 'custom_ingredients_text', e.target.value)}
                              placeholder="Enter full ingredients list"
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {['energy_kcal', 'protein_g', 'carbs_g', 'sugars_g', 'fibre_g', 'fat_g', 'sat_fat_g', 'trans_fat_g', 'sodium_mg'].map((field) => (
                              <div key={field}>
                                <Label className="text-xs">{field.replace('_', ' ')}</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={item.custom_nutrition[field]}
                                  onChange={(e) => {
                                    const newNutrition = { ...item.custom_nutrition, [field]: parseFloat(e.target.value) || 0 };
                                    updateItem(itemIndex, 'custom_nutrition', newNutrition);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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
                data-testid="save-order-button"
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

export default OrderManagement;
