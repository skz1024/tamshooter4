// 사운드파일을 묶은 클래스이고, 모든 변수는 static 이므로, 대문자로 선언하지 않았습니다.
// 인스턴스를 생성할 필요가 없는 클래스입니다.

/**
 * 사운드 id는 사용하지 않습니다.
 * 
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
}

export class soundFile {
  static system = {
    systemBack: new Audio('./sound/systemBack.wav'),
    systemBuzzer: new Audio('./sound/systemBuzzer.wav'),
    systemCursor: new Audio('./sound/systemCursor.wav'),
    systemEnter: new Audio('./sound/systemEnter.ogg'),
    systemSelect: new Audio('./sound/systemSelect.wav'),
    systemScore: new Audio('./sound/systemScore.wav'),
    systemLevelUp: new Audio('./sound/systemLevelUp.wav'),
    systemPause: new Audio('./sound/systemPause.wav'),
    systemRoundClear: new Audio('./sound/systemRoundClear.ogg'),
    systemGameOver: new Audio('./sound/systemGameOver.ogg'),
    systemPlayerDamage: new Audio('./sound/systemPlayerDamage.wav'),
    systemPlayerDamageBig: new Audio('./sound/systemPlayerDamageBig.wav'),
    systemPlayerDamageDanger: new Audio('./sound/systemPlayerDamageDanger.wav'),
    systemPlayerDie: new Audio('./sound/systemPlayerDie.ogg'),
    systemSkillSelect: new Audio('./sound/systemSkillSelect.wav')
  }

  static skill = {
    // baseSkill total count 20
    skillMultyshotUse: new Audio('./sound/skillMultyshotUse.wav'),
    skillMultyshotShot: new Audio('./sound/skillMultyshotShot.wav'),
    skillMissileShot: new Audio('./sound/skillMissileShot.wav'),
    skillMissileHit: new Audio('./sound/skillMissileHit.wav'),
    skillArrowShot: new Audio('./sound/skillArrow.wav'),
    skillLaserShot: new Audio('./sound/skillLaserShot.ogg'),
    skillSapiaWeapon: new Audio('./sound/skillSapiaWeapon.ogg'),
    skillParapoHit: new Audio('./sound/skillParapoHit.wav'),
    skillBlasterShot: new Audio('./sound/skillBlasterShot.ogg'),
    skillSidewaveShot: new Audio('./sound/skillSidewaveShot.wav'),
    skillCriticalChaser: new Audio('./sound/skillCriticalChaser.ogg'),
    skillCriticalChaserHit: new Audio('./sound/skillCriticalChaserHit.ogg'),
    skillHyperBall: new Audio('./sound/skillHyperBall.wav'),
    skillPileBunker: new Audio('./sound/skillPileBunker.ogg'),
    skillPileBunkerHit2: new Audio('./sound/skillPileBunkerHit2.wav'),
    skillPileBunkerHit3: new Audio('./sound/skillPileBunkerHit3.wav'),
    skillSword: new Audio('./sound/skillSword.ogg'),
    skillSwordHit: new Audio('./sound/skillSwordHit.wav'),
    skillSantansu: new Audio('./sound/skillSantansuHit.ogg'),
    skillWhiteflash: new Audio('./sound/skillWhiteflash.ogg'),
    skillRapid: new Audio('./sound/skillRapid.wav'),
    skillSeondanil: new Audio('./sound/skillSeondanil.ogg'),
    skillSeondanilHit: new Audio('./sound/skillSeondanilHit.wav'),
    skillRing: new Audio('./sound/skillRing.wav'),
    skillBoomerang: new Audio('./sound/skillBoomerang.ogg'),
    skillHanjumeok: new Audio('./sound/skillHanjumeok.ogg'),
    skillHanjumeokHit: new Audio('./sound/skillHanjumeokHit.wav'),
    skillHanjumeokSplash: new Audio('./sound/skillHanjumeokSplash.ogg'),
    skillMoon: new Audio('./sound/skillMoon.ogg'),
    skillMoonAttack: new Audio('./sound/skillMoonAttack.ogg'),
  }

  static enemyDie = {
    enemyDieMeteorite1: new Audio('./sound/enemyDieMeteorite1.wav'),
    enemyDieMeteorite2: new Audio('./sound/enemyDieMeteorite2.wav'),
    enemyDieMeteorite3: new Audio('./sound/enemyDieMeteorite3.wav'),
    enemyDieMeteorite4: new Audio('./sound/enemyDieMeteorite4.wav'),
    enemyDieMeteorite5: new Audio('./sound/enemyDieMeteorite5.wav'),
    enemyDieMeteoriteBomb: new Audio('./sound/enemyDieMeteoriteBomb.wav'),
    enemyDieMeteoriteStone: new Audio('./sound/enemyDieMeteoriteStone.wav'),
    enemyDieMetoriteRed: new Audio('./sound/enemyDieMeteoriteRed.wav'),
    enemyDieSpaceCar: new Audio('./sound/enemyDieSpaceCar.wav'),
    enemyDieSpaceComet: new Audio('./sound/enemyDieSpaceComet.wav'),
    enemyDieSpaceEnergy: new Audio('./sound/enemyDieSpaceEnergy.wav'),
    enemyDieSpaceGamjigi: new Audio('./sound/enemyDieSpaceGamjigi.wav'),
    enemyDieSpaceLight: new Audio('./sound/enemyDieSpaceLight.wav'),
    enemyDieSpaceRocket: new Audio('./sound/enemyDieSpaceRocket.wav'),
    enemyDieSpaceSmall: new Audio('./sound/enemyDieSpaceSmall.wav'),
    enemyDieSpaceSquare: new Audio('./sound/enemyDieSpaceSquare.wav'),
    enemyDieSpaceSusong: new Audio('./sound/enemyDieSpaceSusong.ogg'),
    enemyDieJemulDrill: new Audio('./sound/enemyDieJemulDrill.wav'),
    enemyDieJemulEnergyBolt: new Audio('./sound/enemyDieJemulEnergyBolt.wav'),
    enemyDieJemulHellAir: new Audio('./sound/enemyDieJemulHellAir.ogg'),
    enemyDieJemulHellShip: new Audio('./sound/enemyDieJemulHellShip.ogg'),
    enemyDieJemulRocket: new Audio('./sound/enemyDieJemulRocket.wav'),
    enemyDieJemulSpike: new Audio('./sound/enemyDieJemulSpike.wav'),
    enemyDieJemulBoss: new Audio('./sound/enemyDieJemulBoss.ogg'),
    enemyDieJemulBossEye: new Audio('./sound/enemyDieJemulBossEye.ogg'),
    enemyDieJemulRedJewel: new Audio('./sound/enemyDieJemulRedJewel.wav'),
    enemyDieJemulRedAir: new Audio('./sound/enemyDieJemulRedAir.wav'),
    enemyDieDonggrami1: new Audio('./sound/enemyDieDonggrami1.wav'),
    enemyDieDonggrami2: new Audio('./sound/enemyDieDonggrami2.wav'),
  }

  static enemyAttack = {
    jemulEnergyBoltAttack: new Audio('./sound/enemyJemulEnergyBoltAttack.wav'),
    jemulHellDrillAttack: new Audio('./sound/enemyJemulHellDrillAttack.wav'),
    jemulBossAttack: new Audio('./sound/enemyJemulBossAttackLaser.ogg'),
    jemulBossAttack2: new Audio('./sound/enemyJemulBossAttackLaser2.ogg'),
    jemulBossAttack3: new Audio('./sound/enemyJemulBossAttackLaser3.ogg')
  }

  static round = {
    r1_4_message1: new Audio('./sound/round1_4_message1.ogg'),
    r1_4_message2: new Audio('./sound/round1_4_message2.ogg'),
    r1_4_jemulstar: new Audio('./sound/round1_4_jemulstar.ogg'),
    r1_4_jemulstart: new Audio('./sound/round1_4_jemulstart.ogg'),
    r1_4_jemulrun: new Audio('./sound/round1_4_jemulrun.ogg')
  }

  static music = {
    music01_space_void: new Audio('./music/music01_space_void.ogg'),
    music02_meteorite_zone_field: new Audio('./music/music02_meteorite_zone_field.ogg'),
    music03_meteorite_zone_battle: new Audio('./music/music03_meteorite_zone_battle.ogg'),
    music04_meteorite_zone_red: new Audio('./music/music04_meteorite_zone_red.ogg'),
    music05_space_tour: new Audio('./music/music05_space_tour.ogg'),
    music06_round1_boss_thema: new Audio('./music/music06_round1_boss_thema.ogg'),
    music07_paran_planet_entry: new Audio('./music/music07_paran_planet_entry.ogg'),
    music08_round1_4_jemul: new Audio('./music/music08_round1_4_jemul.ogg')
  }
}

export class soundSystem {
  static audioContext = new AudioContext()
  static masterGain = this.audioContext.createGain()
  static soundGain = this.audioContext.createGain()
  static musicGain = this.audioContext.createGain()
  static fadeGain = this.audioContext.createGain()
  static musicEchoGain = this.audioContext.createGain()
  static musicEchoDelay = this.audioContext.createDelay()
  static currentMusic = null
  static nextMusic = null
  static musicPaused = false
  static soundOn = true
  static musicOn = true

  static fadeTime = 0

  /**
   * 사운드 시스템 초기화 함수. 해당 함수를 실행해야 제대로 사운드가 출력됩니다.
   */
  static init () {
    this.masterGain.gain.value = 1
    this.soundGain.gain.value = 1
    this.musicGain.gain.value = 1
    this.fadeGain.gain.value = 1
    this.musicEchoGain.gain.value = 0.3
    this.musicEchoDelay.delayTime.value = 0.2

    this.soundGain.connect(this.masterGain)
    this.musicGain.connect(this.fadeGain).connect(this.masterGain)
    this.musicGain.connect(this.fadeGain).connect(this.musicEchoDelay).connect(this.musicEchoGain).connect(this.masterGain)
    this.masterGain.connect(this.audioContext.destination)
    this.connect()
  }

  /**
   * 배경음악등을 audioContext에서 출력되도록 연결합니다.
   * 효과음은 일부만 적용 (다 하기 너무 귀찮다.)
   */
  static connect () {
    // soundFile 객체 구조를 기준으로 모두 오디오컨텍스트에 연결함.
    let con = (soundObject) => {
      for (let f in soundObject) {
        if (f === 'music') continue // 음악은 사운드에 해당하지 않음. 그래서 continue

        let soundObj2 = soundObject[f]
        for (let f2 in soundObj2) {
          let audioData = soundObj2[f2]
          this.audioContext.createMediaElementSource(audioData).connect(this.soundGain)
        }
      }
    }
    con(soundFile)

    // 배경음악
    this.audioContext.createMediaElementSource(soundFile.music.music01_space_void).connect(this.musicGain)
    this.audioContext.createMediaElementSource(soundFile.music.music02_meteorite_zone_field).connect(this.musicGain)
    this.audioContext.createMediaElementSource(soundFile.music.music03_meteorite_zone_battle).connect(this.musicGain)
    this.audioContext.createMediaElementSource(soundFile.music.music04_meteorite_zone_red).connect(this.musicGain)
    this.audioContext.createMediaElementSource(soundFile.music.music05_space_tour).connect(this.musicGain)
    this.audioContext.createMediaElementSource(soundFile.music.music06_round1_boss_thema).connect(this.musicGain)
    this.audioContext.createMediaElementSource(soundFile.music.music07_paran_planet_entry).connect(this.musicGain)
    this.audioContext.createMediaElementSource(soundFile.music.music08_round1_4_jemul).connect(this.musicGain)
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
   * @param {HTMLAudioElement} soundFile soundFile 객체의 static 변수
   */
  static play (soundFile) {
    // 사운드가 꺼질경우, 사운드를 출력하지 않음.
    if (!this.soundOn) return
    this.audioContext.resume()

    soundFile.volume = this.soundGain.gain.value
    
    // 사운드가 정지 상태일때는 play() 함수를 호출합니다.
    // 그렇지 않으면 currentTime을 0으로 설정해서 처음부터 다시 재생합니다.
    // 절대로 pause() 를 호출한 직후 play() 를 호출하지 마세요. 이 경우 사운드 재생 오류가 발생합니다.
    if (soundFile.paused) {
      soundFile.play()
    } else {
      soundFile.currentTime = 0
    }
  }

  /**
   * 음악을 재생하고, 음악의 일시정지 상태를 해제합니다.
   * 
   * (음악이 꺼져있다면, 일시정지는 해제되어도 음악은 재생되지 않습니다.)
   * @param {HTMLAudioElement} soundFile 음악 파일
   * @param {number} currentTime 재생할 오디오의 현재 시간
   * @returns 
   */
  static musicPlay (soundFile, currentTime = null) {
    this.musicPaused = false // 음악 일시정지 상태를 해제

    if (soundFile == null) return // 음악파일이 없다면 함수 종료

    this.currentMusicChange(soundFile)
    if (currentTime != null) {
      soundFile.currentTime = currentTime
    }

    // 음악설정이 꺼져있는 경우, 음악을 출력하지 않음.
    if (!this.musicOn) return
  }

  /**
   * 현재 재생되고 있는 음악의 시간을 얻어옵니다.
   * @returns {number}
   */
  static getMusicCurrentTime () {
    if (this.currentMusic != null) {
      return this.currentMusic.currentTime
    } else {
      return 0
    }
  }

  /**
   * 음악을 페이드 인/아웃 하면서 변경합니다. 배경음악만 적용 가능 (효과음은 audioContext에 연결되어있지 않아 아무 효과 없음)
   * @param {HTMLAudioElement} soundFile 사운드 파일
   * @param {number} time 페이드 시간(인/아웃 포함), 단위: 초
   */
  static musicChangeFade (soundFile, time = 1) {
    if (soundFile != null && this.currentMusic != soundFile) {
      if (this.currentMusic != null) {
        // time 시간동안 페이드 아웃이 진행됩니다.
        // 페이드 인은, process에서 구현합니다.
        this.fadeTime = time
        this.fadeGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + time)
        this.nextMusic = soundFile
      }
    }
  }

  static currentMusicChange (soundFile) {
    if (soundFile != null && this.currentMusic != soundFile) {
      if (this.currentMusic != null) {
        // 현재 음악이 있다면 현재 음악 일시 정지
        this.currentMusic.pause()
      }

      // 새로운 파일로 교체
      this.currentMusic = soundFile
    }
  }

  static musicPause () {
    this.musicPaused = true
  }

  static musicStop () {
    if (this.currentMusic != null) {
      this.currentMusic.pause()
      this.currentMusic.currentTime = 0
      this.currentMusic = null
    }
  }

  static musicProcess () {
    // 음악 설정이 꺼져있지만, 현재 음악이 재생중인경우, 강제로 해당 음악을 정지
    if (!this.musicOn && this.currentMusic != null && !this.currentMusic.paused) {
      this.currentMusic.pause()
    }

    // 음악 설정이 켜져있는 경우
    if (this.musicOn) {
      // 음악이 일시정지되고, 음악이 있으며 음악이 재생중인경우 일시정지
      if (this.musicPaused && this.currentMusic != null && !this.currentMusic.paused) {
        this.currentMusic.pause()
      } else if(!this.musicPaused && this.currentMusic != null && this.currentMusic.paused) {
        // 음악이 정해져있으며, 플레이중이 아닐 때는 음악 재생
        // 만약 음악파일이 null이면 음악과 관련된 처리를 하지 않음.
        this.currentMusic.play()
      }
    }

    // 음악 페이드 볼륨이 0이 된경우 (음악 on/off 상관없이 페이드 효과는 적용됩니다.)
    if (this.fadeGain.gain.value === 0) {
      this.currentMusicChange(this.nextMusic)
      this.fadeGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.fadeTime)
    }
  }

}
soundSystem.init()