# ⚡ Vapers & Electrónica - Control de Stock y Ventas

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Una plataforma web moderna e interactiva diseñada para la **gestión integral de inventario, ventas y comisiones** en un negocio de venta de vapers y productos electrónicos. Este proyecto cuenta con una sincronización en tiempo real gracias a **Supabase** y un diseño de interfaz de usuario premium oscuro optimizado para dispositivos móviles y de escritorio.

---

## 🚀 Características Principales

- **📊 Dashboard Integral**: Indicadores clave de rendimiento (KPIs) financieros como Ganancia Realizada, Ganancia Potencial (inventario remanente + ganancias realizadas) y saldo de caja ajustable.
- **📦 Control de Inventario Inteligente**: 
  - Carga de productos detallando costos en dólares (USD) y precios de venta en pesos (ARS).
  - Cálculo automático de costos en ARS según la tasa de cotización del dólar configurada.
  - Alertas visuales de stock bajo y margen de ganancia insuficiente.
- **🤝 Gestión de Vendedores**:
  - Registro de vendedores colaboradores con sus respectivos porcentajes de comisión personalizados.
  - Asignación de ventas a vendedores con cálculo automático del monto de comisión y la ganancia neta.
- **📈 Proyecciones Financieras**:
  - Panel interactivo para simular el rendimiento del stock disponible.
  - Estimaciones del mejor escenario (ventas 100% directas) frente al peor escenario (ventas 100% a través de un vendedor seleccionado).
- **📝 Historial de Ventas Auditable**: Registro ordenado de transacciones con la opción de anular ventas (lo cual reintegra automáticamente el stock del producto).
- **⚙️ Configuración Personalizada**: Modificación en tiempo real del tipo de cambio USD/ARS, el margen mínimo de ganancia esperado y el umbral para las alertas de stock.

---

## 🛠️ Stack Tecnológico

- **Frontend**: [React 18](https://react.dev/) con [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Base de Datos y Backend**: [Supabase](https://supabase.com/) (PostgreSQL con políticas RLS activadas)

---

## 📁 Estructura del Proyecto

El código está organizado de forma modular siguiendo las mejores prácticas de React y TypeScript:

```text
projectControlStock/
├── supabase/               # Migraciones de base de datos y esquemas SQL
│   └── migrations/
├── src/
│   ├── components/         # Componentes de la interfaz de usuario (Dashboard, Ventas, Stock, etc.)
│   ├── hooks/              # Custom Hooks para interacción con Supabase y estado local
│   ├── lib/                # Configuración e inicialización del cliente de Supabase
│   ├── types/              # Definición de interfaces y tipos TypeScript
│   ├── utils/              # Funciones auxiliares y cálculos matemáticos/financieros
│   ├── App.tsx             # Componente raíz y control de pestañas principales
│   ├── main.tsx            # Punto de entrada de la aplicación
│   └── index.css           # Estilos globales y clases personalizadas
├── .env.example            # Plantilla para variables de entorno
├── tailwind.config.js      # Configuración de Tailwind CSS
└── vite.config.ts          # Configuración del empaquetador Vite
```

---

## 🗄️ Esquema de Base de Datos (Supabase)

El proyecto utiliza PostgreSQL en Supabase. A continuación se detallan las tablas necesarias para su funcionamiento (disponibles en la migración `supabase/migrations/`):

### 1. Tabla `config`
Almacena la configuración global de la aplicación (único registro con `id = 1`).
- `id`: `INTEGER` (Primary Key, Default: 1)
- `dolar_ars`: `DECIMAL(10,2)` (Cotización del dólar, Default: 1490.00)
- `margen_minimo`: `DECIMAL(5,2)` (Porcentaje de margen mínimo recomendado, Default: 30.00)
- `alerta_stock_bajo`: `INTEGER` (Cantidad mínima para disparar la alerta de stock, Default: 3)

### 2. Tabla `commissioners`
Almacena los datos de los vendedores.
- `id`: `UUID` (Primary Key, Default: gen_random_uuid())
- `name`: `TEXT` (Nombre del vendedor)
- `commission_percent`: `DECIMAL(5,2)` (Porcentaje de comisión acordado)

### 3. Tabla `products`
Almacena el catálogo de productos y compras.
- `id`: `UUID` (Primary Key)
- `name`: `TEXT` (Nombre o modelo del producto)
- `quantity`: `INTEGER` (Cantidad comprada)
- `cost_usd`: `DECIMAL(10,2)` (Costo unitario de compra en USD)
- `price_ars`: `DECIMAL(12,2)` (Precio unitario de venta al público en ARS)
- `stock_initial`: `INTEGER` (Stock inicial registrado)
- `units_sold`: `INTEGER` (Unidades vendidas asociadas a este lote)

### 4. Tabla `sales`
Registra cada transacción o venta realizada.
- `id`: `UUID` (Primary Key)
- `product_id`: `UUID` (Foreign Key -> `products.id`)
- `quantity`: `INTEGER` (Cantidad de unidades vendidas)
- `sale_type`: `TEXT` (Tipo de venta: `'direct'` o `'commissioner'`)
- `commissioner_id`: `UUID` (Foreign Key -> `commissioners.id`, opcional)
- `sale_price`: `DECIMAL(12,2)` (Monto total cobrado por la venta)
- `commission_amount`: `DECIMAL(12,2)` (Monto de comisión abonado)
- `net_profit`: `DECIMAL(12,2)` (Ganancia neta final de la transacción)
- `sold_at`: `TIMESTAMPTZ` (Fecha y hora de la venta)

> [!NOTE]
> Todas las tablas tienen habilitado **Row Level Security (RLS)** con políticas públicas de lectura y escritura para facilitar el desarrollo local y su despliegue inicial.

---

## 🛠️ Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### Prerrequisitos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
- Una cuenta en [Supabase](https://supabase.com/) con un proyecto creado.

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/projectControlStock.git
cd projectControlStock
```

### Paso 2: Configurar las Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto y añade tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_supabase_project_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### Paso 3: Inicializar la Base de Datos
Ejecuta la migración de base de datos provista en `supabase/migrations/20260611235113_001_initial_schema.sql` en el editor SQL de tu panel de Supabase para estructurar las tablas, insertar la configuración inicial y configurar las políticas RLS.

### Paso 4: Instalar las Dependencias
```bash
npm install
```

### Paso 5: Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible de forma local en la dirección provista en la terminal (usualmente `http://localhost:5173`).

---

## 📦 Producción y Construcción

Para generar el empaquetado optimizado para producción, ejecuta:
```bash
npm run build
```
Los archivos compilados se guardarán en la carpeta `dist/` y estarán listos para ser desplegados en plataformas de hosting como Vercel, Netlify o GitHub Pages.
