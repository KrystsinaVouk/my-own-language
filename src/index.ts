import Lexer from "./Lexer";
import Parser from "./Parser";

const code = `код РАВНО 5 МИНУС 9;
                КОНСОЛЬ код;
                сумма РАВНО 0 МИНУС 6;
                КОНСОЛЬ сумма;
                КОНСОЛЬ сумма МИНУС ( 5 ПЛЮС 3 );`

const lexer = new Lexer(code);

console.log(lexer.lexAnalysis());

const parser = new Parser(lexer.tokenList);

const rootNode = parser.parseCode()

parser.run(rootNode);
 /*   `код РАВНО 5 МИНУС 9;
    суммадва РАВНО 0 МИНУС 6;
    КОНСОЛЬ сумма;
    КОНСОЛЬ суммадва;
    КОНСОЛЬ сумма МИНУС суммадва ПЛЮС ( 5 ПЛЮС 3 );`*/
