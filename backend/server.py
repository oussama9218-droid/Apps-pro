from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
from bson import ObjectId
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret (in production, use environment variable)
JWT_SECRET = os.getenv("JWT_SECRET", "pilotage-micro-secret-2025")
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="Pilotage Micro API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Helper Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    first_name: str
    last_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_onboarded: bool = False

class UserProfileCreate(BaseModel):
    activity_type: str  # "BIC" or "BNC"
    urssaf_periodicity: str  # "monthly" or "quarterly"
    vat_regime: str  # "franchise", "simplified", "real"
    micro_threshold: float = 77700.0  # Default micro-entrepreneur threshold
    vat_threshold: float = 36800.0  # Default VAT franchise threshold
    previous_year_turnover: Optional[float] = None

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    activity_type: str
    urssaf_periodicity: str
    vat_regime: str
    micro_threshold: float
    vat_threshold: float
    previous_year_turnover: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InvoiceCreate(BaseModel):
    client_name: str
    client_email: str
    client_address: str
    amount_ht: float
    description: str
    due_date: Optional[datetime] = None

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    invoice_number: str
    client_name: str
    client_email: str
    client_address: str
    amount_ht: float
    vat_amount: float = 0.0
    amount_ttc: float
    description: str
    status: str = "draft"  # draft, sent, paid, overdue
    created_at: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None

class MockBankTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    description: str
    date: datetime
    counterparty: str
    is_revenue: bool = True
    matched_invoice_id: Optional[str] = None

class Obligation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # "urssaf_monthly", "urssaf_quarterly", "vat_quarterly", etc.
    title: str
    due_date: datetime
    status: str = "pending"  # pending, completed, overdue
    estimated_amount: Optional[float] = None
    checklist_items: List[str] = []

# Authentication Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict["password"] = hashed_password.decode('utf-8')
    user_obj = User(**{k: v for k, v in user_dict.items() if k != "password"})
    user_dict["id"] = user_obj.id
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    token = create_access_token({"user_id": user_obj.id})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_obj.model_dump()
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=400, detail="Identifiants invalides")
    
    # Verify password
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), user_doc["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Identifiants invalides")
    
    # Create user object (without password)
    user_dict = {k: v for k, v in user_doc.items() if k != "password"}
    user_obj = User(**user_dict)
    
    # Create access token
    token = create_access_token({"user_id": user_obj.id})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_obj.model_dump()
    }

@api_router.get("/auth/me")
async def get_current_user(user_id: str = Depends(verify_token)):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_dict = {k: v for k, v in user_doc.items() if k != "password"}
    return User(**user_dict)

# Profile Routes
@api_router.post("/profile", response_model=UserProfile)
async def create_profile(profile_data: UserProfileCreate, user_id: str = Depends(verify_token)):
    # Check if profile already exists
    existing_profile = await db.profiles.find_one({"user_id": user_id})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profil déjà créé")
    
    profile_dict = profile_data.model_dump()
    profile_obj = UserProfile(user_id=user_id, **profile_dict)
    
    await db.profiles.insert_one(profile_obj.model_dump())
    
    # Update user onboarded status
    await db.users.update_one({"id": user_id}, {"$set": {"is_onboarded": True}})
    
    return profile_obj

@api_router.get("/profile", response_model=UserProfile)
async def get_profile(user_id: str = Depends(verify_token)):
    profile_doc = await db.profiles.find_one({"user_id": user_id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    
    return UserProfile(**profile_doc)

@api_router.put("/profile", response_model=UserProfile)
async def update_profile(profile_data: UserProfileCreate, user_id: str = Depends(verify_token)):
    profile_dict = profile_data.model_dump()
    profile_dict["updated_at"] = datetime.utcnow()
    
    result = await db.profiles.update_one(
        {"user_id": user_id},
        {"$set": profile_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    
    updated_profile = await db.profiles.find_one({"user_id": user_id})
    return UserProfile(**updated_profile)

# Invoice Routes
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, user_id: str = Depends(verify_token)):
    # Get user profile for VAT calculation
    profile = await db.profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=400, detail="Profil utilisateur requis")
    
    # Generate invoice number
    count = await db.invoices.count_documents({"user_id": user_id})
    invoice_number = f"FAC-{datetime.now().year}-{count + 1:04d}"
    
    # Calculate VAT and total
    vat_amount = 0.0
    if profile["vat_regime"] != "franchise":
        vat_amount = invoice_data.amount_ht * 0.20  # 20% VAT for simplicity
    
    amount_ttc = invoice_data.amount_ht + vat_amount
    
    invoice_dict = invoice_data.model_dump()
    invoice_obj = Invoice(
        user_id=user_id,
        invoice_number=invoice_number,
        vat_amount=vat_amount,
        amount_ttc=amount_ttc,
        **invoice_dict
    )
    
    await db.invoices.insert_one(invoice_obj.model_dump())
    return invoice_obj

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(user_id: str = Depends(verify_token)):
    invoices = await db.invoices.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
    return [Invoice(**invoice) for invoice in invoices]

@api_router.put("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: str, user_id: str = Depends(verify_token)):
    if status not in ["draft", "sent", "paid", "overdue"]:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    update_data = {"status": status}
    if status == "paid":
        update_data["paid_at"] = datetime.utcnow()
    
    result = await db.invoices.update_one(
        {"id": invoice_id, "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    return {"message": "Statut mis à jour"}

# Dashboard Routes
@api_router.get("/dashboard")
async def get_dashboard(user_id: str = Depends(verify_token)):
    # Get user profile
    profile = await db.profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    
    # Calculate current year revenue
    start_of_year = datetime(datetime.now().year, 1, 1)
    invoices = await db.invoices.find({
        "user_id": user_id,
        "status": "paid",
        "paid_at": {"$gte": start_of_year}
    }).to_list(1000)
    
    current_revenue = sum(invoice["amount_ttc"] for invoice in invoices)
    
    # Calculate thresholds percentages
    micro_threshold_percent = (current_revenue / profile["micro_threshold"]) * 100
    vat_threshold_percent = (current_revenue / profile["vat_threshold"]) * 100
    
    # Get next obligations
    next_obligations = await db.obligations.find({
        "user_id": user_id,
        "status": "pending",
        "due_date": {"$gte": datetime.utcnow()}
    }).sort("due_date", 1).limit(5).to_list(5)
    
    # Mock bank transactions for simulation
    mock_transactions = [
        {
            "id": str(uuid.uuid4()),
            "amount": 1500.0,
            "description": "Virement - Client ABC",
            "date": datetime.now() - timedelta(days=5),
            "counterparty": "Client ABC"
        },
        {
            "id": str(uuid.uuid4()),
            "amount": 2300.0,
            "description": "Virement - Projet XYZ",
            "date": datetime.now() - timedelta(days=12),
            "counterparty": "Entreprise XYZ"
        },
        {
            "id": str(uuid.uuid4()),
            "amount": 850.0,
            "description": "Consultation freelance",
            "date": datetime.now() - timedelta(days=18),
            "counterparty": "StartupDEF"
        }
    ]
    
    return {
        "current_revenue": current_revenue,
        "micro_threshold": profile["micro_threshold"],
        "vat_threshold": profile["vat_threshold"],
        "micro_threshold_percent": min(micro_threshold_percent, 100),
        "vat_threshold_percent": min(vat_threshold_percent, 100),
        "next_obligations": [Obligation(**obligation) for obligation in next_obligations],
        "recent_transactions": mock_transactions,
        "activity_type": profile["activity_type"],
        "vat_regime": profile["vat_regime"],
        "urssaf_periodicity": profile["urssaf_periodicity"]
    }

# Mock data initialization
@api_router.post("/mock/init-obligations")
async def init_mock_obligations(user_id: str = Depends(verify_token)):
    # Get user profile
    profile = await db.profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    
    # Clear existing obligations
    await db.obligations.delete_many({"user_id": user_id})
    
    obligations = []
    
    # URSSAF obligations based on periodicity
    if profile["urssaf_periodicity"] == "monthly":
        for i in range(1, 4):
            obligations.append(Obligation(
                user_id=user_id,
                type="urssaf_monthly",
                title=f"Déclaration URSSAF mensuelle - {datetime.now().strftime('%B')}",
                due_date=datetime.now() + timedelta(days=15 + i*30),
                estimated_amount=450.0,
                checklist_items=[
                    "Se connecter sur urssaf.fr",
                    "Saisir le chiffre d'affaires du mois",
                    "Valider la déclaration",
                    "Effectuer le paiement des cotisations"
                ]
            ))
    else:
        obligations.append(Obligation(
            user_id=user_id,
            type="urssaf_quarterly",
            title="Déclaration URSSAF trimestrielle",
            due_date=datetime.now() + timedelta(days=25),
            estimated_amount=1350.0,
            checklist_items=[
                "Se connecter sur urssaf.fr",
                "Saisir le chiffre d'affaires du trimestre",
                "Valider la déclaration trimestrielle",
                "Effectuer le paiement des cotisations"
            ]
        ))
    
    # VAT obligations if not franchise
    if profile["vat_regime"] != "franchise":
        obligations.append(Obligation(
            user_id=user_id,
            type="vat_quarterly",
            title="Déclaration TVA trimestrielle",
            due_date=datetime.now() + timedelta(days=35),
            estimated_amount=800.0,
            checklist_items=[
                "Se connecter sur impots.gouv.fr",
                "Remplir la déclaration CA3",
                "Vérifier les montants HT et TVA",
                "Transmettre la déclaration",
                "Payer la TVA due"
            ]
        ))
    
    # Insert obligations
    if obligations:
        await db.obligations.insert_many([obs.model_dump() for obs in obligations])
    
    return {"message": f"{len(obligations)} obligations créées"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()