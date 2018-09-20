/** Data that must be returned by each parser. */
export type ParseResult = [boolean, ParserInput, ParserOutput];
/** The required type of any function that will act as a parser. */
export type Parser = (input: ParserInput, output: ParserOutput, action?: ParserAction) => ParseResult;
/** The signature of a function that if provided will be run when a parser function 
 *  successfully matches. */
export type ParserAction = (matchedText: string, output: ParserOutput) => ParserOutput;

/** Must be implemented by the client-supplied object that holds data that is produced
 * by the parsing process. */
export interface ParserOutput {
    /** The text that was matched by the parser. */
    matched: Array<string>;
    copy(): ParserOutput;
}

/** Must be implemented by the client-supplied object that holds the input to be parsed. */
export interface ParserInput {
    /** What is the text that is being parsed? */
    text: string;
    copy(): ParserInput;
}

export class ParserSet {
    parsers: Array<Parser> = new Array<Parser>();
    inputObj: ParserInput;
    outputObj: ParserOutput;

    constructor(input: ParserInput, output: ParserOutput) {
        this.inputObj = input;
        this.outputObj = output;
    }

    add(parserApp: Parser): void {
        this.parsers.push(parserApp);
    }

    Parse(text: string): ParseResult {
        let result: ParseResult = [false, null, null];
        let parseIndex = 0;

        while (!result[0]) {
            let input = this.inputObj.copy();
            input.text = text;

            let output = this.outputObj.copy();
            result = this.parsers[parseIndex](input, output);
            parseIndex++;
        };

        return result;
    }
}

export function Parse(parser: Parser, text: string, inputObj: ParserInput, outputObj: ParserOutput): ParseResult {
    let input = inputObj.copy();
    input.text = text;

    let output = outputObj.copy();
    let result = parser(input, output);

    return result;
}

function lastMatched(output: ParserOutput): string {
    let foundMatch: string = null;

    if (output.matched.length > 0) {
        foundMatch = output.matched[output.matched.length - 1];
    }

    return foundMatch;
}

/** Execute all of the given parsers, in order, until one of them
     returns true. A matching parser terminates parsing immediately. */
export function or(parsers: Parser[], outerAction?: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let finalResult: ParseResult = [false, input.copy(), output.copy()];

        for (let i = 0; i < parsers.length; i++) {
            let result = parsers[i](input.copy(), output.copy());
            if (result[0]) { // Parsing successful, finish up and exit
                finalResult[0] = result[0];
                finalResult[1] = result[1];
                finalResult[2] = result[2];
                break;
            }
        }

        if (finalResult[0]) {
            if (outerAction) {
                finalResult[2] = outerAction(lastMatched(finalResult[2]), finalResult[2]);
            }
        }

        return finalResult;
    };
}

/** Execute all of the listed parsers, as long as the previous 
    parser returns true. A non-matching parser terminates
    parsing immediately. */
export function and(parsers: Parser[], outerAction?: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let result: ParseResult = [true, input.copy(), output.copy()];
        result[0] = true;

        let tryInput = input.copy();
        let tryOutput = output.copy();

        for (let i = 0; i < parsers.length; i++) {
            let tryParseResult = parsers[i](tryInput, tryOutput, action);

            if (!tryParseResult[0]) {
                result[0] = false;
                break;
            } else {
                tryInput = tryParseResult[1];
                tryOutput = tryParseResult[2];
            }
        }

        if (result[0]) { // All parsers finished successfully.
            result[1] = tryInput;
            result[2] = tryOutput;
            if (outerAction) {
                result[2] = outerAction(lastMatched(result[2]), result[2]);
            }


        }

        return result;
    };
}

/** Execute the given parser until it fails; return all matched characters as a single match. */
export function all(of: Parser, outerAction?: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let result: ParseResult = [false, input.copy(), output.copy()];

        let matched: string = "";
        let tempInput: ParserInput = input.copy();
        let tempOutput: ParserOutput = output.copy();
        let eachResult: ParseResult;

        do {
            eachResult = of(tempInput, tempOutput);
            if (eachResult[0]) {
                matched = matched.concat(lastMatched(eachResult[2]));
                tempInput = eachResult[1];
            }
        } while (eachResult[0]);

        if (matched.length > 0) {
            result[0] = true;
            result[1].text = input.text.slice(matched.length);
            result[2].matched.push(matched);

            if (outerAction) {
                result[2] = outerAction(matched, result[2]);
            }
        } else {
            result[0] = false;
        }

        return result;
    };
}

/** Greedily take any remaining input up to the match of an optionally-provided parser. */
export function any(upto: Parser, outerAction?: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let result: ParseResult;
        let matched: string;

        if (upto === null) {
            // upto was not provided, so just take everything
            result = [false, input.copy(), output.copy()];
            if (input.text.length > 0) {
                result[0] = true;
                result[1].text = "";
                result[2].matched.push(input.text);
                matched = input.text;
            }
        } else {
            // Try the remaining input, one character at a time until it is used up or the
            // input matches the provided parser.
            let i = -1;
            let remainingInput = input.copy();
            let tryOutput = output.copy();
            let tryResult: ParseResult;
            do {
                i++;
                remainingInput.text = remainingInput.text.slice(1);
                tryResult = upto(remainingInput, tryOutput);
            } while (i < input.text.length && tryResult[0] === false);

            tryOutput.matched.push(input.text.slice(0, i + 1));
            matched = input.text.slice(0, i + 1);
            result = [true, remainingInput, tryOutput];
        }

        if (action) {
            let newOutput = action(matched, result[2]);
            result[2] = newOutput;
        }

        if (outerAction) {
            let newOutput = outerAction(matched, result[2]);
            result[2] = newOutput;
        }

        return result;
    };
}

/** An optional parser always returns true, so it can never
    end parsing if it is missing. */
export function opt(optParser: Parser, outerAction?: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let result = optParser(input, output, action);
        if (result[0] === false) {
            result[1] = input;
            result[2] = output;
        } else {
            if (action) {
                // If it succeeded, we need to run the parser action
                let newOutput = action(output.matched[output.matched.length - 1], result[2]);
                result[2] = newOutput;
            }

            if (outerAction) {
                // If it succeeded, we need to run the parser action
                let newOutput = outerAction(output.matched[output.matched.length - 1], result[2]);
                result[2] = newOutput;
            }
        }

        result[0] = true; // Optional parsers alwasy succeed.

        return result;
    };
}

/** Run the given Parser. If the parse is successful, run the given ParserAction. */
export function apply(toParser: Parser, toApply: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let result = toParser(input.copy(), output.copy(), action);

        if (result[0]) {
            let applyOutput = toApply(lastMatched(result[2]), result[2].copy());
            result[2] = applyOutput;
        }

        return result;
    };
}

/** Run the given parser, and if it succeeds, check to see if the parsing consumed
 *  the entire available input. If not, fail.
 * Normally, parsing is lazy; that is, it can succeed even if there is unconsumed
 * input left. The exact combinator requires that all input be consumed by a 
 * successful parse.
 */
export function exact(toParser: Parser, outerAction: ParserAction) {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let result = toParser(input.copy(), output.copy(), action);

        if (result[0]) {
            if (result[1].text.length > 0) {
                result[0] = false;
                result[1] = input;
                result[2] = output;
            } else {
                if (outerAction) {
                    result[2] = outerAction(lastMatched(result[2]), result[2]);
                }
            }
        }

        return result;
    };
}

/** The lowest level of parsing: match a known string. Comparison is caseless. */
export function lit(text: string, outerAction?: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let result: ParseResult = [false, input.copy(), output.copy()];
        result[1].text = null;

        if (input.text.toLocaleLowerCase().indexOf(text.toLocaleLowerCase()) === 0) {
            result[0] = true;
            let unmatchedPart = input.text.substr(text.length);
            result[1].text = unmatchedPart;
            let matchedPart = input.text.substr(0, text.length);
            result[2].matched.push(matchedPart);

            if (action) {
                let newOutput = action(matchedPart, result[2]);
                result[2] = newOutput;
            }

            if (outerAction) {
                let newOutput = outerAction(matchedPart, result[2]);
                result[2] = newOutput;
            }
        }

        return result;
    };
}

/** Match a single numeric character. */
export function numeric(outerAction?: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let inCopy = input.copy();
        let outCopy = output.copy();
        let result: ParseResult = [false, inCopy, outCopy];
        let cur: string = input.text.slice(0, 1);
        let curAsNum: number = Number(cur);
        if (cur !== "" && !isNaN(curAsNum)) {
            result[0] = true;
            result[1].text = input.text.slice(1);
            result[2].matched.push(cur);
        }

        return result;
    };
}

/** Match a single whitespace character. */
export function whitespace(outerAction?: ParserAction): Parser {
    return (input: ParserInput, output: ParserOutput, action?: ParserAction): ParseResult => {
        let result: ParseResult = [false, input.copy(), output.copy()];

        if (input.text.length > 0) {
            let cur = input.text.slice(0, 1);
            if (" \t\n\r\v".indexOf(cur) > -1) {
                result[0] = true;
                result[1].text = result[1].text.slice(1);
                result[2].matched.push(cur);
            }
        }

        return result;
    };
}