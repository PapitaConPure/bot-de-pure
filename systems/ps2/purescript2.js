const { stringifyPSAST, logPSAST } = require('./debug.js');
const { Token } = require('./lexer/tokens.js');
const { Lexer } = require('./lexer/lexer.js');
const { Parser } = require('./parser/parser.js');
const { Interpreter } = require('./interpreter/interpreter.js');
const { Scope } = require('./interpreter/scope.js');
const { declareNatives, declareContext } = require('./commons.js');

module.exports = {
    stringifyPSAST,
    logPSAST,
    Token,
    Lexer,
    Parser,
    Interpreter,
    Scope,
    declareNatives,
    declareContext,
};
