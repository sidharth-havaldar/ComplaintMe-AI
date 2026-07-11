# Database Design

# ComplaintMe AI

Version: 0.1.0

Database: PostgreSQL

Architecture: Relational

Status: Planning

---

# Overview

ComplaintMe AI stores user complaints separately from AI-generated analysis.

This allows:

- Multiple AI analyses for one complaint
- Future AI model upgrades
- Analysis history
- Better auditing
- Enterprise integrations

---

# Database Relationships

```
User
 │
 │ 1:N
 ▼
Complaint
 │
 ├───────────────┐
 │               │
 ▼               ▼
AI Analysis   Attachment
 │
 ▼
Analysis History (Future)

Complaint
 │
 ▼
Status History

Complaint
 │
 ▼
Category
```

---

# Tables

## users

Stores registered users.

Fields

- id (UUID)
- full_name
- email
- created_at
- updated_at

---

## complaints

Stores user complaints.

Fields

- id
- user_id
- description
- current_status
- created_at
- updated_at

Relationship

One User

↓

Many Complaints

---

## complaint_ai_analysis

Stores every AI analysis.

Relationship

One Complaint

↓

Many AI Analyses

Fields

- id
- complaint_id
- ai_provider
- ai_model
- category
- sentiment
- priority
- expectation
- actual_outcome
- gap_score
- summary
- confidence_score
- processing_time
- prompt_version
- created_at

---

## complaint_categories

Stores complaint categories.

Examples

- Internet
- Banking
- Water
- Electricity
- Healthcare
- Delivery

---

## complaint_status_history

Tracks status changes.

Example

Pending

↓

Under Review

↓

Resolved

↓

Closed

Fields

- id
- complaint_id
- old_status
- new_status
- updated_by
- updated_at

---

## attachments

Stores uploaded files.

Supported

- Images
- PDFs
- Documents

Fields

- id
- complaint_id
- file_url
- file_type
- uploaded_at

---

## audit_logs

Tracks important actions.

Examples

- Complaint Created
- Complaint Deleted
- Analysis Generated
- Login
- Admin Action

---

# Relationships

users

1 → N

complaints

complaints

1 → N

complaint_ai_analysis

complaints

1 → N

attachments

complaints

1 → N

complaint_status_history

---

# AI Analysis Versioning

Every analysis is stored separately.

Example

Complaint

↓

GPT-5.5 Analysis

↓

Claude Analysis

↓

Improved Prompt Analysis

No previous analysis is overwritten.

---

# Indexes

Create indexes on:

- email
- user_id
- complaint_id
- current_status
- created_at
- category

---

# Future Tables

organizations

api_keys

tenants

notifications

complaint_votes

review_analysis

survey_analysis

---

# Naming Convention

Primary Keys

id

Foreign Keys

<entity>_id

Examples

user_id

complaint_id

organization_id

---

# Soft Delete

Complaint records should never be permanently deleted.

Use

deleted_at

instead.

---

# UUID

Every table uses UUIDs.

Never integer IDs.

---

# Timestamps

Every table should contain

created_at

updated_at

Future

deleted_at

---

# Design Principles

- Normalize data
- Avoid duplication
- Store AI separately
- Version AI results
- Prepare for enterprise use
- API-first database design

---

# Future Enterprise Support

Database design supports:

- Multi-tenancy
- Organization dashboards
- API integrations
- AI model comparisons
- Analytics
