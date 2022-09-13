// 사운드파일을 묶은 클래스이고, 모든 변수는 static 이므로, 대문자로 선언하지 않았습니다.
// 인스턴스를 생성할 필요가 없는 클래스입니다.

/**
 * @deprecated
 */
export class soundId {
  static system = {
    systemBack: 0,
    systemBuzzer: 1,
    systemCursor: 2,
    systemEnter: 3,
    systemSelect: 4,
    systemScore: 5,
    systemLevelUp: 6,
    systemPause: 7,
    systemRoundClear: 8,
    systemGameOver: 9
  }

  static skill = {
    skillMultyshotUse: 100,
    skillMultyshotShot: 101,
    skillMissileShot: 102,
    skillMissileHit: 103,
    skillArrowShot: 104,
    skillLaserShot: 105,
    skillSapiaWeapon: 106,
    skillParapoHit: 107,
    skillBlasterShot: 108,
    skillSidewaveShot: 109
  }
}

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

  static music = {
    test: new Audio('./music/test.ogg')
  }
}

export class soundSystem {
  static audioContext = new AudioContext()
  static masterGain = this.audioContext.createGain()
  static soundGain = this.audioContext.createGain()
  static musicGain = this.audioContext.createGain()
  static musicEchoGain = this.audioContext.createGain()
  static musicEchoDelay = this.audioContext.createDelay()

  /**
   * 사운드 시스템 초기화 함수. 해당 함수를 실행해야 제대로 사운드가 출력됩니다.
   */
  static init () {
    this.masterGain.gain.value = 1
    this.soundGain.gain.value = 1
    this.musicGain.gain.value = 1
    this.musicEchoGain.gain.value = 0.25
    this.musicEchoDelay.delayTime.value = 0.2

    this.soundGain.connect(this.masterGain)
    this.musicGain.connect(this.masterGain)
    this.musicGain.connect(this.musicEchoDelay).connect(this.musicEchoGain).connect(this.masterGain)
    this.masterGain.connect(this.audioContext.destination)
    this.connect()
  }

  /**
   * 효과음 및 배경음악등을 audioContext에서 출력되도록 연결합니다.
   */
  static connect () {
    // 효과음 - 시스템
    this.audioContext.createMediaElementSource(soundFile.system.systemBack).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemBuzzer).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemCursor).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemEnter).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemGameOver).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemLevelUp).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemPause).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemRoundClear).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemScore).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.system.systemSelect).connect(this.soundGain)

    // 효과음 - 스킬 및 무기
    this.audioContext.createMediaElementSource(soundFile.skill.skillMultyshotShot).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.skill.skillMultyshotUse).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.skill.skillMissileShot).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.skill.skillMissileHit).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.skill.skillBlasterShot).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.skill.skillLaserShot).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.skill.skillParapoHit).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.skill.skillSapiaWeapon).connect(this.soundGain)
    this.audioContext.createMediaElementSource(soundFile.skill.skillSidewaveShot).connect(this.soundGain)

    // 배경음악
    this.audioContext.createMediaElementSource(soundFile.music.test).connect(this.musicGain)
  }


  /**
   * 마스터 게인(볼륨)을 수정합니다. 최대 2까지 가능 (1 = 100% 기본값)
   * 마스터 볼륨은 특별하게 150%까지 적용할 수 있습니다. 소리가 작게 들린다면 이 값을 올려주세요.
   * @param {number} value 0 ~ 2 범위의 게인값
   */
  static setMasterGain (value) {
    if (value >= 0 && value <= 1.5) {
      this.masterGain.gain.value = value
    }
  }

  static MASTER_GAIN_MAX = 1.5 
  static SOUND_GAIN_MAX = 1
  static TYPE_MASTER_VOLUME = 0
  static TYPE_SOUND_ON = 1
  static TYPE_SOUND_VOLUME = 2
  static TYPE_MUSIC_ON = 3
  static TYPE_MUSIC_VOLUME = 4

  /**
   * tamshooter4 옵션 메뉴에서 사운드 관련 옵션 값을 수정하고 적용할 때 사용하는 함수
   * @param {number} optionTypeNumber soundSystem에 있는 type 상수
   * @param {number} value 적용할 값(참고: 옵션 값 그대로 입력해주세요.). null일경우 정해진 규칙에 따라 값이 변화
   */
  static setOption (optionTypeNumber, value = null) {
    // 만약 value값이 1.5보다 크면, 볼륨 값이 지나치게 클 수 있으므로 게인 설정 값에 맞게 100으로 나눕니다.
    if (value && typeof value === "number" && value >= this.MASTER_GAIN_MAX) {
      value = value / 100
    }

    switch (optionTypeNumber) {
      case this.TYPE_MASTER_VOLUME:
        if (value != null && value >= 0 && value <= this.MASTER_GAIN_MAX) {
          this.masterGain.gain.value = value
        } else {
          // 소수점의 정확한 계산을 위해 강제로 소수점 자리수를 자름
          this.masterGain.gain.value = Number((this.masterGain.gain.value + 0.1).toFixed(1))
          if (this.masterGain.gain.value > this.MASTER_GAIN_MAX) {
            this.masterGain.gain.value = 0
          }
        }
        break
      case this.TYPE_SOUND_ON:
        // 만약 옵션값이 true 또는 false로 전달된다면 이를 반영하고, 아닐경우 on/off 상태를 변경합니다.
        if (typeof value === 'boolean') {
          this.soundOn = value
        } else {
          this.soundOn = !this.soundOn
        }
        break
      case this.TYPE_SOUND_VOLUME:
        if (value != null && value >= 0 & value <= this.SOUND_GAIN_MAX) {
          this.soundGain.gain.value = value
        } else {
          this.soundGain.gain.value = Number((this.soundGain.gain.value + 0.1).toFixed(1))
          if (this.soundGain.gain.value > this.SOUND_GAIN_MAX) {
            this.soundGain.gain.value = 0
          }
        }
        break
      case this.TYPE_MUSIC_ON:
        // 만약 옵션값이 true 또는 false로 전달된다면 이를 반영하고, 아닐경우 on/off 상태를 변경합니다.
        if (typeof value === 'boolean') {
          this.musicOn = value
        } else {
          this.musicOn = !this.musicOn
        }
        break
      case this.TYPE_MUSIC_VOLUME:
        if (value != null && value >= 0 & value <= this.SOUND_GAIN_MAX) {
          this.musicGain.gain.value = value
        } else {
          this.musicGain.gain.value = Number((this.musicGain.gain.value + 0.1).toFixed(1))
          if (this.musicGain.gain.value > this.SOUND_GAIN_MAX) {
            this.musicGain.gain.value = 0
          }
        }
        break
    }
  }

  /**
   * 각 옵션의 값을 얻습니다. 옵션의 값들은 객체로 구성됨
   * @returns 
   */
  static getOption () {
    return {
      masterVolume: Math.round(this.masterGain.gain.value * 100),
      soundOn: this.soundOn,
      soundVolume: Math.round(this.soundGain.gain.value * 100),
      musicOn: this.musicOn,
      musicVolume: Math.round(this.musicGain.gain.value * 100),
    }
  }

  /**
   * 사운드(효과음) 게인(볼륨)을 수정합니다.
   * @param {number} value 0 ~ 1 범위의 게인값
   */
  static setSoundGain (value) {
    if (value >= 0 && value <= 1) {
      this.soundGain.gain.value = value
    }
  }

  /**
   * 배경음악 게인(볼륨)을 수정합니다.
   * @param {number} value 0 ~ 1 범위의 게인값
   */
  static setMusicGain (value) {
    if (value >= 0 && value <= 1) {
      this.musicGain.gain.value = value
    }
  }

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
    // 음악이 꺼질경우, 음악을 출력하지 않음.
    if (!this.musicOn) return 

    soundFile.loop = true
    if (soundFile.paused) {
      soundFile.play()
    }

  }

  static musicStop () {

  }

  static soundOn = true
  static musicOn = true
}
soundSystem.init()