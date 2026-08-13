import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://www.futbolfantasy.com';

// FutbolFantasy uses generic team names like 'Real Madrid', 'Barcelona', etc.
// We need them to match exactly with our DB / API-Football names if possible,
// but for now we'll just store whatever FutbolFantasy has, and fuzzy match in route.ts.

function translatePosition(posClass) {
  if (posClass.includes('por')) return 'POR';
  if (posClass.includes('def')) return 'DEF';
  if (posClass.includes('med')) return 'MED';
  if (posClass.includes('del')) return 'DEL';
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
    
    const allPlayers = [];
    let idCounter = 1;

    for (const team of teams) {
      console.log(`Extrayendo plantilla de: ${team.name}...`);
      const teamRes = await fetch(team.link);
      const teamHtml = await teamRes.text();
      const $team = cheerio.load(teamHtml);
      
      const teamName = team.name;

      $team('div[class*="jugador_"]').each((_, el) => {
        const img = $team(el).find('img');
        let playerName = img.attr('alt');
        if (!playerName) {
          playerName = $team(el).find('.name').text().trim();
        }
        const positionClass = $team(el).attr('class') || '';
        const position = translatePosition(positionClass);
        
        if (playerName && playerName !== 'logo campeonato' && playerName !== 'FútbolFantasy') {
          allPlayers.push({
            id: idCounter++,
            name: playerName,
            photo: img.attr('data-src') || img.attr('src') || '',
            position: position,
            team: teamName
          });
        }
      });
      
      // Delay to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`Total de jugadores extraídos: ${allPlayers.length}`);
    
    const outputData = {
      updatedAt: new Date().toISOString(),
      players: allPlayers
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
