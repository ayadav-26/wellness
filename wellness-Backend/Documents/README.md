# Wellness Center - Node.js Booking & Scheduling Backend

WellnessHub is a REST API backend for a chain of wellness centers offering
therapy booking, therapist scheduling, room management, and business analytics.

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org) with Express.js
- **Database**: [Sequelize ORM](https://sequelize.org) with PostgreSQL
- **Authentication**: JWT (JSON Web Tokens) via `jsonwebtoken`
- **Notifications**: [Nodemailer](https://nodemailer.com) (Email) + [Twilio](https://twilio.com) (SMS)
- **Password Hashing**: bcryptjs
- **Environment Config**: dotenv

## Getting Started

1. Install dependencies: `npm install`
2. Set up `.env` using `.env.example` as reference
3. Create PostgreSQL database and update `DB_NAME` in `.env`
4. Run migrations: `npx sequelize-cli db:migrate`
5. Start dev server: `npm run dev`

## Agent Guide

For AI-assisted development, refer to `AGENTS.md` for coding standards
and `SKILL.md` for the slot allocation and notification workflows.
