import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# 1. Inicialización de la aplicación FastAPI
app = FastAPI(
    title="Plataforma Web PWA",
    description="Servidor optimizado para producción en Render",
    version="1.0.0"
)

# 2. Configuración de CORS (Evita bloqueos cuando clientes o PayPal hagan peticiones)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite peticiones desde cualquier origen/dispositivo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Soporte para archivos estáticos (imágenes, CSS, JS) si existen en la carpeta "static"
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# 4. Manejador global para verificar que el servidor está vivo (Health check para Render)
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Servidor funcionando perfectamente"}

# 5. Ruta principal que carga tu interfaz (Frontend)
@app.get("/", response_class=HTMLResponse)
def home():
    # Intenta leer el archivo index.html local si existe, de lo contrario sirve una plantilla base sin errores
    if os.path.exists("index.html"):
        with open("index.html", "r", encoding="utf-8") as file:
            return HTMLResponse(content=file.read())
    
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Aplicación Web</title>
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; background-color: #f4f4f9; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 90vh; }
            .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
            h1 { color: #111; margin-bottom: 10px; }
            p { color: #555; line-height: 1.5; }
            .status { display: inline-block; padding: 6px 12px; background: #e6f4ea; color: #137333; border-radius: 20px; font-weight: bold; font-size: 14px; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>¡Servidor 100% Estable!</h1>
            <p>La base de tu aplicación está lista, blindada contra errores y lista para cargar tu diseño e integraciones.</p>
            <div class="status">● Sistema En Línea</div>
        </div>
    </body>
    </html>
    """)

# 6. Modelo de datos y ruta para recibir pagos (PayPal / Webhooks)
class PagoModel(BaseModel):
    orderID: str
    monto: str | None = None
    usuario: str | None = None

@app.post("/api/confirmar-pago")
def confirmar_pago(datos: PagoModel):
    try:
        # Registro en consola para verificar recepción de datos
        print(f"[PAGO RECIBIDO] Orden: {datos.orderID} | Monto: {datos.monto}")
        return JSONResponse(status_code=200, content={"status": "exitoso", "orderID": datos.orderID})
    except Exception as e:
        print(f"[ERROR EN PAGO] {str(e)}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Error interno procesando el pago"})
