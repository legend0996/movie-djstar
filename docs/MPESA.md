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

## Payment Flow

1. **Initiate Purchase** (`POST /api/payments/purchase`)
   - Frontend sends `{ movieId, phoneNumber }`
   - Backend creates order + transaction
   - Initiates STK Push to user's phone

2. **User Enters PIN**
   - User receives STK Push on Safaricom app
   - User enters M-Pesa PIN

3. **Callback** (`POST /api/payments/mpesa-callback`)
   - M-Pesa sends callback with result
   - Backend verifies callback structure
   - If successful: Add to library, generate receipt, send email
   - If failed: Update transaction status, notify user
   - Idempotent: Duplicate callbacks ignored

4. **Polling** (`GET /api/payments/status/:checkoutRequestId`)
   - Frontend can poll for status updates
   - Backend can also query M-Pesa for status

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
  "ResultCode": 0,
  "ResultDesc": "Already processed"
}
```

### Failed
```json
HTTP 200
{
  "ResultCode": 1,
  "ResultDesc": "Failure reason"
}
```

## Security

- Callbacks are validated for correct structure
- Idempotency prevents duplicate order processing
- Transaction reference tracking
- Separate payment logger for audit trail
- Callback data stored in database for reconciliation

## Transaction States

```
pending → processing → successful (completed)
pending → processing → failed (cancelled)
processing → expired (30-min timeout)
```

## Testing (Sandbox)

Use the Safaricom sandbox environment:
- Test phone: 254708374149
- Test PIN: 174379 (or use sandbox test PIN)
- Amounts below 100KSh work in sandbox
