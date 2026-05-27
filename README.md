# Hora Dorada Prop House | App clientes

Maqueta navegable para catálogo público/semi-público de clientes.

## Estado actual

- Interfaz final base en `index.html`.
- Datos de prueba en `src/mock-data.js`.
- Funciones separadas para catálogo, cotización, fechas, formato de dinero y Airtable.
- Conexión directa a Airtable disponible solo para pruebas.

## Probar local

Abre `index.html` en el navegador o publica la carpeta en GitHub Pages.

## Conectar Airtable para pruebas

1. Abre la app.
2. Entra al botón de configuración.
3. Cambia el modo a `Airtable directo para pruebas`.
4. Agrega:
   - Base ID
   - Personal Access Token
   - Estados visibles
   - Nombres de tablas
5. Guarda y carga.

El token se guarda en `localStorage` del navegador y no se escribe en el repositorio. Esto sirve para probar, pero no es la arquitectura pública final.

## Campos esperados por defecto

### INVENTARIO

- `Nombre del prop`
- `Código único`
- `Estado`
- `Categoría`
- `Renta x 1 día`
- `Foto principal`

### RENTAS

- `Estado de la renta`
- `Fecha de salida`
- `Fecha de regreso`
- `Props rentados`

`Props rentados` debe ser un campo linked-record hacia `INVENTARIO`, para poder comparar IDs contra props seleccionados.

### SOLICITUDES

- `Nombre del cliente`
- `WhatsApp`
- `Notas`
- `Fecha de salida`
- `Fecha de regreso`
- `Días cobrados`
- `Props solicitados`
- `Subtotal`
- `IVA`
- `Total estimado`
- `Anticipo sugerido`
- `Estado`

## Antes de lanzamiento público

Mover las llamadas de Airtable a un backend serverless para proteger el token. La app ya tiene la capa separada en `src/airtable.js`, así que el cambio debe ser directo.
