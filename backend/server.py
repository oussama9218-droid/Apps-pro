from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, Response
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

# Phase 2: Client Management Models
class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    siret: Optional[str] = None
    address: str
    phone: Optional[str] = None
    notes: Optional[str] = None

class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: str
    siret: Optional[str] = None
    address: str
    phone: Optional[str] = None
    notes: Optional[str] = None
    total_invoices: int = 0
    total_amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Phase 2: Enhanced Invoice Models
class InvoiceCreate(BaseModel):
    client_id: Optional[str] = None  # Link to client or manual entry
    client_name: str
    client_email: str
    client_address: str
    amount_ht: float
    description: str
    due_date: Optional[datetime] = None

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    client_id: Optional[str] = None
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
    pdf_path: Optional[str] = None  # Path to generated PDF
    reminder_count: int = 0  # Number of reminders sent
    last_reminder_date: Optional[datetime] = None

# Phase 2: Reminder System Models
class ReminderCreate(BaseModel):
    invoice_id: str
    type: str  # "gentle", "firm", "final"
    send_date: datetime

class Reminder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    invoice_id: str
    type: str  # "gentle", "firm", "final"
    subject: str
    message: str
    sent_date: datetime
    email_sent: bool = False
    push_sent: bool = False

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

# Phase 2: Notification Models
class NotificationCreate(BaseModel):
    type: str  # "urssaf_reminder", "vat_alert", "invoice_reminder"
    title: str
    message: str
    schedule_date: datetime
    invoice_id: Optional[str] = None

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    title: str
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_date: datetime
    sent_date: Optional[datetime] = None
    read_date: Optional[datetime] = None
    invoice_id: Optional[str] = None

# Health Check
@api_router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database": "connected"
    }

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

# Phase 2: Client Management Routes
@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, user_id: str = Depends(verify_token)):
    # Check if client with same email already exists for this user
    existing_client = await db.clients.find_one({"user_id": user_id, "email": client_data.email})
    if existing_client:
        raise HTTPException(status_code=400, detail="Un client avec cet email existe déjà")
    
    client_dict = client_data.model_dump()
    client_obj = Client(user_id=user_id, **client_dict)
    
    await db.clients.insert_one(client_obj.model_dump())
    return client_obj

@api_router.get("/clients", response_model=List[Client])
async def get_clients(user_id: str = Depends(verify_token)):
    clients = await db.clients.find({"user_id": user_id}).sort("name", 1).to_list(100)
    return [Client(**client) for client in clients]

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, user_id: str = Depends(verify_token)):
    client_doc = await db.clients.find_one({"id": client_id, "user_id": user_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    return Client(**client_doc)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientCreate, user_id: str = Depends(verify_token)):
    update_dict = client_data.model_dump()
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.clients.update_one(
        {"id": client_id, "user_id": user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    updated_client = await db.clients.find_one({"id": client_id, "user_id": user_id})
    return Client(**updated_client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user_id: str = Depends(verify_token)):
    # Check if client has invoices
    invoice_count = await db.invoices.count_documents({"user_id": user_id, "client_id": client_id})
    if invoice_count > 0:
        raise HTTPException(status_code=400, detail=f"Impossible de supprimer : {invoice_count} facture(s) liée(s) à ce client")
    
    result = await db.clients.delete_one({"id": client_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
# Phase 2: Reminder System Routes
@api_router.post("/invoices/{invoice_id}/reminders")
async def send_invoice_reminder(invoice_id: str, user_id: str = Depends(verify_token)):
    # Get invoice
    invoice_doc = await db.invoices.find_one({"id": invoice_id, "user_id": user_id})
    if not invoice_doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    invoice = Invoice(**invoice_doc)
    
    if invoice.status == "paid":
        raise HTTPException(status_code=400, detail="Cette facture est déjà payée")
    
    # Determine reminder type based on days overdue and previous reminders
    days_overdue = 0
    if invoice.due_date:
        days_overdue = (datetime.utcnow() - invoice.due_date).days
    
    reminder_type = "gentle"
    if invoice.reminder_count >= 1:
        reminder_type = "firm"
    elif invoice.reminder_count >= 2:
        reminder_type = "final"
    
    # Create reminder record
    reminder = Reminder(
        user_id=user_id,
        invoice_id=invoice_id,
        type=reminder_type,
        subject=f"Rappel facture {invoice.invoice_number}",
        message=f"Rappel pour la facture {invoice.invoice_number} de {invoice.amount_ttc}€",
        sent_date=datetime.utcnow(),
        email_sent=True,  # Mock email send
        push_sent=True    # Mock push notification
    )
    
    await db.reminders.insert_one(reminder.model_dump())
    
    # Update invoice reminder count and status
    new_reminder_count = invoice.reminder_count + 1
    new_status = invoice.status
    
    if days_overdue > 0 and invoice.status != "overdue":
        new_status = "overdue"
    
    await db.invoices.update_one(
        {"id": invoice_id, "user_id": user_id},
        {
            "$set": {
                "reminder_count": new_reminder_count,
                "last_reminder_date": datetime.utcnow(),
                "status": new_status
            }
        }
    )
    
    return {
        "message": f"Relance {reminder_type} envoyée avec succès",
        "reminder_type": reminder_type,
        "reminder_count": new_reminder_count
    }

@api_router.get("/invoices/{invoice_id}/reminders")
async def get_invoice_reminders(invoice_id: str, user_id: str = Depends(verify_token)):
    reminders = await db.reminders.find({
        "user_id": user_id,
        "invoice_id": invoice_id
    }).sort("sent_date", -1).to_list(10)
    
    return [Reminder(**reminder) for reminder in reminders]

# Phase 2: Notification System Routes
@api_router.get("/notifications")
async def get_notifications(user_id: str = Depends(verify_token)):
    notifications = await db.notifications.find({
        "user_id": user_id
    }).sort("created_at", -1).limit(20).to_list(20)
    
    return [Notification(**notification) for notification in notifications]

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_id: str = Depends(verify_token)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"read_date": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    return {"message": "Notification marquée comme lue"}

# Phase 2: Mock notification scheduler (in real app, this would be a background task)
@api_router.post("/mock/schedule-notifications")
async def schedule_mock_notifications(user_id: str = Depends(verify_token)):
    # Get user profile for URSSAF periodicity
    profile = await db.profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    
    notifications_created = 0
    
    # URSSAF reminders
    if profile["urssaf_periodicity"] == "monthly":
        # Monthly URSSAF reminder for next month
        next_month = datetime.now().replace(day=15) + timedelta(days=32)
        next_month = next_month.replace(day=15)  # 15th of next month
        
        for days_before in [7, 3, 0]:
            notification_date = next_month - timedelta(days=days_before)
            
            notification = Notification(
                user_id=user_id,
                type="urssaf_reminder",
                title=f"Rappel URSSAF - J{-days_before if days_before > 0 else ''}",
                message=f"N'oubliez pas votre déclaration URSSAF mensuelle (échéance: {next_month.strftime('%d/%m/%Y')})",
                scheduled_date=notification_date
            )
            
            await db.notifications.insert_one(notification.model_dump())
            notifications_created += 1
    
    # VAT threshold alert (mock)
    current_revenue = 15000  # Mock current revenue
    vat_threshold = profile.get("vat_threshold", 36800)
    threshold_percent = (current_revenue / vat_threshold) * 100
    
    if threshold_percent > 70:
        notification = Notification(
            user_id=user_id,
            type="vat_alert",
            title="Alerte seuil TVA",
            message=f"Attention: vous avez atteint {threshold_percent:.1f}% du seuil de franchise TVA",
            scheduled_date=datetime.utcnow()
        )
        
        await db.notifications.insert_one(notification.model_dump())
        notifications_created += 1
    
    return {"message": f"{notifications_created} notifications programmées"}

# Phase 2: Auto-reminder system (mock - would be a background job)
@api_router.post("/mock/auto-reminders")
async def process_auto_reminders(user_id: str = Depends(verify_token)):
    # Find overdue invoices that need reminders
    overdue_date_j7 = datetime.utcnow() - timedelta(days=7)
    overdue_date_j14 = datetime.utcnow() - timedelta(days=14)
    
    invoices_j7 = await db.invoices.find({
        "user_id": user_id,
        "status": {"$in": ["sent", "overdue"]},
        "due_date": {"$lt": overdue_date_j7},
        "reminder_count": 0
    }).to_list(10)
    
    invoices_j14 = await db.invoices.find({
        "user_id": user_id,
        "status": "overdue",
        "due_date": {"$lt": overdue_date_j14},
        "reminder_count": 1
    }).to_list(10)
    
    reminders_sent = 0
    
    # Send J+7 gentle reminders
    for invoice_doc in invoices_j7:
        await send_invoice_reminder(invoice_doc["id"], user_id)
        reminders_sent += 1
    
    # Send J+14 firm reminders
    for invoice_doc in invoices_j14:
        await send_invoice_reminder(invoice_doc["id"], user_id)
        reminders_sent += 1
    
    return {"message": f"{reminders_sent} relances automatiques envoyées"}

# Phase 2: PDF Generation
def generate_invoice_pdf(invoice: Invoice, user_profile: dict, user_info: dict) -> bytes:
    """Generate PDF for invoice with French legal mentions"""
    buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        textColor=colors.HexColor('#007AFF')
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=12
    )
    
    # Invoice header
    story.append(Paragraph(f"FACTURE {invoice.invoice_number}", title_style))
    story.append(Spacer(1, 12))
    
    # User info (prestaire)
    user_info_text = f"""
    <b>{user_info['first_name']} {user_info['last_name']}</b><br/>
    Micro-entrepreneur<br/>
    Email: {user_info['email']}<br/>
    Activité: {user_profile['activity_type']}
    """
    story.append(Paragraph(user_info_text, header_style))
    story.append(Spacer(1, 20))
    
    # Client info
    client_info_text = f"""
    <b>Facturé à :</b><br/>
    {invoice.client_name}<br/>
    {invoice.client_address}<br/>
    Email: {invoice.client_email}
    """
    story.append(Paragraph(client_info_text, header_style))
    story.append(Spacer(1, 20))
    
    # Invoice details table
    data = [
        ['Description', 'Montant HT', 'TVA', 'Montant TTC'],
        [invoice.description, f"{invoice.amount_ht:.2f} €", f"{invoice.vat_amount:.2f} €", f"{invoice.amount_ttc:.2f} €"]
    ]
    
    table = Table(data, colWidths=[8*cm, 3*cm, 2*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#007AFF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    story.append(Spacer(1, 30))
    
    # Legal mentions
    if user_profile.get('vat_regime') == 'franchise':
        legal_text = "TVA non applicable, art. 293 B du CGI"
    else:
        legal_text = f"TVA applicable - Régime: {user_profile.get('vat_regime', 'Standard')}"
    
    story.append(Paragraph(f"<i>{legal_text}</i>", styles['Normal']))
    story.append(Spacer(1, 10))
    
    # Payment info
    if invoice.due_date:
        due_text = f"Date d'échéance: {invoice.due_date.strftime('%d/%m/%Y')}"
        story.append(Paragraph(due_text, styles['Normal']))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"Facture créée le {invoice.created_at.strftime('%d/%m/%Y')}", header_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

@api_router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(invoice_id: str, user_id: str = Depends(verify_token)):
    # Get invoice
    invoice_doc = await db.invoices.find_one({"id": invoice_id, "user_id": user_id})
    if not invoice_doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    # Get user profile and info
    profile_doc = await db.profiles.find_one({"user_id": user_id})
    user_doc = await db.users.find_one({"id": user_id})
    
    if not profile_doc or not user_doc:
        raise HTTPException(status_code=400, detail="Profil utilisateur requis")
    
    # Generate PDF
    invoice = Invoice(**invoice_doc)
    pdf_data = generate_invoice_pdf(invoice, profile_doc, user_doc)
    
    # Update invoice with PDF path (in a real system, save to S3/cloud storage)
    pdf_filename = f"facture_{invoice.invoice_number}_{datetime.now().strftime('%Y%m%d')}.pdf"
    await db.invoices.update_one(
        {"id": invoice_id, "user_id": user_id},
        {"$set": {"pdf_path": pdf_filename}}
    )
    
    # Return PDF as response
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={pdf_filename}"}
    )
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