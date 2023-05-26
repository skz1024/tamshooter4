import { dataExportStatPlayerSkill, dataExportStatPlayerWeapon, dataExportStatRound, dataExportStatWeapon } from "./js/dataStat.js"

let pre = document.getElementById('pre')
let element = document.createElement('pre')
element.textContent = '-skillList-\n' 
+ 'name      |cool|delay|attack  |shot |repeat|attack|weapon\n' 
+ '          |Time|     |Multiple|Count|Count |Count |Attack\n'
pre.appendChild(element)

dataExportStatPlayerSkill.forEach((value) => {
  let name = '' + value.name.padEnd(10, ' ').slice(0, 10) + '|'
  let coolTime = ('' + value.coolTime).padEnd(4, ' ') + '|'
  let delay = ('' + value.delay).padEnd(5, ' ') + '|'
  let attackMultiple = ('' + value.multiple).padEnd(8, ' ') + '|'
  let shotCount = ('' + value.shot).padEnd(5, ' ') + '|'
  let repeatCount = ('' + value.repeat).padEnd(6, ' ') + '|'
  let attackCount = ('' + value.hit).padEnd(6, ' ') + '|'
  let weaponAttack = ('' + value.weaponAttack).padEnd(6, ' ') + '|'

  let color = 'black'
  switch (value.coolTime) {
    case 20: color = 'greenyellow'; break
    case 24: color = 'lime'; break
    case 28: color = 'lightgreen'; break
  }


  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = name + coolTime + delay + attackMultiple + shotCount + repeatCount + attackCount + weaponAttack
  pre.appendChild(element)
})

let element2 = document.createElement('pre')
element2.textContent = '-weaponList- (60frame = 1second), (delay = frame)\n'
+ 'name      |delay|shot |attack|attack  |weapon|\n'
+ '          |     |Count|Count |Multiple|Attack|'
pre.appendChild(element2)

dataExportStatPlayerWeapon.forEach((value) => {
  let name = '' + value.name.padEnd(10, ' ').slice(0, 10) + '|'
  let delay = ('' + value.delay).padEnd(5, ' ') + '|'
  let shotCount = ('' + value.shotCount).padEnd(5, ' ') + '|'
  let attackCount = ('' + value.attackCount).padEnd(6, ' ') + '|'
  let attackMultiple = ('' + value.attackMultiple).padEnd(8, ' ') + '|'
  let weaponAttack = ('' + value.weaponAttack).padEnd(6, ' ') + '|'

  let color = 'pink'

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = name + delay + shotCount + attackCount + attackMultiple + weaponAttack
  pre.appendChild(element)
})

let element3 = document.createElement('pre')
element3.textContent = '-roundList-\n'
+ 'round|require|standard|finish|clear  |round name|round info |\n'
+ 'text |level  |power   |time  |bonus  |          |           |\n'
pre.appendChild(element3)

dataExportStatRound.forEach((value) => {
  let roundText = '' + value.roundText.padEnd(5, ' ').slice(0, 5) + '|'
  let requireLevel = ('' + value.requireLevel).padEnd(7, ' ') + '|'
  let standardPower = ('' + value.standardPower).padEnd(8, ' ') + '|'
  let finishTime = ('' + value.finishTime).padEnd(6, ' ') + '|'
  let clearBonus = ('' + value.clearBonus).padEnd(7, ' ') + '|'
  let roundName = '' + value.roundName.padEnd(15, ' ')
  let roundInfo = '' // value.roundInfo + '|'

  let color = 'darkbrown'

  let element = document.createElement('pre')
  element.style.margin = '0'
  element.style.background = color
  element.style.color = 'black'
  element.textContent = roundText + requireLevel + standardPower + finishTime + clearBonus + roundName + roundInfo
  pre.appendChild(element)
})

