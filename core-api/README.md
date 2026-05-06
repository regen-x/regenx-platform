# RegenX API

The RegenX API provides a robust set of endpoints that enable seamless interaction with the RegenX blockchain-powered investment platform. Built on the Stellar blockchain and utilizing Soroban smart contracts, the API facilitates secure and transparent transactions for climate-positive investments.

## Installation

- Ensure your Node.js version is at least 16.x.
- Install dependencies:
  ```sh
  npm install
  ```
- Run Husky pre-commit hook setup:
  ```sh
  npm run prepare
  ```

## How to Run

```sh
npm start
# Runs the app locally using the `PORT` environment variable.

npm run start:dev
# Runs the app in watch mode, automatically restarting on changes.
```

## Useful Commands

```sh
npm run lint
# Runs ESLint to check and fix linting issues.

npm run format
# Runs Prettier to format the codebase.

npm run build
# Builds the application for production, optimizing and minifying it.
```

## Testing

```sh
npm run test
# Runs Jest tests.

npm run test:cov
# Runs tests and generates a code coverage report in `./coverage`.
```

## Database Migrations

Migrations ensure database schema consistency across environments.

```sh
npm run migrate:create
# Creates a new migration file in `./data/migrations`.

npm run migrate:generate
# Automatically generates a migration file based on schema changes.

npm run migrate:run
# Runs all pending migrations to update the database schema.

npm run migrate:revert
# Rolls back the last applied migration.
```

## CI/CD

The RegenX API integrates with GitHub Actions for Continuous Integration and Deployment:

- Runs ESLint and Prettier.
- Builds the application.
- Runs tests with code coverage checks.
- Reports test coverage changes.
- Performs a SonarQube scan and quality gate check.

## Project Philosophy

RegenX API follows a structured, standardized approach to API development, prioritizing:

- **Consistency:** A unified structure for all projects.
- **Maintainability:** Modular code organization.
- **Scalability:** Designed to handle growing demands efficiently.

## Architecture Overview

The RegenX API follows a **Clean Architecture**, specifically the **Hexagonal Architecture** pattern.

```
 +----------------------+
 |   Interface Layer   |  -> Controllers (REST, GraphQL, CLI, etc.)
 +----------------------+
            ↓
 +----------------------+
 |  Application Layer  |  -> Services, DTOs, Mappers, and Business Logic
 +----------------------+
            ↓
 +----------------------+
 |    Domain Layer     |  -> Core Business Rules (Entities, Aggregates, etc.)
 +----------------------+
            ↓
 +----------------------+
 | Infrastructure Layer|  -> Database, APIs, External Services
 +----------------------+
```

### Folder Structure

| Folder           | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `interface`      | Handles client interactions, including HTTP and CLI controllers.      |
| `application`    | Contains DTOs, mappers, service logic, and repository interfaces.     |
| `domain`         | Holds core business logic, independent of external dependencies.      |
| `infrastructure` | Manages database access, external APIs, and third-party integrations. |

## Information Flow

```
[Client] → [Interface Layer] → [Application Layer] → [Domain Layer] → [Infrastructure Layer]
```

Controllers may directly access repositories when business logic is minimal to prevent service bloat. However, services should encapsulate business logic where necessary.

## License

RegenX API is licensed under the MIT License.

