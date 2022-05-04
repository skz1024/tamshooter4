// 사운드파일을 묶은 클래스이고, 모든 변수는 static 이므로, 대문자로 선언하지 않았습니다.
// 인스턴스를 생성할 필요가 없는 클래스입니다.
// 단순하게 soundFile.SYSTEM_SOUND로 접근하세요.
class soundFile {
  static systemBack = new Audio('./sound/systemBack.mp3')
  static systemBuzzer = new Audio('./sound/systemBuzzer.mp3')
  static systemCursor = new Audio('./sound/systemCursor.mp3')
  static systemEnter = new Audio('./sound/systemEnter.mp3')
  static systemSelect = new Audio('./sound/systemSelect.mp3')
  static systemScore = new Audio('./sound/systemScore.mp3')
}

class SoundSystem {
  /**
   * 사운드 재생 함수 >> 주의: 절대로 audio객체의 play() 함수를 직접 호출하지 말고, 이 함수를 사용하세요.
   * 안그러면 나중에 코드 관리하기 귀찮아집니다.
   * @param {Audio} soundFile soundFile 객체의 static 변수
   */
  play (soundFile) {
    // 사운드가 정지 상태일때는 play() 함수를 호출합니다.
    // 그렇지 않으면 currentTime을 0으로 설정해서 처음부터 다시 재생합니다.
    // 절대로 pause() 를 호출한 직후 play() 를 호출하지 마세요. 이 경우 사운드 재생 오류가 발생합니다.
    if (soundFile.paused) {
      soundFile.play()
    } else {
      soundFile.currentTime = 0
    }
  }
}
const soundSystem = new SoundSystem()

export {
  soundFile,
  soundSystem
}