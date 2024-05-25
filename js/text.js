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
    FILED_LOAD_ERROR: 'fieldData가 호환되지 않거나 잘못되어 이 데이터를 불러올 수 없습니다. 메인 화면으로 이동합니다.',
    LOAD_JSON_ERROR: 'Load Error: 세이브 데이터가 JSON 형식과 다릅니다.',
    LOAD_ERROR_MESSAGE1: '세이브 데이터가 손상되거나 잘못되었습니다.',
    LOAD_ERROR_MESSAGE2: '게임을 실행할 수 없습니다.',
    LOAD_ERROR_MESSAGE3: '이 오류가 계속 발생하면, 로컬스토리지의 데이터를 삭제해주세요.',
    LOAD_ERROR_MESSAGE4: 'START 버튼 또는 ENTER 키를 10번 누르면 게임 데이터를 삭제하고 새로고침',
    LOAD_ERROR_MESSAGE5: 'The save data is corrupted or invalid.',
    LOAD_ERROR_MESSAGE6: 'The game could not be executed.',
    LOAD_ERROR_MESSAGE7: 'If this error continues, please delete the data from the local storage.',
    LOAD_ERROR_MESSAGE8: 'Delete and refresh game data by pressing the START button or ENTER key 10 times',
    LOAD_ERROR_DATA_DELETE_COMPLETE1: '게임 초기화 완료. 1초 후 자동으로 페이지 새로고침',
    LOAD_ERROR_DATA_DELETE_COMPLETE2: 'Game initialization complete. Automatically refresh page after 1 second',
    SAVE_NUMBER_DECODE_ERROR: 'saveSystemError: 잘못된 형식의 JSON 데이터.',
    SAVE_DIGIT_NOT_CORRECT: 'saveSystemError: 세이브 데이터가 잘못된 형식입니다.',
    USER_SRAM_ERROR: 'user 데이터에 오류가 발생했습니다. 이 데이터를 사용할 수 없습니다.',
    LOAD_USERLEVEL_ERROR: 'incorrect user level or exp, this data not used.',
    LOAD_PLAYTIME_ERROR: 'play time is NaN, not correct number type',
    LOAD_STARTDATE_ERROR: 'start date is Nan, not correct number type',
    FIELD_ERROR1: '필드에서 오류가 발생했습니다. 게임 진행이 불가능합니다.',
    FIELD_ERROR2: 'START 버튼을 눌러 메인 화면으로 이동하세요.',
    FIELD_ERROR3: 'An error has occurred in the field. The game cannot proceed.',
    FIELD_ERROR4: 'Press the START button to move to the main screen.',
  }

  static fieldError = {
    DIFFERENT_OBJECT_TYPE: '잘못된 objectType 을 입력했기 때문에, FieldObject를 생성할 수 없습니다.'
  }
}
