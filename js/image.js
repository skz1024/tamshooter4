export class imageFile {
  static tamshooter4Title = new Image()
  static digitalNumber = new Image()
  static digitalAlphabet = new Image()
  static playerImage = new Image()
  static enemyTemp = new Image()
  static damageFont = new Image()

  static system = {

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
  }

  static enemy = {
    
  }
}
imageFile.tamshooter4Title.src = './image/title.png'
imageFile.digitalNumber.src = './image/system/numbervector.png'
imageFile.digitalAlphabet.src = './image/system/alphabetvector.png'
imageFile.playerImage.src = './image/system/playerImage.png'
imageFile.enemyTemp.src = './image/enemy/enemy12.png'
imageFile.damageFont.src = './image/system/damageFont.png'

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

// 경고: canvas에 svg 이미지를 사용하지 마세요. 성능이 매우 안좋습니다.
// 그러므로 svg 파일은 게임 내에서 사용되지 않습니다.
// imageFile.DIGITAL_VECTOR_UNUSED.src = 'numbervector.svg'