# API Specification

# ComplaintMe AI

Version: 0.1.0

Architecture: REST API

Status: Planning

---

# Overview

ComplaintMe AI follows an API-first architecture.

Every frontend feature communicates through REST APIs.

The frontend is considered one client of the backend.

Future clients include:

- Mobile Apps
- Enterprise Integrations
- Internal Dashboards
- Third-party Systems

---

# Base URL

/api/v1/

---

# Authentication

Authentication Provider

Supabase

Authorization

Bearer JWT Token

Example

Authorization: Bearer <JWT_TOKEN>

---

# Authentication APIs

## Register

POST

/auth/register

Request

```json
{
  "email": "user@example.com",
  "password": "********"
}
```

Response

```json
{
  "success": true,
  "message": "Registration successful."
}
```

---

## Login

POST

/auth/login

Request

```json
{
  "email": "user@example.com",
  "password": "********"
}
```

Response

```json
{
  "access_token": "...",
  "user": {
    "id": "...",
    "email": "..."
  }
}
```

---

## Logout

POST

/auth/logout

---

# Complaint APIs

## Create Complaint

POST

/complaints

Request

```json
{
  "description": "My internet has been down for four days.",
  "location": "Pune",
  "image": null
}
```

Response

```json
{
  "complaint_id": "123",
  "status": "Pending Analysis"
}
```

---

## Get Complaint

GET

/complaints/{id}

---

## Get My Complaints

GET

/complaints

---

## Update Complaint

PUT

/complaints/{id}

---

## Delete Complaint

DELETE

/complaints/{id}

---

# Analysis APIs

## Analyze Complaint

POST

/analysis

Request

```json
{
  "complaint_id": "123"
}
```

Response

```json
{
  "category": "Internet",
  "company": "Jio Fiber",
  "priority": "High",
  "sentiment": "Negative",
  "expectation": "Reliable internet",
  "actual_outcome": "No connection",
  "gap_score": 90,
  "summary": "Internet unavailable for four days."
}
```

---

## Reanalyze Complaint

POST

/analysis/retry

---

# Dashboard APIs

## Dashboard Overview

GET

/dashboard

Response

```json
{
  "total_complaints": 20,
  "resolved": 12,
  "pending": 8,
  "average_gap_score": 68
}
```

---

# Admin APIs

## Get Users

GET

/admin/users

---

## Get All Complaints

GET

/admin/complaints

---

## Update Complaint Status

PATCH

/admin/complaints/{id}

---

## Analytics

GET

/admin/analytics

---

# Future Enterprise APIs

## Public Analysis API

POST

/public/analyze

Purpose

Allow companies to analyze complaints using Cortexa.

Request

```json
{
  "text": "Customer complaint..."
}
```

Response

Structured AI analysis.

---

# Standard Response Format

Success

```json
{
  "success": true,
  "data": {}
}
```

Failure

```json
{
  "success": false,
  "message": "Validation failed."
}
```

---

# HTTP Status Codes

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# Rate Limits

Authenticated Users

100 requests/minute

Future Enterprise API

Configurable per API Key

---

# Versioning

Current Version

v1

Future

v2

v3

---

# API Design Principles

- RESTful
- Stateless
- JSON Responses
- Versioned
- Secure
- Consistent Error Handling
- API-first Development

---

# Future Integrations

- Slack
- Microsoft Teams
- Zendesk
- Freshdesk
- Salesforce
- HubSpot
