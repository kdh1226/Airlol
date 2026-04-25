import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const PLAYER_SHEET_GIDS = {
  "1006541724": "윤수진",
  "1055361615": "김민재01",
  "1349808246": "심태웅",
  "152620957": "정윤영",
  "1538070085": "김도형",
  "1570719376": "이건은",
  "1603049033": "추송경",
  "1674235311": "이강현",
  "1684828170": "김현규",
  "1710312713": "오승연",
  "1818810563": "이시욱",
  "1843507593": "현명원",
  "1895801022": "양수명",
  "191891493": "이경엽",
  "2075109423": "노준탁",
  "210736567": "원호연",
  "247918078": "한지석",
  "280318929": "오세창",
  "297341351": "최완전",
  "300660248": "최승효",
  "37520308": "류재강",
  "400047427": "박태현",
  "425760240": "강기범",
  "509450432": "박유진",
  "550609566": "설동희",
  "643252883": "정복진",
  "753021257": "정재우",
  "798735375": "김민재97",
  "860410176": "백천우",
  "935155631": "이승제",
};

function parseCSV(text) {
  const rows = [];
  let current = "";
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current);
        current = "";
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(current);
        current = "";
        rows.push(row);
        row = [];
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

const POSITIONS = ['탑', '정글', '미드', '원딜', '서폿'];

function parsePlayerSheet(csvText, playerName) {
  const rows = parseCSV(csvText);
  const positionStats = [];
  const matchupStats = [];
  const championStats = [];

  let currentPosition = null;
  let currentSection = null; // 'position' or 'champion'

  for (const row of rows) {
    if (!row[0] || !row[0].trim()) continue;
    const cell = row[0].trim();

    // Check for position record (e.g., "탑 전적", "정글 전적")
    const posMatch = cell.match(/^(탑|정글|미드|원딜|서폿)\s*전적$/);
    if (posMatch) {
      currentPosition = posMatch[1];
      currentSection = 'position';
      const wins = parseInt(row[1]) || 0;
      const losses = parseInt(row[2]) || 0;
      positionStats.push({ playerName, position: currentPosition, wins, losses });
      continue;
    }

    // Check for champion-by-position record (e.g., "챔피언별 전적(탑)")
    const champPosMatch = cell.match(/챔피언별\s*전적\(?(탑|정글|미드|원딜|서폿)\)?/);
    if (champPosMatch) {
      currentPosition = champPosMatch[1];
      currentSection = 'champion';
      continue;
    }

    // Skip non-data rows
    if (cell.includes('시리즈') || cell.includes('총 게임') || cell === playerName || cell.includes('승')) continue;

    // Matchup data (e.g., "상대전적(현명원)")
    const matchupMatch = cell.match(/상대전적\((.+)\)/);
    if (matchupMatch && currentPosition && currentSection === 'position') {
      const opponentName = matchupMatch[1];
      const wins = parseInt(row[1]) || 0;
      const losses = parseInt(row[2]) || 0;
      matchupStats.push({ playerName, position: currentPosition, opponentName, wins, losses });
      continue;
    }

    // Champion data (under 챔피언별 전적 section)
    if (currentSection === 'champion' && currentPosition) {
      const wins = parseInt(row[1]) || 0;
      const losses = parseInt(row[2]) || 0;
      if (wins > 0 || losses > 0) {
        championStats.push({ playerName, position: currentPosition, championName: cell, wins, losses });
      }
    }
  }

  return { positionStats, matchupStats, championStats };
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Clear existing data
  await conn.execute("DELETE FROM player_position_stats");
  await conn.execute("DELETE FROM player_matchup_stats");
  await conn.execute("DELETE FROM player_champion_stats");

  let totalPositions = 0;
  let totalMatchups = 0;
  let totalChampions = 0;

  for (const [gid, playerName] of Object.entries(PLAYER_SHEET_GIDS)) {
    const filepath = path.join('/home/ubuntu/sheet_data', `gid_${gid}.csv`);
    if (!fs.existsSync(filepath)) {
      console.log(`Skipping ${playerName}: file not found`);
      continue;
    }

    const csvText = fs.readFileSync(filepath, 'utf-8');
    const { positionStats, matchupStats, championStats } = parsePlayerSheet(csvText, playerName);

    // Insert position stats
    for (const stat of positionStats) {
      await conn.execute(
        "INSERT INTO player_position_stats (playerName, position, wins, losses) VALUES (?, ?, ?, ?)",
        [stat.playerName, stat.position, stat.wins, stat.losses]
      );
      totalPositions++;
    }

    // Insert matchup stats
    for (const stat of matchupStats) {
      await conn.execute(
        "INSERT INTO player_matchup_stats (playerName, position, opponentName, wins, losses) VALUES (?, ?, ?, ?, ?)",
        [stat.playerName, stat.position, stat.opponentName, stat.wins, stat.losses]
      );
      totalMatchups++;
    }

    // Insert champion stats
    for (const stat of championStats) {
      await conn.execute(
        "INSERT INTO player_champion_stats (playerName, position, championName, wins, losses) VALUES (?, ?, ?, ?, ?)",
        [stat.playerName, stat.position, stat.championName, stat.wins, stat.losses]
      );
      totalChampions++;
    }

    console.log(`${playerName}: ${positionStats.length} positions, ${matchupStats.length} matchups, ${championStats.length} champions`);
  }

  console.log(`\nTotal: ${totalPositions} position stats, ${totalMatchups} matchup stats, ${totalChampions} champion stats`);
  await conn.end();
}

main().catch(console.error);
