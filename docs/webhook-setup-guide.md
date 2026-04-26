# Airlol 웹훅 자동 동기화 설정 가이드

스프레드시트 데이터가 변경될 때 Airlol 사이트에 자동으로 반영되도록 설정하는 방법입니다. 한 번만 설정하면 이후 자동으로 동작합니다.

---

## 설정 방법 (3분 소요)

### 1단계: Apps Script 열기

스프레드시트에서 상단 메뉴의 **확장 프로그램 > Apps Script** 를 클릭합니다.

### 2단계: 코드 붙여넣기

기존 코드를 모두 지우고, 아래 코드를 **그대로** 복사해서 붙여넣으세요.

```javascript
function syncToAirlol() {
  var url = "https://airlol.manus.space/api/webhook/sync";
  var secret = "airlol_sync_2026_secret";
  
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Webhook-Secret": secret
    },
    payload: JSON.stringify({ source: "google_sheets" }),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("동기화 결과: " + response.getContentText());
  } catch (e) {
    Logger.log("동기화 실패: " + e.message);
  }
}
```

### 3단계: 저장

상단의 **저장 버튼 (💾)** 을 클릭하거나 **Ctrl+S** 를 누릅니다. 프로젝트 이름을 물어보면 "Airlol 동기화" 등 아무 이름이나 입력하세요.

### 4단계: 트리거 설정

1. 왼쪽 메뉴에서 **시계 아이콘 (트리거)** 을 클릭합니다
2. 오른쪽 아래 **"+ 트리거 추가"** 버튼을 클릭합니다
3. 다음과 같이 설정합니다:

| 항목 | 설정값 |
|------|--------|
| 실행할 함수 선택 | `syncToAirlol` |
| 실행할 배포 선택 | `Head` |
| 이벤트 소스 선택 | **스프레드시트에서** |
| 이벤트 유형 선택 | **변경 시** |

4. **저장** 을 클릭합니다
5. Google 계정 권한 요청이 나오면 **허용** 을 클릭합니다

---

## 설정 완료!

이제 스프레드시트에서 데이터를 수정하면 자동으로 Airlol 사이트에 반영됩니다.

---

## 참고 사항

- "변경 시" 트리거는 셀 값 변경, 행 추가/삭제, 시트 추가/삭제 등 모든 변경에 반응합니다
- 동기화는 보통 30초~1분 정도 소요됩니다
- 동기화 결과는 Apps Script의 **실행 로그**에서 확인할 수 있습니다
- 문제가 생기면 Airlol 사이트의 **데이터 동기화** 페이지에서 수동 동기화도 가능합니다

---

## 테스트 방법

설정 후 제대로 작동하는지 확인하려면:

1. Apps Script 편집기에서 **실행 버튼 (▶)** 을 클릭합니다
2. 하단 **실행 로그**에 "동기화 결과: ..." 메시지가 나오면 성공입니다
3. Airlol 사이트에서 데이터가 업데이트되었는지 확인합니다
