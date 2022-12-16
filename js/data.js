'use strict'

import { dataExportPlayerSkill, dataExportPlayerWeapon, PlayerSkillData, PlayerWeaponData } from './dataPlayer.js'
import { EnemyData, EnemyBulletData, dataExportEnemy } from './dataEnemy.js'
import { CustomEffect, EffectData } from './dataEffect.js'
import { dataExportRound, RoundData } from './dataRound.js'
import { dataExportWeapon, WeaponData } from './dataWeapon.js'
import { ID } from './dataId.js'

/*
 * 참고사항
 * dataField.js는 dataXXX.js같은 파일에서 사용하는 기본적인 함수들이 들어있습니다.
 * dataXXX.js 는 각 데이터를 분산하기 위해 만들어진 데이터입니다.
 * 
 * tamshooter4Data 변수는 tam4로 줄여 쓰는것이 가능합니다. (둘이 같은 변수를 참조)
 * 그리고, tamshooter4Data 클래스 밑에는 데이터를 추가하는 과정이 더해집니다.
 * 다만, tamshooter4Data 클래스와 dataXXX.js는 초기화 문제 때문에 들을 상호작용 할 수는 없습니다.
 * 그래서 간접적으로 데이터를 추가하는 방식을 사용할 예정입니다.
 */


/**
 * tamshooter4의 데이터 모음
 * 
 * 모든 데이터는 Map 오브젝트로 구현되었습니다.
 */
export class tamshooter4Data {
  /**
   * 플레이어가 사용하는 플레이어무기 객체 (무기 객체랑 다릅니다.)
   * @type {Map}
   */
  static playerWeapon = dataExportPlayerWeapon

  /**
   * 플레이어 웨폰 객체를 가져옵니다.
   * 
   * 클래스로 가져오기 때문에, 사용하려면 인스턴스를 new() 로 생성해야 합니다!
   * 
   * @param {number} id ID 클래스가 가지고 있는 id 상수
   * @returns {PlayerWeaponData} 플레이어 무기 객체 (무기 객체랑 다름)
   */
  static getPlayerWeapon = (id) => this.playerWeapon.get(id)

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @param {PlayerWeaponData} value 플레이어 무기 객체
   */
  static setPlayerWeapon (id, value) {
    this.playerWeapon.set(id, value) 
  }


  /**
   * 플레이어가 사용하는 스킬 객체
   * 
   */
  static playerSkill = dataExportPlayerSkill

  /**
   * 플레이어 스킬 객체를 가져옵니다.
   * 
   * 클래스로 가져오기 때문에, 사용하려면 인스턴스를 new() 로 생성해야 합니다!
   * 
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @returns {PlayerSkillData} 플레이어 스킬 객체
   */
  static getPlayerSkill = (id) => this.playerSkill.get(id)

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @param {PlayerSkillData} value 플레이어 스킬 객체
   */
  static setPlayerSkill (id, value) {
    this.playerSkill.set(id, value)
  }


  /**
   * 무기 객체를 얻어옵니다.
   * @type {Map}
   */
  static weapon = dataExportWeapon

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @param {WeaponData} value 무기 객체
   */
  static setWeapon (id, value) {
    this.weapon.set(id, value)
  }

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @returns {WeaponData} 무기 객체
   */
  static getWeapon = (id) => this.weapon.get(id) 


  /**
   * 적 객체
   * @type {Map}
   */
  static enemy = dataExportEnemy

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @param {EnemyData} value 적 객체
   */
  static setEnemy (id, value) {
    this.enemy.set(id, value)
  }

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @returns {EnemyData} 적 객체
   */
  static getEnemy = (id) => this.enemy.get(id)


  /**
   * 이펙트 객체 (CustomEffect 객체랑 관련 없음.)
   */
  static effect = new Map()
  
  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @param {EffectData} value 이펙트 데이터
   */
  static setEffect (id, value) {
    this.effect.set(id, value)
  }

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @returns {EffectData} 이펙트 데이터
   */
  static getEffect = (id) => this.effect.get(id)


  /**
   * 적이 총알을 사용할 때 사용하는 객체 (적 데이터와 별개)
   */
  static enemyBullet = new Map()
  
  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @param {EnemyBulletData} value 적 총알의 데이터 (적 데이터와는 별개)
   */
  static setEnemyBullet (id, value) {
    this.enemyBullet.set(id, value)
  }

  /**
   * @deprecated
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @returns {EnemyBulletData} value 적 총알의 데이터 (적 데이터와는 별개)
   */
  static getEnemyBullet = (id) => this.effect.get(id)


  /**
   * 라운드 객체
   */
  static round = dataExportRound

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @param {RoundData} value 라운드 데이터
   */
  static setRound (id, value) {
    this.round.set(id, value)
  }

  /**
   * @param {number} id ID 클래스가 가지고 있는 id 함수
   * @returns {RoundData} 라운드 데이터
   */
  static getRound = (id) => this.round.get(id)
}

/**
 * tamshooter4Data의 짧은 이름을 가진 변수 (tamshooter4Data랑 동일)
 */
export const tam4 = tamshooter4Data
