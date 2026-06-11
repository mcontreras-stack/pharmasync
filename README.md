This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Backends de datos (elige por variables de entorno)

La app soporta **tres modos**, decididos por las variables de entorno (ver `.env.local.example`):

| Modo | Variables | Script SQL |
|---|---|---|
| **Demo (mock)** | ninguna | — (datos en `localStorage`, contraseña demo `123456`) |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y (en el servidor) `SUPABASE_SERVICE_ROLE_KEY` | `database/setup-supabase.sql` |
| **PostgreSQL directo** (tu servidor) | `DATABASE_URL`, `NEXT_PUBLIC_DATA_BACKEND=postgres` (opcional `DATABASE_SSL=true`) | `database/setup-postgres.sql` |

### Modo Supabase
1. Copia `.env.local.example` como `.env.local` y completa las claves (Supabase Studio → Project Settings → API).
2. Ejecuta `database/setup-supabase.sql` en el SQL Editor (es re-ejecutable; crea las 31 tablas, RLS, trigger de usuarios y políticas de admin).
3. La `SUPABASE_SERVICE_ROLE_KEY` (solo servidor) habilita en el panel admin: crear usuarios, resetear contraseñas y eliminar cuentas de Auth.

### Modo PostgreSQL (servidor propio)
1. Crea la base de datos y ejecuta: `psql "$DATABASE_URL" -f database/setup-postgres.sql`.
2. Define `DATABASE_URL` y `NEXT_PUBLIC_DATA_BACKEND=postgres` en el entorno.
3. Inicia sesión con el admin inicial `admin@pharmasync.local` / `cambiar123` y **cambia la contraseña** desde Usuarios → Resetear contraseña.
4. La autenticación usa contraseñas bcrypt y sesiones propias (tabla `sessions`); todo pasa por las rutas `/api` del servidor Next.js.

> Cobertura del modo PostgreSQL: autenticación, gestión de usuarios (admin), ficha de la madre, embarazos y bebés. Los módulos restantes (citas, recetas, chat) siguen disponibles vía Supabase o en modo demo.

En despliegues (Railway, Vercel, VPS) define esas mismas variables en el panel del servicio.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
