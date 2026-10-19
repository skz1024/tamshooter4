//@ts-check

import { StatItem, StatPlayerSkill, StatPlayerWeapon, StatUser, dataExportStatPlayerSkill, dataExportStatPlayerWeapon, dataExportStatRound, dataExportStatWeapon } from "./js/dataStat.js"

/** 타입에 해당하는 클래스 값을 얻어옵니다. 이 값은 css 선택자로 활용합니다. */
const getTypeColorClass = (balance = '') => {
  const balanceType = StatPlayerSkill.balanceTypeList
  switch (balance) {
    case balanceType.SPLASH: return 'type-splash'
    case balanceType.AREA_ATTACK: return 'type-area-attack'
    case balanceType.AREA_SPLASH: return 'type-area-splash'
    case balanceType.CHASE: return 'type-chase'
    case balanceType.SHOT_FRONT: return 'type-shot-front'
    case balanceType.SHOT_XWAY: return 'type-shot-xway'
    case balanceType.SHOT_ANOTHER: return 'type-shot-another'
    case balanceType.MIXED: return 'type-mixed'
    case balanceType.FORMULA: return 'type-formula'
    default: return 'white'
  }
}


let pre = document.getElementById('pre')
let element = document.createElement('pre')
element.id = 'playerSkillList'
element.textContent = '-player skillList-\n' 
+ 'group     |name           |balance     |attack  |cool|■|shot |repeat|repeat|weapon|weapon|weapon|splash|max   |\n' 
+ '          |               |type        |multiple|time|■|count|count |delay |repeat|delay |attack|      |target|\n'
pre?.appendChild(element)

dataExportStatPlayerSkill.forEach((value) => {
  const weaponData = dataExportStatWeapon.get(value.weaponId)
  let name = '' + value.name.padEnd(15, ' ').slice(0, 15) + '|'
  let group = '' + value.group.padEnd(10, ' ').slice(0, 10) + '|'
  let balance = '' + value.balance.padEnd(12, ' ').slice(0, 12) + '|'
  let multiple = ('' + value.multiple).padEnd(8, ' ') + '|'
  let coolTime = ('' + value.coolTime).padEnd(4, ' ') + '|'
  let shotCount = ('' + value.shotCount).padEnd(5, ' ') + '|'
  let repeatCount = ('' + value.repeatCount).padEnd(6, ' ') + '|'
  let weaponRepeat = '-1'.padEnd(6, ' ') + '|'
  let wepaonDelay = '-1'.padEnd(6, ' ') + '|'
  if (value.weapon) {
    // 만약 repeatCount, subCount가 있으면 (r x s) 형태로 표시되고
    // 아니라면, r 깂민 표시합니다.
    const r = value.weapon.repeatCount
    const s = value.weapon.subCount
    weaponRepeat = s > 0 ? (r + 'x' + s).padEnd(6, ' ') + '|' : (r + '').padEnd(6, ' ') + '|'

    const d = value.weapon.repeatDelay
    wepaonDelay = (d + '').padEnd(6, ' ') + '|'
  }
  let repeatDelay = ('' + value.delay).padEnd(6, ' ') + '|'
  let baseAttack = ('' + value.getCurrentAttack()).padEnd(6, ' ') + '|'
  const maxTargetNumber = (weaponData != null && weaponData.isSplash) ? weaponData.maxTarget : 1
  let maxTarget = ('' + maxTargetNumber).padEnd(6, ' ') + '|'
  let isSplash = ('' + (weaponData != null ? weaponData.isSplash : false)).padEnd(6, ' ') + '|'
  
  let color = getTypeColorClass(value.balance)

  // 일부 잘못된 밸런스 규칙이 있는지 검사합니다. 스플래시는 여러 개체를 동시에 공격할 수 있어야 합니다.
  if (balance === StatPlayerSkill.balanceTypeList.SPLASH && weaponData?.isSplash === false) {
    color = '#FF0000'
  } else if (balance === StatPlayerSkill.balanceTypeList.AREA_SPLASH && weaponData?.isSplash === false) {
    color = '#FF0000'
  }

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.className = color
  element.style.color = 'black'
  element.style.width = '800px'
  element.textContent = group + name + balance + multiple + coolTime + '■|' + shotCount + repeatCount + repeatDelay + weaponRepeat + wepaonDelay+ baseAttack + isSplash + maxTarget
  element.addEventListener('mouseenter', () => {
    element.style.outline = '3px solid black'
  })
  element.addEventListener('mouseleave', () => {
    element.style.outline = ''
  })
  pre?.appendChild(element)
})

let element2 = document.createElement('pre')
element2.id = 'playerWeaponList'
element2.textContent = '-player weaponList- (60frame = 1second), (delay = frame)\n'
+ 'group     |name           |balance     |attack  |■|shot |repeat|repeat|weapon|weapon|weapon|spalsh|max   |\n' 
+ '          |               |type        |multiple|■|count|count |delay |repeat|delay |attack|      |target|\n'
pre?.appendChild(element2)

dataExportStatPlayerWeapon.forEach((value) => {
  let name = '' + value.name.padEnd(15, ' ').slice(0, 15) + '|'
  let group = '' + value.group.padEnd(10, ' ').slice(0, 10) + '|'
  let balance = '' + value.balance.padEnd(12, ' ').slice(0, 12) + '|'
  let multiple = ('' + value.multiple).padEnd(8, ' ') + '|'
  let shotCount = ('' + value.shotCount).padEnd(5, ' ') + '|'
  let repeatCount = ('' + value.repeatCount).padEnd(6, ' ') + '|'
  let weaponRepeat = ('').padEnd(6, ' ') + '|'
  let wepaonDelay = '-1'.padEnd(6, ' ') + '|'
  if (value.weapon) {
    // 만약 repeatCount, subCount가 있으면 (r x s) 형태로 표시되고
    // 아니라면, r 깂민 표시합니다.
    const r = value.weapon.repeatCount
    const s = value.weapon.subCount
    weaponRepeat = s > 0 ? (r + 'x' + s).padEnd(6, ' ') + '|' : (r + '').padEnd(6, ' ') + '|'

    const d = value.weapon.repeatDelay
    wepaonDelay = (d + '').padEnd(6, ' ') + '|'
  }
  let delay = ('' + value.delay).padEnd(6, ' ') + '|'
  
  let weaponData = dataExportStatWeapon.get(value.weaponId)
  if (weaponData == null) return
  let weaponAttack = ('' + value.getCurrentAttack()).padEnd(6, ' ') + '|'
  const maxTargetNumber = (weaponData != null && weaponData.isSplash) ? weaponData.maxTarget : 1
  let maxTarget = ('' + maxTargetNumber).padEnd(6, ' ') + '|'
  let isSplash = ('' + (weaponData != null ? weaponData.isSplash : false)).padEnd(6, ' ') + '|'

  // let splashTarget = weaponData.isMultiTarget ? ('' + weaponData.maxTarget).padEnd(6, ' ') + '|' : '1'.padEnd(6, ' ') + '|'
  let splashTarget = ''

  let color = getTypeColorClass(value.balance)

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.className = color
  element.style.width = '800px'
  element.style.color = 'black'
  element.textContent = group + name + balance + multiple + '■|' + shotCount + repeatCount + delay + weaponRepeat + wepaonDelay + splashTarget + weaponAttack + isSplash + maxTarget
  element.addEventListener('mouseenter', () => {
    element.style.outline = '3px solid black'
  })
  element.addEventListener('mouseleave', () => {
    element.style.outline = ''
  })
  pre?.appendChild(element)
})

let element3 = document.createElement('pre')
element3.id = 'roundList'
element3.textContent = '-roundList-\n'
+ 'round|req  |req   |finish|clear  |gold |gold |target |play|timediv|round name|round info |\n'
+ 'text |level|attack|time  |bonus  |value|total|score  |time|score  |          |           |\n'
pre?.appendChild(element3)

dataExportStatRound.forEach((value, keyId) => {
  let roundText = '' + value.roundText.padEnd(5, ' ').slice(0, 5) + '|'
  let requireLevel = ('' + value.requireLevel).padEnd(5, ' ') + '|'
  let requireAttack = ('' + value.requireAttack).padEnd(6, ' ') + '|'
  let finishTime = ('' + value.finishTime).padEnd(6, ' ') + '|'
  let clearBonus = ('' + value.clearBonusScore).padEnd(7, ' ') + '|'
  let goldValue = ('' + value.gold10SecRate).padEnd(5, ' ') + '|'
  let goldTotal = ('' + value.goldTotal).padEnd(5, ' ') + '|'

  let balanceScore = ('' + (value.baseTime * value.scorePerSecond)).padEnd(7, ' ') + '|'
  let playTime = ('' + value.baseTime).padEnd(4, ' ') + '|'
  let timeDivScore = ('' + value.scorePerSecond).padEnd(7, ' ') + '|'
  let roundName = '' + value.roundName.padEnd(15, ' ')
  let roundInfo = value.roundInfo // + '|'

  let textA = roundText + requireLevel + requireAttack + finishTime + clearBonus + goldValue + goldTotal
  let textB = balanceScore + playTime + timeDivScore + roundName + roundInfo

  let color = keyId % 2 === 0 ? '#F3F3F3' : '#E0E0E0'

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.style.width = '800px'
  element.textContent = textA + textB
  element.addEventListener('mouseenter', () => {
    element.style.background = 'skyblue'
  })
  element.addEventListener('mouseleave', () => {
    element.style.background = color
  })
  pre?.appendChild(element)
})

let element4 = document.createElement('pre')
element4.id = 'upgradeCostList'
element4.textContent = '-upgradeCost-\n'
+ 'level|attack      |cost   |totalcost|refund |totalcost            |\n'
+ '     |percent|plus|percent|percent  |percent|refund   |diff |prev |\n'
pre?.appendChild(element4)

for (let i = 0; i <= StatItem.UPGRADE_LEVEL_MAX; i++) {
  let level = ('' + i).padEnd(5, ' ') + '|'
  let attackPercent = ('' + StatItem.upgradeAttackPercentTable[i]).padEnd(7, ' ') + '|'
  let attackDiffValue = i === 0 ? 0 : StatItem.upgradeAttackPercentTable[i] - StatItem.upgradeAttackPercentTable[i - 1]
  let attackDifferent = ('' + attackDiffValue).padEnd(4, ' ') + '|'
  let costPercent = ('' + StatItem.upgradeCostPercentTable[i]).padEnd(7, ' ') + '|'
  let totalCostPercentString = ('' + StatItem.upgradeCostTotalPercentTable[i]).padEnd(9, ' ') + '|'
  let refundPercent = ('' + StatItem.upgradeRefundPercentTable[i]).padEnd(7, ' ') + '|'
  let totalCostRefund = ('' + StatItem.upgradeCostTotalRefundTable[i]).padEnd(9, ' ') + '|'

  let totalCostDiffValue = i === 0 ? 0 : StatItem.upgradeCostTotalPercentTable[i] - StatItem.upgradeCostTotalRefundTable[i]
  let totalCostPrevValue = i === 0 ? 0 : StatItem.upgradeCostTotalPercentTable[i - 1] - StatItem.upgradeCostTotalRefundTable[i - 1]
  let totalCostDifferent = ('' + (totalCostDiffValue)).padEnd(5, ' ') + '|'
  let totalCostPrevDiff = ('' + (totalCostDiffValue - totalCostPrevValue)).padEnd(5, ' ') + '|'

  let color = 'white'
  if (i === 14) color = 'GreenYellow'
  else if (i === 23) color = 'LimeGreen'
  else if (i === 30) color = 'YellowGreen'
  else if (i % 2 === 0) color = '#F5FFF1'
  else color = '#DDE8D9'


  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.style.width = '800px'
  element.textContent = level + attackPercent + attackDifferent + costPercent + totalCostPercentString + refundPercent + totalCostRefund + totalCostDifferent + totalCostPrevDiff
  element.addEventListener('mouseenter', () => {
    element.style.background = 'skyblue'
  })
  element.addEventListener('mouseleave', () => {
    element.style.background = color
  })
  pre?.appendChild(element)
}

let element5 = document.createElement('pre')
element5.id = 'playerLvData'
element5.textContent = '-player level data / max level: ' + StatUser.MAX_LEVEL + '-\n'
+ 'level|exp     |section |total   |attack|\n'
pre?.appendChild(element5)

let sectionExp = 0
let totalExp = 0
for (let i = 0; i < StatUser.expTable.length; i++) {
  let level = (i + '').padEnd(5, ' ') + '|'
  let exp = (StatUser.expTable[i] + '').padEnd(8, ' ') + '|'
  sectionExp = i % 10 === 0 ? StatUser.expTable[i] : sectionExp + StatUser.expTable[i]
  let section = (sectionExp + '').padEnd(8, ' ') + '|'
  totalExp += StatUser.expTable[i]
  let total = (totalExp + '').padEnd(8) + '|'
  let attack = (StatUser.attackLevelTable[i] + '').padEnd(6, ' ') + '|'

  let color = i % 2 === 0 ? '#F5FFF1' : '#DDE8D9'
  if (i > StatUser.MAX_LEVEL) {
    color = i % 2 === 0 ? '#FFA98F' : '#CAA296'
  }

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.width = '800px'
  element.style.color = 'black'
  element.textContent = level + exp + section + total + attack
  element.addEventListener('mouseenter', () => {
    element.style.background = 'skyblue'
  })
  element.addEventListener('mouseleave', () => {
    element.style.background = color
  })
  pre?.appendChild(element)
}
