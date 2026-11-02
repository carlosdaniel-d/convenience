import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pydantic import BaseModel

app = FastAPI(title="convenienceIA API - Santo Domingo", version="3.0.0")

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

def cargar_negocios():
    if os.path.exists("negocios.json"):
        with open("negocios.json", "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.get("/health")
def health_check():
    negocios = cargar_negocios()
    return {"status": "ok", "total_negocios_cargados": len(negocios)}

@app.get("/", response_class=HTMLResponse)
def home():
    if os.path.exists("index.html"):
        with open("index.html", "r", encoding="utf-8") as file:
            return HTMLResponse(content=file.read())
    return HTMLResponse(content="<h1>convenienceIA Online</h1>")

@app.get("/manifest.json")
def get_manifest():
    if os.path.exists("manifest.json"):
        return FileResponse("manifest.json", media_type="application/json")
    return JSONResponse(status_code=404, content={"error": "Manifest no encontrado"})

@app.get("/service-worker.js")
def get_sw():
    if os.path.exists("service-worker.js"):
        return FileResponse("service-worker.js", media_type="application/javascript")
    return JSONResponse(status_code=404, content={"error": "Service Worker no encontrado"})

@app.get("/api/negocios")
def obtener_negocios():
    return {"negocios": cargar_negocios()}

@app.post("/api/dacliass")
def chat_dacliass(query: ChatQuery):
    texto = query.mensaje.lower()
    negocios = cargar_negocios()
    
    for n in negocios:
        if any(palabra in n["nombre"].lower() or palabra in n["categoria"].lower() for palabra in texto.split()):
            return {"respuesta": f"🤖 dAcliass: Encontré '{n['nombre']}' en {n.get('sector', 'Santo Domingo')}. Tienen {n['oferta']} ({n['item']}) con ruta exacta en el mapa."}
            
    return {"respuesta": f"🤖 dAcliass: Analicé tu búsqueda en Santo Domingo para '{query.mensaje}'. Tengo registrados comercios abiertos con precios transparentes y cupones listos."}

@app.post("/api/confirmar-pago")
def confirmar_pago(datos: PagoModel):
    return JSONResponse(status_code=200, content={"status": "exitoso", "orderID": datos.orderID, "mensaje": "Pago procesado y cupón generado correctamente."})
