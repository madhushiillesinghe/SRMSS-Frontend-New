# SRMSS – Smart Route Management and Scheduling System

## 1. Project Description
A comprehensive bus fleet and route management system designed for transport companies and depot managers. The system handles route planning, bus/driver management, real-time tracking, ticketing, fuel tracking, maintenance logs, reporting, and admin user management — all through a creative, colorful, modern dashboard interface.

## 2. Page Structure
- `/login` — Login page (centered card with logo, username/password fields)
- `/dashboard` — Main dashboard with stats, charts, alerts
- `/routes` — Route management (CRUD table + detail forms with stops)
- `/buses` — Bus fleet management (CRUD table + detail forms with QR codes)
- `/drivers` — Driver management (CRUD table + detail forms with license tracking)
- `/schedules` — Trip scheduling (CRUD table + schedule creation forms)
- `/tracker` — Live bus tracking map with active schedule panel
- `/tickets` — Ticket booking & management (CRUD table + booking form)
- `/fuel-logs` — Fuel consumption tracking (CRUD table + add log form)
- `/maintenance-logs` — Maintenance records (CRUD table + add log form)
- `/reports` — Report generation dashboard (multiple report types + PDF export)
- `/admin-users` — Admin user management (CRUD table + create/edit forms)

## 3. Core Features
- [ ] Authentication (login/logout, role-based access)
- [ ] Dashboard with real-time stats and alerts
- [ ] Route management with stop sequences
- [ ] Bus fleet management with QR codes
- [ ] Driver management with license expiry tracking
- [ ] Trip scheduling with status tracking
- [ ] Live GPS bus tracking on map
- [ ] Ticket booking with fare calculation
- [ ] Fuel consumption logging
- [ ] Maintenance logging and scheduling
- [ ] Multi-type report generation with PDF export
- [ ] Admin user management with role-based permissions

## 4. Data Model Design
(To be implemented when Supabase is connected)

### Core Tables:
- **routes** — Route definitions with stops
- **route_stops** — Individual stops within routes
- **buses** — Bus fleet inventory
- **drivers** — Driver profiles with license info
- **schedules** — Trip assignments linking routes, buses, drivers
- **tickets** — Passenger ticket records
- **fuel_logs** — Fuel consumption records
- **maintenance_logs** — Maintenance records
- **admin_users** — System user accounts
- **bus_locations** — Real-time GPS tracking data

## 5. Backend / Third-party Integration Plan
- Supabase: Required for database, authentication, and real-time tracking
- Shopify: Not needed
- Stripe: Not needed (ticketing is internal, not e-commerce)
- Google Maps: Required for live bus tracking (embedded iframe)

## 6. Development Phase Plan

### Phase 1: Login Page + Dashboard ✅ COMPLETED
- Goal: Establish the visual identity and core layout with login and dashboard
- Deliverable: Login page with form validation, Dashboard with stat cards, chart, and alert lists
- Pages: `/login`, `/dashboard`

### Phase 2: Routes + Buses Pages ✅ COMPLETED
- Goal: CRUD management for routes and buses
- Deliverable: Route table + detail form with stops, Bus table + detail form with QR codes

### Phase 3: Drivers + Schedules Pages ✅ COMPLETED
- Goal: Driver management and trip scheduling
- Deliverable: Driver table + detail form, Schedule table + create/edit form

### Phase 4: Live Tracker + Tickets Pages ✅ COMPLETED
- Goal: Real-time tracking and ticket management
- Deliverable: Map view with bus markers, ticket table + booking form

### Phase 5: Fuel Logs + Maintenance Logs ✅ COMPLETED
- Goal: Operational logging
- Deliverable: Fuel log table + add form, Maintenance log table + add form

### Phase 6: Reports + Admin Users + Polish
- Goal: Reporting and user management
- Deliverable: Report cards with PDF export, Admin user table + forms, final polish