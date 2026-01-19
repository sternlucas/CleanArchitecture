# Clean Architecture & DDD Implementation Guidelines

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Layer Analysis](#layer-analysis)
4. [Design Patterns Analysis](#design-patterns-analysis)
5. [Development Guidelines](#development-guidelines)
6. [Best Practices](#best-practices)
7. [Testing Strategy](#testing-strategy)

---

## Executive Summary

This document provides a comprehensive analysis of a Clean Architecture implementation following Domain-Driven Design (DDD) principles. The application demonstrates a well-structured separation of concerns across three primary layers: Domain, Use Cases, and Infrastructure, with clear dependency inversion and adherence to SOLID principles.

**Key Architectural Decisions:**
- **Clean Architecture** with dependency rule enforcement
- **Domain-Driven Design** with rich domain models
- **Repository Pattern** for data access abstraction
- **Factory Pattern** for entity creation
- **Strategy Pattern** for validation
- **Observer Pattern** for domain events
- **Notification Pattern** for error aggregation

---

## Architecture Overview

### Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                  │
│  (API Routes, Database, External Services, Presenters)  │
└───────────────────────┬─────────────────────────────────┘
                        │ depends on
┌───────────────────────▼─────────────────────────────────┐
│                    Use Cases Layer                       │
│         (Application-specific Business Logic)            │
└───────────────────────┬─────────────────────────────────┘
                        │ depends on
┌───────────────────────▼─────────────────────────────────┐
│                      Domain Layer                        │
│  (Entities, Value Objects, Services, Events, Interfaces) │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rule

The **Dependency Inversion Principle** is strictly enforced:
- **Infrastructure** depends on **Use Cases** and **Domain**
- **Use Cases** depend only on **Domain**
- **Domain** has **no dependencies** on outer layers

This ensures that business logic remains independent of technical implementation details.

---

## Layer Analysis

### 1. Domain Layer (`src/domain/`)

The domain layer contains the core business logic and is completely independent of external frameworks.

#### Structure

```
domain/
├── @shared/              # Shared kernel components
│   ├── entity/          # Base entity class
│   ├── repository/      # Repository interfaces
│   ├── event/           # Event infrastructure
│   ├── notification/    # Error notification pattern
│   └── validator/       # Validator interface
├── customer/            # Customer bounded context
│   ├── entity/
│   ├── value-object/
│   ├── factory/
│   ├── repository/
│   └── validator/
├── product/             # Product bounded context
└── checkout/            # Order bounded context
```

#### Key Components

**Entities**
- Extend `Entity` abstract class
- Contain business logic and invariants
- Use Notification pattern for validation errors
- Are self-validating

**Value Objects**
- Immutable objects representing domain concepts
- Examples: `Address`
- Should validate themselves

**Factories**
- Encapsulate complex entity creation logic
- Provide static factory methods
- Examples: `CustomerFactory`, `OrderFactory`

**Domain Services**
- Operations that don't naturally fit in entities
- Stateless operations
- Examples: `ProductService`, `OrderService`

**Repositories (Interfaces)**
- Defined in domain layer
- Implemented in infrastructure layer
- Follow Repository pattern

**Domain Events**
- Represent something that happened in the domain
- Implement `EventInterface`
- Handled by event handlers

#### Example: Customer Entity

```typescript
export default class Customer extends Entity {
  private _name: string = "";
  private _address!: Address;
  private _active: boolean = false;
  private _rewardPoints: number = 0;

  constructor(id: string, name: string) {
    super();
    this._id = id;
    this._name = name;
    this.validate();
    if (this.notification.hasErrors()) {
      throw new NotificationError(this.notification.getErrors());
    }
  }

  validate() {
    CustomerValidatorFactory.create().validate(this);
  }

  // Business logic methods
  activate() {
    if (this._address === undefined) {
      throw new Error("Address is mandatory to activate a customer");
    }
    this._active = true;
  }
}
```

**Key Characteristics:**
- ✅ Self-validating using Notification pattern
- ✅ Encapsulates business rules
- ✅ Uses Value Objects for complex attributes
- ✅ Provides business methods (activate, deactivate, addRewardPoints)

### 2. Use Cases Layer (`src/usecase/`)

Application-specific business logic that orchestrates domain objects.

#### Structure

```
usecase/
├── customer/
│   ├── create/
│   │   ├── create.customer.usecase.ts
│   │   ├── create.customer.dto.ts
│   │   └── create.customer.unit.spec.ts
│   ├── find/
│   ├── list/
│   └── update/
└── product/
    └── ...
```

#### Key Characteristics

- **Single Responsibility**: Each use case handles one specific operation
- **DTO Pattern**: Input/Output DTOs for data transfer
- **Dependency Injection**: Repositories injected via constructor
- **No Framework Dependencies**: Pure TypeScript/JavaScript

#### Example: Create Customer Use Case

```typescript
export default class CreateCustomerUseCase {
  private customerRepository: CustomerRepositoryInterface;

  constructor(customerRepository: CustomerRepositoryInterface) {
    this.customerRepository = customerRepository;
  }

  async execute(
    input: InputCreateCustomerDto
  ): Promise<OutputCreateCustomerDto> {
    const customer = CustomerFactory.createWithAddress(
      input.name,
      new Address(...)
    );

    await this.customerRepository.create(customer);

    return {
      id: customer.id,
      name: customer.name,
      address: { ... }
    };
  }
}
```

**Key Characteristics:**
- ✅ Orchestrates domain objects
- ✅ Uses factories for entity creation
- ✅ Depends on repository interfaces (not implementations)
- ✅ Returns DTOs, not domain entities

### 3. Infrastructure Layer (`src/infrastructure/`)

Technical implementation details and framework-specific code.

#### Structure

```
infrastructure/
├── api/                 # Web framework (Express)
│   ├── routes/
│   ├── presenters/
│   └── express.ts
├── customer/
│   └── repository/
│       └── sequelize/
├── product/
│   └── repository/
│       └── sequelize/
└── order/
    └── repository/
        └── sequelize/
```

#### Key Components

**Repository Implementations**
- Implement domain repository interfaces
- Use ORM (Sequelize) for data persistence
- Map between domain entities and database models

**API Routes**
- HTTP endpoints
- Instantiate use cases
- Handle HTTP concerns (request/response)

**Presenters**
- Format output for different representations (JSON, XML)
- Separate presentation logic from business logic

#### Example: Customer Repository Implementation

```typescript
export default class CustomerRepository implements CustomerRepositoryInterface {
  async create(entity: Customer): Promise<void> {
    await CustomerModel.create({
      id: entity.id,
      name: entity.name,
      street: entity.Address.street,
      // ... map domain entity to database model
    });
  }

  async find(id: string): Promise<Customer> {
    const customerModel = await CustomerModel.findOne({ where: { id } });
    
    // Map database model to domain entity
    const customer = new Customer(id, customerModel.name);
    const address = new Address(...);
    customer.changeAddress(address);
    return customer;
  }
}
```

**Key Characteristics:**
- ✅ Implements domain interfaces
- ✅ Handles ORM-specific concerns
- ✅ Maps between persistence models and domain entities
- ✅ All framework dependencies isolated here

---

## Design Patterns Analysis

### 1. Repository Pattern

**Purpose**: Abstract data access logic

**Implementation**:
- Interfaces defined in domain layer
- Implementations in infrastructure layer
- Generic `RepositoryInterface<T>` for common operations

**Benefits**:
- Decouples domain from persistence
- Enables easy testing with in-memory repositories
- Allows switching data stores without changing domain logic

**Example**:
```typescript
// Domain
export default interface RepositoryInterface<T> {
    create(entity: T): Promise<void>;
    update(entity: T): Promise<void>;
    find(id: string): Promise<T>;
    findAll(): Promise<T[]>;
}

// Infrastructure
export default class CustomerRepository implements CustomerRepositoryInterface {
    // Sequelize implementation
}
```

### 2. Factory Pattern

**Purpose**: Encapsulate complex object creation

**Implementation**:
- Static factory methods
- Located in domain layer
- Handles entity creation with proper initialization

**Benefits**:
- Centralizes creation logic
- Ensures entities are created in valid state
- Reduces coupling between use cases and entity constructors

**Example**:
```typescript
export default class CustomerFactory {
  public static create(name: string): Customer {
    return new Customer(uuid(), name);
  }

  public static createWithAddress(name: string, address: Address): Customer {
    const customer = new Customer(uuid(), name);
    customer.changeAddress(address);
    return customer;
  }
}
```

### 3. Strategy Pattern (Validators)

**Purpose**: Interchangeable validation algorithms

**Implementation**:
- `ValidatorInterface<T>` defines contract
- Concrete validators (e.g., `CustomerYupValidator`)
- Factory pattern for validator creation

**Benefits**:
- Easy to swap validation libraries
- Testable in isolation
- Follows Open/Closed Principle

**Example**:
```typescript
// Interface
export default interface ValidatorInterface<T> {
  validate(entity: T): void;
}

// Implementation
export default class CustomerYupValidator implements ValidatorInterface<Customer> {
  validate(entity: Customer): void {
    // Yup validation logic
  }
}

// Factory
export default class CustomerValidatorFactory {
  static create(): ValidatorInterface<Customer> {
    return new CustomerYupValidator();
  }
}
```

### 4. Observer Pattern (Domain Events)

**Purpose**: Decouple domain events from their handlers

**Implementation**:
- `EventInterface` for events
- `EventHandlerInterface` for handlers
- `EventDispatcher` for registration and notification

**Benefits**:
- Loose coupling between event producers and consumers
- Easy to add new event handlers
- Supports eventual consistency

**Example**:
```typescript
// Event
export default class ProductCreatedEvent implements EventInterface {
  dataTimeOccurred: Date;
  eventData: any;
}

// Handler
export default class SendEmailWhenProductIsCreatedHandler
  implements EventHandlerInterface<ProductCreatedEvent>
{
  handle(event: ProductCreatedEvent): void {
    // Handle event
  }
}
```

### 5. Notification Pattern

**Purpose**: Aggregate validation errors instead of throwing immediately

**Implementation**:
- `Notification` class collects errors
- Entities have `notification` property
- Errors aggregated before throwing

**Benefits**:
- Better user experience (all errors at once)
- Follows DDD validation approach
- Prevents partial validation failures

**Example**:
```typescript
export default class Notification {
  private errors: NotificationErrorProps[] = [];

  addError(error: NotificationErrorProps) {
    this.errors.push(error);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
```

### 6. DTO Pattern

**Purpose**: Transfer data between layers

**Implementation**:
- Input DTOs for use case parameters
- Output DTOs for use case results
- Separate from domain entities

**Benefits**:
- Prevents domain entities from leaking to outer layers
- Allows different representations for same domain concept
- Enables API versioning

---

## Development Guidelines

### Creating a New Bounded Context

#### Step 1: Define Domain Entities

1. Create entity class extending `Entity`:
```typescript
// src/domain/[context]/entity/[entity].ts
import Entity from "../../@shared/entity/entity.abstract";
import NotificationError from "../../@shared/notification/notification.error";
import [Entity]ValidatorFactory from "../factory/[entity].validator.factory";

export default class [Entity] extends Entity {
  private _property: string;

  constructor(id: string, property: string) {
    super();
    this._id = id;
    this._property = property;
    this.validate();
    if (this.notification.hasErrors()) {
      throw new NotificationError(this.notification.getErrors());
    }
  }

  validate() {
    [Entity]ValidatorFactory.create().validate(this);
  }

  // Business logic methods
}
```

2. Create entity specification file:
```typescript
// src/domain/[context]/entity/[entity].spec.ts
// Unit tests for the entity
```

#### Step 2: Create Value Objects (if needed)

```typescript
// src/domain/[context]/value-object/[value-object].ts
export default class [ValueObject] {
  private _property: string;

  constructor(property: string) {
    this._property = property;
    this.validate();
  }

  validate() {
    // Validation logic
  }

  get property(): string {
    return this._property;
  }
}
```

#### Step 3: Create Validator

1. Create validator implementation:
```typescript
// src/domain/[context]/validator/[entity].yup.validator.ts
import ValidatorInterface from "../../@shared/validator/validator.interface";
import [Entity] from "../entity/[entity]";
import * as yup from "yup";

export default class [Entity]YupValidator
  implements ValidatorInterface<[Entity]>
{
  validate(entity: [Entity]): void {
    try {
      yup
        .object()
        .shape({
          id: yup.string().required("Id is required"),
          // ... other validations
        })
        .validateSync(
          {
            id: entity.id,
            // ... other fields
          },
          {
            abortEarly: false,
          }
        );
    } catch (errors) {
      const e = errors as yup.ValidationError;
      e.errors.forEach((error) => {
        entity.notification.addError({
          context: "[entity]",
          message: error,
        });
      });
    }
  }
}
```

2. Create validator factory:
```typescript
// src/domain/[context]/factory/[entity].validator.factory.ts
import ValidatorInterface from "../../@shared/validator/validator.interface";
import [Entity] from "../entity/[entity]";
import [Entity]YupValidator from "../validator/[entity].yup.validator";

export default class [Entity]ValidatorFactory {
  static create(): ValidatorInterface<[Entity]> {
    return new [Entity]YupValidator();
  }
}
```

#### Step 4: Create Factory

```typescript
// src/domain/[context]/factory/[entity].factory.ts
import [Entity] from "../entity/[entity]";
import { v4 as uuid } from "uuid";

export default class [Entity]Factory {
  public static create(property: string): [Entity] {
    return new [Entity](uuid(), property);
  }

  // Additional factory methods as needed
}
```

#### Step 5: Define Repository Interface

```typescript
// src/domain/[context]/repository/[entity]-repository.interface.ts
import [Entity] from "../entity/[entity]";

export default interface [Entity]RepositoryInterface {
  create(entity: [Entity]): Promise<void>;
  update(entity: [Entity]): Promise<void>;
  find(id: string): Promise<[Entity]>;
  findAll(): Promise<[Entity][]>;
}
```

#### Step 6: Create Use Case

1. Create DTOs:
```typescript
// src/usecase/[context]/create/create.[entity].dto.ts
export interface InputCreate[Entity]Dto {
  property: string;
}

export interface OutputCreate[Entity]Dto {
  id: string;
  property: string;
}
```

2. Create use case:
```typescript
// src/usecase/[context]/create/create.[entity].usecase.ts
import [Entity]RepositoryInterface from "../../../domain/[context]/repository/[entity]-repository.interface";
import {
  InputCreate[Entity]Dto,
  OutputCreate[Entity]Dto,
} from "./create.[entity].dto";
import [Entity]Factory from "../../../domain/[context]/factory/[entity].factory";

export default class Create[Entity]UseCase {
  private [entity]Repository: [Entity]RepositoryInterface;

  constructor([entity]Repository: [Entity]RepositoryInterface) {
    this.[entity]Repository = [entity]Repository;
  }

  async execute(
    input: InputCreate[Entity]Dto
  ): Promise<OutputCreate[Entity]Dto> {
    const [entity] = [Entity]Factory.create(input.property);

    await this.[entity]Repository.create([entity]);

    return {
      id: [entity].id,
      property: [entity].property,
    };
  }
}
```

3. Create unit tests:
```typescript
// src/usecase/[context]/create/create.[entity].unit.spec.ts
// Unit tests for the use case
```

#### Step 7: Implement Repository

1. Create database model:
```typescript
// src/infrastructure/[context]/repository/sequelize/[entity].model.ts
import { Column, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({
  tableName: "[entities]",
})
export default class [Entity]Model extends Model {
  @PrimaryKey
  @Column
  id: string;

  @Column({ allowNull: false })
  property: string;
}
```

2. Implement repository:
```typescript
// src/infrastructure/[context]/repository/sequelize/[entity].repository.ts
import [Entity] from "../../../../domain/[context]/entity/[entity]";
import [Entity]RepositoryInterface from "../../../../domain/[context]/repository/[entity]-repository.interface";
import [Entity]Model from "./[entity].model";

export default class [Entity]Repository implements [Entity]RepositoryInterface {
  async create(entity: [Entity]): Promise<void> {
    await [Entity]Model.create({
      id: entity.id,
      property: entity.property,
    });
  }

  async find(id: string): Promise<[Entity]> {
    const model = await [Entity]Model.findOne({
      where: { id },
      rejectOnEmpty: true,
    });

    return new [Entity](model.id, model.property);
  }

  // ... other methods
}
```

#### Step 8: Create API Route

```typescript
// src/infrastructure/api/routes/[entity].route.ts
import express, { Request, Response } from "express";
import Create[Entity]UseCase from "../../../usecase/[context]/create/create.[entity].usecase";
import [Entity]Repository from "../../[context]/repository/sequelize/[entity].repository";

export const [entity]Route = express.Router();

[entity]Route.post("/", async (req: Request, res: Response) => {
  const usecase = new Create[Entity]UseCase(new [Entity]Repository());
  try {
    const output = await usecase.execute(req.body);
    res.send(output);
  } catch (err) {
    res.status(500).send(err);
  }
});
```

#### Step 9: Register Route

```typescript
// src/infrastructure/api/express.ts
import { [entity]Route } from "./routes/[entity].route";

app.use("/[entity]", [entity]Route);
```

### Creating Domain Events

#### Step 1: Define Event

```typescript
// src/domain/[context]/event/[entity]-[action].event.ts
import EventInterface from "../../@shared/event/event.interface";

export default class [Entity][Action]Event implements EventInterface {
  dataTimeOccurred: Date;
  eventData: any;

  constructor(eventData: any) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
```

#### Step 2: Create Event Handler

```typescript
// src/domain/[context]/event/handler/[handler-name].handler.ts
import EventHandlerInterface from "../../../@shared/event/event-handler.interface";
import [Entity][Action]Event from "../[entity]-[action].event";

export default class [HandlerName]Handler
  implements EventHandlerInterface<[Entity][Action]Event>
{
  handle(event: [Entity][Action]Event): void {
    // Handle the event
  }
}
```

#### Step 3: Dispatch Event in Use Case

```typescript
// In use case
import EventDispatcher from "../../../domain/@shared/event/event-dispatcher";
import [Entity][Action]Event from "../../../domain/[context]/event/[entity]-[action].event";

export default class Create[Entity]UseCase {
  // ...
  async execute(input: InputCreate[Entity]Dto): Promise<OutputCreate[Entity]Dto> {
    const [entity] = [Entity]Factory.create(input.property);
    await this.[entity]Repository.create([entity]);

    // Dispatch event
    const eventDispatcher = new EventDispatcher();
    eventDispatcher.notify(new [Entity][Action]Event({
      id: [entity].id,
      // ... event data
    }));

    return { ... };
  }
}
```

### Creating Domain Services

Domain services are used when an operation doesn't naturally fit in an entity.

```typescript
// src/domain/[context]/service/[service].service.ts
import [Entity] from "../entity/[entity]";

export default class [Service]Service {
  static [operation](entities: [Entity][], parameter: Type): [ReturnType] {
    // Stateless operation that involves multiple entities
    // or complex business logic
  }
}
```

---

## Best Practices

### 1. Entity Design

✅ **DO:**
- Extend `Entity` base class
- Use Notification pattern for validation
- Encapsulate business logic in entities
- Use Value Objects for complex attributes
- Make entities self-validating

❌ **DON'T:**
- Expose internal state unnecessarily
- Put infrastructure concerns in entities
- Create anemic domain models
- Use primitive obsession

### 2. Value Object Design

✅ **DO:**
- Make value objects immutable
- Implement equality by value
- Validate in constructor
- Keep them simple

❌ **DON'T:**
- Add identity to value objects
- Make them mutable
- Include infrastructure dependencies

### 3. Use Case Design

✅ **DO:**
- One use case per operation
- Use DTOs for input/output
- Inject dependencies via constructor
- Keep use cases focused and simple

❌ **DON'T:**
- Put business logic in use cases (it belongs in domain)
- Return domain entities directly
- Create god use cases that do too much

### 4. Repository Design

✅ **DO:**
- Define interfaces in domain layer
- Implement in infrastructure layer
- Map between domain and persistence models
- Keep repository methods focused

❌ **DON'T:**
- Put business logic in repositories
- Expose infrastructure concerns in interfaces
- Return persistence models from repositories

### 5. Validation

✅ **DO:**
- Use Notification pattern in entities
- Centralize validation logic
- Use Strategy pattern for validators
- Validate in constructors and setters

❌ **DON'T:**
- Throw exceptions for each validation error
- Put validation logic in use cases
- Skip validation

### 6. Error Handling

✅ **DO:**
- Use Notification pattern for entity validation
- Throw domain exceptions for business rule violations
- Handle infrastructure errors appropriately
- Provide meaningful error messages

❌ **DON'T:**
- Catch and swallow errors
- Expose infrastructure exceptions to domain
- Use generic error messages

### 7. Testing

✅ **DO:**
- Write unit tests for entities
- Test use cases in isolation
- Use mocks for repository interfaces
- Test business logic thoroughly

❌ **DON'T:**
- Skip testing domain logic
- Test infrastructure in unit tests
- Create complex test setups

---

## Testing Strategy

### Unit Tests

**Domain Layer:**
- Test entity business logic
- Test value object validation
- Test domain services
- Test factories

**Use Cases Layer:**
- Test use case orchestration
- Mock repository dependencies
- Test error scenarios
- Test DTO transformations

### Integration Tests

**Repository Tests:**
- Test repository implementations
- Use test database
- Test mapping between domain and persistence

**API Tests:**
- Test HTTP endpoints
- Test request/response handling
- Test error responses

### Test Structure

```
[component]/
├── [component].spec.ts          # Unit tests
├── [component].integration.spec.ts  # Integration tests
└── [component].e2e.spec.ts      # End-to-end tests
```

### Example: Entity Test

```typescript
describe("Customer Entity", () => {
  it("should create a valid customer", () => {
    const customer = new Customer("123", "John Doe");
    expect(customer.id).toBe("123");
    expect(customer.name).toBe("John Doe");
  });

  it("should throw error when name is empty", () => {
    expect(() => {
      new Customer("123", "");
    }).toThrow(NotificationError);
  });

  it("should activate customer with address", () => {
    const customer = new Customer("123", "John Doe");
    customer.changeAddress(new Address("Street", 123, "12345", "City"));
    customer.activate();
    expect(customer.isActive()).toBe(true);
  });
});
```

### Example: Use Case Test

```typescript
describe("CreateCustomerUseCase", () => {
  it("should create a customer", async () => {
    const mockRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const usecase = new CreateCustomerUseCase(mockRepository);
    const output = await usecase.execute({
      name: "John Doe",
      address: { ... }
    });

    expect(output.id).toBeDefined();
    expect(mockRepository.create).toHaveBeenCalled();
  });
});
```

---

## Conclusion

This architecture provides a solid foundation for building maintainable, testable, and scalable applications. By following these guidelines, you can create robust applications that adhere to Clean Architecture and DDD principles.

### Key Takeaways

1. **Domain First**: Always start with the domain layer; it should be independent of all other layers
2. **Dependency Inversion**: Depend on abstractions, not concretions
3. **Rich Domain Models**: Put business logic in entities, not in services or use cases
4. **Consistency**: Follow established patterns consistently across the codebase
5. **Testability**: Design for testability from the start

### Next Steps

1. Establish coding standards and review process
2. Create templates for common patterns
3. Document domain language and business rules
4. Consider adding CQRS for complex scenarios
5. Evaluate adding a DI container
6. Consider implementing Unit of Work pattern

---

## References

- **Clean Architecture** - Robert C. Martin
- **Domain-Driven Design** - Eric Evans
- **Implementing Domain-Driven Design** - Vaughn Vernon
- **Patterns of Enterprise Application Architecture** - Martin Fowler
- **Design Patterns: Elements of Reusable Object-Oriented Software** - Gang of Four

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*
