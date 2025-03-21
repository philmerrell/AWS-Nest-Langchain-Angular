# 📦 DynamoDB Schema: Cost Tracking & Reporting

This document defines the schema structure for all DynamoDB tables related to model usage, cost tracking, and reporting within the system.

---

## 🧠 Table: `ModelPricing`

Stores pricing data for each model, including historical pricing to support accurate back-billing and audits.

| Attribute                      | Type | Description |
|-------------------------------|------|-------------|
| `PK`                          | `S`  | Partition key: `MODEL#<modelId>` |
| `SK`                          | `S`  | Sort key: `PRICE` or `PRICE#<YYYYMMDD>` |
| `inputPricePerMillionTokens` | `N`  | Price for 1 million input tokens |
| `outputPricePerMillionTokens`| `N`  | Price for 1 million output tokens |
| `effectiveDate`               | `S`  | Date pricing became effective (e.g., `2025-03-20`) |
| `updatedAt` *(optional)*      | `S`  | Last update timestamp (ISO8601) |

### Notes
- Use `SK = "PRICE"` to store the **current price**.
- Use `SK = "PRICE#<YYYYMMDD>"` to track **pricing history**.

---

## 👤 Table: `UserModelUsage`

Tracks detailed usage for individual users across models and aggregates usage over time.

| Attribute      | Type | Description |
|----------------|------|-------------|
| `PK`           | `S`  | Partition key: `USER#<emplId>` |
| `SK`           | `S`  | Sort key — see key patterns below |
| `inputTokens`  | `N`  | Number of input tokens used |
| `outputTokens` | `N`  | Number of output tokens used |
| `totalCost`    | `N`  | Total calculated cost (USD) |

### SK Patterns:
- `USAGE#<modelId>#<YYYY-MM-DD>` → Daily usage per model
- `AGG#MONTH#<YYYY-MM>` → Monthly aggregate cost
- `AGG#YEAR#<YYYY>` → Yearly aggregate cost

---

## 🛡️ Table: `AdminUsageAggregates`

Supports admin dashboards, reporting, and daily leaderboards of user costs.

| Attribute   | Type | Description |
|-------------|------|-------------|
| `PK`        | `S`  | Always `"AGGREGATE"` |
| `SK`        | `S`  | `DAY#<YYYY-MM-DD>#<paddedCost>` |
| `emplId`    | `S`  | User’s employee ID |
| `totalCost` | `N`  | Total cost for the user that day |
| `email`     | `S`  | User's email address |

### Notes:
- `paddedCost` is a **12-digit zero-padded string** (e.g., `"000000002.450000"`) for lexicographic descending sort.
- Querying by `PK = AGGREGATE` and `begins_with(SK, "DAY#<YYYY-MM-DD>#")` enables top-N user lookups by cost.

---

## 🔍 Query Patterns

### ✅ For Users

| Use Case | Table | Query |
|----------|-------|-------|
| Get per-model daily usage | `UserModelUsage` | `PK = USER#<emplId>`, `begins_with(SK, 'USAGE#')` |
| Get month-to-date total | `UserModelUsage` | `SK = AGG#MONTH#<YYYY-MM>` |
| Get year-to-date total | `UserModelUsage` | `SK = AGG#YEAR#<YYYY>` |

---

### ✅ For Admins

| Use Case | Table | Query |
|----------|-------|-------|
| List daily user costs | `AdminUsageAggregates` | `PK = AGGREGATE`, `begins_with(SK, 'DAY#<YYYY-MM-DD>#')` |
| Get top users by cost | `AdminUsageAggregates` | Same as above + `Limit` |
| Paginate daily results | `AdminUsageAggregates` | Use `Limit` + `ExclusiveStartKey` |

---

## 🧮 Key Examples

| Table                | PK                  | SK                               |
|----------------------|---------------------|----------------------------------|
| `ModelPricing`       | `MODEL#GPT-4`        | `PRICE#20250101`                 |
| `UserModelUsage`     | `USER#123456`        | `USAGE#GPT-4#2025-03-20`         |
|                      | `USER#123456`        | `AGG#MONTH#2025-03`              |
|                      | `USER#123456`        | `AGG#YEAR#2025`                  |
| `AdminUsageAggregates` | `AGGREGATE`       | `DAY#2025-03-20#000000012.345000` |

---

## 🧩 Tips & Best Practices

- Use `ADD` operations in DynamoDB for atomic accumulation of tokens and cost.
- Always record usage with timestamps so historical pricing (`PRICE#<YYYYMMDD>`) can be applied accurately.
- Pad numeric cost strings to 12 characters for correct lexicographic sort (e.g., `000000012.340000`).

---

## 📁 Directory Reference

```plaintext
/docs
├── dynamo-schemas.md        # ← This file
