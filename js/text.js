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
    RESULT_AUTO_SKIP: '결과 자동 스킵 (result auto skip)',
  }
  static dataPlayerWeapon = {
    MULTYSHOT: '멀티샷 (multyshot)',
    MISSILE: '미사일 (missile)'
  }
}

export class systemText {
  static controlError = {
    BUTTON_OUT_OF_INDEX: '잘못된 버튼의 인덱스가 입력되었습니다. 가능하면 buttonSystem 클래스 내부에 있는 상수 값을 인덱스로 사용하세요.'
  }
  static graphicError = {
    IMAGE_DISPLAY_ERROR: 'imageDisplay의 함수는 필요한 인자 개수가 3, 5, 9개입니다. imageDisplay 함수의 코드를 살펴보세요.'
  }
  static gameError = {
    
  }
  static fieldError = {
    DIFFERENT_OBJECT_TYPE: '잘못된 objectType 을 입력했기 때문에, FieldObject를 생성할 수 없습니다.'
  }
}