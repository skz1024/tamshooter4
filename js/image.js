export class imageFile {
  static tamshooter4Title = new Image()
  static enemyTemp = new Image()

  static system = {
    digitalNumber: new Image(),
    digitalAlphabet: new Image(),
    damageFont: new Image(),
    playerImage: new Image(),
    skillNumber: new Image(),
    skillIcon: new Image()
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
    skillSidewave: new Image(),
  }

  static enemy = {
    
  }
}
imageFile.tamshooter4Title.src = './image/title.png'
imageFile.enemyTemp.src = './image/enemy/enemy12.png'

// system
imageFile.system.digitalNumber.src = './image/system/numbervector.png'
imageFile.system.digitalAlphabet.src = './image/system/alphabetvector.png'
imageFile.system.playerImage.src = './image/system/playerImage.png'
imageFile.system.damageFont.src = './image/system/damageFont.png'
imageFile.system.skillNumber.src = './image/system/skillNumber.png'
imageFile.system.skillIcon.src = './image/system/skillIcon.png'

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

// 경고: canvas에 svg 이미지를 사용하지 마세요. 성능이 매우 안좋습니다.
// 그러므로 svg 파일은 게임 내에서 사용되지 않습니다.
// imageFile.DIGITAL_VECTOR_UNUSED.src = 'numbervector.svg'