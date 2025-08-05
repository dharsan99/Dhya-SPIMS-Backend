# Password Reset Implementation

## Overview
This implementation adds secure password reset functionality to the TexIntelli SPIMS backend with the following features:

- **Forgot Password**: Generate reset token and send email
- **Reset Password**: Validate token and update password
- **Security Features**: Token expiration, one-time use, password validation

## API Endpoints

### 1. Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset link has been sent to your email."
}
```

### 2. Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "new_password"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

## Database Changes

Added two new fields to the `Users` model:
- `resetPasswordToken`: Stores the JWT token for password reset
- `resetPasswordExpires`: Stores the token expiration timestamp

## Security Features

1. **Token Expiration**: Tokens expire after 24 hours
2. **One-time Use**: Tokens are cleared after successful password reset
3. **Password Validation**: Minimum 8 characters required
4. **Email Security**: Doesn't reveal if email exists or not
5. **Token Verification**: Multiple layers of validation

## Implementation Details

### Service Layer (`services/auth.service.js`)
- `forgotPassword(email)`: Generates token, sends email, stores in DB
- `resetPassword(token, password)`: Validates token, updates password

### Controller Layer (`controllers/auth.controller.js`)
- `forgotPassword(req, res)`: Handles forgot password requests
- `resetPassword(req, res)`: Handles password reset requests

### Routes (`routes/auth.routes.js`)
- Added Swagger documentation for both endpoints
- Proper error handling and validation

## Email Template

The password reset email includes:
- Personalized greeting with user's name
- Clear call-to-action button
- Manual link for copy-paste
- Security warnings and expiration notice
- Professional branding

## Environment Variables Required

```env
EMAIL_FROM=your-email@gmail.com
EMAIL_PASS=your-app-password
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

## Testing

Run the test script to verify functionality:
```bash
node test_password_reset.js
```

## Database Migration

Execute the SQL script to add the new fields:
```sql
-- Add password reset fields to users table
ALTER TABLE users 
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpires" TIMESTAMP(6);
```

## Usage Flow

1. User requests password reset with email
2. System generates JWT token and stores in database
3. Email sent with reset link containing token
4. User clicks link and enters new password
5. System validates token and updates password
6. Token is cleared from database

## Error Handling

- Invalid/expired tokens return 400 error
- Missing fields return 400 error
- Weak passwords return 400 error
- Email sending failures are logged
- Database errors are handled gracefully

## Frontend Integration

The frontend should:
1. Provide a "Forgot Password" form
2. Handle the reset password form with token from URL
3. Show appropriate success/error messages
4. Redirect to login after successful reset 