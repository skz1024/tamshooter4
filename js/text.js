// string js 작업은 나중에 할 예정

/**
 * 모든 텍스트 저장소 (변수 값이 아니라면, 절대로 이 값을 하드코딩(직접 입력) 하지 마세요.)
 * 이 값은, 텍스트 관리 및 번역 편의성을 위해 만든 클래스입니다.
 */
export class stringText {
  static main = {
    GAME_START: '게임 시작 (game start)',
    OPTION: '옵션 (option)'
  }

  static option = {
    MUSIC: '음악 (music)',
    SOUND: '사운드 (sound)',
    VOLUME: '소리 크기 (volume)',
    SHOW_ENEMY_HP: '적 체력 보여주기 (show enemy hp)',
    RESULT_AUTO_SKIP: '결과 자동 스킵 (result auto skip)'
  }

  static dataPlayerWeapon = {
    MULTYSHOT: '멀티샷 (multyshot)',
    MISSILE: '미사일 (missile)',
    ARROW: '애로우 (arrow)',
    LASER: '레이저 (laser)',
    SAPIA: '사피아 (sapia)',
  }

  static dataRoundName = {
    test: '테스트',
    round1_1: '우주 여행',
    round1_2: '운석 지대',
    round1_3: '무인기 전투',
    round1_4: '의식의 공간',
    round1_5: '빨간색 운석 지대',
    round1_6: '파란 행성 가는 길',
    round2_1: '파란 행성 하늘',
    round2_2: '동그라미 마을',
    round2_3: '동그라미 마을 회관',
    round2_4: '수많은 동그라미',
    round2_5: '동그라미와 침입자 전투',
    round2_6: '조용한 도로',
    round3_1: '다운 타워 1',
    round3_2: '다운 타워 2',
    round3_3: '다운 타워의 침입자',
    round3_4: '다운 타워 코어',
    round3_5: '다운 타워 통로',
    round3_6: '다운 타워 외벽',
    round4_1: '스카이 랜드 - 하늘길',
    round5_1: '추락지대',
  }

  static dataRoundInfo = {

  }
}

export class systemText {
  static controlError = {
    BUTTON_OUT_OF_INDEX: '잘못된 버튼의 인덱스가 입력되었습니다. 가능하면 buttonSystem 클래스 내부에 있는 상수 값을 인덱스로 사용하세요.'
  }

  static graphicError = {
    IMAGE_DISPLAY_ERROR: 'imageDisplay의 함수는 필요한 인자 개수가 3, 5, 9, 10~12개입니다. imageDisplay 함수의 코드를 살펴보세요.'
  }

  static gameError = {

  }

  static fieldError = {
    DIFFERENT_OBJECT_TYPE: '잘못된 objectType 을 입력했기 때문에, FieldObject를 생성할 수 없습니다.'
  }
}
