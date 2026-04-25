import mysql from 'mysql2/promise';

const realPlayers = [
  '강기범', '김도형', '김민재01', '김민재97', '김현규',
  '노준탁', '류재강', '박유진', '박태현', '백천우',
  '설동희', '심태웅', '양수명', '오세창', '오승연',
  '원호연', '윤수진', '이강현', '이건은', '이경엽',
  '이승제', '이시욱', '정복진', '정윤영', '정재우',
  '최승효', '최완전', '추송경', '한지석', '현명원'
];

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Count before
  const [before] = await conn.execute('SELECT COUNT(*) as cnt FROM players');
  console.log('Before cleanup:', before[0].cnt, 'players');
  
  // Delete all players NOT in the real player list
  const placeholders = realPlayers.map(() => '?').join(',');
  const [result] = await conn.execute(
    `DELETE FROM players WHERE name NOT IN (${placeholders})`,
    realPlayers
  );
  console.log('Deleted:', result.affectedRows, 'fake player entries (champions)');
  
  // Count after
  const [after] = await conn.execute('SELECT COUNT(*) as cnt FROM players');
  console.log('After cleanup:', after[0].cnt, 'players');
  
  // Verify
  const [remaining] = await conn.execute('SELECT name, psScore FROM players ORDER BY CAST(psScore AS DECIMAL) DESC');
  for (const r of remaining) {
    console.log(`  ${r.name}: PS ${r.psScore}`);
  }
  
  await conn.end();
}

run().catch(console.error);
