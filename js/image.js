export class imageFile {
  static tamshooter4Title = new Image()
  static digitalNumber = new Image()
  static digitalAlphabet = new Image()
  static playerImage = new Image()
  static multyshot = new Image()
  static enemyTemp = new Image()
  static missile = new Image()
  static missileB = new Image()
}
imageFile.tamshooter4Title.src = './image/title.png'
imageFile.digitalNumber.src = './image/system/numbervector.png'
imageFile.digitalAlphabet.src = './image/system/alphabetvector.png'
imageFile.playerImage.src = './image/system/playerImage.png'
imageFile.multyshot.src = './image/weapon/multyshot.png'
imageFile.enemyTemp.src = './image/enemy/enemy12.png'
imageFile.missile.src = './image/weapon/missile.png'
imageFile.missileB.src = './image/weapon/missileB.png'

// 경고: canvas에 svg 이미지를 사용하지 마세요. 성능이 매우 안좋습니다.
// 그러므로 svg 파일은 게임 내에서 사용되지 않습니다.
// imageFile.DIGITAL_VECTOR_UNUSED.src = 'numbervector.svg'