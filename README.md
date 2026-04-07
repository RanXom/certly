# Certly

Certly is a high-performance web application designed for streamlined certificate generation, dynamic editing, and automated bulk email distribution. Built on the modern Next.js ecosystem, it provides a production-grade environment featuring a robust canvas editor, optimized API routes, and reliable email dispatch capabilities.

## Prerequisites

To run this project, the following components must be installed on the host system:

- Node.js 20.x or higher
- npm 10.x or higher (or equivalent package manager)

## Tech Stack

- **Framework:** Next.js 16.1.6
- **Language:** TypeScript 5.x
- **UI Architecture:** React 19, Tailwind CSS 4.0, shadcn/ui
- **Canvas Editing:** Fabric.js 5.3.0
- **API Construction:** Hono 4.12.0
- **Data Validation:** Zod 4.3
- **Email Infrastructure:** Resend 6.9
- **State Management:** TanStack React Query 5.90
- **Parsing utilities:** PapaParse 5.5

## Getting Started

### 1. Environment Configuration

The application utilizes an environment configuration file for required service integrations. Ensure the properties are configured in a `.env.local` file at the root of the project:

```env
# Email Configuration
RESEND_API_KEY=YOUR_RESEND_API_KEY
```

### 2. Build and Run

Execute the following commands in the project root to prepare the environment and initialize the application:

```bash
# Install dependencies
npm install

# Run the local development server
npm run dev
```

The server will initialize on `http://localhost:3000`.

### 3. Production Optimization

To compile the application into state-optimized specific bundles for deployment, use:

```bash
# Build the artifact
npm run build

# Run the production server
npm run start
```

## System Architecture

### Canvas Editor Integration
The client features a robust client-side canvas editing experience integrated via Fabric.js. This environment includes layered manipulations, structured typographic controls, intelligent snapping logic, and an exhaustive history buffer for non-destructive operations.

### Bulk Distribution Pipeline
Certly parses bulk client data supplied through structured CSV formats (leveraging PapaParse). The data is systematically merged into the canvas templates, and individual certificates are seamlessly transferred via the Resend API for concurrent email delivery.

### Modular API Logic
The backend data routes are constructed with Hono within Next.js API routes, employing Zod for strict incoming request validations. This yields strong type safety across the client and server boundary.

## Error Handling

Operational errors and validations present standardized feedback across API and UI states:

- **400 Bad Request:** Input payload fails Zod schema validations or CSV formatting is defective.
- **403 Forbidden:** Missing authentication headers for protected external functions.
- **500 Internal Server Error:** System-level exceptions during Canvas generation or external provider (Resend) connection interruptions.

**Project Status:** Active Development / Production-Ready Base.
