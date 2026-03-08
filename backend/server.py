from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.getenv('MONGO_URL')
if not mongo_url:
    mongo_url = "mongodb+srv://flourma:Zerotoone1698@flourma.28ww0rg.mongodb.net/nutrition_db?retryWrites=true&w=majority&appName=flourma"
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv('DB_NAME', 'nutrition_db')]


# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'nutrition-app-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

security = HTTPBearer()

# Create the main app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api_router = APIRouter(prefix="/api")

# ============ Models ============

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    email: str

class NutritionData(BaseModel):
    energy_kcal: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    sugars_g: float = 0.0
    fibre_g: float = 0.0
    fat_g: float = 0.0
    sat_fat_g: float = 0.0
    trans_fat_g: float = 0.0
    sodium_mg: float = 0.0

class SKU(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sku_code: str
    name: str
    ingredients_text: str
    nutrition: NutritionData
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SKUCreate(BaseModel):
    sku_code: str
    name: str
    ingredients_text: str
    nutrition: NutritionData

class Supplement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    ingredients_text: str
    nutrition: NutritionData
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SupplementCreate(BaseModel):
    name: str
    ingredients_text: str
    nutrition: NutritionData

class OrderItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_name: str = ""
    base_sku_id: Optional[str] = None
    supplement_ids: List[str] = []
    is_custom: bool = False
    custom_ingredients_text: Optional[str] = None
    custom_nutrition: Optional[NutritionData] = None
    # Final computed values
    final_ingredients_text: str = ""
    final_nutrition: NutritionData = Field(default_factory=NutritionData)

class OrderItemCreate(BaseModel):
    product_name: str = ""
    base_sku_id: Optional[str] = None
    supplement_ids: List[str] = []
    is_custom: bool = False
    custom_ingredients_text: Optional[str] = None
    custom_nutrition: Optional[NutritionData] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_first_name: str
    customer_last_name: str
    items: List[OrderItem] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderCreate(BaseModel):
    order_number: str
    customer_first_name: str
    customer_last_name: str
    items: List[OrderItemCreate] = []

class LookupRequest(BaseModel):
    order_number: str
    last_name: str

class NutritionLabelResponse(BaseModel):
    customer_name: str
    order_number: str
    items: List[dict]  # List of {product_name, ingredients_text, nutrition}

class RDAValues(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default="default_rda")
    energy_kcal: float = 2000
    protein_g: float = 60
    carbs_g: float = 300
    fibre_g: float = 25
    fat_g: float = 65
    sat_fat_g: float = 20
    sodium_mg: float = 2300
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RDAUpdate(BaseModel):
    energy_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fibre_g: Optional[float] = None
    fat_g: Optional[float] = None
    sat_fat_g: Optional[float] = None
    sodium_mg: Optional[float] = None

# ============ Auth Helpers ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# ============ Nutrition Calculation ============

def calculate_proportional_nutrition(base: NutritionData, base_percentage: float, supplements: list[tuple[NutritionData, float]]) -> NutritionData:
    """
    Calculate proportional nutrition values where base + supplements = 100%
    base_percentage: percentage of base SKU (e.g., 0.95 for 95%)
    supplements: list of (nutrition_data, percentage) tuples (e.g., [(supp1, 0.05)])
    """
    result = NutritionData(
        energy_kcal=base.energy_kcal * base_percentage,
        protein_g=base.protein_g * base_percentage,
        carbs_g=base.carbs_g * base_percentage,
        sugars_g=base.sugars_g * base_percentage,
        fibre_g=base.fibre_g * base_percentage,
        fat_g=base.fat_g * base_percentage,
        sat_fat_g=base.sat_fat_g * base_percentage,
        trans_fat_g=base.trans_fat_g * base_percentage,
        sodium_mg=base.sodium_mg * base_percentage
    )
    
    # Add each supplement proportionally
    for supp_nutrition, supp_percentage in supplements:
        result.energy_kcal += supp_nutrition.energy_kcal * supp_percentage
        result.protein_g += supp_nutrition.protein_g * supp_percentage
        result.carbs_g += supp_nutrition.carbs_g * supp_percentage
        result.sugars_g += supp_nutrition.sugars_g * supp_percentage
        result.fibre_g += supp_nutrition.fibre_g * supp_percentage
        result.fat_g += supp_nutrition.fat_g * supp_percentage
        result.sat_fat_g += supp_nutrition.sat_fat_g * supp_percentage
        result.trans_fat_g += supp_nutrition.trans_fat_g * supp_percentage
        result.sodium_mg += supp_nutrition.sodium_mg * supp_percentage
    
    return result

async def calculate_item_nutrition(item_data: OrderItemCreate) -> tuple[str, str, NutritionData]:
    """Calculate final product name, ingredients and nutrition for an order item"""
    if item_data.is_custom:
        product_name = item_data.product_name or "Custom Blend"
        return product_name, item_data.custom_ingredients_text or "", item_data.custom_nutrition or NutritionData()
    
    # Get base SKU
    if not item_data.base_sku_id:
        raise HTTPException(status_code=400, detail="base_sku_id required for non-custom items")
    
    sku_doc = await db.skus.find_one({"id": item_data.base_sku_id}, {"_id": 0})
    if not sku_doc:
        raise HTTPException(status_code=404, detail="SKU not found")
    
    sku = SKU(**sku_doc)
    
    # If no supplements, return 100% base SKU
    if not item_data.supplement_ids:
        product_name = item_data.product_name or sku.name
        return product_name, sku.ingredients_text, sku.nutrition
    
    # Calculate proportions: each supplement gets 5%, base gets the rest
    num_supplements = len(item_data.supplement_ids)
    supplement_percentage_each = 0.05  # 5% per supplement
    total_supplement_percentage = num_supplements * supplement_percentage_each
    base_percentage = 1.0 - total_supplement_percentage
    
    if base_percentage <= 0:
        raise HTTPException(status_code=400, detail="Too many supplements. Maximum 19 supplements allowed per item.")
    
    # Get supplements and build ingredients list
    ingredients_parts = [f"{sku.name} ({base_percentage*100:.0f}%)"]
    supplement_data = []
    
    for supp_id in item_data.supplement_ids:
        supp_doc = await db.supplements.find_one({"id": supp_id}, {"_id": 0})
        if supp_doc:
            supplement = Supplement(**supp_doc)
            ingredients_parts.append(f"{supplement.name} ({supplement_percentage_each*100:.0f}%)")
            supplement_data.append((supplement.nutrition, supplement_percentage_each))
    
    # Calculate proportional nutrition
    final_nutrition = calculate_proportional_nutrition(sku.nutrition, base_percentage, supplement_data)
    final_ingredients = ", ".join(ingredients_parts)
    
    # Product name
    product_name = item_data.product_name or f"{sku.name} + Supplements"
    
    return product_name, final_ingredients, final_nutrition

# ============ Startup - Create Admin User & Default RDA ============

@app.on_event("startup")
async def startup_event():
    # Create dummy admin user if not exists
    admin_exists = await db.admin_users.find_one({"email": "admin@nutrition.com"}, {"_id": 0})
    if not admin_exists:
        admin = AdminUser(
            email="admin@nutrition.com",
            password_hash=hash_password("admin123")
        )
        await db.admin_users.insert_one(admin.model_dump())
        logger.info("Created admin user: admin@nutrition.com / admin123")
    
    # Create default RDA values if not exists
    rda_exists = await db.rda_settings.find_one({"id": "default_rda"}, {"_id": 0})
    if not rda_exists:
        default_rda = RDAValues()
        await db.rda_settings.insert_one(default_rda.model_dump())
        logger.info("Created default RDA values")

# ============ Auth Routes ============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    admin = await db.admin_users.find_one({"email": request.email}, {"_id": 0})
    if not admin or not verify_password(request.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": admin["email"]})
    return LoginResponse(token=token, email=admin["email"])

@api_router.get("/auth/verify")
async def verify(email: str = Depends(verify_token)):
    return {"email": email, "valid": True}

# ============ Public Routes ============

@api_router.get("/rda")
async def get_rda():
    """Public endpoint to get RDA values for nutrition label calculations"""
    rda = await db.rda_settings.find_one({"id": "default_rda"}, {"_id": 0})
    if not rda:
        # Return default values if not found
        return RDAValues().model_dump()
    return rda

@api_router.post("/lookup", response_model=NutritionLabelResponse)
async def lookup_order(request: LookupRequest):
    # Case-insensitive last name search using regex
    order = await db.orders.find_one(
        {
            "order_number": request.order_number,
            "customer_last_name": {"$regex": f"^{request.last_name}$", "$options": "i"}
        },
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_obj = Order(**order)
    
    # Format items for response
    items = []
    for item in order_obj.items:
        items.append({
            "product_name": item.product_name,
            "ingredients_text": item.final_ingredients_text,
            "nutrition": item.final_nutrition.model_dump()
        })
    
    return NutritionLabelResponse(
        customer_name=f"{order_obj.customer_first_name} {order_obj.customer_last_name}",
        order_number=order_obj.order_number,
        items=items
    )

# ============ Admin Routes - SKUs ============

@api_router.get("/skus", response_model=List[SKU])
async def get_skus(email: str = Depends(verify_token)):
    skus = await db.skus.find({}, {"_id": 0}).to_list(1000)
    return skus

@api_router.post("/skus", response_model=SKU)
async def create_sku(sku_data: SKUCreate, email: str = Depends(verify_token)):
    sku = SKU(**sku_data.model_dump())
    await db.skus.insert_one(sku.model_dump())
    return sku

@api_router.put("/skus/{sku_id}", response_model=SKU)
async def update_sku(sku_id: str, sku_data: SKUCreate, email: str = Depends(verify_token)):
    existing = await db.skus.find_one({"id": sku_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="SKU not found")
    
    updated = SKU(**sku_data.model_dump(), id=sku_id, created_at=existing["created_at"])
    await db.skus.replace_one({"id": sku_id}, updated.model_dump())
    return updated

@api_router.delete("/skus/{sku_id}")
async def delete_sku(sku_id: str, email: str = Depends(verify_token)):
    result = await db.skus.delete_one({"id": sku_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="SKU not found")
    return {"success": True}

# ============ Admin Routes - Supplements ============

@api_router.get("/supplements", response_model=List[Supplement])
async def get_supplements(email: str = Depends(verify_token)):
    supplements = await db.supplements.find({}, {"_id": 0}).to_list(1000)
    return supplements

@api_router.post("/supplements", response_model=Supplement)
async def create_supplement(supp_data: SupplementCreate, email: str = Depends(verify_token)):
    supplement = Supplement(**supp_data.model_dump())
    await db.supplements.insert_one(supplement.model_dump())
    return supplement

@api_router.put("/supplements/{supp_id}", response_model=Supplement)
async def update_supplement(supp_id: str, supp_data: SupplementCreate, email: str = Depends(verify_token)):
    existing = await db.supplements.find_one({"id": supp_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Supplement not found")
    
    updated = Supplement(**supp_data.model_dump(), id=supp_id, created_at=existing["created_at"])
    await db.supplements.replace_one({"id": supp_id}, updated.model_dump())
    return updated

@api_router.delete("/supplements/{supp_id}")
async def delete_supplement(supp_id: str, email: str = Depends(verify_token)):
    result = await db.supplements.delete_one({"id": supp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplement not found")
    return {"success": True}

# ============ Admin Routes - Orders ============

@api_router.get("/orders", response_model=List[Order])
async def get_orders(email: str = Depends(verify_token)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, email: str = Depends(verify_token)):
    # Check if order number already exists
    existing = await db.orders.find_one({"order_number": order_data.order_number}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Order number already exists")
    
    # Process each item
    order_items = []
    for item_data in order_data.items:
        product_name, final_ingredients, final_nutrition = await calculate_item_nutrition(item_data)
        
        order_item = OrderItem(
            product_name=product_name,
            base_sku_id=item_data.base_sku_id,
            supplement_ids=item_data.supplement_ids,
            is_custom=item_data.is_custom,
            custom_ingredients_text=item_data.custom_ingredients_text,
            custom_nutrition=item_data.custom_nutrition,
            final_ingredients_text=final_ingredients,
            final_nutrition=final_nutrition
        )
        order_items.append(order_item)
    
    order = Order(
        order_number=order_data.order_number,
        customer_first_name=order_data.customer_first_name,
        customer_last_name=order_data.customer_last_name,
        items=order_items
    )
    await db.orders.insert_one(order.model_dump())
    return order

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_data: OrderCreate, email: str = Depends(verify_token)):
    existing = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Process each item
    order_items = []
    for item_data in order_data.items:
        product_name, final_ingredients, final_nutrition = await calculate_item_nutrition(item_data)
        
        order_item = OrderItem(
            product_name=product_name,
            base_sku_id=item_data.base_sku_id,
            supplement_ids=item_data.supplement_ids,
            is_custom=item_data.is_custom,
            custom_ingredients_text=item_data.custom_ingredients_text,
            custom_nutrition=item_data.custom_nutrition,
            final_ingredients_text=final_ingredients,
            final_nutrition=final_nutrition
        )
        order_items.append(order_item)
    
    updated = Order(
        id=order_id,
        order_number=order_data.order_number,
        customer_first_name=order_data.customer_first_name,
        customer_last_name=order_data.customer_last_name,
        items=order_items,
        created_at=existing["created_at"]
    )
    await db.orders.replace_one({"id": order_id}, updated.model_dump())
    return updated

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, email: str = Depends(verify_token)):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True}

# ============ Admin Routes - RDA Settings ============

@api_router.get("/admin/rda", response_model=RDAValues)
async def get_rda_admin(email: str = Depends(verify_token)):
    """Admin endpoint to view current RDA settings"""
    rda = await db.rda_settings.find_one({"id": "default_rda"}, {"_id": 0})
    if not rda:
        return RDAValues()
    return RDAValues(**rda)

@api_router.put("/admin/rda", response_model=RDAValues)
async def update_rda(rda_update: RDAUpdate, email: str = Depends(verify_token)):
    """Admin endpoint to update RDA values"""
    existing = await db.rda_settings.find_one({"id": "default_rda"}, {"_id": 0})
    
    if not existing:
        # Create new if doesn't exist
        new_rda = RDAValues()
        await db.rda_settings.insert_one(new_rda.model_dump())
        existing = new_rda.model_dump()
    
    # Update only provided fields
    update_data = {k: v for k, v in rda_update.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.rda_settings.update_one(
            {"id": "default_rda"},
            {"$set": update_data}
        )
    
    # Fetch and return updated values
    updated = await db.rda_settings.find_one({"id": "default_rda"}, {"_id": 0})
    return RDAValues(**updated)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
