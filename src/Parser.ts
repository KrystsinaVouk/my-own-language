import Token from "./Token";
import TokenType, {tokenTypesList} from "./TokenType";
import ExpressionNode from "./AST/ExpressionNode";
import StatementsNode from "./AST/StatementsNode";
import NumberNode from "./AST/NumberNode";
import VariableNode from "./AST/VariableNode";
import BinaryOperationNode from "./AST/BinaryOperationNode";
import UnaryOperationNode from "./AST/UnaryOperationNode";

export default class Parser {
    tokens: Token[];
    position: number = 0;
    scope: any = {};

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    match(...expected: TokenType[]): Token | null {
        if (this.position < this.tokens.length) {
            const currentToken = this.tokens[this.position];
            if (expected.find(tokenType => tokenType.name === currentToken.type.name)) {
                this.position += 1;
                return currentToken;
            }
        }
        return null;
    }

    require(...expected: TokenType[]): Token {
        const token = this.match(...expected);
        if (!token) {
            throw new Error(`There is a ${expected[0].name} required on the position ${this.position}`)
        }
        return token;
    }

    parseVariableOrNumber(): ExpressionNode {
        const number = this.match(tokenTypesList.NUMBER);
        if (number != null) {
            return new NumberNode(number);
        }

        const variable = this.match(tokenTypesList.VARIABLE);
        if (variable != null) {
            return new VariableNode(variable);
        }

        throw new Error(`There is a number or variable expected on the position ${this.position}`);
    }

    parseParentheses(): ExpressionNode {
        if (this.match(tokenTypesList.LPAR) != null) {
            const node = this.parseFormula();
            this.require(tokenTypesList.RPAR);
            return node;
        } else {
            return this.parseVariableOrNumber();
        }
    }

    parsePrint(): ExpressionNode {
        const operatorLog = this.match(tokenTypesList.LOG);
        if (operatorLog != null) {
            return new UnaryOperationNode(operatorLog, this.parseFormula());
        }
        throw new Error(`There is an operand LOG expected on the position : ${this.position}`);
    }

    parseFormula(): ExpressionNode {
        let leftNode = this.parseParentheses();
        let operator = this.match(tokenTypesList.MINUS, tokenTypesList.PLUS);
        while (operator != null) {
            const rightNode = this.parseParentheses();
            leftNode = new BinaryOperationNode(operator, leftNode, rightNode);
            operator = this.match(tokenTypesList.MINUS, tokenTypesList.PLUS);
        }
        return leftNode; // that forms or builds the entire subtree !
    }

    parseExpression(): ExpressionNode {
        if (this.match(tokenTypesList.VARIABLE) === null) {
            const printNode = this.parsePrint();
            return printNode; // it means there is CONSOLE
        }
        this.position -= 1;
        let variableNode = this.parseVariableOrNumber();
        const assignOperator = this.match(tokenTypesList.ASSIGN);
        if (assignOperator != null) {
            const rightFormulaNode = this.parseFormula();
            const binaryOperationNode = new BinaryOperationNode(assignOperator, variableNode, rightFormulaNode);
            return binaryOperationNode;
        }
        throw new Error(`There is an assign operator expected after the variable on the position ${this.position}`);
    }

    parseCode(): ExpressionNode {
        const root = new StatementsNode();

        while (this.position < this.tokens.length) {
            const codeStringNode = this.parseExpression();
            this.require(tokenTypesList.SEMICOLON);
            root.addNode(codeStringNode);
        }
        return root;
    }

    run(node: ExpressionNode): any {
        if (node instanceof NumberNode) {
            return parseInt(node.number.text);
        }
        if (node instanceof UnaryOperationNode) {
            switch (node.operator.type.name) {
                case tokenTypesList.LOG.name:
                    console.log(this.run(node.operand));
                    return;
            }
        }
        if (node instanceof BinaryOperationNode) {
            switch (node.operator.type.name) {
                case tokenTypesList.PLUS.name:
                    return this.run(node.leftNode) + this.run(node.rightNode)
                case tokenTypesList.MINUS.name:
                    return this.run(node.leftNode) - this.run(node.rightNode)
                case tokenTypesList.ASSIGN.name:
                    const result = this.run(node.rightNode)
                    const variableNode = <VariableNode>node.leftNode;
                    this.scope[variableNode.variable.text] = result;
                    return result;
            }
        }
        if (node instanceof VariableNode) {
            if (this.scope[node.variable.text]) {
                return this.scope[node.variable.text]
            } else {
                throw new Error(`The variable with the name ${node.variable.text} has been found`)
            }
        }
        if (node instanceof StatementsNode) {
            node.codeStrings.forEach(codeString => {
                this.run(codeString)
            });
            return;
        }
        throw new Error(`Error!`)
    }


}
