import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const SHEET_DIR = '/home/ubuntu/sheet_data';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Read all CSV files and extract series data
  const files = fs.readdirSync(SHEET_DIR).filter(f => f.endsWith('.csv'));
  const seriesData = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(SHEET_DIR, file), 'utf-8');
    const lines = content.split('\n');
    
    if (lines.length < 2) continue;
    
    // Check if line 2 contains "시리즈 전적"
    if (lines[1] && lines[1].includes('시리즈 전적')) {
      // Extract player name from line 1 (first column, remove parenthetical nickname)
      let name = lines[0].split(',')[0].trim();
      name = name.replace(/\(.*?\)/g, '').trim();
      
      // Extract series wins and losses from line 2
      const parts = lines[1].split(',');
      const wins = parseInt(parts[1]) || 0;
      const losses = parseInt(parts[2]) || 0;
      
      if (name) {
        seriesData.push({ name, wins, losses });
      }
    }
  }
  
  console.log(`Found ${seriesData.length} players with series data:`);
  
  let updated = 0;
  for (const p of seriesData) {
    try {
      const [result] = await conn.execute(
        'UPDATE players SET seriesWins = ?, seriesLosses = ? WHERE name = ?',
        [p.wins, p.losses, p.name]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ ${p.name}: ${p.wins}승 ${p.losses}패`);
        updated++;
      } else {
        console.log(`  ✗ ${p.name}: not found in DB (${p.wins}승 ${p.losses}패)`);
      }
    } catch (err) {
      console.error(`  ✗ ${p.name}: ${err.message}`);
    }
  }
  
  console.log(`\nUpdated ${updated}/${seriesData.length} players`);
  await conn.end();
}

main().catch(console.error);
