import { graphicSystem } from "./graphic";
import { soundSystem } from "./sound";

/**
 * 탐슈터 4를 만들기 위한 탐사엔진입니다.
 * 탐사엔진의 이름은 tam + 4(sa) + engine 의 조합입니다.
 * 
 * 게임을 만들기 위해서, init 함수를 사용해주십시요.
 * init 함수를 사용하면 게임 캔버스를 그립니다.
 * 
 * 항상 생각했지만, 복잡한 게임을 만들기 위해서는 구조를 잘 짜야 합니다.
 * 탐슈터 4는 구조적으로 복잡한 게임이 될 수밖에 없기 때문에 단순한 구현 위주로 동작했던
 * 기존 방식으로 게임을 만드는것은 너무 어렵습니다.
 * 
 * 그래서, 아예 기존에 분할되었던 기능을 한 엔진에 전부 합칠 예정입니다.
 * 
 * 각 모듈에 대한 설명은 내부 변수 참고
 */
class TamsaEngine {
  /**
   * 새로운 게임을 만듭니다. 이 클래스에 내장되어있는 함수들을 이용해 게임을 제작할 수 있습니다.
   * @param {string} gameTitle 게임 타이틀: 브라우저 타이틀에 표시됩니다.
   * @param {number} gameWidth 게임 너비
   * @param {number} gameHeight 게임 높이
   * @param {number} gameFps 초당 게임 프레임 (기본값: 고정 60), 가변방식 사용 불가
   * @param {boolean} autoCreateCanvas 캔버스 자동생성 (false일경우 사용자가 graphicSystem을 직접 호출해서 캔버스를 지정해야 합니다.)
   */
  constructor (gameTitle, gameWidth, gameHeight, gameFps = 60, autoCreateCanvas = true) {
    /** 브라우저 타이틀에 표시할 게임 타이틀 */ this.gameTitle = gameTitle
    /** 게임의 너비 (캔버스의 너비) */ this.gameWidth = gameWidth
    /** 게임의 높이 (캔버스의 높이) */ this.gameHeight = gameHeight
    /** 초당 게임 프레임 */ this.gameFps = gameFps

    /** 현재 프레임 */ this.currentFps = 0

    
    // 기본 초기화 작업 (재수행 될 수 없음.)
    // 캔버스 등록 및 브라우저 화면에 표시(이 위치를 수정해야 겠다면, 수동으로 캔버스를 지정해주세요.)
    this.graphicSystem = new graphicSystem(gameWidth, gameHeight)
  }

  /** 1초당 몇 프레임인지를 확인합니다. */

  framePerSecondsCheck () {

  }
}

let tamshooter4 = new TamsaEngine('tamshooter4', 800, 600)
let graphicSystem = tamshooter4.graphicSystem
let soundSystem = tamshooter4.soundSystem

export {
  tamshooter4,
  graphicSystem,
  soundSystem
}