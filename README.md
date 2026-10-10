# Home Hub

A self-hosted home management platform for centralizing household information, routines, inventory, and planning.

## Overview

Home Hub is a local-first application designed to help households track what they have, what they need, and what is likely to run out soon. It starts with a simple domestic inventory system and grows into a broader home intelligence hub that can combine inventory, shopping lists, maintenance, expenses, and daily household context in one place.

The project is built for privacy, simplicity, and practical use at home. It is meant to run locally, ideally with Docker, and be accessible from other devices on the same network, especially mobile phones.

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

- Local-first
- Self-hosted
- User-owned data
- Core functionality does not depend on AI
- AI is optional and additive
- Modular architecture
- Mobile-first experience
- Low-friction data entry
- Automation only after enough historical insight exists

## Status

This project is in the early stages of design and development. The first milestone focuses on validating the data model and the product experience before introducing advanced automation or AI features.

---

## Roadmap

### v0.1.0 — Basic inventory

The first functional version of the system.

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

### v0.2.0 — Shopping list module

Create a dedicated shopping workflow.

The first iteration should work without AI and provide a fast way to take the household needs into another app or conversation.

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

### v0.3.0 — Assistant and basic intelligence

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

### v0.4.0 — Consumption and forecasting

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

### v0.5.0 — Household tasks

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

### v0.6.0 — Home finances

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

The backend should be a separate API service.

Possible stack:

- Node.js
- TypeScript
- Fastify
- NestJS (optional)
- Express (possible alternative)

For this project, Fastify is a strong fit due to its simplicity and modularity. The API can start as a modular monolith and grow organically without introducing microservices too early.

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

## Deployment with Docker

The application should initially be distributed with Docker Compose.

Services:

- app-web
- app-api
- postgres

Possible future services:

- redis
- ollama
- worker

Example command:

```bash
docker compose up -d
```

To run it on a remote server with HTTPS and login, see [DEPLOY.md](DEPLOY.md).

Then the application can be accessed via:

- http://home.local
- http://<server-ip>

The system should function without requiring external cloud services.

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

- Fastify
- TypeScript
- PostgreSQL
- Prisma or Drizzle

### Deployment

- Docker Compose
- Local network access
- Self-hosted environment

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
