// ID 동결을 위한 전용 Freeze 함수
// 객체 내부의 객체까지 전부 동결합니다.
function deepFreeze(obj) {
  Object.keys(obj).forEach((name) => {
    const prop = obj[name];
    if (typeof prop === 'object' && prop !== null) {
      deepFreeze(prop); // 하위 객체가 있으면 재귀 호출
    }
  });
  return Object.freeze(obj);
}

/**
 * 공통적으로 사용하는 객체 ID (상수 값 - 숫자만 허용)

ID 규칙 (기본 5자리 숫자, 이후 확장 가능)
ID 범위 (배치 순서는 고정)
플레이어 무기: 10000 ~ 11999,
플레이어 스킬: 12000 ~ 19999,
적: 20000 ~ 39999,
무기: 40000 ~ 49999,
아이템: 50000 ~ 69999,
라운드: 70000 ~ 79999,
장비: 80000 ~ 80999,
다음 구역에서 특수한 ID가 필요하다면 확장할 수 있음.

참고: ID type을 계산하기 위해서는 ID.getType 함수를 사용해주세요.

 */
export class ID {
  /** 참고, 이 상수는 타입의 첫번째 객체의 시작 값이랑 동일합니다. */
  static type = {
    /** ID를 사용할 생각이 없다면, 이 값을 사용해도 됩니다. 일반적으로 0은 사용하지 않음으로 간주됩니다. */ 
    UNUSED: 0,
    //---
    PLAYER_WEAPON: 10000,
    PLAYER_SKILL: 12000,
    ENEMY: 20000,
    WEAPON: 40000,
    ITEM: 50000,
    ROUND: 70000,
    EQUIPMENT: 80000,
  }

  /** 
   * 해당 ID의 타입 상수를 리턴합니다.
   * 주의: 타입 상수값은 ID.type을 참고하세요. 디버그 할 때 어려움을 겪는다면, getTypeString을 사용할 수도 있습니다.
   */
  static getType (idValue) {
    const entries = Object.entries(this.type);
    
    for (let i = entries.length - 1; i >= 0; i--) {
      const [key, startId] = entries[i];
      if (idValue >= startId) {
        // 숫자 상수값(10000, 20000 등)을 그대로 반환
        return this.type[key]; 
      }
    }
    return this.type.UNUSED;
  }

  /** 해당 ID의 타입 상수 변수 이름을 출력합니다. 이것은 타입을 문자열로 표시하는 것과 거의 동일합니다. */
  static getTypeString (idValue) {
    const entries = Object.entries(this.type);
      
    // 뒤에서부터(큰 숫자부터) 비교
    for (let i = entries.length - 1; i >= 0; i--) {
      const [typeName, startId] = entries[i];
      if (idValue >= startId) {
        return typeName; // 또는 대응하는 Enum 값
      }
    }
    return "UNUSED";
  }

  static playerWeapon = {
    /** 사용되지 않는 id */ unused: 0,
    /** 무기 번호를 가져올 때 사용(서브웨폰은 엉뚱한 번호를 가져온다.) 
     * 지금은 목적이 바뀌어서 같은 값을 가진 또다른 변수를 만들었습니다. */ weaponNumberStart: 10000,
    multyshot: 10001,
    missile: 10002,
    arrow: 10003,
    laser: 10004,
    sapia: 10005,
    parapo: 10006,
    blaster: 10007,
    sidewave: 10008,
    ring: 10009,
    rapid: 10010,
    seondanil: 10011,
    boomerang: 10012,
    kalnal: 10013,
    cogwheel: 10014,
    yeonsai: 10015,
    sabangtan: 10016,
    r3TowerPink: 10017,
    r3TowerPurple: 10018,
    r3Helljeon: 10019,
  }

  static playerSkill = {
    unused: 0,
    /** 스킬 번호 ID의 시작점 */
    skillNumberStart: 12000,
    multyshot: 12001,
    missile: 12002,
    arrow: 12003,
    laser: 12004,
    sapia: 12005,
    parapo: 12006,
    blaster: 12007,
    sidewave: 12008,
    sword: 12009,
    hyperBall: 12010,
    critcalChaser: 12011,
    pileBunker: 12012,
    santansu: 12013,
    whiteflash: 12014,
    ring: 12015,
    rapid: 12016,
    seondanil: 12017,
    hanjumoek: 12018,
    boomerang: 12019,
    moon: 12020,
    kalnal: 12021,
    cogwheel: 12022,
    yeonsai: 12023,
    sabangtan: 12024,
    habirant: 12025,
    icechaser: 12026,
    calibur: 12027,
    sujikpa: 12028,
    speaker: 12029,
    eomukggochi: 12030,
    r2Firecracker: 12031,
    r2Toyhammer: 12032,
    r3Xkill: 12033,
    r3Xshot: 12034,
    r3Xbeam: 12035,
    r3Xboom: 12036,
    r3Helljeon: 12037,
  }

  static weapon = {
    unused: 0,

    // group 1
    multyshot: 41010,
    missile: 41011,
    arrow: 41012,
    laser: 41013,
    sapia: 41014,
    parapo: 41015,
    parapoSub: 41016,
    blaster: 41017,
    sidewave: 41018,
    rapid: 41019,
    ring: 41020,
    seondanil: 41021,
    boomerang: 41022,

    // group 2
    kalnal: 41023,
    cogwheel: 41024,
    yeonsai: 41025,
    sabangtan: 41026,

    // extend r3
    r3TowerPink: 41027,
    r3TowerPurple: 41028,
    r3Helljeon: 41029,

    // skill list
    // group 1 skill
    skillMultyshot: 46001,
    skillMissile: 46002,
    skillArrow: 46003,
    skillLaser: 46004,
    skillSapia: 46005,
    skillParapo: 46006,
    skillBlaster: 46007,
    skillSidewave: 46008,
    skillSword: 46009,
    skillHyperBall: 46010,
    skillCriticalChaser: 46011,
    skillPileBunker: 46012,
    skillSantansu: 46013,
    skillWhiteflash: 46014,
    skillWhiteflashSub: 46015,
    skillRapid: 46016,
    skillRing: 46017,
    skillSeondanil: 46018,
    skillSeondanilSub: 46019,
    skillHanjumeok: 46020,
    skillBoomerang: 46021,
    skillMoon: 46022,

    // group 2 skill
    skillKalnal: 46023,
    skillCogwheel: 46024,
    skillYeonsai: 46025,
    skillSabangtan: 46026,
    skillHabirant: 46027,
    skillHabirantSub: 46028,
    skillIcechaser: 46029,
    skillCalibur: 46030,
    skillCaliburSub: 46031,
    skillSujikpa: 46032,
    skillSpeaker: 46033,
    skillEomukggochi: 46034,
    skillEomukggochiSub: 46035,

    // round 2 donggrami skill
    skillR2Firecraker: 46036,
    skillR2Toyhammer: 46037,

    // round 3 X series skill, helljeon
    skillR3Xkill: 46038,
    skillR3Xshot: 46039,
    skillR3XshotSub: 46040,
    skillR3Xbeam: 46041,
    skillR3XbeamSub: 46042,
    skillR3Xboom: 46043,
    skillR3XboomSub: 46044,
    skillR3Helljeon: 46045,
  }

  /**
   * 적의 ID
   * 
   * 참고: xxxEnemy로 되어있는 변수들은 다른 적들이 그룹으로 묶여 있다는 뜻입니다.
   * 그래서 ID.enemy.xxxEnemy.square 와 같이 사용해야 합니다.
   * 
   * unused 같이 뒷글자가 Enemy로 끝나지 않으면, 내부 객체가 없습니다. 
   * 따라서 unused는 ID.enemy.unused로 사용해야 합니다.
   */
  static enemy = {
    START_ID: 20100,
    unused: 20100,
    test: 20001,
    testAttack: 20002,
    testShowDamageEnemy: 20003,
    spaceEnemy: {
      light: 20101,
      rocket: 20102,
      car: 20103,
      square: 20104,
      attack: 20105,
      energy: 20106,
      susong: 20107,
      gamjigi: 20108,
      comet: 20109,
      meteorite: 20110,
      boss: 20111,
      donggrami: 20112,
    },
    meteoriteEnemy: {
      class1: 20113,
      class2: 20114,
      class3: 20115,
      class4: 20116,
      whiteMeteo: 20117,
      blackMeteo: 20118,
      stone: 20119,
      stonePiece: 20120,
      bomb: 20121,
      bombBig: 20122,
      red: 20123,
    },
    jemulEnemy: {
      rotateRocket: 20125,
      energyBolt: 20126,
      hellSpike: 20127,
      hellDrill: 20128,
      hellAir: 20129,
      hellShip: 20130,
      boss: 20131,
      bossEye: 20132,
      redMeteorite: 20133,
      redMeteoriteImmortal: 20134,
      redAir: 20135,
      redShip: 20136,
      redJewel: 20137,
      blackSpaceRing: 20138,
    },
    donggramiEnemy: {
      miniBlue: 20140,
      miniGreen: 20141,
      miniRed: 20142,
      miniPurple: 20143,
      mini: 20144,
      miniArchomatic: 20145,
      miniAnother: 20146,
      exclamationMark: 20147,
      questionMark: 20148,
      emoji: 20149,
      talk: 20150,
      normal: 20151,
      strong: 20152,
      bossBig1: 20153,
      bossBig2: 20154,
      bounce: 20155,
      speed: 20156,
      talkShopping: 20157,
      fruit: 20158,
      juice: 20159,
      party: 20160,
      talkRunawayR2_4: 20161,
      talkParty: 20162,
      talkRuinR2_6: 20163,

      tree: 20164,
      leaf: 20165,

      // 라운드 2-3 전용
      a1_fighter: 20166,
      b1_bounce: 20167,
      a2_brick: 20168,
      a2_bomb: 20169,
      b2_mini: 20170,
      a3_collector: 20171,
      b3_mini: 20172,

      /** 라운드 3 전용 */ r3_getLost: 20173,
      /** 라운드 3 전용 */ r3_returnToMaeul: 20174,
    },
    intruder: {
      jemuBoss: 20175,
      jemuBossUltra: 20176,
      square: 20177,
      metal: 20178,
      diacore: 20179,
      rendown: 20180,
      lever: 20181,
      flying1: 20182,
      flying2: 20183,
      flyingRocket: 20184,
      gami: 20185,
      momi: 20186,
      hanoi: 20187,
      daseok: 20188,
      towerLaserMini: 20189,
    },
    towerEnemyGroup1: {
      moveBlue: 20190,
      moveViolet: 20191,
      moveDarkViolet: 20192,
      moveYellowEnergy: 20193,
      sandglass: 20194,
      tapo: 20195,
      punch: 20196,
      daepo: 20197,
      hellgi: 20198,
      helljeon: 20199,
      hellcho: 20200,
      hellba: 20201,
      hellgal: 20202,
      laserAlpha: 20203,
      laserMini: 20204,
      laserMini2: 20205,
      X: 20206,
      I: 20207,
      gasiUp: 20208,
      gasiDown: 20209,
      square: 20210,
      diamond: 20211,
      pentagon: 20212,
      hexagon: 20213,
      octagon: 20214,
      crazyRobot: 20215,
      squareMini: 20216,
      diamondMini: 20217,
      pentagonMini: 20218,
      hexagonMini: 20219,
      octagonMini: 20220,
      hellgrey: 20221,
      hellgreyBoss: 20222,
    },
    towerEnemyGroup2: {
      barYellow: 20223,
      barLime: 20224,
      barViolet: 20225,
      barOrange: 20226,
      barCyan: 20227,
      barGrey: 20228,
      barRandom: 20229,
      jagijang: 20230,
      lightning: 20231,
      magnet: 20232,
      hellla: 20233,
      hellpo: 20234,
      hellpa: 20235,
      hellna: 20236,
      pentaShadow: 20237,
      pentaLight: 20238,
      hexaShadow: 20239,
      hexaLight: 20240,
      octaShadow: 20241,
      octaLight: 20242,
      bossBar: 20243,
    },
    towerEnemyGroup3: {
      core8: 20244,
      corePotion: 20245,
      coreMetal: 20246,
      coreShot: 20247,
      coreRainbow: 20248,
      coreBrown: 20249,
      shipSmall: 20250,
      shipBig: 20251,
      star: 20252,
      fakeMove: 20253,
      fakeBar: 20254,
      fakeHell: 20255,
      fakeCore: 20256,
      fakeShip: 20257,
      bossDasu: 20258,
      clockAnalog: 20259,
      clockDigital: 20260,
      clockJong: 20261,
      energyBlue: 20262,
      energyOrange: 20263,
      energyA: 20264,
    },
    towerEnemyGroup4: {
      nokgasi1: 20265,
      nokgasi2: 20266,
      blackSpaceAnti: 20267,
      blackSpaceRed: 20268,
      blackSpaceGreen: 20269,
      blackSpaceTornado: 20270,
      blackSpaceArea: 20271,
      antijemulP3_1: 20272,
      antijemulP3_2: 20273,
      antijemulP4_1: 20274,
      antijemulP4_2: 20275,
      antijemulP4_3: 20276,
    },
    towerEnemyGroup5: {
      camera: 20277,
      cctv: 20278,
      radio: 20279,
      sirenRed: 20280,
      sirenGreen: 20281,
      sirenBlue: 20282,
      blub: 20283,
      hellnet: 20284,
      helltell: 20285,
      gabudan: 20286,
      trash1: 20287,
      trash2: 20288,
      trashWing: 20289,
      trashLotter: 20290,
      sujipgi: 20291,
      roller: 20292,
      cutter: 20293,
      vacuumCleaner: 20294,
      gamokBangpae: 20295,
      fakeHellgreyBoss: 20296,
    }
  }

  static round = {
    /** 사용 안함 */ UNUSED: 0,
    /** 이전 라운드 없음 */ PREVNULL: 0,
    test1Enemy: 70001,
    test2Background: 70002,
    test3Round3DownTower: 70003,
    testWeaponSkill: 70004,
    test4Sound: 70005,
    //
    round1_1: 70011,
    round1_2: 70012,
    round1_3: 70013,
    round1_4: 70014,
    round1_5: 70015,
    round1_6: 70016,
    //
    round2_1: 70017,
    round2_2: 70018,
    round2_3: 70019,
    round2_4: 70020,
    round2_5: 70021,
    round2_6: 70022,
    //
    round3_1: 70025,
    round3_2: 70026,
    round3_3: 70027,
    round3_4: 70028,
    round3_5: 70029,
    round3_6: 70030,
    round3_7: 70031,
    round3_8: 70032,
    round3_9: 70033,
    round3_10: 70034,
    round3_11: 70035,
    round3_12: 70036,
    //
    round4_1: 70040,
  }

  static equipment = {
    unused: 80000,
    standardPlusC1Blue: 80001,
    donggramiMugi: 80002,
    hellgiJangbi: 80003,
  }

  static item = {
    standardPlusC1Blue: 50000,
    donggramiMugi: 50001,
    hellgiJangbi: 50002,
    donggramiTicket: 36000,
    donggramiUSB: 36001,
    hellgiComponent: 36002,
    upgradeStone: 36003,
    boseokTest: 36004,
  }
}
deepFreeze(ID) // 절대로 ID를 수정하지 마