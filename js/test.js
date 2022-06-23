class A {
  constructor () {
    this.a42 = 1
    this.b = 2
  }
}

class B {
  static a42 = 1
  static b = 2
}

class BX extends B {
  static a = 124
  static b = 227
}

class AX extends A {
  constructor () {
    this.a42 = 99
    this.b = 919
  }
}