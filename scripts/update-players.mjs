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
      const teamRes = await fetch(team.link);
      const teamHtml = await teamRes.text();
      const $team = cheerio.load(teamHtml);
      
      const teamName = team.name;

      // Extract players from the list view to get profile links
      $team('.jugador.tipo_lista').each((_, el) => {
        const linkEl = $team(el).find('a[href*="/jugadores/"]').last();
        const profileUrl = linkEl.attr('href');
        let playerName = linkEl.text().trim();
        
        if (!playerName || !profileUrl) return;
        
        allPlayers.push({
          name: playerName,
          profileUrl: profileUrl.startsWith('http') ? profileUrl : BASE_URL + profileUrl,
          team: teamName
        });
      });
      
      // Delay to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 500));
    }

    // Deduplicate players by name
    const uniquePlayersMap = new Map();
    for (const p of allPlayers) {
      if (!uniquePlayersMap.has(p.name)) {
        uniquePlayersMap.set(p.name, p);
      }
    }
    allPlayers = Array.from(uniquePlayersMap.values());
    console.log(`Total de jugadores extraídos: ${allPlayers.length}. Obteniendo posiciones y fotos...`);

    // Fetch profiles in batches to get position and photo
    const BATCH_SIZE = 20;
    const finalPlayers = [];
    
    for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
      const batch = allPlayers.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (player) => {
        try {
          const pRes = await fetch(player.profileUrl);
          const pHtml = await pRes.text();
          const $p = cheerio.load(pHtml);
          
          // Position
          let pos = $p('.posicion').first().text().trim().toUpperCase();
          if (!['POR', 'DEF', 'MED', 'DEL'].includes(pos)) pos = 'MED';
          
          // Photo
          let photo = $p('.foto img').attr('src') || '';
          if (photo && !photo.startsWith('http')) photo = BASE_URL + photo;
          
          return {
            id: idCounter++,
            name: player.name,
            photo,
            position: pos,
            team: player.team
          };
        } catch (e) {
          console.error(`Error fetching ${player.name}: ${e.message}`);
          return {
            id: idCounter++,
            name: player.name,
            photo: '',
            position: 'MED',
            team: player.team
          };
        }
      });
      
      const results = await Promise.all(promises);
      finalPlayers.push(...results);
      
      process.stdout.write(`Progreso: ${finalPlayers.length}/${allPlayers.length}\r`);
      await new Promise(r => setTimeout(r, 300));
    }
    
    console.log('\n✅ Posiciones obtenidas exitosamente.');
    
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
