# Clean Architecture Project Documentation

## 1. Project Overview

This project is a backend system designed with Clean Architecture and Domain-Driven Design (DDD) principles. It provides a robust foundation for managing customers, products, and orders, with extensible support for additional business domains. The system exposes RESTful APIs for customer and product management, and is structured for high testability, maintainability, and scalability.

**Main Features:**
- Customer and product registration and listing
- Order management (domain logic)
- Event-driven domain notifications
- Validation and error notification system
- Extensible architecture for new domains and features

## 2. Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express.js (API layer)
- **ORM:** Sequelize (with sequelize-typescript)
- **Database:** SQLite (in-memory for development/testing)
- **Validation:** Yup
- **Testing:** Jest, Supertest, @faker-js/faker
- **Environment Management:** dotenv
- **Build Tools:** ts-node, @swc/core, @swc/jest
- **Linting:** TSLint

## 3. Software Architecture

### Architectural Patterns
- **Clean Architecture:**
  - Clear separation between domain, use cases, and infrastructure.
  - Dependency inversion: domain and use cases are independent of frameworks and external agents.
- **Domain-Driven Design (DDD):**
  - Rich domain model with entities, value objects, repositories, services, factories, and events.
  - Ubiquitous language and encapsulation of business rules.
- **Event-Driven:**
  - Domain events and event handlers for decoupled side effects (e.g., sending emails on product creation).

### Layer Responsibilities
- **Domain Layer (`src/domain/`):**
  - Contains business entities, value objects, domain services, factories, repositories (interfaces), validators, and domain events.
- **Use Case Layer (`src/usecase/`):**
  - Application-specific business rules. Implements use cases (e.g., create, list, update) using domain models and repositories.
  - Uses Data Transfer Objects (DTOs) for input/output.
- **Infrastructure Layer (`src/infrastructure/`):**
  - Implements repositories, models (ORM), API routes, presenters, and server setup.
  - Handles database, HTTP, and external integrations.
- **API Layer (`src/infrastructure/api/`):**
  - Express app, routes, and presenters for HTTP communication.

## 4. Best Practices and Conventions

- **SOLID Principles:**
  - Single Responsibility: Each class/module has a clear, focused responsibility.
  - Open/Closed: Entities and use cases are open for extension, closed for modification.
  - Liskov Substitution, Interface Segregation, Dependency Inversion are applied via interfaces and abstractions.
- **Separation of Concerns:**
  - Domain logic is isolated from infrastructure and frameworks.
- **DTOs:**
  - All use cases use DTOs for input/output, ensuring decoupling from domain entities.
- **Validation:**
  - Yup-based validators, invoked via factory pattern, ensure entity invariants.
- **Error Handling:**
  - Notification pattern collects validation errors; custom `NotificationError` is thrown for aggregated errors.
- **Event Handling:**
  - Event dispatcher and handlers for domain events (e.g., product creation triggers email handler).
- **Testing:**
  - Unit and E2E tests using Jest and Supertest. High coverage for domain, use cases, and API.
- **API Versioning:**
  - Not implemented, but structure allows for easy introduction via route prefixes.
- **Logging:**
  - Basic logging via `console.log` (can be extended with a logging library).
- **Linting:**
  - TSLint with recommended rules for code quality.

## 5. Project Structure

```
CleanArchitecture/
├── docs/
├── src/
│   ├── domain/           # Domain layer (entities, value objects, events, repositories, validators)
│   │   ├── @shared/      # Shared abstractions (entity, event, notification, repository, validator)
│   │   ├── checkout/     # Order domain logic
│   │   ├── customer/     # Customer domain logic
│   │   └── product/      # Product domain logic
│   ├── usecase/          # Application/business use cases (DTOs, use case classes)
│   │   ├── customer/
│   │   └── product/
│   └── infrastructure/   # Frameworks, database, API, and external agents
│       ├── api/          # Express app, routes, presenters, server
│       ├── customer/     # Sequelize models and repositories for customer
│       ├── order/        # Sequelize models and repositories for order
│       └── product/      # Sequelize models and repositories for product
├── package.json
├── tsconfig.json
├── tslint.json
└── jest.config.ts
```

**Reasoning:**
- Folders are organized by layer and domain, following Clean Architecture and DDD.
- Shared abstractions are centralized in `@shared`.
- Infrastructure is decoupled from domain and use case logic.

## 6. Main Flows

### Customer API
- **POST `/customer`**: Create a new customer. Validates input, creates domain entity, persists via repository.
- **GET `/customer`**: List all customers. Supports JSON and XML output.

### Product API
- **POST `/product`**: Create a new product. Validates input, creates domain entity, persists via repository.
- **GET `/product`**: List all products.

### Order Domain
- Order creation and management is handled in the domain and use case layers, with extensible support for API exposure.

### Data Persistence
- Uses Sequelize ORM with SQLite (in-memory by default). Models map to domain entities.

### Event Handling
- Domain events (e.g., `ProductCreatedEvent`) are dispatched and handled by registered event handlers (e.g., sending emails).

## 7. Developer Guidelines

### Running Locally

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the development server:**
   ```sh
   npm run dev
   ```
   The server will start on the port defined in `.env` (`PORT`, default: 3000).

3. **Run tests:**
   ```sh
   npm test
   ```

### Required Dependencies
- Node.js (>=14)
- npm

### Environment Variables
- `.env` file (optional):
  - `PORT`: Port for the server (default: 3000)

### Internal Development Guidelines
- Follow Clean Architecture and DDD principles for new features.
- Place new domain logic in the appropriate domain subfolder.
- Use DTOs for all use case inputs/outputs.
- Write unit and E2E tests for all new features.
- Use TSLint and recommended rules for code quality.
- Prefer dependency injection and interfaces for extensibility and testability.
- Document new APIs and flows in this README.

---

For further questions, refer to the codebase or contact the maintainers. 