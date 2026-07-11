# ComplaintMe AI Architecture

> **Version:** 0.1.0
>
> **Engine:** Cortexa
>
> **Architecture Style:** Modular Monolith
>
> **Status:** Design Phase

---

# Overview

ComplaintMe AI is built as a **Modular Monolith** with an API-first architecture.

The frontend is only one client of the backend.

The backend exposes reusable REST APIs that can later support:

- Web Applications
- Mobile Applications
- Enterprise Integrations
- Future SaaS Products

The intelligence layer is powered by **Cortexa**, a modular AI framework responsible for understanding, classifying, and structuring complaints.

---

# High Level Architecture

```
                 User
                  │
                  ▼
        ComplaintMe Frontend
           (Next.js 15)
                  │
        HTTPS REST API
                  │
                  ▼
         FastAPI Backend
                  │
        ┌─────────┼──────────┐
        ▼         ▼          ▼
 Authentication  Cortexa    Database
                 Engine
```

---

# System Components

## Frontend

Responsibilities

- Authentication
- Complaint Submission
- Dashboard
- Complaint History
- Admin Interface

Technology

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand

---

## Backend

Responsibilities

- Authentication Verification
- Complaint Processing
- AI Orchestration
- API Endpoints
- Database Access

Technology

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic

---

## Cortexa Engine

Cortexa is the AI orchestration layer.

Its responsibility is NOT to replace LLMs.

Instead it coordinates AI capabilities into one workflow.

Current Modules

- Complaint Classifier
- Entity Extraction
- Sentiment Analysis
- Priority Detection
- Expectation Extraction
- Complaint Summarizer

Future Modules

- Duplicate Complaint Detection
- Review Intelligence
- Voice Complaint Analysis
- Recommendation Engine

---

# Data Flow

```
User Complaint

      │

      ▼

Frontend

      │

      ▼

REST API

      │

      ▼

FastAPI

      │

      ▼

Cortexa

      │

      ▼

Structured Complaint

      │

      ▼

Database

      │

      ▼

Dashboard
```

---

# Backend Layering

```
API

↓

Services

↓

Repositories

↓

Database
```

Each layer has one responsibility.

Controllers never contain business logic.

Services never directly access the database.

Repositories never contain AI logic.

---

# AI Pipeline

```
Complaint

↓

Language Detection

↓

Cleaning

↓

Classification

↓

Entity Recognition

↓

Sentiment Analysis

↓

Expectation Extraction

↓

Priority Detection

↓

Summary Generation

↓

Structured JSON
```

---

# Database Design

Main Entities

- Users
- Complaints
- Complaint AI Analysis
- Categories
- Organizations
- Audit Logs

---

# Authentication

Authentication is managed by Supabase.

FastAPI only verifies JWT tokens.

This keeps authentication independent from business logic.

---

# API Design

Architecture Style

REST

Versioning

/api/v1/

Example

/api/v1/auth

/api/v1/complaints

/api/v1/dashboard

/api/v1/admin

/api/v1/analysis

---

# Folder Structure

```
ComplaintMe-AI/

frontend/

backend/

database/

docs/

assets/

scripts/

prompts/
```

---

# Security

- JWT Verification
- Passwords managed by Supabase
- HTTPS
- Input Validation
- SQL Injection Protection
- XSS Protection
- Rate Limiting

---

# Scalability

Current

Modular Monolith

Future

- API Gateway
- Queue Workers
- Multi-Tenant Support
- Enterprise APIs

---

# Design Principles

- Clean Architecture
- SOLID Principles
- Separation of Concerns
- API First
- AI Modularization
- Test Driven Design
- Scalability Before Complexity

---

# Future Vision

ComplaintMe AI is the first application powered by the Cortexa framework.

Future products may include

- Review Intelligence
- Survey Intelligence
- Customer Feedback Intelligence
- Employee Feedback Intelligence
- Voice Analytics

All powered by the same Cortexa engine.
