const express = require('express');
const FighterImages = require('../models/FighterImages');
const { createFuzzyFinder } = require('../utils/nameMatcher');
const router = express.Router();

// Sportradar MMA API - Dynamic import promise
let sportradarPromise = null;

// Initialize Sportradar SDK with dynamic import (ES6 module)
const initSportradar = async () => {
  if (!sportradarPromise) {
    sportradarPromise = (async () => {
      try {
        console.log('🔄 Loading Sportradar MMA SDK...');
        const SDK = await import('@api/sportradar-mma');
        
        console.log('📦 SDK loaded, checking exports...');
        console.log('SDK keys:', Object.keys(SDK));
        console.log('Has default?', !!SDK.default);
        console.log('SDK.default type:', typeof SDK.default);
        
        // The SDK is already instantiated, just use it directly
        let sportradarMma;
        if (SDK.default && typeof SDK.default === 'object') {
          console.log('✅ Using pre-instantiated SDK.default');
          sportradarMma = SDK.default;
        } else if (typeof SDK.default === 'function') {
          console.log('SDK.default is a constructor, instantiating...');
          sportradarMma = new SDK.default();
        } else if (typeof SDK === 'function') {
          console.log('SDK is a function, calling as constructor');
          sportradarMma = new SDK();
        } else {
          console.log('SDK is an object, using as-is');
          sportradarMma = SDK;
        }
        
        // Initialize with API key from environment
        const API_KEY = process.env.SPORTRADAR_API_KEY || 'ufc_fan_app_API';
        
        if (typeof sportradarMma.auth === 'function') {
          sportradarMma.auth(API_KEY);
          console.log('✅ Sportradar MMA API authenticated with key:', API_KEY.substring(0, 10) + '...');
        } else {
          console.log('⚠️ No auth method found on SDK');
          console.log('Available methods:', Object.keys(sportradarMma).filter(k => typeof sportradarMma[k] === 'function'));
        }
        
        console.log('✅ Sportradar MMA SDK ready!');
        return sportradarMma;
      } catch (error) {
        console.log('⚠️ Sportradar MMA package not found. Using mock data.');
        console.log('Error details:', error.message);
        console.log('Stack:', error.stack);
        return null;
      }
    })();
  }
  return sportradarPromise;
};

// Get MMA Rankings (changed from champions to rankings)
// Shared helper: fuzzy-match fighter headshots from our FighterImages collection
// onto a rankings payload (mutates competitor.image_url in place when missing).
async function enhanceRankingsWithImages(rankings) {
  try {
    const { isValidImageUrl } = require('../utils/nameMatcher');
    const fighterImages = await FighterImages.find();
    const findImage = createFuzzyFinder(
      fighterImages
        .filter((img) => {
          const u = img?.image_url || img?.image_path;
          return img?.name && u && isValidImageUrl(u);
        })
        .map((img) => ({ name: img.name, value: img.image_url || img.image_path })),
      { threshold: 0.9 }
    );
    rankings.forEach((ranking) => {
      (ranking.competitor_rankings || []).forEach((cr) => {
        const c = cr.competitor;
        if (c && c.name && (!c.image_url || String(c.image_url).includes('placeholder'))) {
          const nameParts = c.name.split(',').map((p) => p.trim());
          const normalized = nameParts.length > 1 ? `${nameParts[1]} ${nameParts[0]}` : c.name;
          const matched = findImage(normalized);
          if (matched) c.image_url = matched;
        }
      });
    });
  } catch (imgErr) {
    console.warn('⚠️ Could not enhance rankings with images:', imgErr.message);
  }
  return rankings;
}

router.get('/rankings', async (req, res) => {
  try {
    console.log('📊 Fetching MMA Rankings...');

    // 1) Prefer freshly-scraped UFC.com rankings stored in MongoDB by the
    //    PythonAnywhere job (scrapers/ufc_rankings/). This is the source of truth.
    try {
      const Ranking = require('../models/Ranking');
      const doc = await Ranking.findOne({ key: 'ufc_rankings' }).lean();
      if (doc && Array.isArray(doc.rankings) && doc.rankings.length) {
        console.log(`📦 Serving ${doc.rankings.length} divisions from scraped UFC rankings (updated ${doc.updatedAt})`);
        await enhanceRankingsWithImages(doc.rankings);
        return res.json({ rankings: doc.rankings, source: 'ufc.com', updatedAt: doc.updatedAt });
      }
      console.log('ℹ️ No scraped rankings in MongoDB yet — falling back to Sportradar/mock.');
    } catch (dbErr) {
      console.warn('⚠️ Could not read scraped rankings from MongoDB, falling back:', dbErr.message);
    }

    // 2) Fallback: Sportradar API (or mock data below).
    // Initialize SDK (only loads once, then cached)
    const sportradarMma = await initSportradar();
    
    // Try to use real API if available
    if (sportradarMma) {
      try {
        console.log('🔄 Calling Sportradar MMA Rankings API...');
        console.log('📋 Request params:', { access_level: 'trial', language_code: 'en', format: 'json' });
        
        const response = await sportradarMma.mmaRankings({
          access_level: 'trial',
          language_code: 'en',
          format: 'json'
        });
        
        console.log('✅ Real rankings data received from Sportradar');
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        console.log('Has data property?', !!response.data);
        
        // Fetch fighter images for fuzzy matching
        const { isValidImageUrl } = require('../utils/nameMatcher');
        const fighterImages = await FighterImages.find();
        const findImage = createFuzzyFinder(
          fighterImages
            .filter((img) => {
              const imageUrl = img?.image_url || img?.image_path;
              return img?.name && imageUrl && isValidImageUrl(imageUrl);
            })
            .map((img) => ({
              name: img.name,
              value: img.image_url || img.image_path,
            })),
          { threshold: 0.90 } // 90% similarity threshold for fuzzy matching
        );
        
        // Enhance rankings with fighter images from our database
        const rankingsData = response.data || response;
        if (rankingsData.rankings) {
          rankingsData.rankings.forEach((ranking) => {
            if (ranking.competitor_rankings) {
              ranking.competitor_rankings.forEach((compRanking) => {
                const competitor = compRanking.competitor;
                if (competitor && competitor.name) {
                  // Normalize name from "Last, First" format to "First Last"
                  const nameParts = competitor.name.split(',').map(p => p.trim());
                  const normalizedName = nameParts.length > 1 
                    ? `${nameParts[1]} ${nameParts[0]}` 
                    : competitor.name;
                  
                  // Try fuzzy match if image_url is missing or if we want to override
                  if (!competitor.image_url || competitor.image_url.includes('placeholder')) {
                    const matchedImage = findImage(normalizedName);
                    if (matchedImage) {
                      competitor.image_url = matchedImage;
                      console.log(`✅ Matched image for ${competitor.name}: ${matchedImage}`);
                    }
                  }
                }
              });
            }
          });
        }
        
        // Return the enhanced data
        return res.json(rankingsData);
      } catch (apiError) {
        console.error('❌ Sportradar API error:', apiError.message);
        console.error('Error status:', apiError.response?.status);
        console.error('Error data:', apiError.response?.data);
        console.log('⚠️ Falling back to mock data');
        console.log('💡 Note: Trial API keys may have limited endpoint access.');
        console.log('💡 The mock data will ensure the Ranking page works perfectly!');
      }
    }
    
    // Fallback to mock data if API fails or package not installed
    console.log('⚠️ Using mock rankings data');
    
    // Fetch fighter images for fuzzy matching
    let findImage = null;
    try {
      const { isValidImageUrl } = require('../utils/nameMatcher');
      const fighterImages = await FighterImages.find();
      findImage = createFuzzyFinder(
        fighterImages
          .filter((img) => {
            const imageUrl = img?.image_url || img?.image_path;
            return img?.name && imageUrl && isValidImageUrl(imageUrl);
          })
          .map((img) => ({
            name: img.name,
            value: img.image_url || img.image_path,
          })),
        { threshold: 0.90 } // 90% similarity threshold for fuzzy matching
      );
      console.log(`🖼️ Loaded ${fighterImages.length} fighter images for rankings`);
    } catch (imageError) {
      console.warn('⚠️ Could not load fighter images for rankings:', imageError.message);
    }
    
    // Enhance mock data with fuzzy-matched images
    const enhanceCompetitorImages = (competitors) => {
      if (!findImage) return competitors;
      
      return competitors.map(comp => {
        if (comp.competitor && comp.competitor.name) {
          // Normalize name from "Last, First" format to "First Last"
          const nameParts = comp.competitor.name.split(',').map(p => p.trim());
          const normalizedName = nameParts.length > 1 
            ? `${nameParts[1]} ${nameParts[0]}` 
            : comp.competitor.name;
          
          // Try fuzzy match if image_url is missing
          if (!comp.competitor.image_url) {
            const matchedImage = findImage(normalizedName);
            if (matchedImage) {
              comp.competitor.image_url = matchedImage;
              console.log(`✅ Matched image for ${comp.competitor.name}: ${matchedImage}`);
            }
          }
        }
        return comp;
      });
    };
    
    const mockRankings = {
      rankings: [
        {
          name: 'heavyweight',
          type_id: 1,
          week: 45,
          year: 2024,
          competitor_rankings: enhanceCompetitorImages([
            {
              rank: 1,
              movement: 0,
              competitor: {
                id: 'sr:competitor:jones_jon',
                name: 'Jones, Jon',
                abbreviation: 'JON',
                gender: 'male',
                country: 'USA',
                record: '27-1-0',
                image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-03/JONES_JON_L_BELT_03-04.png'
              }
            },
            {
              rank: 2,
              movement: 0,
              competitor: {
                id: 'sr:competitor:miocic_stipe',
                name: 'Miocic, Stipe',
                abbreviation: 'MIO',
                gender: 'male',
                country: 'USA',
                record: '20-4-0',
                image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-07/MIOCIC_STIPE_L_07-08.png'
              }
            },
            {
              rank: 3,
              movement: 1,
              competitor: {
                id: 'sr:competitor:gane_ciryl',
                name: 'Gane, Ciryl',
                abbreviation: 'GAN',
                gender: 'male',
                country: 'France',
                record: '12-2-0',
                image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-09/GANE_CIRYL_L_09-02.png'
              }
            }
          ])
        },
        {
          name: 'light_heavyweight',
            type_id: 2,
            week: 45,
            year: 2024,
            competitor_rankings: [
              {
                rank: 1,
                movement: 0,
                competitor: {
                  id: 'sr:competitor:pereira_alex',
                  name: 'Pereira, Alex',
                  abbreviation: 'PER',
                  gender: 'male',
                  country: 'Brazil',
                  record: '11-2-0',
                  image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-11/PEREIRA_ALEX_L_11-11.png'
                }
              },
              {
                rank: 2,
                movement: 0,
                competitor: {
                  id: 'sr:competitor:ankalaev_magomed',
                  name: 'Ankalaev, Magomed',
                  abbreviation: 'ANK',
                  gender: 'male',
                  country: 'Russia',
                  record: '18-1-1',
                  image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-01/ANKALAEV_MAGOMED_L_01-13.png'
                }
              },
              {
                rank: 3,
                movement: 0,
                competitor: {
                  id: 'sr:competitor:hill_jamahal',
                  name: 'Hill, Jamahal',
                  abbreviation: 'HIL',
                  gender: 'male',
                  country: 'USA',
                  record: '12-1-0',
                  image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-01/HILL_JAMAHAL_L_BELT_01-21.png'
                }
              }
            ]
          },
          {
            name: 'lightweight',
            type_id: 3,
            week: 45,
            year: 2024,
            competitor_rankings: [
              {
                rank: 1,
                movement: 0,
                competitor: {
                  id: 'sr:competitor:makhachev_islam',
                  name: 'Makhachev, Islam',
                  abbreviation: 'MAK',
                  gender: 'male',
                  country: 'Russia',
                  record: '26-1-0',
                  image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/MAKHACHEV_ISLAM_L_BELT_06-01.png'
                }
              },
              {
                rank: 2,
                movement: 0,
                competitor: {
                  id: 'sr:competitor:tsarukyan_arman',
                  name: 'Tsarukyan, Arman',
                  abbreviation: 'TSA',
                  gender: 'male',
                  country: 'Armenia',
                  record: '21-3-0',
                  image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-04/TSARUKYAN_ARMAN_L_04-22.png'
                }
              },
              {
                rank: 3,
                movement: 0,
                competitor: {
                  id: 'sr:competitor:oliveira_charles',
                  name: 'Oliveira, Charles',
                  abbreviation: 'OLI',
                  gender: 'male',
                  country: 'Brazil',
                  record: '34-10-0',
                  image_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/OLIVEIRA_CHARLES_L_04-13.png'
                }
              }
            ]
          }
        ].map(ranking => ({
          ...ranking,
          competitor_rankings: enhanceCompetitorImages(ranking.competitor_rankings || [])
        })),
        generated_at: new Date().toISOString()
      };
      
      console.log('✅ Returning enhanced mock rankings with fuzzy-matched images');
      return res.json(mockRankings);
  } catch (error) {
    console.error('❌ Error fetching rankings:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch rankings data',
      message: error.message 
    });
  }
});

// Keep old /champions endpoint for backward compatibility (redirects to rankings)
router.get('/champions', (req, res) => {
  res.redirect('/api/sportradar/rankings');
});

module.exports = router;

