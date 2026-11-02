import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

app = FastAPI(title="convenienceIA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatQuery(BaseModel):
    mensaje: str

class PagoModel(BaseModel):
    orderID: str
    monto: str | None = None

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Servidor funcionando perfectamente"}

@app.get("/", response_class=HTMLResponse)
def home():
    if os.path.exists("index.html"):
        with open("index.html", "r", encoding="utf-8") as file:
            return HTMLResponse(content=file.read())
    return HTMLResponse(content="<h1>convenienceIA Online</h1>")

# Endpoint inteligente de dAcliass
@app.post("/api/dacliass")
def chat_dacliass(query: ChatQuery):
    texto = query.mensaje.lower()
    
    if "oferta" in texto or "descuento" in texto or "flash" in texto:
        respuesta = "🔥 Te recomiendo visitar 'Colmado & Más Express', tienen un descuento Flash del 20% activo ahora mismo."
    elif "burger" in texto or "hamburguesa" in texto or "comida" in texto:
        respuesta = "🍔 'Burger & Grill RD' tiene delivery gratis hoy. ¿Te gustaría ver su menú?"
    elif "bebida" in texto or "cerveza" in texto or "refresco" in texto:
        respuesta = "🍹 En 'Colmado & Más Express' encuentras bebidas frías con entrega rápida a 0.8 km."
    else:
        respuesta = f"¡Hola! Soy dAcliass. Entendí tu consulta sobre '{query.mensaje}'. Estoy rastreando los comercios cercanos para ofrecerte la mejor opción en tiempo real."
    
    return {"respuesta": respuesta}

@app.post("/api/confirmar-pago")
def confirmar_pago(datos: PagoModel):
    return JSONResponse(status_code=200, content={"status": "exitoso", "orderID": datos.orderID})
