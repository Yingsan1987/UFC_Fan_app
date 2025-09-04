require('dotenv').config();
const mongoose = require('mongoose');
const Fighter = require('./models/Fighter');
const connectDB = require('./config/database');

const seedFighters = async () => {
  await connectDB();

  const fighters = [
    {
      name: "Jon Jones",
      nickname: "Bones",
      division: "Heavyweight",
      height: "6'4\"",
      weight: "248 lbs",
      reach: "84.5\"",
      age: 36,
      wins: 27,
      losses: 1,
      draws: 0,
      record: "27-1-0",
      ranking: 1,
      champion: true,
      nationality: "American",
      hometown: "Rochester, New York",
      fightingStyle: "Mixed Martial Arts",
      camp: "Jackson Wink MMA",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2023-02/JONES_JON_L_BELT_03-04.png",
      strikingAccuracy: 58,
      grappling: "Excellent wrestler with creative submissions",
      knockouts: 10,
      submissions: 6,
      lastFight: {
        opponent: "Ciryl Gane",
        result: "Win",
        method: "Submission (Guillotine)",
        date: new Date("2023-03-04")
      }
    },
    {
      name: "Islam Makhachev",
      nickname: "",
      division: "Lightweight",
      height: "5'10\"",
      weight: "155 lbs",
      reach: "70\"",
      age: 32,
      wins: 25,
      losses: 1,
      draws: 0,
      record: "25-1-0",
      ranking: 1,
      champion: true,
      nationality: "Russian",
      hometown: "Makhachkala, Dagestan",
      fightingStyle: "Sambo/Wrestling",
      camp: "Eagles MMA",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2023-02/MAKHACHEV_ISLAM_L_BELT_02-11.png",
      strikingAccuracy: 54,
      grappling: "Elite grappler with exceptional ground control",
      knockouts: 4,
      submissions: 11,
      lastFight: {
        opponent: "Alexander Volkanovski",
        result: "Win",
        method: "Decision (Unanimous)",
        date: new Date("2023-10-21")
      }
    },
    {
      name: "Leon Edwards",
      nickname: "Rocky",
      division: "Welterweight",
      height: "6'0\"",
      weight: "170 lbs",
      reach: "74\"",
      age: 32,
      wins: 22,
      losses: 3,
      draws: 1,
      record: "22-3-1",
      ranking: 1,
      champion: true,
      nationality: "British",
      hometown: "Birmingham, England",
      fightingStyle: "Mixed Martial Arts",
      camp: "Team Renegade",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2022-08/EDWARDS_LEON_L_BELT_08-20.png",
      strikingAccuracy: 47,
      grappling: "Solid defensive grappling with improving takedown defense",
      knockouts: 7,
      submissions: 2,
      lastFight: {
        opponent: "Kamaru Usman",
        result: "Win",
        method: "KO (Head Kick)",
        date: new Date("2022-08-20")
      }
    },
    {
      name: "Alexander Volkanovski",
      nickname: "The Great",
      division: "Featherweight",
      height: "5'6\"",
      weight: "145 lbs",
      reach: "71.5\"",
      age: 35,
      wins: 26,
      losses: 3,
      draws: 0,
      record: "26-3-0",
      ranking: 1,
      champion: true,
      nationality: "Australian",
      hometown: "Shellharbour, Australia",
      fightingStyle: "Mixed Martial Arts",
      camp: "Freestyle Fighting Gym",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2023-02/VOLKANOVSKI_ALEXANDER_L_BELT_02-11.png",
      strikingAccuracy: 56,
      grappling: "Strong wrestling base with excellent takedown defense",
      knockouts: 12,
      submissions: 1,
      lastFight: {
        opponent: "Islam Makhachev",
        result: "Loss",
        method: "Decision (Unanimous)",
        date: new Date("2023-10-21")
      }
    },
    {
      name: "Sean O'Malley",
      nickname: "Suga",
      division: "Bantamweight",
      height: "5'11\"",
      weight: "135 lbs",
      reach: "72\"",
      age: 29,
      wins: 17,
      losses: 1,
      draws: 1,
      record: "17-1-1",
      ranking: 1,
      champion: true,
      nationality: "American",
      hometown: "Helena, Montana",
      fightingStyle: "Striking",
      camp: "MMA Lab",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2023-08/OMALLEY_SEAN_L_BELT_08-19.png",
      strikingAccuracy: 55,
      grappling: "Improving ground game with solid takedown defense",
      knockouts: 12,
      submissions: 0,
      lastFight: {
        opponent: "Aljamain Sterling",
        result: "Win",
        method: "TKO (Punches)",
        date: new Date("2023-08-19")
      }
    },
    {
      name: "Conor McGregor",
      nickname: "The Notorious",
      division: "Lightweight",
      height: "5'9\"",
      weight: "155 lbs",
      reach: "74\"",
      age: 35,
      wins: 22,
      losses: 6,
      draws: 0,
      record: "22-6-0",
      ranking: null,
      champion: false,
      nationality: "Irish",
      hometown: "Dublin, Ireland",
      fightingStyle: "Boxing/Karate",
      camp: "SBG Ireland",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2021-07/McGREGOR_CONOR_L_07-10.png",
      strikingAccuracy: 57,
      grappling: "Limited ground game, prefers to keep fights standing",
      knockouts: 19,
      submissions: 1,
      lastFight: {
        opponent: "Dustin Poirier",
        result: "Loss",
        method: "TKO (Doctor Stoppage)",
        date: new Date("2021-07-10")
      }
    },
    {
      name: "Khabib Nurmagomedov",
      nickname: "The Eagle",
      division: "Lightweight",
      height: "5'10\"",
      weight: "155 lbs",
      reach: "70\"",
      age: 35,
      wins: 29,
      losses: 0,
      draws: 0,
      record: "29-0-0",
      ranking: null,
      champion: false,
      status: "retired",
      nationality: "Russian",
      hometown: "Makhachkala, Dagestan",
      fightingStyle: "Wrestling/Sambo",
      camp: "Eagles MMA",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2020-10/NURMAGOMEDOV_KHABIB_L_10-24.png",
      strikingAccuracy: 51,
      grappling: "Legendary ground control and submission ability",
      knockouts: 8,
      submissions: 11,
      lastFight: {
        opponent: "Justin Gaethje",
        result: "Win",
        method: "Submission (Triangle Choke)",
        date: new Date("2020-10-24")
      }
    },
    {
      name: "Israel Adesanya",
      nickname: "The Last Stylebender",
      division: "Middleweight",
      height: "6'4\"",
      weight: "185 lbs",
      reach: "80\"",
      age: 34,
      wins: 24,
      losses: 3,
      draws: 0,
      record: "24-3-0",
      ranking: 2,
      champion: false,
      nationality: "Nigerian-New Zealand",
      hometown: "Auckland, New Zealand",
      fightingStyle: "Kickboxing",
      camp: "City Kickboxing",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2023-09/ADESANYA_ISRAEL_L_09-09.png",
      strikingAccuracy: 56,
      grappling: "Improving takedown defense, prefers striking",
      knockouts: 15,
      submissions: 0,
      lastFight: {
        opponent: "Sean Strickland",
        result: "Loss",
        method: "Decision (Unanimous)",
        date: new Date("2023-09-09")
      }
    },
    {
      name: "Francis Ngannou",
      nickname: "The Predator",
      division: "Heavyweight",
      height: "6'4\"",
      weight: "263 lbs",
      reach: "83\"",
      age: 37,
      wins: 17,
      losses: 3,
      draws: 0,
      record: "17-3-0",
      ranking: null,
      champion: false,
      status: "active",
      nationality: "Cameroonian-French",
      hometown: "Batié, Cameroon",
      fightingStyle: "Boxing/MMA",
      camp: "Xtreme Couture",
      imageUrl: "https://dmxg5wxfqgb4u.cloudfront.net/styles/card_advance_small_280x356/s3/2022-01/NGANNOU_FRANCIS_L_01-22.png",
      strikingAccuracy: 51,
      grappling: "Improving ground game, devastating power striker",
      knockouts: 12,
      submissions: 4,
      lastFight: {
        opponent: "Ciryl Gane",
        result: "Win",
        method: "Decision (Unanimous)",
        date: new Date("2022-01-22")
      }
    }
  ];

  try {
    await Fighter.deleteMany();
    await Fighter.insertMany(fighters);
    console.log('✅ Fighters seeded successfully');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding fighters:', err);
    process.exit(1);
  }
};

seedFighters();
