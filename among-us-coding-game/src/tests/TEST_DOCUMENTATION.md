# Among Us Coding Game - Test Documentation

## Overview

This document describes the comprehensive test suite for the Among Us Coding Game backend application. The test suite covers all endpoints, controllers, integration scenarios, WebSocket functionality, and performance benchmarks.

## Test Structure

```
src/tests/
├── controllers/
│   ├── gameController.test.ts      # Game controller unit tests
│   ├── playerController.test.ts    # Player controller unit tests
│   └── taskController.test.ts      # Task controller unit tests
├── routes/
│   └── integration.test.ts         # Full application integration tests
├── utils/
│   ├── testHelpers.ts             # Test utility functions
│   └── testSetup.ts               # Test environment setup
├── websocket.test.ts              # WebSocket functionality tests
└── performance.test.ts            # Performance and load tests
```

## Test Coverage

### 1. Game Controller Tests (`gameController.test.ts`)

#### Endpoints Tested:

- `POST /api/games` - Create new game
- `POST /api/games/:gameId/join` - Join existing game
- `DELETE /api/games/:gameId` - End game

#### Test Scenarios:

- ✅ **Create Game**: Successfully create new game with valid data
- ✅ **Invalid Data**: Handle invalid game creation data
- ✅ **Default Values**: Create game with minimal required fields
- ✅ **Join Game**: Allow players to join existing games
- ✅ **Join Full Game**: Prevent joining when game is full
- ✅ **Non-existent Game**: Handle attempts to join non-existent games
- ✅ **End Game**: Successfully end active games
- ✅ **Already Ended**: Prevent ending already ended games
- ✅ **Error Handling**: Graceful database error handling

### 2. Player Controller Tests (`playerController.test.ts`)

#### Endpoints Tested:

- `POST /api/players/register` - Register new player
- `PUT /api/players/status` - Update player status
- `GET /api/players` - Get all players

#### Test Scenarios:

- ✅ **Register Player**: Create new crewmate and imposter players
- ✅ **Missing Fields**: Handle incomplete registration data
- ✅ **Duplicate Names**: Allow duplicate player names (current behavior)
- ✅ **Update Status**: Change player status (active, inactive, eliminated)
- ✅ **Invalid Player ID**: Handle non-existent player updates
- ✅ **Get All Players**: Retrieve player list with correct structure
- ✅ **Empty List**: Handle empty player list
- ✅ **Malformed Requests**: Handle invalid request data

### 3. Task Controller Tests (`taskController.test.ts`)

#### Endpoints Tested:

- `POST /api/tasks/assign` - Assign tasks to players
- `POST /api/tasks/submit` - Submit completed tasks
- `GET /api/tasks` - Retrieve tasks

#### Test Scenarios:

- ✅ **Assign Tasks**: Assign coding tasks with different difficulties
- ✅ **Imposter Tasks**: Assign fake tasks to imposters
- ✅ **Bulk Assignment**: Handle multiple task assignments
- ✅ **Submit Solutions**: Submit task solutions with test results
- ✅ **Partial Submissions**: Handle incomplete task submissions
- ✅ **Fake Submissions**: Handle imposter fake submissions
- ✅ **Task Filtering**: Filter tasks by player, game, status, difficulty
- ✅ **Pagination**: Handle paginated task requests
- ✅ **Empty Results**: Handle queries with no results

### 4. Integration Tests (`integration.test.ts`)

#### Complete Game Flow:

1. Create game
2. Register players (crewmates and imposters)
3. Join game
4. Assign tasks (real and fake)
5. Submit solutions
6. Update player statuses
7. End game

#### Scenarios Tested:

- ✅ **Complete Game Flow**: Full game lifecycle
- ✅ **Imposter Interactions**: Imposter vs crewmate scenarios
- ✅ **Error Cascading**: Handle multiple error conditions
- ✅ **Concurrent Operations**: Multiple players joining simultaneously

### 5. WebSocket Tests (`websocket.test.ts`)

#### Events Tested:

- Connection/disconnection events
- Game creation and joining broadcasts
- Task assignment and submission events
- Imposter actions (sabotage, elimination)
- Room management (join/leave game rooms)
- Broadcasting to game participants

#### Test Scenarios:

- ✅ **Player Connection**: Handle player connect/disconnect
- ✅ **Game Events**: Broadcast game state changes
- ✅ **Task Events**: Real-time task updates
- ✅ **Imposter Actions**: Sabotage and elimination events
- ✅ **Room Management**: Game room join/leave functionality
- ✅ **Error Handling**: Invalid event data handling
- ✅ **Broadcasting**: Message distribution to game rooms

### 6. Performance Tests (`performance.test.ts`)

#### Load Testing:

- Concurrent game creation (10 simultaneous requests)
- Concurrent player registration (20 simultaneous requests)
- High volume task assignments (50 tasks)

#### Response Time Testing:

- Health check response times (100 iterations)
- Task retrieval efficiency (50 iterations)

#### Stress Testing:

- Rapid sequential requests (200 requests)
- Mixed load scenarios (50 random operations)
- Memory usage monitoring

#### Performance Benchmarks:

- ✅ **Concurrent Games**: < 5 seconds for 10 games
- ✅ **Player Registration**: < 3 seconds for 20 players
- ✅ **Task Assignment**: < 2 seconds for 50 tasks
- ✅ **Health Check**: < 50ms average, < 200ms max
- ✅ **Memory Usage**: < 50MB increase for 300 operations

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Specific Test Categories

```bash
# Controller tests only
npm run test:controllers

# Route integration tests
npm run test:routes

# WebSocket tests
npm run test:websocket

# Performance tests
npm run test:performance
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

- TypeScript support with ts-jest
- MongoDB Memory Server for isolated testing
- Coverage reporting (text, lcov, html)
- 30-second timeout for complex operations
- Automatic test discovery

### Test Environment

- In-memory MongoDB database (mongodb-memory-server)
- Fresh database for each test suite
- Automatic cleanup after each test
- Express app instance for endpoint testing

## Test Data

### Mock Data Factories

- `createMockGame()`: Generate test game data
- `createMockPlayer()`: Generate test player data
- `createMockTask()`: Generate test task data

### Test Helpers

- `createTestApp()`: Set up Express app for testing
- `makeRequest()`: Helper for HTTP requests
- Database setup and teardown utilities

## API Endpoints Coverage

### Game Endpoints

| Method | Endpoint                  | Status | Tests                      |
| ------ | ------------------------- | ------ | -------------------------- |
| POST   | `/api/games`              | ✅     | Create, validation, errors |
| POST   | `/api/games/:gameId/join` | ✅     | Join, full game, not found |
| DELETE | `/api/games/:gameId`      | ✅     | End game, already ended    |

### Player Endpoints

| Method | Endpoint                | Status | Tests                       |
| ------ | ----------------------- | ------ | --------------------------- |
| POST   | `/api/players/register` | ✅     | Register, roles, validation |
| PUT    | `/api/players/status`   | ✅     | Update status, not found    |
| GET    | `/api/players`          | ✅     | List all, empty list        |

### Task Endpoints

| Method | Endpoint            | Status | Tests                        |
| ------ | ------------------- | ------ | ---------------------------- |
| POST   | `/api/tasks/assign` | ✅     | Assign, bulk, imposter tasks |
| POST   | `/api/tasks/submit` | ✅     | Submit, partial, fake        |
| GET    | `/api/tasks`        | ✅     | List, filter, pagination     |

### Utility Endpoints

| Method | Endpoint  | Status | Tests                 |
| ------ | --------- | ------ | --------------------- |
| GET    | `/health` | ✅     | Health check response |

## Test Metrics

- **Total Test Cases**: 80+ test scenarios
- **Endpoint Coverage**: 100% of implemented endpoints
- **Error Scenarios**: Comprehensive error handling tests
- **Integration Coverage**: Full game flow testing
- **Performance Benchmarks**: Load and stress testing
- **WebSocket Coverage**: Real-time functionality testing

## Continuous Integration

The test suite is designed to run in CI/CD environments:

- All tests use in-memory database (no external dependencies)
- Deterministic test execution
- Comprehensive error reporting
- Performance baseline monitoring

## Future Test Enhancements

1. **Authentication Tests**: When auth is implemented
2. **Role-based Access**: Permission testing
3. **Rate Limiting**: API throttling tests
4. **Database Migration**: Schema change tests
5. **Security**: Input validation and sanitization tests
6. **Monitoring**: APM integration tests

## Contributing to Tests

When adding new features:

1. Add unit tests for new controllers
2. Update integration tests for new endpoints
3. Add WebSocket tests for real-time features
4. Include performance tests for critical paths
5. Update this documentation
