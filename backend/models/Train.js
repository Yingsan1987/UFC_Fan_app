const mongoose = require('mongoose');

const trainCarSchema = new mongoose.Schema({
  carNumber: {
    type: Number,
    required: true
  },
  spot1: {
    avatarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainToUFCAvatar',
      default: null
    },
    occupied: {
      type: Boolean,
      default: false
    }
  },
  spot2: {
    avatarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainToUFCAvatar',
      default: null
    },
    occupied: {
      type: Boolean,
      default: false
    }
  },
  isFighting: {
    type: Boolean,
    default: false
  },
  fightResult: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainToUFCAvatar',
      default: null
    },
    loser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainToUFCAvatar',
      default: null
    },
    foughtAt: {
      type: Date,
      default: null
    }
  }
}, { _id: false });

const trainSchema = new mongoose.Schema({
  // Train Configuration
  maxCars: {
    type: Number,
    default: 10
  },
  currentCarCount: {
    type: Number,
    default: 10
  },
  totalSpots: {
    type: Number,
    default: 20 // 10 cars * 2 spots
  },
  occupiedSpots: {
    type: Number,
    default: 0
  },
  
  // Train Cars
  cars: [trainCarSchema],
  
  // Train Status
  isActive: {
    type: Boolean,
    default: true
  },
  isMoving: {
    type: Boolean,
    default: true
  },
  speed: {
    type: Number,
    default: 1 // 1 = normal speed
  },
  
  // Battle System
  autoFightInterval: {
    type: Number,
    default: 30000 // 30 seconds in milliseconds
  },
  lastFightTime: {
    type: Date,
    default: null
  },
  
  // Winner
  winner: {
    avatarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainToUFCAvatar',
      default: null
    },
    wonAt: {
      type: Date,
      default: null
    }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
});

trainSchema.methods.findAvailableSpot = function() {
  for (let i = 0; i < this.cars.length; i++) {
    const car = this.cars[i];
    if (!car.spot1.occupied) {
      return { carNumber: i + 1, spotNumber: 1 };
    }
    if (!car.spot2.occupied) {
      return { carNumber: i + 1, spotNumber: 2 };
    }
  }
  return null;
};

trainSchema.methods.isCarFull = function(carNumber) {
  const car = this.cars[carNumber - 1];
  if (!car) return false;
  return car.spot1.occupied && car.spot2.occupied;
};

trainSchema.methods.getRemainingFighters = function() {
  let count = 0;
  this.cars.forEach(car => {
    if (car.spot1.occupied) count++;
    if (car.spot2.occupied) count++;
  });
  return count;
};

module.exports = mongoose.model('Train', trainSchema, 'trains');

