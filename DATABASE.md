# Database Design

# ComplaintMe AI

**Version:** 0.1.0

**Database:** PostgreSQL

**Architecture:** Relational Database (3NF)

**Status:** Approved

---

# Overview

ComplaintMe AI is designed using a normalized PostgreSQL database that separates user-generated information from AI-generated intelligence.

The database is designed to support:

- Multiple AI analyses per complaint
- AI model upgrades
- Enterprise integrations
- Audit history
- Analytics
- Scalability
- Future SaaS expansion

---

# Entity Relationship Diagram

```
                          Users
                            │
                            │
                            ▼
                       Complaints
                 ┌─────────┼────────────┐
                 │         │            │
                 ▼         ▼            ▼
          Organizations Attachments Status History
                 │
                 ▼
         Complaint Categories

Complaints
      │
      ▼
Complaint AI Analysis
      │
      ├──────────────┐
      ▼              ▼
Expectation Gap  Complaint Tags

Users
      │
      ▼
Audit Logs
```

---

# Core Tables

---

## users

Stores registered users.

### Fields

- id (UUID)
- full_name
- email (Unique)
- role
- created_at
- updated_at

### Roles

- User
- Moderator
- Admin

---

## organizations

Stores companies, institutions and government departments.

### Fields

- id (UUID)
- name
- organization_type
- industry
- website (Nullable)
- created_at
- updated_at

### Examples

- Amazon
- Jio
- Airtel
- Karnataka Electricity Board
- XYZ University

---

## complaint_categories

Stores complaint categories.

### Fields

- id (UUID)
- name
- description
- created_at

### Examples

- Internet
- Banking
- Healthcare
- Water Supply
- Electricity
- Delivery

---

## complaints

Stores complaints submitted by users.

### Fields

- id (UUID)
- user_id (FK)
- organization_id (FK, Nullable)
- category_id (FK, Nullable)
- title (Nullable)
- description
- language
- source
- current_status
- created_at
- updated_at
- deleted_at (Nullable)

### Sources

- Website
- Mobile
- API
- Email
- Import

---

## complaint_ai_analysis

Stores every AI-generated analysis.

A single complaint may have multiple AI analyses.

### Fields

- id (UUID)
- complaint_id (FK)
- ai_provider
- ai_model
- analysis_version
- analysis_status
- category
- sentiment
- priority
- expectation
- actual_outcome
- gap_score
- summary
- confidence_score
- processing_time_ms
- prompt_version
- created_at

### Analysis Status

- Pending
- Completed
- Failed
- Retried

---

## expectation_gap

Stores expectation vs reality measurements.

### Fields

- id (UUID)
- analysis_id (FK)
- expectation
- actual_outcome
- gap_score
- created_at

### Example

Expected Internet Speed

100 Mbps

Actual Internet Speed

20 Mbps

Gap Score

80%

---

## complaint_tags

Stores AI-generated searchable tags.

### Fields

- id (UUID)
- analysis_id (FK)
- tag

### Example Tags

- wifi
- internet
- router
- delivery
- refund
- billing

---

## attachments

Stores uploaded complaint files.

### Fields

- id (UUID)
- complaint_id (FK)
- file_name
- file_url
- file_type
- uploaded_at

### Supported Files

- Images
- PDF
- Documents

---

## complaint_status_history

Tracks complaint status changes.

### Fields

- id (UUID)
- complaint_id (FK)
- old_status
- new_status
- updated_by
- updated_at

### Example Flow

Pending

↓

Under Review

↓

Resolved

↓

Closed

---

## audit_logs

Stores important system events.

### Fields

- id (UUID)
- user_id (FK)
- action
- entity
- entity_id
- ip_address
- created_at

### Example Actions

- Login
- Logout
- Complaint Created
- Complaint Updated
- AI Analysis Generated
- Admin Action

---

# Database Relationships

| Parent | Relationship | Child |
|---------|--------------|-------|
| Users | 1 → N | Complaints |
| Organizations | 1 → N | Complaints |
| Complaint Categories | 1 → N | Complaints |
| Complaints | 1 → N | Complaint AI Analysis |
| Complaint AI Analysis | 1 → 1 | Expectation Gap |
| Complaint AI Analysis | 1 → N | Complaint Tags |
| Complaints | 1 → N | Attachments |
| Complaints | 1 → N | Complaint Status History |
| Users | 1 → N | Audit Logs |

---

# AI Versioning Strategy

Every AI analysis is stored independently.

Example

Complaint

↓

GPT Analysis

↓

Claude Analysis

↓

Improved Prompt Analysis

No analysis is overwritten.

Benefits

- AI comparison
- Prompt comparison
- Regression testing
- Historical auditing

---

# Indexing Strategy

Indexes should be created for:

- email
- user_id
- organization_id
- category_id
- complaint_id
- current_status
- language
- source
- created_at
- gap_score

---

# UUID Strategy

Every table uses UUID primary keys.

Sequential integer IDs will not be used.

---

# Soft Delete Strategy

Complaints should never be permanently deleted.

Use:

- deleted_at

instead of removing records.

---

# Naming Convention

Primary Key

id

Foreign Keys

- user_id
- complaint_id
- category_id
- organization_id
- analysis_id

---

# Timestamp Convention

Every table contains:

- created_at
- updated_at

Optional:

- deleted_at

---

# Database Design Principles

- Third Normal Form (3NF)
- API First
- AI Data Isolation
- Versioned AI Analysis
- Auditability
- Scalability
- Enterprise Ready

---

# Future Expansion

This schema is intentionally designed to support future features without major restructuring.

Future modules include:

- Multi-Tenant Organizations
- Enterprise Dashboard
- Public API
- Review Intelligence
- Survey Intelligence
- Employee Feedback Intelligence
- Voice Complaint Analysis
- Recommendation Engine

---

# Database Philosophy

User data represents facts.

AI analysis represents interpretation.

These two domains remain independent to ensure transparency, traceability, and continuous AI improvements without modifying original complaint data.
