import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# 10 Dummy SKUs with realistic Indian flour nutrition data
DUMMY_SKUS = [
    {
        "id": str(uuid.uuid4()),
        "sku_code": "WHEAT01",
        "name": "Whole Wheat Flour",
        "ingredients_text": "Whole Wheat Flour (100%)",
        "nutrition": {
            "energy_kcal": 346.0,
            "protein_g": 12.5,
            "carbs_g": 71.0,
            "sugars_g": 0.4,
            "fibre_g": 12.2,
            "fat_g": 1.7,
            "sat_fat_g": 0.3,
            "trans_fat_g": 0.0,
            "sodium_mg": 2.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "MULTI01",
        "name": "Multigrain Flour",
        "ingredients_text": "Wheat Flour (60%), Bajra Flour (20%), Ragi Flour (10%), Jowar Flour (10%)",
        "nutrition": {
            "energy_kcal": 341.0,
            "protein_g": 11.8,
            "carbs_g": 69.5,
            "sugars_g": 0.5,
            "fibre_g": 11.0,
            "fat_g": 2.1,
            "sat_fat_g": 0.4,
            "trans_fat_g": 0.0,
            "sodium_mg": 3.5
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "BESAN01",
        "name": "Bengal Gram Flour (Besan)",
        "ingredients_text": "Bengal Gram Flour (100%)",
        "nutrition": {
            "energy_kcal": 387.0,
            "protein_g": 22.0,
            "carbs_g": 57.8,
            "sugars_g": 10.8,
            "fibre_g": 10.8,
            "fat_g": 6.7,
            "sat_fat_g": 0.7,
            "trans_fat_g": 0.0,
            "sodium_mg": 64.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "RAGI01",
        "name": "Ragi Flour (Finger Millet)",
        "ingredients_text": "Ragi Flour (100%)",
        "nutrition": {
            "energy_kcal": 328.0,
            "protein_g": 7.3,
            "carbs_g": 72.0,
            "sugars_g": 0.0,
            "fibre_g": 11.5,
            "fat_g": 1.3,
            "sat_fat_g": 0.2,
            "trans_fat_g": 0.0,
            "sodium_mg": 11.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "JOWAR01",
        "name": "Jowar Flour (Sorghum)",
        "ingredients_text": "Jowar Flour (100%)",
        "nutrition": {
            "energy_kcal": 329.0,
            "protein_g": 10.4,
            "carbs_g": 70.7,
            "sugars_g": 0.0,
            "fibre_g": 9.7,
            "fat_g": 1.9,
            "sat_fat_g": 0.3,
            "trans_fat_g": 0.0,
            "sodium_mg": 7.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "BAJRA01",
        "name": "Bajra Flour (Pearl Millet)",
        "ingredients_text": "Bajra Flour (100%)",
        "nutrition": {
            "energy_kcal": 361.0,
            "protein_g": 11.6,
            "carbs_g": 67.5,
            "sugars_g": 0.0,
            "fibre_g": 11.5,
            "fat_g": 5.0,
            "sat_fat_g": 1.0,
            "trans_fat_g": 0.0,
            "sodium_mg": 10.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "OAT01",
        "name": "Oat Flour",
        "ingredients_text": "Oat Flour (100%)",
        "nutrition": {
            "energy_kcal": 404.0,
            "protein_g": 13.2,
            "carbs_g": 67.7,
            "sugars_g": 0.8,
            "fibre_g": 10.1,
            "fat_g": 9.1,
            "sat_fat_g": 1.6,
            "trans_fat_g": 0.0,
            "sodium_mg": 4.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "RICE01",
        "name": "Rice Flour",
        "ingredients_text": "Rice Flour (100%)",
        "nutrition": {
            "energy_kcal": 366.0,
            "protein_g": 5.9,
            "carbs_g": 80.1,
            "sugars_g": 0.1,
            "fibre_g": 2.4,
            "fat_g": 1.4,
            "sat_fat_g": 0.4,
            "trans_fat_g": 0.0,
            "sodium_mg": 0.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "QUINOA01",
        "name": "Quinoa Flour",
        "ingredients_text": "Quinoa Flour (100%)",
        "nutrition": {
            "energy_kcal": 368.0,
            "protein_g": 14.1,
            "carbs_g": 64.2,
            "sugars_g": 0.0,
            "fibre_g": 7.0,
            "fat_g": 6.1,
            "sat_fat_g": 0.7,
            "trans_fat_g": 0.0,
            "sodium_mg": 5.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "sku_code": "AMARANTH01",
        "name": "Amaranth Flour",
        "ingredients_text": "Amaranth Flour (100%)",
        "nutrition": {
            "energy_kcal": 371.0,
            "protein_g": 13.6,
            "carbs_g": 65.2,
            "sugars_g": 1.7,
            "fibre_g": 6.7,
            "fat_g": 7.0,
            "sat_fat_g": 1.5,
            "trans_fat_g": 0.0,
            "sodium_mg": 4.0
        }
    }
]

# 3 Dummy Supplements (nutrition per 100g of the supplement itself)
DUMMY_SUPPLEMENTS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Flax Seeds Powder",
        "ingredients_text": "Flax Seeds Powder",
        "nutrition": {
            "energy_kcal": 534.0,
            "protein_g": 18.3,
            "carbs_g": 28.9,
            "sugars_g": 1.6,
            "fibre_g": 27.3,
            "fat_g": 42.2,
            "sat_fat_g": 3.7,
            "trans_fat_g": 0.0,
            "sodium_mg": 30.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Chia Seeds Powder",
        "ingredients_text": "Chia Seeds Powder",
        "nutrition": {
            "energy_kcal": 486.0,
            "protein_g": 16.5,
            "carbs_g": 42.1,
            "sugars_g": 0.0,
            "fibre_g": 34.4,
            "fat_g": 30.7,
            "sat_fat_g": 3.3,
            "trans_fat_g": 0.0,
            "sodium_mg": 16.0
        }
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Protein Boost",
        "ingredients_text": "Whey Protein Isolate",
        "nutrition": {
            "energy_kcal": 370.0,
            "protein_g": 90.0,
            "carbs_g": 5.0,
            "sugars_g": 5.0,
            "fibre_g": 0.0,
            "fat_g": 1.0,
            "sat_fat_g": 0.5,
            "trans_fat_g": 0.0,
            "sodium_mg": 400.0
        }
    }
]

# 2 Dummy Orders with multiple items
DUMMY_ORDERS = [
    {
        "id": str(uuid.uuid4()),
        "order_number": "ORD-2024-001",
        "customer_first_name": "Rahul",
        "customer_last_name": "Sharma",
        "items": []  # Will be populated with 2 items
    },
    {
        "id": str(uuid.uuid4()),
        "order_number": "ORD-2024-002",
        "customer_first_name": "Priya",
        "customer_last_name": "Patel",
        "items": []  # Will be populated with 1 custom item
    }
]


async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Clear existing data
        await db.skus.delete_many({})
        await db.supplements.delete_many({})
        await db.orders.delete_many({})
        
        # Insert SKUs
        await db.skus.insert_many(DUMMY_SKUS)
        print(f"✓ Inserted {len(DUMMY_SKUS)} SKUs")
        
        # Insert Supplements
        await db.supplements.insert_many(DUMMY_SUPPLEMENTS)
        print(f"✓ Inserted {len(DUMMY_SUPPLEMENTS)} Supplements")
        
        # Prepare orders with real IDs
        wheat_sku = DUMMY_SKUS[0]
        multi_sku = DUMMY_SKUS[1]
        ragi_sku = DUMMY_SKUS[3]
        flax_supp = DUMMY_SUPPLEMENTS[0]
        chia_supp = DUMMY_SUPPLEMENTS[1]
        
        # Order 1: 2 items (95% Wheat + 5% Flax, 100% Multigrain)
        base_pct = 0.95
        supp_pct = 0.05
        
        item1 = {
            "id": str(uuid.uuid4()),
            "product_name": "Wheat with Flax Seeds",
            "base_sku_id": wheat_sku["id"],
            "supplement_ids": [flax_supp["id"]],
            "is_custom": False,
            "custom_ingredients_text": None,
            "custom_nutrition": None,
            "final_ingredients_text": f"{wheat_sku['name']} ({base_pct*100:.0f}%), {flax_supp['name']} ({supp_pct*100:.0f}%)",
            "final_nutrition": {
                "energy_kcal": wheat_sku["nutrition"]["energy_kcal"] * base_pct + flax_supp["nutrition"]["energy_kcal"] * supp_pct,
                "protein_g": wheat_sku["nutrition"]["protein_g"] * base_pct + flax_supp["nutrition"]["protein_g"] * supp_pct,
                "carbs_g": wheat_sku["nutrition"]["carbs_g"] * base_pct + flax_supp["nutrition"]["carbs_g"] * supp_pct,
                "sugars_g": wheat_sku["nutrition"]["sugars_g"] * base_pct + flax_supp["nutrition"]["sugars_g"] * supp_pct,
                "fibre_g": wheat_sku["nutrition"]["fibre_g"] * base_pct + flax_supp["nutrition"]["fibre_g"] * supp_pct,
                "fat_g": wheat_sku["nutrition"]["fat_g"] * base_pct + flax_supp["nutrition"]["fat_g"] * supp_pct,
                "sat_fat_g": wheat_sku["nutrition"]["sat_fat_g"] * base_pct + flax_supp["nutrition"]["sat_fat_g"] * supp_pct,
                "trans_fat_g": wheat_sku["nutrition"]["trans_fat_g"] * base_pct + flax_supp["nutrition"]["trans_fat_g"] * supp_pct,
                "sodium_mg": wheat_sku["nutrition"]["sodium_mg"] * base_pct + flax_supp["nutrition"]["sodium_mg"] * supp_pct
            }
        }
        
        item2 = {
            "id": str(uuid.uuid4()),
            "product_name": "Pure Multigrain",
            "base_sku_id": multi_sku["id"],
            "supplement_ids": [],
            "is_custom": False,
            "custom_ingredients_text": None,
            "custom_nutrition": None,
            "final_ingredients_text": multi_sku["ingredients_text"],
            "final_nutrition": multi_sku["nutrition"]
        }
        
        DUMMY_ORDERS[0]["items"] = [item1, item2]
        
        # Order 2: 1 custom item
        item3 = {
            "id": str(uuid.uuid4()),
            "product_name": "Custom Premium Blend",
            "base_sku_id": None,
            "supplement_ids": [],
            "is_custom": True,
            "custom_ingredients_text": "Custom Premium Blend: Wheat (50%), Ragi (25%), Quinoa (25%)",
            "custom_nutrition": {
                "energy_kcal": 350.0,
                "protein_g": 13.0,
                "carbs_g": 68.0,
                "sugars_g": 0.3,
                "fibre_g": 10.5,
                "fat_g": 3.2,
                "sat_fat_g": 0.5,
                "trans_fat_g": 0.0,
                "sodium_mg": 5.0
            },
            "final_ingredients_text": "Custom Premium Blend: Wheat (50%), Ragi (25%), Quinoa (25%)",
            "final_nutrition": {
                "energy_kcal": 350.0,
                "protein_g": 13.0,
                "carbs_g": 68.0,
                "sugars_g": 0.3,
                "fibre_g": 10.5,
                "fat_g": 3.2,
                "sat_fat_g": 0.5,
                "trans_fat_g": 0.0,
                "sodium_mg": 5.0
            }
        }
        
        DUMMY_ORDERS[1]["items"] = [item3]
        
        # Insert Orders
        await db.orders.insert_many(DUMMY_ORDERS)
        print(f"✓ Inserted {len(DUMMY_ORDERS)} Orders")
        
        print("\n✓ Database seeded successfully!")
        print("\nDemo Credentials:")
        print("Admin: admin@nutrition.com / admin123")
        print("\nDemo Orders:")
        print("Order 1: ORD-2024-001, Last Name: Sharma")
        print("Order 2: ORD-2024-002, Last Name: Patel")
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
