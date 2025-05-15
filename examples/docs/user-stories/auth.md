# Authentication User Stories

## US-001: User Registration

As a new user, I want to register for an account so that I can access the system.

**Acceptance Criteria:**
1. User can enter email, password, and name
2. System validates email format
3. System checks for existing accounts with the same email
4. User receives confirmation email after successful registration

@test: src/auth/register.test.ts#shouldRegisterNewUser
@test: src/auth/register.test.ts#shouldValidateEmailFormat

## US-002: User Login

As a registered user, I want to log in to the system to access my account.

**Acceptance Criteria:**
1. User can enter email and password
2. System validates credentials
3. User is redirected to dashboard after successful login
4. System shows appropriate error messages for invalid credentials

@test: src/auth/login.test.ts#shouldLoginWithValidCredentials
@test: src/auth/login.test.ts#shouldShowErrorForInvalidCredentials