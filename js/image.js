export class imageFile {
  static tamshooter4Title = new Image()
  static enemyTemp = new Image()
  static roundIcon = new Image()

  static system = {
    bitmapFont: new Image(),
    digitalFont20px: new Image(),
    digitalFont12px: new Image(),
    damageFont: new Image(),
    playerImage: new Image(),
    skillNumber: new Image(),
    skillIcon: new Image(),
    fieldSystem: new Image(),
    optionCheck: new Image(),
    playerDie: new Image(),
    playerLevelup: new Image()
  }

  static effect = {
    jemulstar: new Image(),
    jemulCreate: new Image()
  }

  static weapon = {
    multyshot: new Image(),
    missile: new Image(),
    missileB: new Image(),
    missileEffect: new Image(),
    arrow: new Image(),
    laser: new Image(),
    sapia: new Image(),
    parapo: new Image(),
    parapoEffect: new Image(),
    blaster: new Image(),
    sidewave: new Image(),
    subWeapon: new Image(),

    // skill
    skillMultyshot: new Image(),
    skillMissile: new Image(),
    skillMissileEffect: new Image(),
    skillArrow: new Image(),
    skillLaser: new Image(),
    skillSapia: new Image(),
    skillParapoEffect: new Image(),
    skillBlaster: new Image(),
    skillSidewave: new Image()
  }

  static enemy = {
    spaceEnemy: new Image(),
    meteoriteEnemy: new Image(),
    jemulEnemy: new Image()
  }

  static enemyAttack = {
    energyBoltAttack: new Image(),
    attackList: new Image(),
  }
  
  static enemyDie = {
    effectList: new Image(),
    enemyDieSpaceComet: new Image(),
    enemyDieSpaceGamjigi: new Image(),
    enemyDieMeteorite: new Image(),
  }

  static round = {
    roundIcon: new Image(),
    round1_1_space: new Image(),
    round1_2_meteorite: new Image(),
    round1_3_meteoriteDeep: new Image(),
    round1_4_meteoriteDark: new Image(),
    round1_4_redzone: new Image(),
    round1_5_meteoriteRed: new Image(),
    round1_6_space: new Image(),
    round1_6_paran_planet: new Image()
  }
}
imageFile.tamshooter4Title.src = './image/title.png'
imageFile.roundIcon.src = './image/round/roundIcon.png'

// system
imageFile.system.digitalFont20px.src = './image/system/digitalFont.png'
imageFile.system.digitalFont12px.src = './image/system/digitalFontSmall.png'
imageFile.system.playerImage.src = './image/system/playerImage.png'
imageFile.system.damageFont.src = './image/system/damageFont.png'
imageFile.system.skillNumber.src = './image/system/skillNumber.png'
imageFile.system.skillIcon.src = './image/system/skillIcon.png'
imageFile.system.fieldSystem.src = './image/system/fieldSystem.png'
imageFile.system.optionCheck.src = './image/system/optionCheck.png'
imageFile.system.playerDie.src = './image/system/playerDie.png'
imageFile.system.playerLevelup.src = './image/system/playerLevelup.png'

// effect
imageFile.effect.jemulstar.src = './image/effect/jemulstar.png'
imageFile.effect.jemulCreate.src = './image/effect/jemulCreate.png'

// weapon
imageFile.weapon.multyshot.src = './image/weapon/multyshot.png'
imageFile.weapon.missile.src = './image/weapon/missile.png'
imageFile.weapon.missileB.src = './image/weapon/missileB.png'
imageFile.weapon.missileEffect.src = './image/weapon/missileEffect.png'
imageFile.weapon.arrow.src = './image/weapon/arrow.png'
imageFile.weapon.laser.src = './image/weapon/laser.png'
imageFile.weapon.sapia.src = './image/weapon/sapia.png'
imageFile.weapon.parapo.src = './image/weapon/parapo.png'
imageFile.weapon.parapoEffect.src = './image/weapon/parapoEffect.png'
imageFile.weapon.blaster.src = './image/weapon/blaster.png'
imageFile.weapon.sidewave.src = './image/weapon/sidewave.png'
imageFile.weapon.subWeapon.src = './image/weapon/subWeapon.png'

// weapon - skill
imageFile.weapon.skillMultyshot.src = './image/weapon/skillMultyshot.png'
imageFile.weapon.skillMissile.src = './image/weapon/skillMissile.png'
imageFile.weapon.skillMissileEffect.src = './image/weapon/skillMissileEffect.png'
imageFile.weapon.skillArrow.src = './image/weapon/skillArrow.png'
imageFile.weapon.skillLaser.src = './image/weapon/skillLaser.png'
imageFile.weapon.skillSapia.src = './image/weapon/skillSapia.png'
imageFile.weapon.skillParapoEffect.src = './image/weapon/skillParapoEffect.png'
imageFile.weapon.skillBlaster.src = './image/weapon/skillBlaster.png'
imageFile.weapon.skillSidewave.src = './image/weapon/skillSidewave.png'

// enemy
imageFile.enemy.spaceEnemy.src = './image/enemy/spaceEnemy.png'
imageFile.enemy.meteoriteEnemy.src = './image/enemy/meteoriteEnemy.png'
imageFile.enemy.jemulEnemy.src = './image/enemy/jemulEnemy.png'

// enemyBullet
imageFile.enemyAttack.energyBoltAttack.src = './image/enemy/energyBoltAttack.png'
imageFile.enemyAttack.attackList.src = './image/enemy/enemyAttackList.png'

// enemyDie
imageFile.enemyDie.effectList.src = './image/enemy/enemyDieEffect.png'
imageFile.enemyDie.enemyDieSpaceComet.src = './image/enemy/enemyDieSpaceComet.png'
imageFile.enemyDie.enemyDieSpaceGamjigi.src = './image/enemy/enemyDieSpaceGamjigi.png'
imageFile.enemyDie.enemyDieMeteorite.src = './image/enemy/enemyDieMeteorite.png'

// round
imageFile.round.roundIcon.src = './image/round/roundIcon.png'
imageFile.round.round1_1_space.src = './image/round/round1_1_space.jpg'
imageFile.round.round1_2_meteorite.src = './image/round/round1_2_meteoriteZone.jpg'
imageFile.round.round1_3_meteoriteDeep.src = './image/round/round1_3_meteoriteDeep.jpg'
imageFile.round.round1_4_meteoriteDark.src = './image/round/round1_4_meteoriteDark.jpg',
imageFile.round.round1_4_redzone.src = './image/round/round1_4_redZone.jpg'
imageFile.round.round1_5_meteoriteRed.src = './image/round/round1_5_meteoriteRed.jpg'
imageFile.round.round1_6_space.src = './image/round/round1_6_space.jpg'
imageFile.round.round1_6_paran_planet.src = './image/round/round1_6_paran_planet.png'

// 경고: canvas에 svg 이미지를 사용하지 마세요. 성능이 매우 안좋습니다.
// 그러므로 svg 파일은 게임 내에서 사용되지 않습니다.
// imageFile.DIGITAL_VECTOR_UNUSED.src = 'numbervector.svg'

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
  }
  // { x: 0, y: 0, width: 0, height: 0, frame: 1 },

  static meteoriteEnemy = {
    class11: { x: 0, y: 0, width: 50, height: 50, frame: 1 },
    class12: { x: 50, y: 0, width: 50, height: 50, frame: 1 },
    class13: { x: 100, y: 0, width: 50, height: 50, frame: 1 },
    class14: { x: 150, y: 0, width: 50, height: 50, frame: 1 },
    class15: { x: 200, y: 0, width: 50, height: 50, frame: 1 },
    class21: { x: 0, y: 50, width: 50, height: 50, frame: 1 },
    class22: { x: 50, y: 50, width: 50, height: 50, frame: 1 },
    class23: { x: 100, y: 50, width: 50, height: 50, frame: 1 },
    class24: { x: 150, y: 50, width: 50, height: 50, frame: 1 },
    class25: { x: 200, y: 50, width: 50, height: 50, frame: 1 },
    class31: { x: 0, y: 100, width: 50, height: 50, frame: 1 },
    class32: { x: 50, y: 100, width: 50, height: 50, frame: 1 },
    class33: { x: 100, y: 100, width: 50, height: 50, frame: 1 },
    class34: { x: 150, y: 100, width: 50, height: 50, frame: 1 },
    class35: { x: 200, y: 100, width: 50, height: 50, frame: 1 },
    whiteMeteo1: { x: 0, y: 150, width: 70, height: 50, frame: 1 },
    whiteMeteo2: { x: 70, y: 150, width: 70, height: 50, frame: 1 },
    whiteMeteo3: { x: 140, y: 150, width: 70, height: 50, frame: 1 },
    whiteMeteo4: { x: 210, y: 150, width: 70, height: 50, frame: 1 },
    whiteMeteo5: { x: 280, y: 150, width: 70, height: 50, frame: 1 },
    blackMeteo1: { x: 0, y: 200, width: 80, height: 45, frame: 1 },
    blackMeteo2: { x: 80, y: 200, width: 80, height: 45, frame: 1 },
    blackMeteo3: { x: 160, y: 200, width: 80, height: 45, frame: 1 },
    blackMeteo4: { x: 240, y: 200, width: 80, height: 45, frame: 1 },
    blackMeteo5: { x: 320, y: 200, width: 80, height: 45, frame: 1 },
    bomb: {x: 0, y: 250, width: 60, height: 60, frame: 8},
    bombBig: {x: 0, y: 250, width: 60, height: 60, frame: 1},
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
    red1: {x: 250, y: 80, width: 50, height: 50, frame: 1},
    red2: {x: 300, y: 80, width: 70, height: 50, frame: 1},
    red3: {x: 370, y: 80, width: 80, height: 45, frame: 1},
    red4: {x: 450, y: 80, width: 50, height: 50, frame: 1},
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
    jemulBossEye: {x: 840, y: 330, width: 100, height: 60, frame: 7},
    redAir: {x: 1450, y: 200, width: 120, height: 90, frame: 4},
    redShip: {x: 1590, y: 140, width: 110, height: 40, frame: 3},
    redJewel: {x: 1550, y: 330, width: 40, height: 45, frame: 10},
    redMeteorite: {x: 1920, y: 140, width: 70, height: 50, frame: 1}
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
  }
  
  static enemyDieEffectEx = {
    enemyDieSpaceGamjigi: {x: 0, y: 0, width: 30, height: 50, frame: 10},
    enemyDieSapceComet: {x: 0, y: 0, width: 35, height: 35, frame: 10}
  }

  static enemyDieMeteorite = {
    enemyDieMeteorite1: {x: 0, y: 0, width: 50, height: 50, frame: 10},
    enemyDieMeteorite2: {x: 0, y: 50, width: 50, height: 50, frame: 10},
    enemyDieMeteorite3: {x: 0, y: 100, width: 50, height: 50, frame: 10},
    enemyDieMeteoriteWhite: {x: 0, y: 150, width: 70, height: 50, frame: 10},
    enemyDieMeteoriteBlack: {x: 0, y: 200, width: 80, height: 45, frame: 10},
  }

  static enemyAttack = {
    jemulEnergyBoltAttack: {x: 0, y: 0, width: 60, height: 60, frame: 6},
    jemulEnemyAir: {x: 20, y: 0, width: 30, height: 20, frame: 1},
    jemulEnemyShip: {x: 0, y: 0, width: 20, height: 20, frame: 1},
    jemulEnemyHellSpike: {x: 50, y: 0, width: 15, height: 20, frame: 1},
  }
}

/**
 * 이 클래스는 자동완성을 쉽게 하기 위해 만들어진 클래스입니다. 일반적인 용도로는 사용하지 않습니다.
 * 해당 생성자를 사용하지 마세요.
 */
export class ImageDataObject {
  constructor () {
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 0
    this.frame = 10
    throw new Error('이 클래스는 생성할 수 없습니다. This class cannot be created. ')
  }
}
