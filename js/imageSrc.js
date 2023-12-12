//@ts-check

/**
 * 이 클래스는 자동완성을 쉽게 하기 위해 만들어진 클래스이지만, 
 * 
 * 라운드 3부터는 이 클래스를 사용해 이미지데이터 오브젝트를 생성하도록 변경했습니다.
 * 
 * (다만 추후에 JSON 방식으로도 변경할 수 있을지도 모름)
 */
export class ImageDataObject {
  constructor (x = 0, y = 0, width = 0, height = 0, frame = 1) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.frame = frame
    // throw new Error('이 클래스는 생성할 수 없습니다. This class cannot be created. ')
  }
}

/**
 * tamshooter4 에서 사용하는 이미지의 경로
 * 
 * 모든 변수는 static입니다.
 */
export class imageSrc {
  static system = {
    digitalFont: './image/system/digitalFont.png',
    digitalFontSmall: './image/system/digitalFontSmall.png',
    digitalFontBig: './image/system/digitalFontBig.png',
    playerImage: './image/system/playerImage.png',
    damageFont: './image/system/damageFont.png',
    skillNumber: './image/system/skillNumber.png',
    skillIcon: './image/system/skillIcon.png',
    fieldSystem: './image/system/fieldSystem.png',
    optionCheck: './image/system/optionCheck.png',
    playerDie: './image/system/playerDie.png',
    playerLevelup: './image/system/playerLevelup.png',
    playerStat: './image/system/playerStat.png',
    menuList: './image/system/menuList.png',
    skillInfo: './image/system/skillInfo.png',
    weaponIcon: './image/system/weaponIcon.png',
    roundIcon: './image/system/roundIcon.png',
    tamshooter4Title:'./image/system/title.png'
  }

  static number = {
    round2_3_number: './image/round/round2_3_number.png'
  }

  static effect = {
    jemulstar: './image/effect/jemulstar.png',
    jemulCreate: './image/effect/jemulCreate.png',
  }

  static weaponImage = './image/weapon/weapon.png'
  static skillImage = './image/weapon/skill.png'

  static weaponEffect = {
    missile: './image/weapon/missileEffect.png',
    parapo: './image/weapon/parapoEffect.png'
  }

  static skillEffect = {
    missile: './image/weapon/skillMissileEffect.png',
    parapo: './image/weapon/skillParapoEffect.png',
    pileBunker: './image/weapon/skillPileBunkerEffect.png',
    swordHit: './image/weapon/skillSwordHitEffect.png',
    criticalChaser: './image/weapon/skillCriticalChaserEffect.png',
    santansu: './image/weapon/skillSantansuEffect.png',
    seondanil: './image/weapon/skillSeondanilEffect.png',
    whiteflash: './image/weapon/skillWhiteflashEffect.png',
    hanjumoekSplash: './image/weapon/skillHanjumeokSplashEffect.png',
  }

  static enemy = {
    spaceEnemy: './image/enemy/spaceEnemy.png',
    meteoriteEnemy: './image/enemy/meteoriteEnemy.png',
    jemulEnemy: './image/enemy/jemulEnemy.png',
    donggramiEnemy: './image/enemy/donggramiEnemy.png',
    intruderEnemy: './image/enemy/intruderEnemy.png',
    towerEnemyGroup1: './image/enemy/towerEnemyGroup1.png',
    towerEnemyGroup2: './image/enemy/towerEnemyGroup2.png'
  }

  static enemyDie = {
    effectList: './image/enemy/enemyDieEffect.png',
  }

  static round = {
    roundIcon: './image/round/roundIcon.png',
    round1_1_space: './image/round/round1_1_space.jpg',
    round1_2_meteorite: './image/round/round1_2_meteoriteZone.jpg',
    round1_3_meteoriteDeep: './image/round/round1_3_meteoriteDeep.jpg',
    round1_4_meteoriteDark: './image/round/round1_4_meteoriteDark.jpg',
    round1_4_redzone: './image/round/round1_4_redZone.jpg',
    round1_5_meteoriteRed: './image/round/round1_5_meteoriteRed.jpg',
    round1_6_space: './image/round/round1_6_space.jpg',
    round1_6_paran_planet: './image/round/round1_6_paran_planet.png',
    round2_1_cloud: './image/round/round2_1_cloud.png',
    round2_2_apartment1: './image/round/round2_2_apartment1.png',
    round2_2_apartment2: './image/round/round2_2_apartment2.png',
    round2_2_maeul_entrance: './image/round/round2_2_maeul_entrance.png',
    round2_2_park: './image/round/round2_2_park.png',
    round2_2_placard: './image/round/round2_2_placard.png',
    round2_2_shopping_mall: './image/round/round2_2_shopping_mall.png',
    round2_2_tunnel: './image/round/round2_2_tunnel.png',
    round2_2_tunnel_outload: './image/round/round2_2_tunnel_outload.png',
    round2_donggramiHp: './image/round/round2_donggramiHp.png',
    round2_3_placard: './image/round/round2_3_placard.png',
    round2_3_maeul_space: './image/round/round2_3_maeul_space.png',
    round2_3_course: './image/round/round2_3_course.png',
    round2_3_result: './image/round/round2_3_result.png',
    round2_3_status: './image/round/round2_3_status.png',
    round2_3_effect: './image/round/round2_3_effect.png',
    round2_4_courseSelect: './image/round/round2_4_courseSelect.png',
    round2_4_elevator: './image/round/round2_4_elevator.png',
    round2_4_elevatorNumber: './image/round/round2_4_elevatorNumber.png',
    round2_4_elevatorFloor1: './image/round/round2_4_elevatorFloor1.png',
    round2_4_elevatorFloor3: './image/round/round2_4_elevatorFloor3.png',
    round2_4_elevatorFloor4: './image/round/round2_4_elevatorFloor4.png',
    round2_4_elevatorRooftop: './image/round/round2_4_elevatorRooftop.png',
    round2_4_elevatorOutside: './image/round/round2_4_elevatorOutside.png',
    round2_4_elevatorHall: './image/round/round2_4_elevatorHall.png',
    round2_4_corridor: './image/round/round2_4_corridor.png',
    round2_4_mountainDeep: './image/round/round2_4_mountainDeep.png',
    round2_4_mountainPath: './image/round/round2_4_mountainPath.png',
    round2_4_mountainRooftop: './image/round/round2_4_mountainRooftop.png',
    round2_4_placard: './image/round/round2_4_placard.png',
    round2_4_mountainWall: './image/round/round2_4_mountainWall.png',
    round2_4_rooftop: './image/round/round2_4_rooftop.png',
    round2_4_rooftopWayout: './image/round/round2_4_rooftopWayout.png',
    round2_4_roomSky: './image/round/round2_4_roomSky.png',
    round2_4_roomParty: './image/round/round2_4_roomParty.png',
    round2_4_roomYellow: './image/round/round2_4_roomYellow.png',
    round2_4_roomBlue: './image/round/round2_4_roomBlue.png',
    round2_4_floorB1: './image/round/round2_4_floorB1.png',
    round2_5_floorB1Dark: './image/round/round2_5_floorB1Dark.png',
    round2_5_floorB1Break: './image/round/round2_5_floorB1Break.png',
    round2_5_floorB1Light: './image/round/round2_5_floorB1Light.png',
    round2_6_downtowerEntrance: './image/round/round2_6_downtowerEntrance.png',
    round2_6_original1: './image/round/round2_6_original1.png',
    round2_6_original2: './image/round/round2_6_original2.png',
    round2_6_ruin1: './image/round/round2_6_ruin1.png',
    round2_6_ruin2: './image/round/round2_6_ruin2.png',
    round2_6_quiteRoad: './image/round/round2_6_quiteRoad.png',
    round3_playerOption: './image/round/round3_playerOption.png',
    round3_bossWarning: './image/round/round3_bossWarning.png',
    round3_1_level1: './image/round/round3_1_level1.png',
    round3_1_level2: './image/round/round3_1_level2.png',
    round3_1_level3: './image/round/round3_1_level3.png',
    round3_1_level4: './image/round/round3_1_level4.png',
    round3_2_level1: './image/round/round3_2_level1.png',
    round3_2_level2: './image/round/round3_2_level2.png',
    round3_2_level3: './image/round/round3_2_level3.png',
    round3_2_level4: './image/round/round3_2_level4.png',
    round3_3_level1: './image/round/round3_3_level1.png',
    round3_3_level2: './image/round/round3_3_level2.png',
    round3_3_level3: './image/round/round3_3_level3.png',
    round3_3_level4: './image/round/round3_3_level4.png',
    round3_4_level: './image/round/round3_4_level.png',
    round3_4_level2: './image/round/round3_4_level2.png',
    round3_4_level3: './image/round/round3_4_level3.png',
    round3_4_level4: './image/round/round3_4_level4.png',
    round3_4_level5: './image/round/round3_4_level5.png',
    round3_5_level1: './image/round/round3_5_level1.png',
  }

  // 경고: canvas에 svg 이미지를 사용하지 마세요. 성능이 매우 안좋습니다.
  // 그러므로 svg 파일은 게임 내에서 사용되지 않습니다.
  // imageFile.DIGITAL_VECTOR_UNUSED.src = 'numbervector.svg'
}

/**
 * imageData가 가지고 있는 정보입니다. imageDataInfo로 한것은 imageData로 하면 이름 충돌이 발생하기 때문입니다.
 */
export class imageDataInfo {
  static spaceEnemy = {
    rocketBlue: { x: 0, y: 0, width: 60, height: 24, frame: 5 },
    rocketRed: { x: 0, y: 25, width: 60, height: 24, frame: 5 },
    rocketBlueBig: { x: 0, y: 50, width: 120, height: 48, frame: 5 },
    rocketRedBig: { x: 0, y: 100, width: 120, height: 48, frame: 5 },
    greenCar: { x: 300, y: 0, width: 70, height: 38, frame: 6 },
    spaceLight: { x: 600, y: 50, width: 20, height: 20, frame: 8 },
    blueSqaure: { x: 0, y: 150, width: 60, height: 60, frame: 4 },
    blueAttack: { x: 240, y: 150, width: 60, height: 60, frame: 3 },
    purpleEnergy: { x: 500, y: 150, width: 40, height: 45, frame: 7 },
    susong: { x: 0, y: 210, width: 160, height: 80, frame: 5 },
    gamjigi: { x: 0, y: 290, width: 30, height: 50, frame: 1 },
    comet: { x: 50, y: 290, width: 35, height: 35, frame: 6 },
    meteorite1: { x: 450, y: 290, width: 50, height: 50, frame: 1 },
    meteorite2: { x: 500, y: 290, width: 50, height: 50, frame: 1 },
    meteorite3: { x: 550, y: 290, width: 50, height: 50, frame: 1 },
    meteorite4: { x: 600, y: 290, width: 70, height: 50, frame: 1 },
    meteorite5: { x: 670, y: 290, width: 80, height: 45, frame: 1 },
    bossSqaure: { x: 0, y: 340, width: 60, height: 60, frame: 8 },
    donggrami1: { x: 500, y: 340, width: 50, height: 50, frame: 1},
    donggrami2: { x: 550, y: 340, width: 50, height: 50, frame: 1},

    // dieEffect
    enemyDieComet: {x: 0, y: 400, width: 35, height: 35, frame: 10},
    enemyDieGamjigi: {x: 400, y: 400, width: 30, height: 50, frame: 10},
  }
  // { x: 0, y: 0, width: 0, height: 0, frame: 1 },

  static meteoriteEnemy = {
    class11: { x: 0, y: 0, width: 48, height: 48, frame: 1 },
    class12: { x: 50, y: 0, width: 48, height: 48, frame: 1 },
    class13: { x: 100, y: 0, width: 48, height: 48, frame: 1 },
    class14: { x: 150, y: 0, width: 48, height: 48, frame: 1 },
    class15: { x: 200, y: 0, width: 48, height: 48, frame: 1 },
    class21: { x: 0, y: 50, width: 48, height: 48, frame: 1 },
    class22: { x: 50, y: 50, width: 48, height: 48, frame: 1 },
    class23: { x: 100, y: 50, width: 48, height: 48, frame: 1 },
    class24: { x: 150, y: 50, width: 48, height: 48, frame: 1 },
    class25: { x: 200, y: 50, width: 48, height: 48, frame: 1 },
    class31: { x: 0, y: 99, width: 50, height: 50, frame: 1 },
    class32: { x: 50, y: 99, width: 50, height: 50, frame: 1 },
    class33: { x: 100, y: 99, width: 50, height: 50, frame: 1 },
    class34: { x: 150, y: 99, width: 50, height: 50, frame: 1 },
    class35: { x: 200, y: 99, width: 50, height: 50, frame: 1 },
    whiteMeteo1: { x: 50, y: 0, width: 70, height: 50, frame: 1 },
    whiteMeteo2: { x: 570, y: 0, width: 70, height: 50, frame: 1 },
    whiteMeteo3: { x: 640, y: 0, width: 70, height: 50, frame: 1 },
    whiteMeteo4: { x: 710, y: 0, width: 70, height: 50, frame: 1 },
    whiteMeteo5: { x: 780, y: 0, width: 70, height: 50, frame: 1 },
    blackMeteo1: { x: 50, y: 50, width: 80, height: 45, frame: 1 },
    blackMeteo2: { x: 580, y: 50, width: 80, height: 45, frame: 1 },
    blackMeteo3: { x: 660, y: 50, width: 80, height: 45, frame: 1 },
    blackMeteo4: { x: 740, y: 50, width: 80, height: 45, frame: 1 },
    blackMeteo5: { x: 820, y: 50, width: 80, height: 45, frame: 1 },
    bomb: {x: 500, y: 95, width: 60, height: 60, frame: 8},
    bombBig: {x: 500, y: 95, width: 60, height: 60, frame: 1},
    stoneBrown: {x: 250, y: 0, width: 80, height: 80, frame: 1},
    stoneBrownPiece1: {x: 250, y: 0, width: 40, height: 40, frame: 1},
    stoneBrownPiece2: {x: 290, y: 0, width: 40, height: 40, frame: 1},
    stoneBrownPiece3: {x: 290, y: 40, width: 40, height: 40, frame: 1},
    stoneBrownPiece4: {x: 250, y: 40, width: 40, height: 40, frame: 1},
    stoneBlack: {x: 330, y: 0, width: 80, height: 80, frame: 1},
    stoneBlackPiece1: {x: 330, y: 0, width: 40, height: 40, frame: 1},
    stoneBlackPiece2: {x: 370, y: 0, width: 40, height: 40, frame: 1},
    stoneBlackPiece3: {x: 370, y: 40, width: 40, height: 40, frame: 1},
    stoneBlackPiece4: {x: 330, y: 40, width: 40, height: 40, frame: 1},
    stoneGreen: {x: 410, y: 0, width: 80, height: 80, frame: 1},
    stoneGreenPiece1: {x: 410, y: 0, width: 40, height: 40, frame: 1},
    stoneGreenPiece2: {x: 450, y: 0, width: 40, height: 40, frame: 1},
    stoneGreenPiece3: {x: 450, y: 40, width: 40, height: 40, frame: 1},
    stoneGreenPiece4: {x: 410, y: 40, width: 40, height: 40, frame: 1},
    red1: {x: 251, y: 81, width: 50, height: 50, frame: 1},
    red2: {x: 305, y: 81, width: 70, height: 50, frame: 1},
    red3: {x: 376, y: 81, width: 80, height: 45, frame: 1},
    red4: {x: 900, y: 0, width: 50, height: 50, frame: 1},

    // enemyDie
    enemyDieMeteorite1: {x: 0, y: 150, width: 50, height: 50, frame: 10},
    enemyDieMeteorite2: {x: 0, y: 200, width: 50, height: 50, frame: 10},
    enemyDieMeteorite3: {x: 0, y: 250, width: 50, height: 50, frame: 10},
    enemyDieMeteoriteWhite: {x: 0, y: 300, width: 70, height: 50, frame: 10},
    enemyDieMeteoriteBlack: {x: 0, y: 350, width: 80, height: 45, frame: 10},
  }

  static jemulEnemy = {
    rotateRocket: {x: 0, y: 0, width: 200, height: 100, frame: 10},
    energyBolt: {x: 0, y: 100, width: 90, height: 40, frame: 20},
    hellSpike: {x: 0, y: 140, width: 60, height: 60, frame: 10},
    hellDrill: {x: 840, y: 300, width: 100, height: 30, frame: 10},
    hellShipFront: {x: 600, y: 140, width: 110, height: 45, frame: 3},
    hellShipUp: {x: 930, y: 140, width: 110, height: 45, frame: 3},
    hellShipDown: {x: 1260, y: 140, width: 110, height: 45, frame: 3},
    hellAirFront: {x: 0, y: 200, width: 120, height: 100, frame: 4},
    hellAirUp: {x: 480, y: 200, width: 120, height: 100, frame: 4},
    hellAirDown: {x: 960, y: 200, width: 120, height: 100, frame: 4},
    jemulBoss: {x: 0, y: 300, width: 120, height: 100, frame: 7},
    jemulBossEye: {x: 841, y: 331, width: 100, height: 60, frame: 7},
    redAir: {x: 1450, y: 200, width: 120, height: 90, frame: 4},
    redShip: {x: 1590, y: 140, width: 110, height: 40, frame: 3},
    redJewel: {x: 1550, y: 331, width: 40, height: 45, frame: 10},
    redMeteorite: {x: 1920, y: 140, width: 70, height: 50, frame: 1},

    // enemyAttack
    energyBoltAttack: new ImageDataObject(0, 400, 100, 100, 6),
    jemulEnemyAir: {x: 620, y: 400, width: 30, height: 20, frame: 1},
    jemulEnemyShip: {x: 600, y: 400, width: 20, height: 20, frame: 1},
    jemulEnemyHellSpike: {x: 650, y: 400, width: 15, height: 20, frame: 1},
  }

  static donggramiEnemy = {
    lightBlue: {x: 0, y: 0, width: 48, height: 48, frame: 1},
    blue: {x: 50, y: 0, width: 48, height: 48, frame: 1},
    darkBlue: {x: 100, y: 0, width: 48, height: 48, frame: 1},
    lightGreen: {x: 150, y: 0, width: 48, height: 48, frame: 1},
    green: {x: 200, y: 0, width: 48, height: 48, frame: 1},
    darkGreen: {x: 250, y: 0, width: 48, height: 48, frame: 1},
    lightOrange: {x: 0, y: 50, width: 48, height: 48, frame: 1},
    orange: {x: 50, y: 50, width: 48, height: 48, frame: 1},
    darkOrange: {x: 100, y: 50, width: 48, height: 48, frame: 1},
    lightYellow: {x: 150, y: 0, width: 48, height: 48, frame: 1},
    yellow: {x: 200, y: 50, width: 48, height: 48, frame: 1},
    darkYellow: {x: 250, y: 100, width: 48, height: 48, frame: 1},
    lightRed: {x: 0, y: 100, width: 48, height: 48, frame: 1},
    red: {x: 50, y: 100, width: 48, height: 48, frame: 1},
    darkRed: {x: 100, y: 100, width: 48, height: 48, frame: 1},
    lightPurple: {x: 150, y: 100, width: 48, height: 48, frame: 1},
    purple: {x: 200, y: 100, width: 48, height: 48, frame: 1},
    darkPurple: {x: 250, y: 100, width: 48, height: 48, frame: 1},
    black: {x: 0, y: 150, width: 48, height: 48, frame: 1},
    darkGrey: {x: 50, y: 150, width: 48, height: 48, frame: 1},
    grey: {x: 100, y: 150, width: 48, height: 48, frame: 1},
    lightGrey: {x: 150, y: 150, width: 48, height: 48, frame: 1},
    whitesmoke : {x: 200, y: 150, width: 48, height: 48, frame: 1},
    white: {x: 250, y: 150, width: 48, height: 48, frame: 1},
    gold: {x: 0, y: 200, width: 48, height: 48, frame: 1},
    silver: {x: 50, y: 200, width: 48, height: 48, frame: 1},
    pink: {x: 100, y: 200, width: 48, height: 48, frame: 1},
    skyblue: {x: 150, y: 200, width: 48, height: 48, frame: 1},
    magenta: {x: 200, y: 200, width: 48, height: 48, frame: 1},
    cyan: {x: 250, y: 200, width: 48, height: 48, frame: 1},
    mix1: {x: 0, y: 250, width: 48, height: 48, frame: 1},
    mix2: {x: 50, y: 250, width: 48, height: 48, frame: 1},
    mix3: {x: 100, y: 250, width: 48, height: 48, frame: 1},
    mix4: {x: 150, y: 250, width: 48, height: 48, frame: 1},
    mix5: {x: 200, y: 250, width: 48, height: 48, frame: 1},
    mix6: {x: 250, y: 250, width: 48, height: 48, frame: 1},
    bigBlue: {x: 300, y: 0, width: 192, height: 192, frame: 1},
    bigRed: {x: 300, y: 200, width: 192, height: 192, frame: 1},

    // donggramiSpace merged
    brick1: {x: 0, y: 400, width: 100, height: 100, frame: 1},
    brick2: {x: 100, y: 400, width: 100, height: 100, frame: 1},
    brick3: {x: 200, y: 400, width: 100, height: 100, frame: 1},
    brick4: {x: 300, y: 400, width: 100, height: 100, frame: 1},
    bomb: {x: 400, y: 400, width: 100, height: 100, frame: 1},

    // new added
    tree: {x: 0, y: 510, width: 60, height: 120, frame: 1},
    leaf: {x: 60, y: 510, width: 50, height: 50, frame: 1},

    // effect
    /** 느낌표 */ exclamationMark: {x: 600, y: 0, width: 40, height: 40, frame: 11},
    /** 물음표 */ questionMark: {x: 600, y: 40, width: 40, height: 40, frame: 12},
    /** 웃음 */ EmojiSmile: {x: 600, y: 80, width: 40, height: 40, frame: 1},
    /** 행복 */ EmojiHappy: {x: 640, y: 80, width: 40, height: 40, frame: 1},
    /** 행복과슬픔 */ EmojiHappySad: {x: 680, y: 80, width: 40, height: 40, frame: 1},
    /** 찡그림 */ EmojiFrown: {x: 720, y: 80, width: 40, height: 40, frame: 1},
    /** 어메이즈(놀람?) */ EmojiAmaze: {x: 760, y: 80, width: 40, height: 40, frame: 1},
    /** 슬픔 */ EmojiSad: {x: 800, y: 80, width: 40, height: 40, frame: 1},
    /** 화남 */ EmojiAngry: {x: 840, y: 80, width: 40, height: 40, frame: 1},
    /** 생각중... */ EmojiThinking: {x: 880, y: 80, width: 40, height: 40, frame: 1},
    /** 말풍선(donggramiTalk 전용) */ speechBubble: {x: 600, y: 120, width: 200, height: 52, frame: 1},
    /** 말풍선 꼬리 */ speechBubbleTale: {x: 810, y: 120, width: 70, height: 26, frame: 1},
    /** 환영 대화창 */ welcomeText: {x: 600, y: 180, width: 198, height: 78, frame: 1},
    /** 마을 대화창 */ welcomeMaeulText: {x: 800, y: 180, width: 198, height: 78, frame: 1},

    // a1 effect
    /** 물결 부스터 */ booster: {x: 600, y: 300, width: 40, height: 40, frame: 7},
    /** 뿅망치 */ toyHammer: {x: 600, y: 350, width: 60, height: 60, frame: 10},
    /** 뿅망치(멈춤이미지) */ toyHammerNoEnimation: {x: 1140, y: 350, width: 60, height: 60, frame: 1},
    /** 뿅망치별... */ toyHammerStar: {x: 600, y: 410, width: 60, height: 60, frame: 8},
    /** 지진 기모으기 */ earthquakeEnergy: {x: 600, y: 480, width: 40, height: 40, frame: 8},

    // r2-4
    /** 과일: 빨강 */ fruitRed: {x: 1000, y: 100, width: 50, height: 50, frame: 1},
    /** 과일: 초록 (사인머스켓?) */ fruitGreen: {x: 1050, y: 100, width: 50, height: 50, frame: 1},
    /** 과일: 오렌지 */ fruitOrange: {x: 1100, y: 100, width: 50, height: 50, frame: 1},
    /** 과일: 퍼플 (포도?) */ fruitPurple: {x: 1150, y: 100, width: 50, height: 50, frame: 1},
    /** 주스: 오렌지 */ juiceOrange: {x: 1000, y: 150, width: 40, height: 50, frame: 1},
    /** 주스: 콜라(?) */ juiceCola: {x: 1050, y: 150, width: 40, height: 50, frame: 1},
    /** 주스: 물(?) */ juiceWater: {x: 1100, y: 150, width: 25, height: 50, frame: 1},
    /** 캔들 */ candle: {x: 1100, y: 420, width: 64, height: 128, frame: 1},
    /** 폭죽 */ firecracker: {x: 1150, y: 150, width: 50, height: 50, frame: 1},
    /** 폭죽 이펙트 */ firecrackerEffect: {x: 600, y: 600, width: 50, height: 50, frame: 10},
    /** 폭죽 이펙트(터지기 전)  */ firecrackerPrevEffect: {x: 600, y: 650, width: 50, height: 50, frame: 8},
    /** 접시 */ plate: {x: 600, y: 520, width: 50, height: 30, frame: 1},
    /** 접시 던지기 */ plateThrow: {x: 600, y: 520, width: 50, height: 30, frame: 9},
    /** 접시 깨지기 */ plateBreak: {x: 600, y: 550, width: 50, height: 20, frame: 10},
    /** 캔들 + 불 이펙트 */ candleFire: {x: 900, y: 280, width: 30, height: 60, frame: 10},
  }

  static intruderEnemy = {
    jemuEye: {x: 0, y: 0, width: 100, height: 60, frame: 8},
    jemuWing: {x: 0, y: 60, width: 160, height: 120, frame: 5},
    square: {x: 800, y: 0, width: 100, height: 100, frame: 1},
    square3DUp: {x: 800, y: 0, width: 100, height: 100, frame: 9},
    square3DLeft: {x: 800, y: 100, width: 100, height: 100, frame: 9},
    metal: {x: 1700, y: 0, width: 100, height: 100, frame: 1},
    diacore: {x: 1700, y: 100, width: 100, height: 100, frame: 1},
    daseok: {x: 1800, y: 0, width: 160, height: 240, frame: 1},
    hanoi: {x: 1800, y: 250, width: 200, height: 170, frame: 1},
    rendownBlue: {x: 0, y: 200, width: 140, height: 120, frame: 11},
    rendownGreen: {x: 0, y: 320, width: 140, height: 120, frame: 11},
    rendownDie: {x: 1540, y: 200, width: 140, height: 120, frame: 1},
    leverImage: {x: 0, y: 450, width: 80, height: 80, frame: 1},
    leverRight: {x: 0, y: 450, width: 80, height: 80, frame: 12},
    leverLeft: {x: 1000, y: 450, width: 80, height: 80, frame: 12},
    flying1: {x: 0, y: 530, width: 100, height: 40, frame: 12},
    flying2: {x: 0, y: 570, width: 100, height: 60, frame: 11},
    gami: {x: 0, y: 630, width: 160, height: 80, frame: 6},
    gamiDie: {x: 960, y: 630, width: 160, height: 80, frame: 1},
    momi: {x: 0, y: 710, width: 120, height: 60, frame: 12},
    momiDie: {x: 1440, y: 710, width: 120, height: 60, frame: 1},
    flyingRocket: {x: 0, y: 780, width: 150, height: 60, frame: 10},
    nextEnemy: {x: 1700, y: 200, width: 80, height: 40, frame: 1},

    // effect
    energyThunder: {x: 0, y: 1350, width: 100, height: 30, frame: 8},
    energyBolt: {x: 0, y: 1380, width: 50, height: 50, frame: 10},
    energyReflect: {x: 0, y: 1430, width: 50, height: 50, frame: 10},
    lightMetal: {x: 0, y: 1480, width: 50, height: 50, frame: 15},
    lightDiacore: {x: 0, y: 1530, width: 50, height: 50, frame: 15},
    leverMissileBomb: {x: 800, y: 1350, width: 80, height: 80, frame: 10},
    hanoiRing: {x: 800, y: 1430, width: 100, height: 40, frame: 7},
    leverLaser: {x: 500, y: 1380, width: 30, height: 100, frame: 1},
    flyingGreenLaser: {x: 540, y: 1450, width: 50, height: 10, frame: 1},
    leverMissileLeft: {x: 540, y: 1380, width: 60, height: 60, frame: 1},
    leverMissileRight: {x: 600, y: 1380, width: 60, height: 60, frame: 1},

    // enemyDie
    enemyDieIntruderDaseok: {x: 0, y: 850, width: 160, height: 240, frame: 10},
    enemyDieIntruderHanoi: {x: 0, y: 1090, width: 200, height: 170, frame: 7},
    enemyDieIntruderLever: {x: 0, y: 1260, width: 80, height: 80, frame: 11},
  }

  static towerEnemyGroup1 = {
    moveBlue: new ImageDataObject(0, 0, 80, 60, 4),
    moveViolet: new ImageDataObject(0, 60, 80, 60, 4),
    moveDarkViolet: new ImageDataObject(0, 120, 80, 60, 8),
    moveYellowEnergy: new ImageDataObject(0, 180, 100, 80, 8),
    sandglass: new ImageDataObject(0, 260, 100, 150, 1),
    sandglassSandDown: new ImageDataObject(0 + (100 * 8), 260, 100, 150, 1),
    sandglassEnimation: new ImageDataObject(0, 260, 100, 150, 9),
    tapo: new ImageDataObject(0, 410, 130, 100, 1),
    tapoEnimation: new ImageDataObject(0, 410, 130, 100, 7),
    hellgiEnimation: new ImageDataObject(0, 524, 170, 66, 7),
    helljeon: new ImageDataObject(0, 600, 120, 70, 1),
    helljeonEnimation: new ImageDataObject(0, 600, 120, 70, 5),
    hellba: new ImageDataObject(601, 601, 100, 50, 4),
    hellcho: new ImageDataObject(680, 100, 120, 60, 1),
    hellgal: new ImageDataObject(1002, 601, 100, 50, 1),
    laserAlpha: new ImageDataObject(920, 400, 120, 80, 1),
    laserMini: new ImageDataObject(1041, 400, 80, 40, 1),
    laserMiniGrey: new ImageDataObject(1041, 441, 80, 40, 1),
    deapo: new ImageDataObject(400, 60, 120, 40, 1),
    punchBall: new ImageDataObject(400, 0, 50, 50, 1),
    punchSpring: new ImageDataObject(450, 0, 100, 50, 1),
    punchModule: new ImageDataObject(550, 0, 50, 50, 1),
    X: new ImageDataObject(610, 0, 65, 80, 1),
    I: new ImageDataObject(680, 0, 85, 80, 1),
    gasiUp: new ImageDataObject(800, 0, 20, 60, 1),
    gasiDown: new ImageDataObject(820, 0, 20, 60, 1),
    square: new ImageDataObject(980, 670, 100, 100, 1),
    diamond: new ImageDataObject(1090, 670, 100, 100, 1),
    pentagon: new ImageDataObject(610, 670, 100, 100, 1),
    hexagon: new ImageDataObject(720, 670, 110, 100, 1),
    octagon: new ImageDataObject(840, 670, 130, 130, 1),
    bossRobot: new ImageDataObject(900, 0, 250, 300, 1),

    // bullet
    bulletTapo: new ImageDataObject(0, 700, 90, 30, 1),
    bulletRed: new ImageDataObject(0, 750, 20, 20, 1),
    bulletBlue: new ImageDataObject(30, 750, 20, 20, 1),
    bulletHelljeonRocket: new ImageDataObject(100, 700, 70, 10, 1),
    bulletRedLaser: new ImageDataObject(100, 730, 100, 20, 1),
    bulletOrangeLaser: new ImageDataObject(100, 760, 60, 20, 1),
    bulletDaepo: new ImageDataObject(210, 700, 100, 100, 1),
    bulletPurpleEnergy: new ImageDataObject(320, 700, 50, 50),
    bulletBossRocket: new ImageDataObject(380, 700, 120, 40, 1),

    // enemyDie
    enemyDieMoveYellowEnergy: new ImageDataObject(530, 1200, 100, 80, 5),
    enemyDieSandglass: new ImageDataObject(0, 800, 100, 150, 10),
    enemyDieTapo: new ImageDataObject(0, 1050, 130, 100, 6),
    enemyDieX: new ImageDataObject(0, 1200, 65, 80, 8),
    enemyDieI: new ImageDataObject(0, 960, 85, 80, 14),
    enemyDieDaepoFront: new ImageDataObject(1000, 850, 80, 40, 1),
    enemyDieDaepoBack: new ImageDataObject(1080, 850, 80, 40, 1),
    enemyDiePunchBall: new ImageDataObject(1000, 800, 50, 50, 1),
    enemyDiePunchSpring: new ImageDataObject(1050, 800, 100, 50, 1),
    enemyDiePunchModule: new ImageDataObject(1150, 800, 50, 50, 1),
    enemyDieGasiUp: new ImageDataObject(800, 1050, 20, 60, 6),
    enemyDieGasiDown: new ImageDataObject(800, 1110, 20, 60, 6),
  }

  static towerEnemyGroup2 = {
    barYellow: new ImageDataObject(0, 0, 140, 20, 5),
    barLime: new ImageDataObject(0, 20, 140, 20, 5),
    barViolet: new ImageDataObject(0, 40, 140, 20, 5),
    barOrange: new ImageDataObject(0, 60, 140, 20, 5),
    barCyan: new ImageDataObject(0, 80, 140, 20, 5),
    barGrey: new ImageDataObject(0, 100, 140, 20, 5),
    jagijang: new ImageDataObject(0, 130, 140, 140, 6),
    lightning: new ImageDataObject(0, 330, 90, 100, 1),
    lightningEnimation: new ImageDataObject(0, 330, 90, 100, 5),
    magnet: new ImageDataObject(600, 430, 150, 100, 1),
    hellla: new ImageDataObject(0, 531, 200, 88, 5),
    hellpo: new ImageDataObject(0, 620, 160, 70, 4),
    hellpa: new ImageDataObject(0, 690, 140, 120, 5),
    hellpaAttackWait: new ImageDataObject(700, 690, 140, 120, 3),
    hellna: new ImageDataObject(1001, 530, 120, 80, 1),
    pentaShadow: new ImageDataObject(0, 810, 120, 110, 1),
    pentaLight: new ImageDataObject(120, 810, 120, 110, 1),
    hexaShadow: new ImageDataObject(240, 810, 130, 110, 1),
    hexaLight: new ImageDataObject(370, 810, 130, 110, 1),
    octaShadow: new ImageDataObject(500, 810, 150, 140, 1),
    octaLight: new ImageDataObject(650, 810, 150, 140, 1),
    bossBar: new ImageDataObject(0, 960, 200, 40, 5),

    // bullet
    bulletJagijang: new ImageDataObject(850, 130, 50, 50, 1),
    bulletYellow: new ImageDataObject(910, 130, 20, 20, 1),
    bulletHellpo: new ImageDataObject(940, 130, 50, 50, 1),
    
    // attack
    lightningAttack: new ImageDataObject(0, 430, 100, 100, 6),
    hellpaAttack: new ImageDataObject(850, 200, 100, 30, 1),

    // effect
    jagijangLightning: new ImageDataObject(0, 270, 120, 60, 6),
    magnetMagneticBlue: new ImageDataObject(850, 240, 20, 25, 5),
    magnetMagneticRed: new ImageDataObject(850, 265, 20, 25, 5),

    // enemyDie
    enemyDieBar: new ImageDataObject(700, 0, 140, 20, 1),
    enemyDieJagijang: new ImageDataObject(850, 0, 100, 100, 1),
    enemyDieLightning: new ImageDataObject(450, 330, 90, 100, 8),
    enemyDieMagnet: new ImageDataObject(750, 430, 150, 100, 1),
    enemyDieBossBar: new ImageDataObject(1000, 960, 200, 40, 1),
  }

  static fieldSystem = {
    roundClear: { x: 0, y: 0, width: 400, height: 60 },
    gameOver: { x: 0, y: 60, width: 320, height: 60 },
    pause: { x: 0, y: 120, width: 200, height: 60 },
    result: { x: 200, y: 120, width: 240, height: 60 },
    menu: { x: 450, y: 0, width: 120, height: 128 },
    selected: { x: 450, y: 128, width: 120, height: 32 },
    unchecked: { x: 420, y: 0, width: 30, height: 32 },
    checked: { x: 420, y: 32, width: 30, height: 32 },
    arrow: { x: 420, y: 64, width: 30, height: 32 }
  }

  static enemyDieEffectList = {
    squareGrey: {x: 0, y: 0, width: 20, height: 20, frame: 10},
    circleRedWhite: {x: 0, y: 20, width: 20, height: 20, frame: 10},
    car1: {x: 0, y: 40, width: 20, height: 20, frame: 10},
    diamondBlue: {x: 0, y: 60, width: 20, height: 20, frame: 10},
    squareLinePurple: {x: 0, y: 80, width: 20, height: 20, frame: 10},
    smallCircleUp: {x: 0, y: 100, width: 20, height: 20, frame: 10},
    circleRedOrange: {x: 0, y: 120, width: 20, height: 20, frame: 10},
    pulseDiamondBlue: {x: 0, y: 140, width: 20, height: 20, frame: 10},
    diamondMagenta: {x: 0, y: 160, width: 20, height: 20, frame: 10},
    fireBlue: {x: 0, y: 180, width: 20, height: 20, frame: 10},
    squareRed: {x: 0, y: 200, width: 20, height: 20, frame: 10},
    fireRed: {x: 0, y: 220, width: 20, height: 20, frame: 10},
    squareLineRed: {x: 0, y: 240, width: 20, height: 20, frame: 10},
    noiseRed: {x: 0, y: 260, width: 20, height: 20, frame: 10},
    squareBlueLine: {x: 0, y: 280, width: 20, height: 20, frame: 10},
    metalSlashGrey: {x: 0, y: 300, width: 20, height: 20, frame: 10},
    circleBlue: {x: 0, y: 320, width: 20, height: 20, frame: 10},
    circleGreenStroke: {x: 0, y: 340, width: 20, height: 20, frame: 10},
    squareDarkCyan: new ImageDataObject(0, 360, 20, 20, 10),
    squareDarkViolet: new ImageDataObject(0, 380, 20, 20, 10),
    circleViolet: new ImageDataObject(0, 400, 20, 20, 10),
    metalSlashGreen: new ImageDataObject(0, 420, 20, 20, 10),
    metalSlashMagenta: new ImageDataObject(0, 440, 20, 20, 10),
  }

  static round2_3_result = {
    ready: {x: 0, y: 0, width: 300, height: 100, frame: 1},
    start: {x: 0, y: 100, width: 300, height: 100, frame: 1},
    fight: {x: 0, y: 200, width: 300, height: 100, frame: 1},
    complete: {x: 0, y: 300, width: 300, height: 100, frame: 1},
    win: {x: 0, y: 400, width: 300, height: 100, frame: 1},
    draw: {x: 0, y: 500, width: 300, height: 100, frame: 1},
    lose: {x: 0, y: 600, width: 300, height: 100, frame: 1}
  }

  static round2_3_effect = {
    warpYellow: {x: 0, y: 0, width: 50, height: 50, frame: 8},
    warpMint: {x: 0, y: 50, width: 50, height: 50, frame: 8},
    warpCyan: {x: 0, y: 100, width: 50, height: 50, frame: 8},
    warpArchomatic: {x: 0, y: 150, width: 50, height: 50, frame: 8},
    powerRed: {x: 0, y: 200, width: 50, height: 50, frame: 10},
    powerPurple: {x: 0, y: 250, width: 50, height: 50, frame: 10},
    powerBlue: {x: 0, y: 300, width: 50, height: 50, frame: 10},
    powerGreen: {x: 0, y: 350, width: 50, height: 50, frame: 10},
    moveCube: {x: 0, y: 400, width: 50, height: 50, frame: 10},
    moveArrow: {x: 0, y: 450, width: 50, height: 50, frame: 10},
  }

  static round2_3_status = {
    a1BattleRoom: {x: 0, y: 0, width: 800, height: 100, frame: 1},
    a2BreakRoom: {x: 0, y: 100, width: 800, height: 100, frame: 1},
    a3PowerRoom: {x: 0, y: 200, width: 800, height: 100, frame: 1},
    time: {x: 0, y: 300, width: 100, height: 100, frame: 1},
    b2Warp: {x: 100, y: 300, width: 100, height: 100, frame: 1},
    c1TotalDamage: {x: 200, y: 300, width: 200, height: 100, frame: 1},
    c2Score: {x: 400, y: 300, width: 200, height: 100, frame: 1},
    c2Square: {x: 600, y: 300, width: 100, height: 100, frame: 1},
    c3Goal: {x: 700, y: 300, width: 100, height: 100, frame: 1},
  }

  static round2_4_elevator = {
    elevatorClose: {x: 0, y: 0, width: 100, height: 100, frame: 1},
    elevatorOpen: {x: 0, y: 100, width: 100, height: 100, frame: 1},
    elevatorOpening: {x: 0, y: 0, width: 100, height: 100, frame: 10},
    elevatorClosing: {x: 0, y: 100, width: 100, height: 100, frame: 10},
    number1: {x: 0, y: 0, width: 35, height: 35, frame: 1},
    number2: {x: 35, y: 0, width: 35, height: 35, frame: 1},
    number3: {x: 70, y: 0, width: 35, height: 35, frame: 1},
    number4: {x: 105, y: 0, width: 35, height: 35, frame: 1},
    number5: {x: 140, y: 0, width: 35, height: 35, frame: 1},
    numberB: {x: 175, y: 0, width: 35, height: 35, frame: 1},
    numberUp: {x: 210, y: 50, width: 35, height: 35, frame: 1},
    numberDown: {x: 210, y: 100, width: 35, height: 35, frame: 1},
    numberUpRun: {x: 0, y: 50, width: 35, height: 35, frame: 8},
    numberDownRun: {x: 0, y: 100, width: 35, height: 35, frame: 8},
    numberScreen: {x: 0, y: 150, width: 200, height: 50, frame: 1},
    elevatorHall: {x: 0, y: 200, width: 100, height: 100, frame: 1},
  }

  static round3_optionWeapon = {
    orange: {x: 0, y: 0, width: 40, height: 40, frame: 10},
    skyblue: new ImageDataObject(400, 0, 40, 40, 10),
    green: new ImageDataObject(0, 40, 40, 40, 10),
    black: new ImageDataObject(400, 40, 40, 40, 10),
    pink: new ImageDataObject(0, 80, 40, 40, 10),
    purple: new ImageDataObject(400, 80, 40, 40, 10),
    orangeShot: new ImageDataObject(805, 0, 30, 12, 1),
    skyblueShot: new ImageDataObject(880, 0, 32, 32, 1),
    greenShot: new ImageDataObject(840, 0, 30, 12, 1),
    blackShot: new ImageDataObject(800, 40, 64, 64, 1),
    purpleShot: new ImageDataObject(0, 360, 40, 40, 20),
    pinkShot: new ImageDataObject(0, 200, 100, 100, 10),
    orangeItem: new ImageDataObject(0, 120, 40, 40, 1),
    skyblueItem: new ImageDataObject(40, 120, 40, 40, 1),
    greenItem: new ImageDataObject(80, 120, 40, 40, 1),
    blackItem: new ImageDataObject(120, 120, 40, 40, 1),
    pinkItem: new ImageDataObject(160, 120, 40, 40, 1),
    purpleItem: new ImageDataObject(200, 120, 40, 40, 1),
    skyblueSplash: new ImageDataObject(0, 300, 60, 60, 10)
  }

  static round3_bossWarning = {
    warning: new ImageDataObject(0, 0, 660, 120),
    lightRed: new ImageDataObject(0, 120, 660, 120),
    red: new ImageDataObject(0, 240, 660, 120),
  }

  static weapon = {
    arrowGreen: {x: 0, y: 0, width: 20, height: 20, frame: 7},
    arrowBrown: {x: 0, y: 20, width: 20, height: 20, frame: 7},
    blaster: {x: 140, y: 0, width: 35, height: 35, frame: 1},
    blasterMini: {x: 176, y: 0, width: 18, height: 18, frame: 1},
    multyshotNormal: {x: 200, y: 0, width: 40, height: 10, frame: 1},
    multyshotGreen: {x: 200, y: 10, width: 40, height: 10, frame: 1},
    multyshotBlue: {x: 200, y: 20, width: 40, height: 10, frame: 1},
    multyshotGrey: {x: 200, y: 30, width: 40, height: 10, frame: 1},
    laser: {x: 240, y: 0, width: 40, height: 40, frame: 1},
    laserBlue: {x: 320, y: 0, width: 40, height: 40, frame: 1},
    sidewave: {x: 400, y: 0, width: 12, height: 60, frame: 8},
    missile: {x: 0, y: 40, width: 40, height: 20, frame: 8},
    missileRocket: {x: 0, y: 60, width: 40, height: 20, frame: 6},
    sapia: {x: 500, y: 0, width: 48, height: 48, frame: 1},
    sapiaShot: {x: 550, y: 0, width: 26, height: 26, frame: 1},
    parapo: {x: 0, y: 80, width: 45, height: 20, frame: 14},
    rapid: {x: 320, y: 40, width: 60, height: 18, frame: 1},
    ring: {x: 640, y: 0, width: 50, height: 50, frame: 1},
    boomerang: {x: 580, y: 0, width:60, height: 50, frame: 1},
    seondanil: {x: 690, y: 0, width: 90, height: 40, frame: 1}
  }

  static weaponEffect = {
    missile: {x: 0, y: 0, width: 100, height: 100, frame: 10},
    parapoLeft: {x: 0, y: 0, width: 100, height: 100, frame: 10},
    parapoRight: {x: 0, y: 100, width: 100, height: 100, frame: 10},
    parapoUp: {x: 0, y: 200, width: 100, height: 100, frame: 10},
    parapoDown: {x: 0, y: 300, width: 100, height: 100, frame: 10},
  }

  static skill = {
    blaster: {x: 0, y: 0, width: 36, height: 36, frame: 1},
    multyshot: {x: 40, y: 0, width: 60, height: 12, frame: 1},
    sidewave: {x: 100, y: 0, width: 36, height: 120, frame: 5},
    sapiaRect: {x: 300, y: 0, width: 100, height: 100, frame: 5},
    sapiaCircle: {x: 300, y: 100, width: 100, height: 100, frame: 5},
    sword: {x: 0, y: 140, width: 80, height: 20, frame: 1},
    hyperBall: {x: 0, y: 40, width: 100, height: 100, frame: 1},
    laser: {x: 0, y: 200, width: 800, height: 100, frame: 1},
    swordMove: {x: 0, y: 300, width: 80, height: 40, frame: 7},
    missile: {x: 0, y: 350, width: 60, height: 30, frame: 8},
    criticalChase: {x: 0, y: 380, width: 60, height: 40, frame: 8},
    arrow: {x: 0, y: 420, width: 70, height: 70, frame: 7},
    santansu: {x: 100, y: 120, width: 30, height: 80, frame: 1},
    boomerang: {x: 130, y: 120, width: 80, height: 80, frame: 1},
    ring: {x: 500, y: 350, width: 100, height: 100, frame: 1},
    moon: {x: 600, y: 300, width: 200, height: 200, frame: 1},
    seondanil: {x: 600, y: 500, width: 180, height: 100, frame: 1},
    rapid: {x: 0, y: 490, width: 100, height: 30, frame: 6},
    hanjumoek: {x: 0, y: 520, width: 75, height: 40, frame: 8},
    whiteflash: {x: 0, y: 560, width: 60, height: 60, frame: 6}
  }
  
  static skillEffect = {
    criticalChase: {x: 0, y: 0, width: 50, height: 60, frame: 12},
    missile: {x: 0, y: 0, width: 200, height: 200, frame: 10},
    parapo: {x: 0, y: 0, width: 240, height: 240, frame: 10},
    pileBunker1: {x: 0, y: 0, width: 60, height: 20, frame: 12},
    pileBunker2: {x: 0, y: 20, width: 60, height: 20, frame: 12},
    pileBunker3: {x: 0, y: 40, width: 60, height: 20, frame: 12},
    swordHit: {x: 0, y: 0, width: 20, height: 20, frame: 11},
    santansuUp: {x: 0, y: 0, width: 40, height: 40, frame: 9},
    santansuDown: {x: 0, y: 40, width: 40, height: 40, frame: 9},
    santansuWater: {x: 0, y: 80, width: 40, height: 40, frame: 9},
    seondanil: {x: 0, y: 0, width: 180, height: 100, frame: 6},
    whiteflash: {x: 0, y: 0, width: 60, height: 60, frame: 15},
    hanjumeokSplash: {x: 0, y: 0, width: 100, height: 100, frame: 10},
  }

  static menuList = {
    roundSelect: {x: 0, y: 0, width: 400, height: 50, frame: 1},
    weaponSelect: {x: 0, y: 50, width: 400, height: 50, frame: 1},
    skillSelect: {x: 0, y: 100, width: 400, height: 50, frame: 1},
    upgrade: {x: 0, y: 150, width: 400, height: 50, frame: 1},
    option: {x: 0, y: 200, width: 400, height: 50, frame: 1},
    data: {x: 0, y: 250, width: 400, height: 50, frame: 1},
    etc: {x: 0, y: 300, width: 400, height: 50, frame: 1}
  }

  static system = {
    skillInfoYellowTitle: {x: 0, y: 0, width: 800, height: 20, frame: 1},
    skillInfoYellow: {x: 0, y: 20, width: 800, height: 20, frame: 1},
    skillInfoSkyBlueTitle: {x: 0, y: 40, width: 800, height: 20, frame: 1},
    skillInfoSkyBlue: {x: 0, y: 60, width: 800, height: 20, frame: 1},
    skillInfoPurpleBlueTitle: {x: 0, y: 80, width: 800, height: 20, frame: 1},
    skillInfoPurpleBlue: {x: 0, y: 100, width: 800, height: 20, frame: 1},
  }

  static effect = {
    jemulstar: {x: 0, y: 0, width: 60, height: 60, frame: 10},
    jemulCreate: {x: 0, y: 0, width: 40, height: 40, frame: 4},
  }

  // : {x: , y: , width: , height: , frame: 1},
}
