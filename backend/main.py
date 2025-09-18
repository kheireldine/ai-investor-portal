from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import List
from datetime import datetime, timedelta
import sqlite3
import os
import google.genai as genai

# --- CONFIG ---
SECRET_KEY = "supersecretkey123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="AI Investor Portal POC")

# --- CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE ---
conn = sqlite3.connect("investor_portal.db", check_same_thread=False)
c = conn.cursor()

# --- TABLES ---
c.execute("""
CREATE TABLE IF NOT EXISTS investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    name TEXT NOT NULL
)
""")
c.execute("""
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER,
    type TEXT,
    amount REAL,
    status TEXT,
    timestamp TEXT,
    FOREIGN KEY(investor_id) REFERENCES investors(id)
)
""")
c.execute("""
CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER,
    asset TEXT,
    quantity REAL,
    value REAL,
    FOREIGN KEY(investor_id) REFERENCES investors(id)
)
""")
conn.commit()

# --- MODELS ---
class InvestorCreate(BaseModel):
    email: str
    password: str
    name: str

class InvestorProfile(BaseModel):
    email: str
    name: str

class RequestCreate(BaseModel):
    type: str
    amount: float

class PortfolioItem(BaseModel):
    asset: str
    quantity: float
    value: float

class Token(BaseModel):
    access_token: str
    token_type: str

class AIPrompt(BaseModel):
    prompt: str

# --- UTILS ---
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_investor(email: str):
    c.execute("SELECT id, email, hashed_password, name FROM investors WHERE email=?", (email,))
    row = c.fetchone()
    if row:
        return {"id": row[0], "email": row[1], "hashed_password": row[2], "name": row[3]}
    return None

def get_current_investor(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    investor = get_investor(email)
    if investor is None:
        raise credentials_exception
    return investor

# --- ROUTES ---
@app.post("/signup", response_model=InvestorProfile)
def signup(investor: InvestorCreate):
    if get_investor(investor.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(investor.password)
    c.execute("INSERT INTO investors (email, hashed_password, name) VALUES (?, ?, ?)",
              (investor.email, hashed_password, investor.name))
    conn.commit()
    # Initialize a dummy portfolio
    investor_id = c.lastrowid
    c.execute("INSERT INTO portfolio (investor_id, asset, quantity, value) VALUES (?, ?, ?, ?)",
              (investor_id, "Stock A", 10, 1000))
    c.execute("INSERT INTO portfolio (investor_id, asset, quantity, value) VALUES (?, ?, ?, ?)",
              (investor_id, "Stock B", 5, 500))
    conn.commit()
    return {"email": investor.email, "name": investor.name}

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    investor = get_investor(form_data.username)
    if not investor or not verify_password(form_data.password, investor["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(
        data={"sub": investor["email"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/profile", response_model=InvestorProfile)
def profile(current_investor: dict = Depends(get_current_investor)):
    return {"email": current_investor["email"], "name": current_investor["name"]}

@app.get("/portfolio", response_model=List[PortfolioItem])
def portfolio(current_investor: dict = Depends(get_current_investor)):
    c.execute("SELECT asset, quantity, value FROM portfolio WHERE investor_id=?", (current_investor["id"],))
    items = c.fetchall()
    return [{"asset": i[0], "quantity": i[1], "value": i[2]} for i in items]

@app.post("/requests")
def create_request(request: RequestCreate, current_investor: dict = Depends(get_current_investor)):
    c.execute("INSERT INTO requests (investor_id, type, amount, status, timestamp) VALUES (?, ?, ?, ?, ?)",
              (current_investor["id"], request.type, request.amount, "pending", datetime.utcnow().isoformat()))
    conn.commit()
    return {"message": "Request submitted"}

@app.get("/requests")
def get_requests(current_investor: dict = Depends(get_current_investor)):
    c.execute("SELECT type, amount, status, timestamp FROM requests WHERE investor_id=?", (current_investor["id"],))
    rows = c.fetchall()
    return [{"type": r[0], "amount": r[1], "status": r[2], "timestamp": r[3]} for r in rows]

# --- AI ENDPOINT ---
os.environ["GEMINI_API_KEY"] = "AIzaSyAag51_DzjHFqH-mwl2kRiSUBOQgL-NxTI"
client = genai.Client()
class AIPrompt(BaseModel):
    prompt: str

# Example dependency
def get_current_investor():
    return {"id": 1, "name": "Test Investor"}

@app.post("/ai")
def ai_endpoint(payload: AIPrompt, current_investor: dict = Depends(get_current_investor)):
    # Always prepend a review/test instruction to ensure Markdown output
    enhanced_prompt = f"""{payload.prompt}\n\nPlease review and test this as Markdown and provide the output. You provide the output as  a code only without any explanation for example `
# Hello from AI

This is **bold text**, and this is _italic_.

- Item 1
- Item 2
- Item 3

\`\`\`javascript
console.log("Code block works!");
\`\`\`
Reminder: Recheck i want only code not text and review the code we will convert it to html ! 
`"""

    # Call your model
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=enhanced_prompt
    )

    # Extract the text from the first candidate
    text = response.candidates[0].content.parts[0].text
   

    # Optionally, you can wrap in a Markdown-safe object
    return {"response": str(text)}