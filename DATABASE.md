# Database Design

# ComplaintMe AI

**Version:** 0.1.0

**Database:** PostgreSQL

**Architecture:** Relational (Normalized)

**Status:** Approved

---

# Overview

ComplaintMe AI is designed using a normalized relational database that separates user-generated data from AI-generated intelligence.

The architecture supports:

- Multiple AI analyses per complaint
- AI model versioning
- Organization mapping
- Future enterprise integrations
- Historical tracking
- Auditability
- Scalability

---

# Entity Relationship Diagram

```
                           Users
                             │
                             │ 1:N
                             ▼
                        Complaints
                    ┌──────┼───────────┐
                    │      │           │
                    ▼      ▼           ▼
              Organizations  Attachments
                    │
                    ▼
            Complaint Categories

Complaints
      │
      │ 1:N
      ▼
Complaint AI Analysis
      │
      ├─────────────┐
      ▼             ▼
Expectation Gap   Complaint Tags

Complaints
      │
      ▼
Status History

Users
      │
      ▼
Audit Logs
```

---

# Core Tables

---

## users

Stores all registered users.

### Fields

- id (UUID)
- full_name
- email
- role
- created_at
- updated_at

### Roles

- User
- Admin
- Moderator

---

## organizations

Stores companies, institutions, and government departments.

### Fields

- id (UUID)
- name
- organization_type
- industry
- website (nullable)
- created_at
- updated_at

### Examples

- Jio
- Amazon
- Airtel
- Karnataka Electricity Board
- XYZ University

---

## complaint_categories

Stores predefined complaint categories.

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
- organization_id (FK, nullable)
- category_id (FK, nullable)
- title (nullable)
- description
- language
- source
- current_status
- created_at
- updated_at
- deleted_at (nullable)

### Sources

- Website
- Mobile App
- API
- Email
- Import

---

## complaint_ai_analysis

Stores every AI analysis generated for a complaint.

A complaint may have multiple AI analyses.

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

### Status

- Pending
- Completed
- Failed
- Retried

---

## expectation_gap

Stores expectation vs. reality measurements.

### Fields

- id (UUID)
- analysis_id (FK)
- expectation
- actual_outcome
- gap_score
- created_at

### Example

Expected Speed

100 Mbps

Actual Speed

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

- internet
- wifi
- router
- delay
- refund
- billing

---

## attachments

Stores uploaded files.

### Fields

- id (UUID)
- complaint_id (FK)
- file_url
- file_name
- file_type
- uploaded_at

### Supported Types

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

### Example

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
- Analysis Generated
- Admin Action

---

# Relationships

Users

1 → N

Complaints

Organizations

1 → N

Complaints

Complaint Categories

1 → N

Complaints

Complaints

1 → N

Complaint AI Analysis

Complaint AI Analysis

1 → N

Complaint Tags

Complaint AI Analysis

1 → 1

Expectation Gap

Complaints

1 → N

Attachments

Complaints

1 → N

Status History

Users

1 → N

Audit Logs

---

# AI Versioning Strategy

Complaint

↓

Analysis v1 (GPT)

↓

Analysis v2 (Claude)

↓

Analysis v3 (Improved Prompt)

Older analyses are never overwritten.

This enables:

- Model comparison
- Prompt comparison
- Regression testing
- AI auditing

---

# Indexes

Create indexes for:

- email
- user_id
- organization_id
- complaint_id
- category_id
- current_status
- language
- source
- created_at
- gap_score

---

# UUID Strategy

Every table uses UUIDs.

Never integer IDs.

---

# Soft Delete Strategy

Complaints should never be permanently removed.

Use

deleted_at

instead.

---

# Naming Convention

Primary Keys

id

Foreign Keys

<entity>_id

Examples

- user_id
- complaint_id
- category_id
- organization_id

---

# Timestamp Convention

Every table contains

- created_at
- updated_at

Optional

- deleted_at

---

# Design Principles

- Third Normal Form (3NF)
- API-First
- AI Data Isolation
- Versioned AI Analysis
- Auditability
- Enterprise Ready
- Scalable by Design

---

# Future Expansion

The database is intentionally designed to support future additions without major schema redesign.

Planned future modules include:

- Multi-Tenant Organizations
- Enterprise Dashboards
- Public API Keys
- Review Intelligence
- Survey Intelligence
- Employee Feedback Intelligence
- Voice Complaint Analysis
- AI Recommendation Engine

---

# Database Philosophy

User data and AI-generated intelligence are treated as separate domains.

User data represents facts.

AI data represents interpretations.

Keeping them independent ensures transparency, auditability, and future AI model improvements without data loss.
