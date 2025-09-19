# replit.md

## Overview

InterviewGuru is a comprehensive interview management system built with a modern full-stack architecture. The application provides tools for managing candidates, scheduling interviews, recording sessions, and analyzing performance through AI-powered transcription and evaluation. It features a React-based frontend with shadcn/ui components, an Express.js backend, and PostgreSQL database with Drizzle ORM for data management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/building
- **Routing**: Wouter for client-side routing with a simple, lightweight approach
- **UI Framework**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod schema validation for type-safe forms
- **Styling**: Tailwind CSS with CSS custom properties for theming and design tokens

### Backend Architecture
- **Runtime**: Node.js with TypeScript and ES modules
- **Framework**: Express.js with middleware for JSON parsing, URL encoding, and request logging
- **Database ORM**: Drizzle ORM with Neon serverless PostgreSQL connection
- **File Handling**: Multer for multipart form data and file uploads (100MB limit)
- **Development**: Hot module replacement with Vite integration for seamless development experience

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **Database Schema**: Comprehensive interview management schema including:
  - Candidates table with personal info, skills (JSON array), and status tracking
  - Interviews table with scheduling, duration, type, and location details
  - Recordings table for audio/video files with transcription storage
  - Evaluations table for AI-generated performance assessments
  - Notifications table for system alerts and reminders
- **File Storage**: Local filesystem storage for uploaded audio/video recordings

### Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **User System**: Basic user management with username-based authentication (legacy compatibility maintained)

### External Service Integrations
- **AI Services**: OpenAI integration for:
  - Whisper API for audio transcription of interview recordings
  - GPT-5 for analyzing interview performance and generating structured evaluations
- **Email Services**: SendGrid integration for automated email notifications and communications
- **Media Processing**: Browser-based media recording capabilities with device enumeration support

### Design Patterns and Architectural Decisions
- **Monorepo Structure**: Organized with separate client, server, and shared directories for clean separation of concerns
- **Shared Schema**: TypeScript schema definitions shared between frontend and backend for type safety
- **API Design**: RESTful API structure with consistent error handling and response formatting
- **Component Architecture**: Modular React components with clear separation between UI, forms, and business logic
- **Database Migrations**: Drizzle Kit for schema management and database migrations
- **Build Strategy**: Separate build processes for client (Vite) and server (esbuild) with optimized production bundles

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, TypeScript for the frontend foundation
- **Node.js Backend**: Express.js, TypeScript, ESM modules for server infrastructure
- **Database**: Neon serverless PostgreSQL, Drizzle ORM, WebSocket support for real-time connections

### UI and Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Styling**: Tailwind CSS for utility-first styling, PostCSS for processing
- **Icons**: Lucide React for consistent iconography

### Data Management
- **Client State**: TanStack Query for server state, caching, and synchronization
- **Form Handling**: React Hook Form with Hookform Resolvers for form state management
- **Validation**: Zod for runtime type checking and schema validation

### AI and External Services
- **OpenAI**: GPT-5 and Whisper APIs for interview analysis and transcription
- **SendGrid**: Email service for automated notifications and communications
- **Media**: Browser MediaDevices API for audio/video recording capabilities

### Development and Build Tools
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Development**: Replit-specific plugins for enhanced development experience
- **Database Tools**: Drizzle Kit for migrations and schema management

### Utilities and Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Styling Utilities**: clsx and tailwind-merge for conditional CSS classes
- **File Handling**: Multer for multipart form uploads
- **Charts**: Recharts for data visualization and analytics displays