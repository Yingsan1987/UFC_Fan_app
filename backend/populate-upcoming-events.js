require('dotenv').config();
const mongoose = require('mongoose');
const UFCEvent = require('./models/UFCEvent');
const connectDB = require('./config/database');

const sampleUpcomingEvents = [
  {
    eventName: "UFC 309: Jones vs Miocic",
    eventDate: new Date("2024-11-16T00:00:00.000Z"),
    location: "Madison Square Garden, New York, NY",
    status: "upcoming",
    fightCard: {
      mainEvent: [
        {
          fightId: "jones-miocic-1",
          fighter1: "Jon Jones",
          fighter2: "Stipe Miocic",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      coMainEvent: [
        {
          fightId: "oliveira-chandler-2",
          fighter1: "Charles Oliveira",
          fighter2: "Michael Chandler",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      mainCard: [
        {
          fightId: "nickal-craig-1",
          fighter1: "Bo Nickal",
          fighter2: "Paul Craig",
          winner: null,
          result: null,
          method: null,
          processed: false
        },
        {
          fightId: "miller-dariush-1",
          fighter1: "Jim Miller",
          fighter2: "Beneil Dariush",
          winner: null,
          result: null,
          method: null,
          processed: false
        },
        {
          fightId: "fiorot-grasso-1",
          fighter1: "Manon Fiorot",
          fighter2: "Valentina Shevchenko",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      preliminaryCard: [
        {
          fightId: "almeida-martinez-1",
          fighter1: "Jonathan Martinez",
          fighter2: "Marcus McGhee",
          winner: null,
          result: null,
          method: null,
          processed: false
        },
        {
          fightId: "craig-prachnio-1",
          fighter1: "Chris Weidman",
          fighter2: "Eryk Anders",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      earlyPreliminaryCard: [
        {
          fightId: "early-1",
          fighter1: "Mauricio Ruffy",
          fighter2: "James Llontop",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ]
    }
  },
  {
    eventName: "UFC Fight Night: Yan vs Figueiredo",
    eventDate: new Date("2024-11-23T00:00:00.000Z"),
    location: "Galaxy Arena, Macau, China",
    status: "upcoming",
    fightCard: {
      mainEvent: [
        {
          fightId: "yan-figueiredo-1",
          fighter1: "Petr Yan",
          fighter2: "Deiveson Figueiredo",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      coMainEvent: [
        {
          fightId: "silva-pereira-1",
          fighter1: "Alex Pereira",
          fighter2: "Jamahal Hill",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      mainCard: [
        {
          fightId: "volkov-gane-1",
          fighter1: "Alexander Volkov",
          fighter2: "Ciryl Gane",
          winner: null,
          result: null,
          method: null,
          processed: false
        },
        {
          fightId: "santos-walker-1",
          fighter1: "Johnny Walker",
          fighter2: "Volkan Oezdemir",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      preliminaryCard: [
        {
          fightId: "prelim-1",
          fighter1: "Song Yadong",
          fighter2: "Ricky Simon",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      earlyPreliminaryCard: []
    }
  },
  {
    eventName: "UFC 310: Pantoja vs Asakura",
    eventDate: new Date("2024-12-07T00:00:00.000Z"),
    location: "T-Mobile Arena, Las Vegas, NV",
    status: "upcoming",
    fightCard: {
      mainEvent: [
        {
          fightId: "pantoja-asakura-1",
          fighter1: "Alexandre Pantoja",
          fighter2: "Kai Asakura",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      coMainEvent: [
        {
          fightId: "shevchenko-grasso-3",
          fighter1: "Valentina Shevchenko",
          fighter2: "Alexa Grasso",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      mainCard: [
        {
          fightId: "rakhmonov-garry-1",
          fighter1: "Shavkat Rakhmonov",
          fighter2: "Ian Machado Garry",
          winner: null,
          result: null,
          method: null,
          processed: false
        },
        {
          fightId: "gane-volkov-2",
          fighter1: "Ciryl Gane",
          fighter2: "Alexander Volkov",
          winner: null,
          result: null,
          method: null,
          processed: false
        },
        {
          fightId: "pena-pennington-1",
          fighter1: "Julianna Pena",
          fighter2: "Raquel Pennington",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      preliminaryCard: [
        {
          fightId: "dober-islam-1",
          fighter1: "Drew Dober",
          fighter2: "Rafael Fiziev",
          winner: null,
          result: null,
          method: null,
          processed: false
        },
        {
          fightId: "ribas-lemos-1",
          fighter1: "Amanda Ribas",
          fighter2: "Amanda Lemos",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ],
      earlyPreliminaryCard: [
        {
          fightId: "early-2",
          fighter1: "Cody Durden",
          fighter2: "Aori Qileng",
          winner: null,
          result: null,
          method: null,
          processed: false
        }
      ]
    }
  }
];

const populateUpcomingEvents = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('🗑️ Clearing existing upcoming events...');
    await UFCEvent.deleteMany({ status: 'upcoming' });
    
    console.log('📝 Inserting sample upcoming events...');
    const inserted = await UFCEvent.insertMany(sampleUpcomingEvents);
    
    console.log('✅ Successfully populated upcoming events!');
    console.log(`📊 Inserted ${inserted.length} events:`);
    inserted.forEach(event => {
      const totalFights = 
        (event.fightCard.mainEvent?.length || 0) +
        (event.fightCard.coMainEvent?.length || 0) +
        (event.fightCard.mainCard?.length || 0) +
        (event.fightCard.preliminaryCard?.length || 0) +
        (event.fightCard.earlyPreliminaryCard?.length || 0);
      
      console.log(`  - ${event.eventName} (${totalFights} fights)`);
      console.log(`    Date: ${event.eventDate.toDateString()}`);
      console.log(`    Location: ${event.location}`);
    });
    
    console.log('\n🎉 Done! You can now view upcoming fights on the Events page.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating upcoming events:', error);
    process.exit(1);
  }
};

populateUpcomingEvents();

