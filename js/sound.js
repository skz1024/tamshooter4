// 사운드파일을 묶은 클래스이고, 모든 변수는 static 이므로, 대문자로 선언하지 않았습니다.
// 인스턴스를 생성할 필요가 없는 클래스입니다.
// 단순하게 soundFile.SYSTEM_SOUND로 접근하세요.
export class soundFile {
  static system = {
    systemBack: new Audio('./sound/systemBack.mp3'),
    systemBuzzer: new Audio('./sound/systemBuzzer.mp3'),
    systemCursor: new Audio('./sound/systemCursor.mp3'),
    systemEnter: new Audio('./sound/systemEnter.mp3'),
    systemSelect: new Audio('./sound/systemSelect.mp3'),
    systemScore: new Audio('./sound/systemScore.mp3'),
    systemLevelUp: new Audio('./sound/systemLevelUp.mp3'),
    systemPause: new Audio('./sound/systemPause.mp3'),
    systemRoundClear: new Audio('./sound/systemRoundClear.mp3'),
    systemGameOver: new Audio('./sound/systemGameOver.mp3')
  }

  static skill = {
    skillMultyshotUse: new Audio('./sound/skillMultyshotUse.mp3'),
    skillMultyshotShot: new Audio('./sound/skillMultyshotShot.mp3'),
    skillMissileShot: new Audio('./sound/skillMissileShot.mp3'),
    skillMissileHit: new Audio('./sound/skillMissileHit.mp3'),
    skillArrowShot: new Audio('./sound/skillArrow.mp3'),
    skillLaserShot: new Audio('./sound/skillLaserShot.mp3'),
    skillSapiaWeapon: new Audio('./sound/skillSapiaWeapon.mp3'),
    skillParapoHit: new Audio('./sound/skillParapoHit.mp3'),
    skillBlasterShot: new Audio('./sound/skillBlasterShot.mp3'),
    skillSidewaveShot: new Audio('./sound/skillSidewaveShot.mp3')
  }
}

export class soundSystem {
  /**
   * 사운드 재생 함수 >> 주의: 절대로 audio객체의 play 함수를 직접 호출하지 말고, 이 함수를 사용하세요.
   * 참고: 음악은, musicPlay 함수를 사용해주세요. play 함수는 효과음 전용입니다.
   * @param {Audio} soundFile soundFile 객체의 static 변수
   */
  static play (soundFile) {
    // 사운드가 꺼질경우, 사운드를 출력하지 않음.
    if (!this.soundOn) return
    
    // 사운드가 정지 상태일때는 play() 함수를 호출합니다.
    // 그렇지 않으면 currentTime을 0으로 설정해서 처음부터 다시 재생합니다.
    // 절대로 pause() 를 호출한 직후 play() 를 호출하지 마세요. 이 경우 사운드 재생 오류가 발생합니다.
    if (soundFile.paused) {
      soundFile.play()
    } else {
      soundFile.currentTime = 0
    }
  }

  static musicPlay (soundFile) {

  }

  static soundOn = true
  static soundVolume = 1
  static musicOn = true
  static musicVolume = 1
}
