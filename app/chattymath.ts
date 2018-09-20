/// <reference path="../typings/globals/jQuery/index" />

import * as pcomb from "../src/pcomb";
import * as tmpl from "./template";

enum MathOps {
    NotSet = 0,
    Add,
    Subtract,
    Multipy,
    Divide
}

class ChattyInput implements pcomb.ParserInput {
    text: string;
    copy(): pcomb.ParserInput {
        let newInput = new ChattyInput();
        newInput.text = this.text;

        return newInput;
    }
}

class ChattyData implements pcomb.ParserOutput {
    matched: string[];
    leftOperand: number;
    rightOperand: number;
    operator: MathOps;
    accumulator: number = 0;

    copy(): ChattyData {
        let newData = new ChattyData();
        if (newData.matched) {
            newData.matched = this.matched.slice();
        } else {
            newData.matched = Array<string>();
        }
        newData.leftOperand = this.leftOperand;
        newData.rightOperand = this.rightOperand;
        newData.operator = this.operator;
        newData.accumulator = this.accumulator;

        return newData;
    }
}

export class Chatty {
    formulaParser: pcomb.Parser;
    numericParser: pcomb.Parser;
    numberParser: pcomb.Parser;
    operandPlus: pcomb.Parser;
    operandMinus: pcomb.Parser;
    operandMultiply: pcomb.Parser;
    operandDivide: pcomb.Parser;
    operand: pcomb.Parser;
    singleDigitNumbers: pcomb.Parser;
    doubleDigitNumbersLessThen20: pcomb.Parser;
    tensIncrementNumbers: pcomb.Parser;
    englishNumbers: pcomb.Parser;
    space: pcomb.Parser;
    parsers: pcomb.ParserSet;
    translatedNumberSave: pcomb.ParserAction;

    private operandSet(matched: string, output: pcomb.ParserOutput): pcomb.ParserOutput {
        let result: ChattyData = <ChattyData>output.copy();

        switch (matched) {
            case "+":
            case "plus":
                result.operator = MathOps.Add;
                break;
            case "-":
            case "minus":
                result.operator = MathOps.Subtract;
                break;
            case "*":
            case "times":
                result.operator = MathOps.Multipy;
                break;
            case "/":
            case "divided by":
                result.operator = MathOps.Divide;
                break;
        }

        return result;
    }

    private numberSet(matched: string, output: pcomb.ParserOutput): ChattyData {
        let result: ChattyData = <ChattyData>output.copy();
        let matchedAsNumber: number = Number(matched);

        if (result.leftOperand == null) {
            result.leftOperand = matchedAsNumber;
        } else {
            result.rightOperand = matchedAsNumber;
        }

        return result;
    }

    private numberTranslate(matched: string, output: ChattyData): ChattyData {
        let result: ChattyData = output.copy();
        switch (matched.toLocaleLowerCase()) {
            case "one":
                result.accumulator += 1;
                break;
            case "two":
                result.accumulator += 2;
                break;
            case "three":
                result.accumulator += 3;
                break;
            case "four":
                result.accumulator += 4;
                break;
            case "five":
                result.accumulator += 5;
                break;
            case "six":
                result.accumulator += 6;
                break;
            case "seven":
                result.accumulator += 7;
                break;
            case "eight":
                result.accumulator += 8;
                break;
            case "nine":
                result.accumulator += 9;
                break;
            case "ten":
                result.accumulator += 10;
                break;
            case "eleven":
                result.accumulator += 11;
                break;
            case "twelve":
                result.accumulator += 12;
                break;
            case "thirteen":
                result.accumulator += 13;
                break;
            case "fourteen":
                result.accumulator += 14;
                break;
            case "fifteen":
                result.accumulator += 15;
                break;
            case "sixteen":
                result.accumulator += 16;
                break;
            case "seventeen":
                result.accumulator += 17;
                break;
            case "eighteen":
                result.accumulator += 18;
                break;
            case "nineteen":
                result.accumulator += 19;
                break;
            case "twenty":
                result.accumulator += 20;
                break;
            case "thirty":
                result.accumulator += 30;
                break;
            case "forty":
                result.accumulator += 40;
                break;
            case "fifty":
                result.accumulator += 50;
                break;
            case "sixty":
                result.accumulator += 60;
                break;
            case "seventy":
                result.accumulator += 70;
                break;
            case "eighty":
                result.accumulator += 80;
                break;
            case "ninety":
                result.accumulator += 90;
                break;
        }

        return result;
    }

    constructor() {
        this.translatedNumberSave = (matched: string, output: ChattyData) => {
            let accuStr: string = output.accumulator.toString();
            output.accumulator = 0;
            return this.numberSet(accuStr, output);
        };

        this.operandPlus = pcomb.or([pcomb.lit("+", this.operandSet),
        pcomb.lit("plus", this.operandSet)]);
        this.operandMinus = pcomb.or([pcomb.lit("-", this.operandSet),
        pcomb.lit("minus", this.operandSet)]);
        this.operandMultiply = pcomb.or([pcomb.lit("*", this.operandSet),
        pcomb.lit("times", this.operandSet)]);
        this.operandDivide = pcomb.or([pcomb.lit("/", this.operandSet),
        pcomb.lit("divided by", this.operandSet)]);

        this.operand = pcomb.or([this.operandPlus,
        this.operandMinus,
        this.operandMultiply,
        this.operandDivide]);

        this.singleDigitNumbers = pcomb.or([
            pcomb.lit("one"),
            pcomb.lit("two"),
            pcomb.lit("three"),
            pcomb.lit("four"),
            pcomb.lit("five"),
            pcomb.lit("six"),
            pcomb.lit("seven"),
            pcomb.lit("eight"),
            pcomb.lit("nine")
        ], this.numberTranslate);

        this.doubleDigitNumbersLessThen20 = pcomb.or([
            pcomb.lit("ten"),
            pcomb.lit("eleven"),
            pcomb.lit("twelve"),
            pcomb.lit("thirteen"),
            pcomb.lit("fourteen"),
            pcomb.lit("fifteen"),
            pcomb.lit("sixteen"),
            pcomb.lit("seventeen"),
            pcomb.lit("eighteen"),
            pcomb.lit("nineteen")
        ], this.numberTranslate);

        this.tensIncrementNumbers = pcomb.or([
            pcomb.lit("twenty"),
            pcomb.lit("thirty"),
            pcomb.lit("forty"),
            pcomb.lit("fifty"),
            pcomb.lit("sixty"),
            pcomb.lit("seventy"),
            pcomb.lit("eighty"),
            pcomb.lit("ninety")
        ], this.numberTranslate);

        this.space = pcomb.opt(pcomb.all(pcomb.whitespace()));
        this.numericParser = pcomb.all(pcomb.numeric(), this.numberSet);

        this.numberParser = pcomb.or([
            this.numericParser,
            pcomb.apply(this.doubleDigitNumbersLessThen20, this.translatedNumberSave),
            pcomb.apply(pcomb.and([
                this.tensIncrementNumbers,
                pcomb.or([pcomb.lit("-"), pcomb.whitespace()]),
                this.singleDigitNumbers
            ]), this.translatedNumberSave),
            pcomb.apply(this.tensIncrementNumbers, this.translatedNumberSave),
            pcomb.apply(this.singleDigitNumbers, this.translatedNumberSave)
        ]);

        this.formulaParser = pcomb.and([
            this.space,
            pcomb.opt(pcomb.lit("what does")),
            pcomb.opt(pcomb.lit("what is")),
            this.space,
            this.numberParser,
            this.space,
            this.operand,
            this.space,
            this.numberParser,
            this.space,
            pcomb.opt(pcomb.or([pcomb.lit("="), pcomb.lit("equal")]))]);

        this.parsers = new pcomb.ParserSet(new ChattyInput(), new ChattyData());
    }

    ask(text: string): string {
        let theAnswer = "sorry, but I couldn't understand that";
        let parseResult = pcomb.Parse(this.formulaParser, text, new ChattyInput(), new ChattyData());
        if (parseResult[0]) {
            let calc: number = NaN;
            let theData: ChattyData = <ChattyData>parseResult[2];

            switch (theData.operator) {
                case MathOps.Add:
                    calc = theData.leftOperand + theData.rightOperand;
                    break;
                case MathOps.Subtract:
                    calc = theData.leftOperand - theData.rightOperand;
                    break;
                case MathOps.Multipy:
                    calc = theData.leftOperand * theData.rightOperand;
                    break;
                case MathOps.Divide:
                    calc = theData.leftOperand / theData.rightOperand;
                    break;
            }

            theAnswer = `The answer is ${calc}`;
        }

        return theAnswer;
    }
}

let $ = jQuery;
let yourChatty = new Chatty();

$(document).ready(function () {
    $("#answerRequest").click(function (e) {
        e.preventDefault();
        let data = {
            "question": $("#question").val(),
            "answer": yourChatty.ask($("#question").val())
        };

        $("#answers").prepend(tmpl.tmpl("answerTemplate", data));
    });
});