// Symbol polyfill
if (!window.Symbol) {
  window.Symbol = function(name) {
    return `__symbol:${String(name || '')}__${Math.random()}`
  }

  window.Symbol.iterator = window.Symbol('Symbol.iterator')
  window.Symbol.for = window.Symbol
}
