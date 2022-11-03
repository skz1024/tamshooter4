import { graphicSystem } from "./js/graphic.js"
import { imageFile } from "./js/image.js"

var planet = () => {
  let image = imageFile.round.round1_6_paran_planet
  let elaspedFrame = 0
  let degree = 0
  let x = graphicSystem.CANVAS_WIDTH + 100
  let y = graphicSystem.CANVAS_HEIGHT - (image.height / 2)
  let process = () => {
    // 0 ~ 8초 < 행성이 중앙으로 이동
    this.x = 99
  }

  return {
    image,
    elaspedFrame,
    degree,
    x,
    y,
    process
  }
}

let a = planet()


addEventListener('keydown', (e) => {
  buttonSystem.keyInput(e.key)
  buttonSystem.keyDown(e.key)

  // 새로고침 기능, 개발자 도구 이외의 다른 기능은 막습니다.
  if (e.key !== 'F5' && e.key !== 'F12') {
    e.preventDefault()
  }
})
addEventListener('keyup', (e) => {
  buttonSystem.keyUp(e.key)
})


