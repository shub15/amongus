# Among Us Style Map Implementation

## Features Implemented

### 1. Map Structure

- Created a ship map with 14 interconnected rooms
- Each room has:
  - Name and display name
  - Adjacent rooms for normal movement
  - Vent connections for impostor movement
  - Position coordinates for UI rendering
  - Task assignments

### 2. Player Movement

- Players can move between adjacent rooms
- Impostors can use vents to move between connected rooms
- Movement cooldown system for vents and kills
- Real-time position updates via WebSocket

### 3. Game Mechanics

- **Killing**: Impostors can kill crewmates in the same room
- **Body Reporting**: Crewmates can report dead bodies in the same room
- **Venting**: Impostors can use vents to move quickly between rooms
- **Cooldowns**: Kill and vent actions have cooldown periods

### 4. Backend Implementation

- Updated Player model with room tracking and cooldown fields
- Updated Game model with map structure and cooldown settings
- Added new API endpoints for map actions:
  - Move player
  - Use vent
  - Kill player
  - Report body
- Enhanced socket service with new event handlers

### 5. Frontend Implementation

- Created GameMap component with visual ship layout
- Interactive room selection and movement
- Role-based actions (kill for impostors, report for crewmates)
- Real-time player position updates
- Visual indicators for player status (alive/dead/venting)

## Technical Details

### Database Schema Changes

- Added `currentRoom` field to Player model
- Added `lastKillTime` and `isVenting` fields to Player model
- Added `map`, `killCooldown`, and `ventCooldown` fields to Game model
- Added database indexes for improved query performance

### API Endpoints

- `POST /games/:gameId/move` - Move player to adjacent room
- `POST /games/:gameId/use-vent` - Use vent to move to connected room
- `POST /games/:gameId/kill` - Kill a player in the same room
- `POST /games/:gameId/report-body` - Report a dead body

### WebSocket Events

- `moveToRoom` - Player moves to a new room
- `useVent` - Player uses a vent to move
- `killPlayer` - Player kills another player
- `reportBody` - Player reports a dead body
- `playerMoved` - Notification when player moves
- `playerVentMove` - Notification when player uses vent
- `playerKilled` - Notification when player is killed
- `bodyReported` - Notification when body is reported

## Usage Instructions

### For Players

1. **Movement**: Click on your current room to move to an adjacent room
2. **Impostors**: Use the "Use Vent" button to move through vents (cooldown applies)
3. **Impostors**: When in the same room as a crewmate, the "Kill Player" button appears
4. **Crewmates**: When in the same room as a dead body, the "Report Body" button appears

### For Developers

1. The map structure is defined in the Game model
2. Rooms are connected via `adjacentRooms` and `ventsTo` arrays
3. Cooldown periods can be adjusted in the Game model
4. New rooms can be added by updating the default map structure

## Future Enhancements

- Add visual animations for player movement
- Implement more sophisticated venting mechanics
- Add environmental obstacles and special rooms
- Include task locations on the map
- Add mini-games for room interactions
