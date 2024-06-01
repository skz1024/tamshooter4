//@ts-check

import { StatItem, StatPlayerSkill, StatPlayerWeapon, dataExportStatPlayerSkill, dataExportStatPlayerWeapon, dataExportStatRound, dataExportStatRoundBalance, dataExportStatWeapon } from "./js/dataStat.js"

let pre = document.getElementById('pre')
let element = document.createElement('pre')
element.textContent = '-player skillList-\n' 
+ 'name      |group   |balance |cool|delay|attack  |shot |repeat|attack|weapon\n' 
+ '          |        |type    |Time|     |Multiple|Count|Count |Count |Attack\n'
pre?.appendChild(element)

/** 현재에 해당하는 스킬 값을 얻어옴 */
const getSkillColor = (balance = '', coolTime = 20) => {
  const balanceType = StatPlayerSkill.balanceTypeList
  let color = 'white'
  // 쿨타임 20초: 밝은색, 24초: 진한색, 28초: 회색계통
  if (balance === balanceType.CHASE) {
    // 체이스타입, 노란색 표시
    if (coolTime === 20) color = '#FFF3CF'
    else if (coolTime === 24) color = '#FFE8A3'
    else if (coolTime === 28) color = '#FFDE7C'
  } else if (balance === balanceType.SPLASH) {
    // 스플래시타입, 파란색 표시
    if (coolTime === 20) color = '#D7F0FF'
    else if (coolTime === 24) color = '#A3DCFF'
    else if (coolTime === 28) color = '#69C6FF'
  } else if (balance === balanceType.AREA) {
    // 에리어 타입, 분홍색 표시
    if (coolTime === 20) color = '#FFE6FE'
    else if (coolTime === 24) color = '#FFBBFC'
    else if (coolTime === 28) color = '#FF8AFA'
  } else if (balance === balanceType.SHOT) {
    // 샷 타입, 초록색 표시
    if (coolTime === 20) color = '#D2FFD4'
    else if (coolTime === 24) color = '#9AFF9F'
    else if (coolTime === 28) color = '#69FF70'
  }

  return color
}

dataExportStatPlayerSkill.forEach((value) => {
  let name = '' + value.name.padEnd(10, ' ').slice(0, 10) + '|'
  let group = '' + value.group.padEnd(8, ' ').slice(0, 8) + '|'
  let balance = '' + value.balance.padEnd(8, ' ').slice(0, 8) + '|'
  let coolTime = ('' + value.coolTime).padEnd(4, ' ') + '|'
  let delay = ('' + value.delay).padEnd(5, ' ') + '|'
  let attackMultiple = ('' + value.multiple).padEnd(8, ' ') + '|'
  let shotCount = ('' + value.shot).padEnd(5, ' ') + '|'
  let repeatCount = ('' + value.repeat).padEnd(6, ' ') + '|'
  let attackCount = ('' + value.hit).padEnd(6, ' ') + '|'
  let weaponAttack = ('' + value.weaponAttack).padEnd(6, ' ') + '|'
  
  // color를 얻어올 때, value.xxx 하는 이유는, 일반 변수를 넣으면 중간에 string 변형이 일어나기 때문에, 원본과 값이 다를 수 있음.
  let color = getSkillColor(value.balance, value.coolTime)
  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = name + group + balance + coolTime + delay + attackMultiple + shotCount + repeatCount + attackCount + weaponAttack
  pre?.appendChild(element)
})

let element2 = document.createElement('pre')
element2.textContent = '-player weaponList- (60frame = 1second), (delay = frame)\n'
+ 'name      |group   |balance    |delay|shot |repeat|attack  |weapon|\n'
+ '          |        |type       |     |Count|count |Multiple|Attack|'
pre?.appendChild(element2)


/** 무기의 색을 얻습니다. 밸런스 타입에 따라 다름 */
const getWeaponColor = (balance = '') => {
  let color = 'white'
  const balanceList = StatPlayerWeapon.balanceTypeList
  switch (balance) {
    case balanceList.CHASE: color = '#89FEC9'; break // 추적: 청록
    case balanceList.FRONT: color = '#99F08D'; break // 전방: 초록
    case balanceList.MULTYSHOT: color = '#FED589'; break // 멀티샷: 주황
    case balanceList.PENETRATION: color = '#FFFFBF'; break // 관통: 노랑
    case balanceList.REFLECT: color = '#EAD2EA'; break // 반사: 보라
    case balanceList.SIDEWAVE: color = '#E8FFCC'; break // 사이드: 연두
    case balanceList.SPLASH: color = '#B5CEFF'; break // 스플래시: 파랑
    case balanceList.UNIQUE: color = '#DEDEDE'; break // 유니크: 회색
  }

  return color
}

dataExportStatPlayerWeapon.forEach((value) => {
  let name = '' + value.name.padEnd(10, ' ').slice(0, 10) + '|'
  let group = '' + value.group.padEnd(8, ' ').slice(0, 8) + '|'
  let balance = '' + value.balance.padEnd(11, ' ').slice(0, 11) + '|'
  let delay = ('' + value.delay).padEnd(5, ' ') + '|'
  let shotCount = ('' + value.shotCount).padEnd(5, ' ') + '|'
  let attackMultiple = ('' + value.attackMultiple).padEnd(8, ' ') + '|'
  
  let weaponData = dataExportStatWeapon.get(value.weaponIdList[0])
  if (weaponData == null) return
  let repeatCount = weaponData.repeatCount
  let weaponAttack = ('' + value.getCurrentAttack(10000, repeatCount)).padEnd(6, ' ') + '|'

  let color = getWeaponColor(value.balance)

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = name + group + balance + delay + shotCount + attackMultiple + weaponAttack
  pre?.appendChild(element)
})

let element3 = document.createElement('pre')
element3.textContent = '-roundList-\n'
+ 'round|require|standard|finish|clear  |gold |gold |balance|play|timediv|round name|round info |\n'
+ 'text |level  |power   |time  |bonus  |value|total|score  |time|score  |          |           |\n'
pre?.appendChild(element3)

dataExportStatRound.forEach((value, keyId) => {
  let roundText = '' + value.roundText.padEnd(5, ' ').slice(0, 5) + '|'
  let requireLevel = ('' + value.requireLevel).padEnd(7, ' ') + '|'
  let requireAttack = ('' + value.requireAttack).padEnd(8, ' ') + '|'
  let finishTime = ('' + value.finishTime).padEnd(6, ' ') + '|'
  let clearBonus = ('' + value.clearBonus).padEnd(7, ' ') + '|'
  let goldValue = ('' + value.gold).padEnd(5, ' ') + '|'
  let goldTotal = ('' + value.goldTotal).padEnd(5, ' ') + '|'

  let balanceData = dataExportStatRoundBalance.get(keyId)
  let balanceScore = ('' + (balanceData != null ? balanceData.balanceScore : 0)).padEnd(7, ' ') + '|'
  let playTime = ('' + (balanceData != null ? balanceData.playTime : 0)).padEnd(4, ' ') + '|'
  let timeDivScore = ('' + (balanceData != null ? balanceData.timeDivScore : 0)).padEnd(7, ' ') + '|'
  let roundName = '' + value.roundName.padEnd(15, ' ')
  let roundInfo = '' // value.roundInfo + '|'

  let textA = roundText + requireLevel + requireAttack + finishTime + clearBonus + goldValue + goldTotal
  let textB = balanceScore + playTime + timeDivScore + roundName + roundInfo

  let color = 'darkbrown'

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = textA + textB
  pre?.appendChild(element)
})

let element4 = document.createElement('pre')
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


  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = level + attackPercent + attackDifferent + costPercent + totalCostPercentString + refundPercent + totalCostRefund + totalCostDifferent + totalCostPrevDiff
  pre?.appendChild(element)
}
