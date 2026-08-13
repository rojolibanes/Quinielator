import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://www.futbolfantasy.com';

// FutbolFantasy uses generic team names like 'Real Madrid', 'Barcelona', etc.
// We need them to match exactly with our DB / API-Football names if possible,
// but for now we'll just store whatever FutbolFantasy has, and fuzzy match in route.ts.

function translatePosition(posClass) {
  if (!posClass) return 'MED';
  const pos = posClass.toLowerCase();
  if (pos.includes('por')) return 'POR';
  if (pos.includes('def')) return 'DEF';
  if (pos.includes('med') || pos.includes('cen')) return 'MED';
  if (pos.includes('del')) return 'DEL';
  return 'MED'; // default
}

async function scrapePlayers() {
  console.log('Iniciando scraper de FutbolFantasy...');
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const teams = [];
    $('.teams.liga a.team').each((_, el) => {
      const name = $(el).attr('data-tooltip') || $(el).attr('title');
      let link = $(el).attr('href');
      if (name && link) {
        if (!link.startsWith('http')) link = BASE_URL + link;
        teams.push({ name: name.trim(), link });
      }
    });
    
    console.log(`Se encontraron ${teams.length} equipos.`);
    
    let allPlayers = [];
    let idCounter = 1;

    for (const team of teams) {
      console.log(`Extrayendo plantilla de: ${team.name}...`);
      const teamRes = await fetch(`${team.link}/plantilla`);
      const teamHtml = await teamRes.text();
      const $team = cheerio.load(teamHtml);
      
      const teamName = team.name;

      $team('.wjugador').each((_, el) => {
        const $el = $team(el);
        
        // Skip loaned players (cedidos)
        if ($el.closest('.cedidos').length > 0) return;
        
        // Skip youth/B-team players (filial)
        if ($el.hasClass('filial')) return;
        
        let playerName = $el.find('a.jugador').text().trim();
        // Remove squad numbers like "1. "
        playerName = playerName.replace(/^\d+\.\s*/, '');
        
        let posText = $el.find('.posicion').text().trim().toLowerCase();
        let pos = 'MED';
        if (posText.includes('por')) pos = 'POR';
        else if (posText.includes('def')) pos = 'DEF';
        else if (posText.includes('med') || posText.includes('cen')) pos = 'MED';
        else if (posText.includes('del')) pos = 'DEL';

        let photo = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
        if (photo && !photo.startsWith('http')) photo = BASE_URL + photo;
        
        if (playerName) {
          allPlayers.push({
            id: idCounter++,
            name: playerName,
            photo,
            position: pos,
            team: teamName
          });
        }
      });
      
      // Delay to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 200));
    }

    // Deduplicate players by name
    const uniquePlayersMap = new Map();
    for (const p of allPlayers) {
      if (!uniquePlayersMap.has(p.name)) {
        uniquePlayersMap.set(p.name, p);
      }
    }
    const finalPlayers = Array.from(uniquePlayersMap.values());
    console.log(`\n✅ Posiciones obtenidas exitosamente.`);
    
    console.log(`Total de jugadores extraídos (final): ${finalPlayers.length}`);
    
    const outputData = {
      updatedAt: new Date().toISOString(),
      players: finalPlayers
    };
    
    const outputPath = path.join(process.cwd(), 'src', 'data', 'players.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log(`✅ Jugadores guardados exitosamente en ${outputPath}`);
  } catch (err) {
    console.error('Error durante el scraper:', err);
  }
}

scrapePlayers();
