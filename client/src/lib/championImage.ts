// 라이엇 Data Dragon 챔피언 이미지 URL 생성 유틸리티
// 한글 챔피언 이름 → 영문 ID 매핑

const DDRAGON_VERSION = "16.8.1";
const DDRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;

// 한글 이름 → Data Dragon 영문 키 매핑
const CHAMPION_MAP: Record<string, string> = {
  "가렌": "Garen",
  "갈리오": "Galio",
  "갱플랭크": "Gangplank",
  "그라가스": "Gragas",
  "그레이브즈": "Graves",
  "그웬": "Gwen",
  "나르": "Gnar",
  "나미": "Nami",
  "나서스": "Nasus",
  "나피리": "Naafiri",
  "노틸러스": "Nautilus",
  "녹턴": "Nocturne",
  "누누와 윌럼프": "Nunu",
  "니달리": "Nidalee",
  "니코": "Neeko",
  "닐라": "Nilah",
  "다리우스": "Darius",
  "다이애나": "Diana",
  "드레이븐": "Draven",
  "라이즈": "Ryze",
  "라칸": "Rakan",
  "람머스": "Rammus",
  "럭스": "Lux",
  "럼블": "Rumble",
  "레나타 글라스크": "Renata",
  "레넥톤": "Renekton",
  "레오나": "Leona",
  "렉사이": "RekSai",
  "렐": "Rell",
  "렝가": "Rengar",
  "루시안": "Lucian",
  "룰루": "Lulu",
  "르블랑": "Leblanc",
  "리 신": "LeeSin",
  "리산드라": "Lissandra",
  "리븐": "Riven",
  "릴리아": "Lillia",
  "마스터 이": "MasterYi",
  "마오카이": "Maokai",
  "말자하": "Malzahar",
  "말파이트": "Malphite",
  "모데카이저": "Mordekaiser",
  "모르가나": "Morgana",
  "문도 박사": "DrMundo",
  "미스 포츈": "MissFortune",
  "밀리오": "Milio",
  "바드": "Bard",
  "바루스": "Varus",
  "바이": "Vi",
  "베이가": "Veigar",
  "베인": "Vayne",
  "벡스": "Vex",
  "벨베스": "Belveth",
  "벨코즈": "Velkoz",
  "볼리베어": "Volibear",
  "브라움": "Braum",
  "브라이어": "Briar",
  "블라디미르": "Vladimir",
  "블리츠크랭크": "Blitzcrank",
  "비에고": "Viego",
  "빅토르": "Viktor",
  "뽀삐": "Poppy",
  "사미라": "Samira",
  "사이온": "Sion",
  "사일러스": "Sylas",
  "샤코": "Shaco",
  "세나": "Senna",
  "세라핀": "Seraphine",
  "세주아니": "Sejuani",
  "세트": "Sett",
  "소나": "Sona",
  "소라카": "Soraka",
  "쉔": "Shen",
  "쉬바나": "Shyvana",
  "스몰더": "Smolder",
  "스웨인": "Swain",
  "스카너": "Skarner",
  "시비르": "Sivir",
  "신 짜오": "XinZhao",
  "신드라": "Syndra",
  "신지드": "Singed",
  "쓰레쉬": "Thresh",
  "아리": "Ahri",
  "아무무": "Amumu",
  "아우렐리온 솔": "AurelionSol",
  "아이번": "Ivern",
  "아지르": "Azir",
  "아칼리": "Akali",
  "아크샨": "Akshan",
  "아트록스": "Aatrox",
  "아펠리오스": "Aphelios",
  "알리스타": "Alistar",
  "암베사": "Ambessa",
  "애니": "Annie",
  "애니비아": "Anivia",
  "애쉬": "Ashe",
  "야스오": "Yasuo",
  "에코": "Ekko",
  "엘리스": "Elise",
  "오공": "MonkeyKing",
  "오로라": "Aurora",
  "오른": "Ornn",
  "오리아나": "Orianna",
  "올라프": "Olaf",
  "요네": "Yone",
  "요릭": "Yorick",
  "우디르": "Udyr",
  "우르곳": "Urgot",
  "워윅": "Warwick",
  "유미": "Yuumi",
  "이렐리아": "Irelia",
  "이블린": "Evelynn",
  "이즈리얼": "Ezreal",
  "일라오이": "Illaoi",
  "자르반 4세": "JarvanIV",
  "자야": "Xayah",
  "자이라": "Zyra",
  "자크": "Zac",
  "잔나": "Janna",
  "잭스": "Jax",
  "제드": "Zed",
  "제라스": "Xerath",
  "제리": "Zeri",
  "조이": "Zoe",
  "직스": "Ziggs",
  "진": "Jhin",
  "질리언": "Zilean",
  "징크스": "Jinx",
  "초가스": "Chogath",
  "카르마": "Karma",
  "카밀": "Camille",
  "카사딘": "Kassadin",
  "카서스": "Karthus",
  "카시오페아": "Cassiopeia",
  "카이사": "Kaisa",
  "카직스": "Khazix",
  "카타리나": "Katarina",
  "칼리스타": "Kalista",
  "케넨": "Kennen",
  "케이틀린": "Caitlyn",
  "케인": "Kayn",
  "코그모": "KogMaw",
  "코르키": "Corki",
  "퀸": "Quinn",
  "크산테": "KSante",
  "클레드": "Kled",
  "키아나": "Qiyana",
  "킨드레드": "Kindred",
  "타릭": "Taric",
  "탈론": "Talon",
  "탈리야": "Taliyah",
  "탐 켄치": "TahmKench",
  "트런들": "Trundle",
  "트리스타나": "Tristana",
  "트린다미어": "Tryndamere",
  "트위스티드 페이트": "TwistedFate",
  "트위치": "Twitch",
  "티모": "Teemo",
  "파이크": "Pyke",
  "판테온": "Pantheon",
  "피들스틱": "Fiddlesticks",
  "피오라": "Fiora",
  "피즈": "Fizz",
  "하이머딩거": "Heimerdinger",
  "헤카림": "Hecarim",
  "흐웨이": "Hwei",
  "제이스": "Jayce",
  "멜": "Mel",
  // DB 이름 변형 (띄어쓰기 없는 버전, 오타 등)
  "문도박사": "DrMundo",
  "브랜드": "Brand",
  "자헨": "Zaahen",
  "유나라": "Yunara",
  "탐켄치": "TahmKench",
  "쓰래쉬": "Thresh",
  "케일": "Kayle",
};

// 런타임에 Data Dragon에서 매핑을 가져오는 캐시
let runtimeMap: Record<string, string> | null = null;
let fetchPromise: Promise<Record<string, string>> | null = null;

async function fetchChampionMap(): Promise<Record<string, string>> {
  if (runtimeMap) return runtimeMap;
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = fetch(`${DDRAGON_BASE}/data/ko_KR/champion.json`)
    .then(res => res.json())
    .then(data => {
      const map: Record<string, string> = {};
      for (const [key, val] of Object.entries(data.data as Record<string, any>)) {
        map[val.name] = key;
      }
      runtimeMap = map;
      return map;
    })
    .catch(() => CHAMPION_MAP);
  
  return fetchPromise;
}

/**
 * 한글 챔피언 이름으로 Data Dragon 아이콘 URL 반환
 */
export function getChampionImageUrl(koreanName: string): string {
  const englishKey = CHAMPION_MAP[koreanName];
  if (englishKey) {
    return `${DDRAGON_BASE}/img/champion/${englishKey}.png`;
  }
  // 매핑에 없으면 빈 문자열 반환 (fallback 처리)
  return "";
}

/**
 * React Hook: 런타임 매핑 로드 후 이미지 URL 반환
 */
export function useChampionImage() {
  return {
    getImageUrl: (koreanName: string) => {
      // 정적 매핑 우선 사용
      const url = getChampionImageUrl(koreanName);
      if (url) return url;
      // 런타임 매핑 시도 (비동기이므로 fallback)
      if (runtimeMap) {
        const key = runtimeMap[koreanName];
        if (key) return `${DDRAGON_BASE}/img/champion/${key}.png`;
      } else {
        fetchChampionMap(); // 백그라운드 로드
      }
      return "";
    },
    preload: fetchChampionMap,
  };
}

export { DDRAGON_VERSION, DDRAGON_BASE, fetchChampionMap };
