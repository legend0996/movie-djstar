# M-Pesa Integration

## Overview

Safaricom M-Pesa Buy Goods (CustomerPayBillOnline) for processing payments. Supports sandbox and production environments.

## Configuration

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa-callback
MPESA_TIMEOUT_URL=https://your-domain.com/api/payments/mpesa-timeout
```

For local development, use ngrok:
```bash
ngrok http 5000
```
Then set `MPESA_CALLBACK_URL=https://your-ngrok.ngrok.io/api/payments/mpesa-callback`.

## Payment Flow

1. **Initiate Purchase** (`POST /api/payments/purchase`)
   - Frontend sends `{ movieId, phoneNumber }`
   - Backend creates order (status: `pending`) + transaction (status: `pending`)
   - Initiates STK Push to user's phone via Safaricom API
   - Returns `orderId`, `transactionId`, `checkoutRequestID`

2. **User Enters PIN**
   - User receives STK Push on Safaricom app
   - User enters M-Pesa PIN

3. **Callback** (`POST /api/payments/mpesa-callback`)
   - Safaricom sends callback with `Body.stkCallback` containing `ResultCode`, `ResultDesc`, `TransactionDate`, `MpesaReceiptNumber`, etc.
   - Backend verifies callback structure
   - **Important**: `ResultCode` arrives as a **string** — always convert with `Number()` before comparison
   - **Important**: `TransactionDate` is `YYYYMMDDHHmmss` format — parse with `parseMpesaDate()` helper
   - If `ResultCode === 0` (success):
     - Update transaction status to `successful`, store M-Pesa receipt number
     - Update order status to `completed` and payment status to `paid`
     - Add movie to user's library via `libraryRepository.addToLibrary()`
     - Increment movie purchase count
     - Split revenue (developer commission / owner earnings)
     - Generate receipt record
   - If `ResultCode !== 0` (failure):
     - Update transaction status to `failed`, store error description
     - Update order status to `failed`
     - Notify user via in-app notification
   - **Idempotent**: Duplicate callbacks are safely ignored (transaction already processed)

4. **Timeout** (`POST /api/payments/mpesa-timeout`)
   - If user does not enter PIN within the timeout window
   - Backend queries M-Pesa for final status via `queryPaymentStatus()`
   - Updates transaction accordingly

5. **Polling** (`GET /api/payments/status/:checkoutRequestId`)
   - Frontend polls for status updates after STK push
   - Backend can also query M-Pesa directly for live status

## Callback Response

### Success
```json
HTTP 200
{
  "ResultCode": 0,
  "ResultDesc": "Success"
}
```

### Already Processed
```json
HTTP 200
{
  "ResultCode": "0",
  "ResultDesc": "Already processed"
}
```

### Failed
```json
HTTP 200
{
  "ResultCode": "1",
  "ResultDesc": "The amount is less than the set limit"
}
```

**Note**: Safaricom returns `ResultCode` as a **string**. Always use `Number(resultCode) === 0` for success checks.

## Security

- Callbacks are validated for correct structure (checks `Body.stkCallback` exists)
- Idempotency prevents duplicate order processing (checks transaction status before update)
- Transaction reference tracking via `checkoutRequestID` and `merchantRequestID`
- Separate payment logger (`paymentLogger`) for audit trail
- Callback data stored in database (`transaction.callbackData` JSON field) for reconciliation
- Webhook origin not verified (Safaricom IP whitelisting recommended in production)

## Transaction States

```
pending → processing → successful (completed)
pending → processing → failed (cancelled)
pending → processing → expired (30-minute timeout)
```

## Known Fixes (Critical)

1. **ResultCode type**: `Body.stkCallback.ResultCode` arrives as a **string** from Safaricom. Always convert with `Number(resultCode)` before comparison. See `handleCallback` and `queryPaymentStatus` in `paymentService.js`.

2. **TransactionDate format**: `Body.stkCallback.TransactionDate` is `YYYYMMDDHHmmss`. Use `parseMpesaDate(dateStr)` from `paymentService.js` to convert to a valid Date for storage.

3. **Stuck transactions**: If a transaction remains in `processing` state (e.g., ngrok was down and callback never arrived), run `scripts/fixStuckTransactions.js` to query M-Pesa for status and update accordingly.

## Testing (Sandbox)

Use the Safaricom sandbox environment:
- Test phone: 254708374149
- Test PIN: 174379 (or use sandbox test PIN)
- Amounts below 100KSh work in sandbox
- All movies priced at KES 20.00 (flat rate, no free movies)

### Ngrok Setup for Local Testing

```bash
# Terminal 1: Start ngrok
ngrok http 5000

# Terminal 2: Start backend
npm run dev

# Set MPESA_CALLBACK_URL in .env to your ngrok HTTPS URL
# e.g., MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/mpesa-callback
```
