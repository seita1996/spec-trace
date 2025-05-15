# Authentication API Specification

## Overview

This document describes the authentication API endpoints.

### FS-001: Register User API

POST /api/auth/register

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

**Response:**
```json
{
  "userId": "string",
  "email": "string",
  "name": "string"
}
```

@test: e2e/api/auth.spec.ts#registerEndpointShouldCreateUser

### FS-002: Login API

POST /api/auth/login

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "userId": "string"
}
```

@test: e2e/api/auth.spec.ts#loginEndpointShouldReturnToken