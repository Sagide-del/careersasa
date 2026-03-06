# CareerSasa Backend

## Run
cd backend
npm install
copy .env.example .env
npm run dev

Backend runs on http://localhost:4000

## Endpoints used by frontend
- POST /auth/register
- POST /auth/login
- POST /payments/mpesa/stkpush
- POST /payments/mpesa/callback  (Daraja webhook)
- GET  /payments/me
- POST /assessment/submit
- GET  /results/:rid

## M-Pesa notes
- Use a public URL for MPESA_CALLBACK_URL (ngrok or deployed domain)
- Sandbox and Production base URLs handled via MPESA_ENV
