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
    /** 사용되지 않는 id @deprecated */ unused: 0,
    /** 무기 번호를 가져올 때 사용(서브웨폰은 엉뚱한 번호를 가져온다.) 
     * 지금은 목적이 바뀌어서 같은 값을 가진 또다른 변수를 만들었습니다.
     *  @deprecated */ weaponNumberStart: 10000,
    /** 10000번 코드는 다른 무기를 넘어가기 위한 아이콘으로 대체됨 */ nextWeaponChangeButton: 10000,
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
    missileRocket: 41012,
    arrow: 41013,
    laser: 41014,
    laserBlue: 41015,
    sapia: 41016,
    sapiaShot: 41017,
    parapo: 41018,
    parapoShockWave: 41019,
    blaster: 41020,
    blasterMini: 41021,
    sidewave: 41022,
    rapid: 41024,
    ring: 41025,
    seondanil: 41026,
    boomerang: 41027,

    // group 2
    kalnal: 41028,
    cogwheel: 41029,
    yeonsai: 41030,
    sabangtan: 41031,

    // extend r3
    r3TowerPink: 41032,
    r3TowerPurple: 41033,
    r3Helljeon: 41034,

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
    skillWhiteflashSmoke: 46015,
    skillRapid: 46016,
    skillRing: 46017,
    skillSeondanil: 46018,
    skillSeondanilMini: 46019,
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
      class1: 20120,
      class2: 20121,
      class3: 20122,
      class4: 20123,
      whiteMeteo: 20124,
      blackMeteo: 20125,
      stone: 20130,
      stonePiece: 20131,
      bomb: 20134,
      bombBig: 20135,
      red: 20136,
    },
    jemulEnemy: {
      rotateRocket: 20140,
      energyBolt: 20141,
      hellSpike: 20142,
      hellDrill: 20143,
      hellAir: 20144,
      hellShip: 20145,
      boss: 20146,
      bossEye: 20147,
      redMeteorite: 20148,
      redMeteoriteImmortal: 20149,
      redAir: 20150,
      redShip: 20151,
      redJewel: 20152,
      blackSpaceRing: 20153,
    },
    donggramiEnemy: {
      miniBlue: 20170,
      miniGreen: 20171,
      miniRed: 20172,
      miniPurple: 20173,
      mini: 20174,
      miniArchomatic: 20175,
      miniAnother: 20176,
      exclamationMark: 20180,
      questionMark: 20181,
      emoji: 20182,
      talk: 20183,
      normal: 20184,
      strong: 20185,
      bossBig1: 20186,
      bossBig2: 20187,
      bounce: 20188,
      speed: 20189,
      talkShopping: 20190,
      fruit: 20191,
      juice: 20192,
      party: 20193,
      talkRunawayR2_4: 20194,
      talkParty: 20195,
      talkRuinR2_6: 20196,

      tree: 20197,
      leaf: 20198,

      // 라운드 2-3 전용
      a1_fighter: 20200,
      b1_bounce: 20201,
      a2_brick: 20202,
      a2_bomb: 20203,
      b2_mini: 20204,
      a3_collector: 20205,
      b3_mini: 20206,

      /** 라운드 3 전용 */ r3_getLost: 20355,
      /** 라운드 3 전용 */ r3_returnToMaeul: 20356,
    },
    intruder: {
      jemuBoss: 20210,
      jemuBossUltra: 20211,
      square: 20212,
      metal: 20213,
      diacore: 20214,
      rendown: 20215,
      lever: 20216,
      flying1: 20217,
      flying2: 20218,
      flyingRocket: 20219,
      gami: 20229,
      momi: 20230,
      hanoi: 20231,
      daseok: 20232,
      towerLaserMini: 20233,
    },
    towerEnemyGroup1: {
      moveBlue: 20240,
      moveViolet: 20242,
      moveDarkViolet: 20243,
      moveYellowEnergy: 20244,
      sandglass: 20245,
      tapo: 20246,
      punch: 20247,
      daepo: 20248,
      hellgi: 20249,
      helljeon: 20250,
      hellcho: 20251,
      hellba: 20252,
      hellgal: 20253,
      laserAlpha: 20254,
      laserMini: 20255,
      laserMini2: 20257,
      X: 20258,
      I: 20259,
      gasiUp: 20260,
      gasiDown: 20261,
      square: 20262,
      diamond: 20263,
      pentagon: 20264,
      hexagon: 20265,
      octagon: 20266,
      crazyRobot: 20267,
      squareMini: 20270,
      diamondMini: 20271,
      pentagonMini: 20272,
      hexagonMini: 20273,
      octagonMini: 20274,
      hellgrey: 20275,
      hellgreyBoss: 20276,
    },
    towerEnemyGroup2: {
      barYellow: 20277,
      barLime: 20278,
      barViolet: 20279,
      barOrange: 20280,
      barCyan: 20281,
      barGrey: 20282,
      barRandom: 20283,
      jagijang: 20284,
      lightning: 20285,
      magnet: 20286,
      hellla: 20287,
      hellpo: 20288,
      hellpa: 20289,
      hellna: 20290,
      pentaShadow: 20291,
      pentaLight: 20292,
      hexaShadow: 20293,
      hexaLight: 20294,
      octaShadow: 20295,
      octaLight: 20296,
      bossBar: 20297,
    },
    towerEnemyGroup3: {
      core8: 20300,
      corePotion: 20301,
      coreMetal: 20302,
      coreShot: 20303,
      coreRainbow: 20304,
      coreBrown: 20305,
      shipSmall: 20306,
      shipBig: 20307,
      star: 20308,
      fakeMove: 20309,
      fakeBar: 20310,
      fakeHell: 20311,
      fakeCore: 20312,
      fakeShip: 20313,
      bossDasu: 20314,
      clockAnalog: 20315,
      clockDigital: 20316,
      clockJong: 20317,
      energyBlue: 20318,
      energyOrange: 20319,
      energyA: 20320,
    },
    towerEnemyGroup4: {
      nokgasi1: 20321,
      nokgasi2: 20322,
      blackSpaceAnti: 20323,
      blackSpaceRed: 20324,
      blackSpaceGreen: 20325,
      blackSpaceTornado: 20326,
      blackSpaceArea: 20327,
      antijemulP3_1: 20328,
      antijemulP3_2: 20329,
      antijemulP4_1: 20330,
      antijemulP4_2: 20331,
      antijemulP4_3: 20332,
    },
    towerEnemyGroup5: {
      camera: 20335,
      cctv: 20336,
      radio: 20337,
      sirenRed: 20338,
      sirenGreen: 20339,
      sirenBlue: 20340,
      blub: 20341,
      hellnet: 20342,
      helltell: 20343,
      gabudan: 20344,
      trash1: 20345,
      trash2: 20346,
      trashWing: 20347,
      trashLotter: 20348,
      sujipgi: 20349,
      roller: 20350,
      cutter: 20351,
      vacuumCleaner: 20352,
      gamokBangpae: 20353,
      fakeHellgreyBoss: 20354,
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