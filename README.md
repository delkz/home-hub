# Home Hub

A self-hosted home management platform for centralizing household information, routines, inventory, and planning.

## Overview

Home Hub is a household application designed to help households track what they have, what they need, and what is likely to run out soon. It starts with a simple domestic inventory system and grows into a broader home intelligence hub that can combine inventory, shopping lists, maintenance, expenses, and daily household context in one place.

The project is built for privacy, simplicity, and practical use at home. Today it runs on **Vercel + Neon** (reachable from a phone at the supermarket, with login); a **Docker Compose** path exists for development and is the target for a fully local setup later. See [Deployment](#deployment).

## Why this project exists

Most homes accumulate information in scattered places: notes, spreadsheets, shopping lists, reminders, and memory. Home Hub aims to provide a single local system that brings that information together without requiring cloud services or complicated infrastructure.

The initial version focuses on one essential problem: understanding what is in the house, how much of each item remains, when it was last purchased, and what is likely to run out.

## Goals

The system should help answer questions such as:

- What do I have at home?
- How much of a given item do I still have?
- When was this last purchased?
- How often do I need to restock it?
- What is running low?
- What needs to be replaced?
- Which household tasks are pending?
- How much am I spending on specific categories?
- What will I likely need to buy soon?

In the future, these signals can be used to support a lightweight intelligence layer that helps users make decisions and automate small household routines.

## Project principles

- Validate before building: a feature is only added after the previous one is actually used
- Self-hosted (your own Vercel + Neon project today; fully local with Docker later)
- User-owned data (exportable and backed up)
- Core functionality does not depend on AI
- AI is optional and additive
- Modular architecture
- Mobile-first experience, usable in the store
- Low-friction data entry
- Automation only after enough historical insight exists

## Status

Home Hub is a **hypothesis, not yet a product**: *"I will log household stock consistently enough that software beats a notes app."* Nothing built so far has tested that. Inventory, purchases, movements and a full login system (v0.1) exist; the shopping list (v0.2) is the first feature that makes the app worth opening, and it is next.

### Current phase: validation (infrastructure frozen)

- **Frozen:** authentication and infrastructure. No new auth features (no roles, password reset, extra profile fields) until the validation test passes.
- **The loop to prove:** low stock → shopping list → buy → restock.
- **The test:** use the app for **4 weeks** with real groceries, from a phone, with at least one other household member also logging. Keep a log of what annoys you; that log becomes the roadmap.
- **Success metric:** purchases are still being logged in week 4.
- **Stop rule:** if they are not, fix entry friction (quick-add) once; if usage still does not stick, stop building and use an existing tool such as [Grocy](https://grocy.info) instead.
- **Gated until the test passes:** LLM assistant, forecasting, household tasks, finances, receipt import.

### Immediate to-do (in order)

1. [x] Document the deployment honestly (see [Deployment](#deployment)).
2. [ ] Tests for the inventory math: create purchase, create movement, low-stock calculation (`apps/api/tests`).
3. [ ] v0.2 shopping list: low-stock view with a checkbox and a "bought" button that records a purchase through the existing purchases endpoint.
4. [ ] CSV export of items and movements (data ownership).
5. [ ] Set up and test a Neon backup/restore (see [DEPLOY.md](DEPLOY.md)).
6. [ ] Start the 4-week usage test and keep the annoyance log.

---

## Roadmap

### v0.1.0 — Basic inventory (done, in validation)

The first functional version of the system. Implemented: items, categories, movements, batch purchases, dashboard and login. Remaining: tests for the quantity math and CSV export.

#### Core features

- Item registration
- Categories
- Current quantity
- Unit of measure
- Stock-in entries
- Stock-out / consumption records
- Last purchase date
- Movement history
- Item state
- Notes and observations
- Search and filters
- Responsive mobile-first interface
- Simple dashboard for recent items and low-stock items
- Docker-based deployment
- PostgreSQL database
- Local network access

#### Example items

- Rice
  - Quantity: 2 kg
  - Last purchase: 2026-08-25
  - Location: pantry
  - Status: OK

- Detergent
  - Quantity: 1 unit
  - Last purchase: 2026-08-10
  - Location: kitchen
  - Status: low stock

- Hallway light bulb
  - Quantity: 1
  - Installed on: 2026-05-02
  - Status: working

This version is intended to validate the data model and the user experience before any automation or AI layer is added.

### v0.2.0 — Shopping list module (next, highest priority)

Create a dedicated shopping workflow. This is the real product: the problem Home Hub solves is *"I don't know what to buy before I'm at the store."* Inventory is only the input to this output.

The first iteration should work without AI and provide a fast way to take the household needs into another app or conversation.

#### First slice (1–2 evenings)

- A derived view of low-stock items with a checkbox per item
- A "bought" button that creates a purchase (and the stock-in movement) through the existing purchases endpoint
- Keep the plain-text export for sharing (WhatsApp, notes)

#### Initial version

- "Generate shopping list" button
- Generate a plain-text list from items that need restocking
- Present the generated text for review
- Copy the list to the clipboard
- Keep the output simple enough to paste into notes or messaging apps

#### Planned evolution

- Shopping list management
- Manual item add
- Automatic addition of low-stock items
- Dedicated checklist screen
- Mark items as purchased
- Export the checklist as plain text
- Automatically create inventory entries when marked as bought
- Purchase history
- Price paid
- Store information

This creates a natural lifecycle:

Inventory → need → shopping list → purchase → inventory

### v0.3.0 — Assistant and basic intelligence (gated)

> Starts only after the 4-week usage test passes and there is real movement history.

Add an optional LLM integration.

The AI should not be responsible for the core system operation; it should instead act as a layer on top of the existing data and shopping list workflow.

Possible capabilities:

- Chat with inventory data
- Purchase suggestions
- Identification of likely low-stock items
- Inventory summaries
- Recommendations based on consumption history
- Enrichment of shopping lists

Examples:

- Which products will I probably need to buy this week?
- Am I running out of anything?
- What do I buy most often?
- What can I buy to improve my meals for the week?
- Improve my shopping list based on what I already have at home.

Initial integrations may use a local model or a provider with a free tier. The integration should be abstracted behind a provider-independent interface to make it easy to swap models later.

### v0.4.0 — Consumption and forecasting (gated)

> Needs months of clean movement data. The first version is just the average days between purchases, a SQL query, not an ML project.

Use movement history to identify behavioral patterns.

Examples:

- Milk is bought every 7 days on average.
- Last purchase was 5 days ago.
- Forecast: you will likely need to buy milk within the next 2 days.

Other potential metrics:

- Average consumption
- Average time between purchases
- Most consumed products
- Forgotten products
- Products bought but rarely used

These insights can also feed the AI assistant.

### v0.5.0 — Household tasks (gated)

> Deferred until the inventory + shopping loop is used weekly.

Add management for household tasks.

Examples:

- Clean the air conditioner filter
- Replace the water filter
- Clean the refrigerator
- Water the plants
- Check tire pressure
- Change the bed linen

Task types:

- One-time
- Recurring
- Related to an item
- Related to a room

Example:

- Bedroom air conditioner
  - Last cleaning: 2026-08-01
  - Next cleaning: 2026-11-01

### v0.6.0 — Home finances (gated)

> Deferred until the inventory + shopping loop is used weekly.

Add household financial tracking.

This does not need to become a full finance app. The focus can remain on:

- Grocery spending
- Maintenance costs
- Household products
- Appliances
- Services
- House-related subscriptions

This allows questions like:

- How much have I spent on groceries in the last 3 months?
- Which products increased in price?
- How much does it cost to maintain the house per month?

### Backlog — after validation

Ideas that came out of the project review, in rough priority order. None of these start before the usage test passes.

- **Cheap capture:** quick-add and barcode scanning (Open Food Facts) to cut entry friction
- **Installable PWA with offline queueing**, since connectivity in the store and pantry is unreliable
- **Brazilian receipt import (NFC-e):** the QR code on a nota fiscal resolves to itemized purchase data, so one scan could log a whole purchase with prices, with no OCR and no LLM. Check SEFAZ terms and per-state reliability before committing.
- **Price tracking per item**, as a by-product of purchase history
- **Periodic stock counts** (reconciliation) to correct drift
- **Append-only, correctable movement ledger** with idempotent writes
- **English docs** and a one-click "deploy your own Home Hub", if there is interest from other households

### Future — Home Intelligence Hub

Once the core modules work reliably, the system can evolve into a broader home intelligence layer.

Possible future capabilities:

- Automation
- Notifications
- Home Assistant integration
- IoT integrations
- Invoice and receipt scanning
- Barcode reading
- Product recognition via camera
- Purchase forecasting
- Maintenance alerts
- Spending analysis
- Household dashboard
- Multiple residents
- Permissions and access control
- Calendar integration
- Public API

---

## Architecture

The initial architecture is intentionally simple and designed to evolve gradually.

Browser

↓

React

↓

API

↓

Application

↓

Domain

↓

Infrastructure

↓

PostgreSQL

The frontend and backend can be separated cleanly. There is no need for SSR in the first iteration.

## Frontend

The frontend should be built with React and TypeScript.

Recommended stack:

- React
- Vite
- TypeScript
- TanStack Query
- React Router
- Zod
- Tailwind CSS

The interface should be designed primarily for mobile use, since many interactions will likely happen from a phone while inside the house.

The experience should minimize friction. A user should be able to open the app and record a task such as “the coffee is finished” in just a few seconds.

## Backend

The backend is a separate API service, built with Node.js and Express (JavaScript) on top of Prisma and PostgreSQL. It runs as a modular monolith: no microservices, and no rewrite (for example to Fastify/TypeScript) until the validation phase is over.

## Database

The project will use PostgreSQL.

Recommended ORM:

- Prisma
- Drizzle

### Initial domain model

- Household
- Room
- Category
- Item
- Inventory
- InventoryMovement
- Purchase
- ShoppingList
- ShoppingListItem
- Task
- TaskRecurrence
- Expense
- User

## Important concept: Item is not inventory

The system should distinguish clearly between an item and the current inventory state.

Example:

- Item: Café Pilão 500g
- Inventory: current quantity = 2
- InventoryMovement:
  - +2 purchase
  - -1 consumption
  - +3 purchase

This preserves the full history of the product lifecycle and prevents the loss of context over time. Current stock is a derived or optimized value, not the only source of truth.

## Backend organization

A modular structure can look like this:

```text
src/
  modules/
    inventory/
      domain/
      application/
      infrastructure/
      presentation/
    shopping/
    tasks/
    expenses/
    ai/
```

This is not meant to enforce an overly rigid Clean Architecture, but it should keep business rules out of controllers and avoid unnecessary cross-module coupling.

## Deployment

Two paths exist. The honest summary: **the cloud path is the one in use; the local path is a later goal.**

- **Vercel + Neon (current, in use).** Static frontend and Express API as a serverless function on Vercel, PostgreSQL on Neon, HTTPS and login. This is what makes the app usable from a phone anywhere. The data lives in your own Neon project, not in a shared service. Setup and security notes: [DEPLOY.md](DEPLOY.md).
- **Docker Compose (development, future local mode).** `docker compose up -d` starts the web app, API and PostgreSQL on your machine. It is the development environment today. A fully local, LAN-only setup (for example on a Raspberry Pi) is a goal for a later version, not something the project promises yet.

Trade-offs of the current choice: the app needs internet, Neon's free tier has cold starts and limits, and backups are your responsibility (see [DEPLOY.md](DEPLOY.md)).

---

## Technical direction

### Frontend

- React + TypeScript
- Vite
- TanStack Query for server state
- React Router for navigation
- Zod for validation
- Tailwind CSS for styling

### Backend

- Node.js + Express (JavaScript)
- PostgreSQL
- Prisma

### Deployment

- Vercel + Neon (in use)
- Docker Compose (development; future local mode)

---

## Suggested project structure

```text
home-hub/
  apps/
    web/
    api/
  packages/
    shared/
  docker/
  prisma/
  docs/
  README.md
  docker-compose.yml
```

This structure allows the frontend and backend to evolve independently while still sharing types, validation schemas, and domain contracts when needed.

---

## Contributing

Contributions are welcome.

This project is meant to be open, collaborative, and community-driven. You can contribute by:

- reporting issues
- proposing features
- improving documentation
- helping with UX and mobile design
- contributing to backend, frontend, or database work

Before opening a substantial pull request, it is a good idea to discuss the feature in an issue so the architecture and roadmap stay aligned.

## License

This project is open source and will be distributed under an open license. The exact license should be finalized as the project matures.

---

## Closing note

The end goal is not simply to know what exists in the house. The bigger ambition is to create a digital layer over the home that can remember, organize, and eventually anticipate needs.

Home Hub aims to become a practical, privacy-conscious home command center that helps people manage their space with less friction and more insight.
