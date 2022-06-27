export class imageFile {
  static tamshooter4Title = new Image()
  static enemyTemp = new Image()

  static system = {
    bitmapFont: new Image(),
    digitalFont20px: new Image(),
    digitalFont12px: new Image(),
    damageFont: new Image(),
    playerImage: new Image(),
    skillNumber: new Image(),
    skillIcon: new Image(),
    fieldSystem: new Image(),
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
    spaceEnemy: new Image()
  }

  static round = {
    roundIcon: new Image(),
    round1_space: new Image(),
    round1_meteorite: new Image(),
    round1_redzone: new Image(),
  }
}
imageFile.tamshooter4Title.src = './image/title.png'
imageFile.enemyTemp.src = './image/enemy/enemy12.png'

// system
imageFile.system.digitalFont20px.src = './image/system/digitalFont.png'
imageFile.system.digitalFont12px.src = './image/system/digitalFontSmall.png'
imageFile.system.playerImage.src = './image/system/playerImage.png'
imageFile.system.damageFont.src = './image/system/damageFont.png'
imageFile.system.skillNumber.src = './image/system/skillNumber.png'
imageFile.system.skillIcon.src = './image/system/skillIcon.png'
imageFile.system.fieldSystem.src = './image/system/fieldSystem.png'

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

// round
imageFile.round.roundIcon.src = './image/round/roundIcon.png'
imageFile.round.round1_space.src = './image/round/stars-g700d8fc30_1280.jpg'
imageFile.round.round1_meteorite.src = './image/round/space-g26f4aa3b6_1920_2.jpg'
imageFile.round.round1_redzone.src = './image/round/space-g26f4aa3b6_1920.jpg'

// 경고: canvas에 svg 이미지를 사용하지 마세요. 성능이 매우 안좋습니다.
// 그러므로 svg 파일은 게임 내에서 사용되지 않습니다.
// imageFile.DIGITAL_VECTOR_UNUSED.src = 'numbervector.svg'

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
    meteorite5: { x: 670, y: 290, width: 80, height: 45, frame: 1 }

    // { x: 0, y: 0, width: 0, height: 0, frame: 1 },
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
}
