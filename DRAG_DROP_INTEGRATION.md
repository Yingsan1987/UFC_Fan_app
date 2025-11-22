# 🎮 Train to UFC - Drag & Drop System Integration Guide

This document outlines the complete drag-and-drop fighter avatar system for the Train to UFC game mode.

## 📁 File Structure

```
frontend/src/
├── components/TrainToUFC/
│   ├── FighterAvatar.jsx      # UFC-style fighter avatar component
│   ├── TrainSlot.jsx          # Individual train slot with drop zone
│   ├── WaitingZone.jsx        # Waiting zone for available fighters
│   ├── DragGhost.jsx          # Drag preview/ghost component
│   ├── TrainCar.jsx           # Train car component (existing)
│   └── AnimatedTrain.jsx      # Animated train component (existing)
├── store/
│   └── trainGameStore.js      # State management (React Context)
├── styles/
│   └── trainAnimations.css    # Animation styles
└── pages/
    └── TrainToUFC.jsx         # Main game page (updated)

backend/routes/
└── train-to-ufc.js            # API routes (already updated)
```

## 🚀 Installation Steps

### 1. Import Animation Styles

Add to `frontend/src/main.jsx`:

```jsx
import './styles/trainAnimations.css';
```

### 2. Wrap App with TrainGameProvider

Update `frontend/src/App.jsx`:

```jsx
import { TrainGameProvider } from './store/trainGameStore';

// In your App component:
<TrainGameProvider>
  {/* Your existing app content */}
</TrainGameProvider>
```

### 3. Update TrainToUFC Page

The page should now use:
- `FighterAvatar` for fighter display
- `WaitingZone` for the side panel
- `TrainSlot` within `TrainCar` components
- `useTrainGameStore()` hook for state

## 🎯 Component Usage

### FighterAvatar

```jsx
<FighterAvatar
  fighterData={avatar}
  size="md"              // "sm" | "md" | "lg"
  draggable={true}
  onDragStart={(fighter, e) => {}}
  onDragEnd={(fighter, e) => {}}
  isDragging={false}
  showStats={true}
/>
```

### WaitingZone

```jsx
<WaitingZone
  fighters={waitingZone}
  onDrop={async (fighter) => {
    await handleDropToWaitingZone(fighter);
  }}
/>
```

### TrainSlot

```jsx
<TrainSlot
  car={car}
  carNumber={carNumber}
  slotNumber={1}  // or 2
  fighter={spot.avatarId}
  myAvatar={avatar}
  onDrop={handleDrop}
  onRemove={handleRemove}
/>
```

## 🔌 Socket.io Integration

### Client-Side Events

```javascript
// Place fighter
socket.emit('train_place_fighter', {
  userId: currentUser.uid,
  fighterId: fighter._id,
  cartId: carNumber,
  slotId: spotNumber
});

// Return fighter
socket.emit('train_return_fighter', {
  userId: currentUser.uid,
  fighterId: fighter._id
});

// Listen for updates
socket.on('train_state_update', (data) => {
  // Update store state
  syncTrainState(data.train, data.avatar);
});
```

### Server-Side Handlers

Add to `backend/sockets/trainSocket.js`:

```javascript
socket.on('train_place_fighter', async (data) => {
  // Handle placement
  // Emit update to all clients
  io.to(`train-${trainId}`).emit('train_state_update', {
    train: updatedTrain,
    update: { type: 'fighter-placed', ...data }
  });
});

socket.on('train_return_fighter', async (data) => {
  // Handle return
  // Emit update
});
```

## 🎨 Animations

All animations are defined in `trainAnimations.css`:

- **breathing**: Idle fighter animation
- **pop**: Drag start animation
- **snap**: Slot drop animation
- **shake**: Rejection animation
- **snapBack**: Return to waiting zone

## ✅ API Endpoints

### POST /api/train-to-ufc/place-fighter

**Request:**
```json
{
  "trainId": "train_id",
  "carNumber": 1,
  "spotNumber": 1
}
```

**Response:**
```json
{
  "message": "Fighter placed on train!",
  "train": { /* train object */ },
  "avatar": { /* avatar object */ }
}
```

### POST /api/train-to-ufc/leave-train

**Request:**
```json
{
  "trainId": "train_id"
}
```

**Response:**
```json
{
  "message": "Fighter moved back to waiting zone!",
  "train": { /* train object */ },
  "avatar": { /* avatar object */ }
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Drag fighter from waiting zone to train slot
- [ ] Drag fighter from train back to waiting zone
- [ ] Reject drop when slot is occupied
- [ ] Reject drop when weight class mismatch
- [ ] Animations play correctly
- [ ] Socket.io updates work in real-time
- [ ] State syncs with backend

## 🔧 Troubleshooting

### Issue: Fighters not draggable

**Solution:** Check that `draggable={true}` prop is set on `FighterAvatar`

### Issue: Drop not working

**Solution:** Ensure `onDragOver` prevents default: `e.preventDefault()`

### Issue: State not updating

**Solution:** Make sure `TrainGameProvider` wraps the component tree

### Issue: Animations not playing

**Solution:** Verify `trainAnimations.css` is imported in `main.jsx`

## 📝 Next Steps

1. Add drag ghost visual feedback
2. Implement weight class validation UI
3. Add sound effects for drag/drop
4. Create unit tests for drag behaviors
5. Add keyboard navigation support

