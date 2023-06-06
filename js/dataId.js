/**
 * 공통적으로 사용하는 객체 ID (상수 값 - 숫자만 허용)
 * 
 * ID 값은 서로 달라야 합니다. (사람이 실수한게 아니라면...)
 * 
 * 이 값을 심볼로 정의하지 마세요. 심볼은 로컬스토리지에 저장할 수 없습니다.
 * 실시간 저장이 필요한 이 게임 특성상, 심볼을 저장 데이터 용도로 활용하는것은 부적절합니다.
 */
export class ID {
  static playerWeapon = {
    unused: 0,
    /** 무기 번호를 가져올 때 사용(서브웨폰은 엉뚱한 번호를 가져온다.) */ weaponNumberStart: 10000,
    multyshot: 10001,
    missile: 10002,
    arrow: 10003,
    laser: 10004,
    sapia: 10005,
    parapo: 10006,
    blaster: 10007,
    sidewave: 10008,
    ring: 10009,
    rapid: 10010,
    seondanil: 10011,
    boomerang: 10012,
    subMultyshot: 10767,
  }

  static playerSkill = {
    unused: 0,
    skillNumberStart: 15000,
    multyshot: 15001,
    missile: 15002,
    arrow: 15003,
    laser: 15004,
    sapia: 15005,
    parapo: 15006,
    blaster: 15007,
    sidewave: 15008,
    sword: 15009,
    hyperBall: 15010,
    critcalChaser: 15011,
    pileBunker: 15012,
    santansu: 15013,
    whiteflash: 15014,
    ring: 15015,
    rapid: 15016,
    seondanil: 15017,
    hanjumoek: 15018,
    boomerang: 15019,
    moon: 15020
  }

  static weapon = {
    unused: 0,
    multyshot: 11010,
    missile: 11011,
    missileRocket: 11012,
    arrow: 11013,
    laser: 11014,
    laserBlue: 11015,
    sapia: 11016,
    sapiaShot: 11017,
    parapo: 11018,
    parapoShockWave: 11019,
    blaster: 11020,
    blasterMini: 11021,
    sidewave: 11022,
    subMultyshot: 11023,
    rapid: 11024,
    ring: 11025,
    seondanil: 11026,
    boomerang: 11027,

    // skill
    skillMultyshot: 16001,
    skillMissile: 16002,
    skillArrow: 16003,
    skillLaser: 16004,
    skillSapia: 16005,
    skillParapo: 16006,
    skillBlaster: 16007,
    skillSidewave: 16008,
    skillSword: 16009,
    skillHyperBall: 16010,
    skillCriticalChaser: 16011,
    skillPileBunker: 16012,
    skillSantansu: 16013,
    skillWhiteflash: 16014,
    skillWhiteflashSmoke: 16015,
    skillRapid: 16016,
    skillRing: 16017,
    skillSeondanil: 16018,
    skillSeondanilMini: 16019,
    skillHanjumoek: 16020,
    skillBoomerang: 16021,
    skillMoon: 16022
  }

  /**
   * 적의 ID
   * 
   * 참고: xxxEnemy로 되어있는 변수들은 다른 적들이 그룹으로 묶여 있다는 뜻입니다.
   * 그래서 ID.enemy.xxxEnemy.square 와 같이 사용해야 합니다.
   * 
   * unused 같이 뒷글자가 Enemy로 끝나지 않으면, 내부 객체가 없습니다. 
   * 따라서 unused는 ID.enemy.unused로 사용해야 합니다.
   */
  static enemy = {
    unused: 20000,
    test: 20001,
    testAttack: 20002,
    testShowDamageEnemy: 20003,
    spaceEnemy: {
      light: 20101,
      rocket: 20102,
      car: 20103,
      square: 20104,
      attack: 20105,
      energy: 20106,
      susong: 20107,
      gamjigi: 20108,
      comet: 20109,
      meteorite: 20110,
      boss: 20111,
      donggrami: 20112,
    },
    meteoriteEnemy: {
      class1: 20120,
      class2: 20121,
      class3: 20122,
      class4: 20123,
      whiteMeteo: 20124,
      blackMeteo: 20125,
      stone: 20130,
      stonePiece: 20131,
      bomb: 20134,
      bombBig: 20135,
      red: 20136,
    },
    jemulEnemy: {
      rotateRocket: 20140,
      energyBolt: 20141,
      hellSpike: 20142,
      hellDrill: 20143,
      hellAir: 20144,
      hellShip: 20145,
      boss: 20146,
      bossEye: 20147,
      redMeteorite: 20148,
      redMeteoriteImmortal: 20149,
      redAir: 20150,
      redShip: 20151,
      redJewel: 20152,
    },
    donggramiEnemy: {
      miniBlue: 20170,
      miniGreen: 20171,
      miniRed: 20172,
      miniPurple: 20173,
      mini: 20174,
      miniArchomatic: 20175,
      miniAnother: 20176,
      exclamationMark: 20180,
      questionMark: 20181,
      emoji: 20182,
      talk: 20183,
      normal: 20184,
      strong: 20185,
      bossBig1: 20186,
      bossBig2: 20187,
      bounce: 20188,
      speed: 20189,
      talkShopping: 20190,
    }
  }

  /** 더이상 사용하지 않을 수 있음. @deprecated */
  static enemyBullet = {
    meteoriteBomb: 30140,
    jemulEnemySpike: 30145,
    jemulEnemyShip: 30146,
    jemulEnemyAir: 30147
  }

  static effect = {
    missile: 40000,
    parapo: 40001,
    skillMissile: 40002,
    skillParapo: 40003,
    enemyBulletMeteoriteBomb: 40004,
    jemulEnemyEnergyBoltAttack: 40005,
    jemulstar: 40006,
    jemulCreate: 40007
  }

  static sprite = {

  }

  static round = {
    round1_1: 70011,
    round1_2: 70012,
    round1_3: 70013,
    round1_4: 70014,
    round1_5: 70015,
    round1_6: 70016,
    round1_test: 70009,
    UNUSED: 0,
    //
    round2_1: 70021,
    round2_2: 70022,
    round2_3: 70023,
    round2_4: 70024,
    round2_5: 70025,
    round2_6: 70026,
    //
    round3_1: 70031,
    round3_2: 70032,
    round3_3: 70033,
    round3_4: 70034,
    round3_5: 70035,
    round3_6: 70036,
    round3_7: 70037,
    round3_8: 70038,
    round3_A1: 70041,
    round3_A2: 70042,
    round3_A3: 70043,
    //
    round4_1: 70101,
  }
}
Object.freeze(ID)