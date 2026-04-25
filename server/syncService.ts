import { upsertPlayerBulk, upsertChampionBulk, createSyncLog } from "./db";

const SPREADSHEET_ID = "1bUqPV6mcmbo3XlSD7kOg2JR_jexMk1rYspTrl7otNWA";

// GID to player name mapping for individual sheets (시리즈 전적)
const PLAYER_SHEET_GIDS: Record<string, string> = {
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

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

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

async function fetchCSV(gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch sheet gid=${gid}: ${response.status}`);
  return response.text();
}

export async function syncFromSpreadsheet(sheetUrl?: string): Promise<{
  success: boolean;
  playersUpdated: number;
  championsUpdated: number;
}> {
  // Determine spreadsheet ID
  let spreadsheetId = SPREADSHEET_ID;
  if (sheetUrl) {
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) spreadsheetId = match[1];
  }

  try {
    // 1. Fetch main sheet (gid=0) for player wins/losses and champion data
    const mainCsv = await fetchCSV("0");
    const rows = parseCSV(mainCsv);

    const playerData: { name: string; wins: number; losses: number; seriesWins?: number; seriesLosses?: number }[] = [];
    const championData: { name: string; wins: number; losses: number }[] = [];

    let inChampionSection = false;
    for (const row of rows) {
      if (row[0] && row[0].includes("챔피언별 승률")) {
        inChampionSection = true;
        continue;
      }

      if (inChampionSection && row[0] && row[0].trim()) {
        const wins = parseInt(row[1]) || 0;
        const losses = parseInt(row[2]) || 0;
        if (wins > 0 || losses > 0) {
          championData.push({ name: row[0].trim(), wins, losses });
        }
      }

      // Player data from right side columns (index 14-16)
      if (row.length > 16 && row[14] && row[14].trim()) {
        const wins = parseInt(row[15]) || 0;
        const losses = parseInt(row[16]) || 0;
        if (wins > 0 || losses > 0) {
          playerData.push({ name: row[14].trim(), wins, losses });
        }
      }
    }

    // 2. Fetch individual sheets for series records
    const seriesMap: Record<string, { seriesWins: number; seriesLosses: number }> = {};

    const gids = Object.keys(PLAYER_SHEET_GIDS);
    // Fetch in batches of 5 to avoid rate limiting
    for (let i = 0; i < gids.length; i += 5) {
      const batch = gids.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (gid) => {
          const csv = await fetchCSV(gid);
          const sheetRows = parseCSV(csv);
          const playerName = PLAYER_SHEET_GIDS[gid];

          for (const row of sheetRows) {
            if (row[0] && row[0].includes("시리즈")) {
              const wins = parseInt(row[1]) || 0;
              const losses = parseInt(row[2]) || 0;
              seriesMap[playerName] = { seriesWins: wins, seriesLosses: losses };
              break;
            }
          }
        })
      );
    }

    // 3. Merge series data into player data
    for (const p of playerData) {
      if (seriesMap[p.name]) {
        p.seriesWins = seriesMap[p.name].seriesWins;
        p.seriesLosses = seriesMap[p.name].seriesLosses;
      }
    }

    let playersCount = 0;
    let championsCount = 0;

    if (playerData.length > 0) {
      playersCount = await upsertPlayerBulk(playerData);
    }
    if (championData.length > 0) {
      championsCount = await upsertChampionBulk(championData);
    }

    await createSyncLog({
      syncType: "spreadsheet",
      status: "success",
      message: `Synced from spreadsheet (players: ${playersCount}, champions: ${championsCount}, series: ${Object.keys(seriesMap).length})`,
      playersCount,
      championsCount,
    });

    return { success: true, playersUpdated: playersCount, championsUpdated: championsCount };
  } catch (error: any) {
    await createSyncLog({
      syncType: "spreadsheet",
      status: "error",
      message: error.message,
    });
    throw error;
  }
}
