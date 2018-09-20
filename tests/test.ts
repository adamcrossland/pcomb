import * as tsUnit from "../node_modules/tsUnit.external/tsUnit";
import * as pcomb from "../src/pcomb";

class TestInput implements pcomb.ParserInput {
    text: string;
    copy(): TestInput {
        let copy = new TestInput();
        copy.text = this.text;

        return copy;
    }
}

class TestOutput implements pcomb.ParserOutput {
    matched: Array<string>;
    copy(): TestOutput {
        let copy = new TestOutput();
        copy.matched = this.matched.slice(0);
        copy.name = this.name;
        copy.containsWhitespace = this.containsWhitespace;

        return copy;
    }

    name: string;
    containsWhitespace: boolean;

    constructor() {
        this.matched = [];
        this.name = "";
        this.containsWhitespace = false;
    }
}

export class PCombTests extends tsUnit.TestClass {
    private parsers: pcomb.ParserSet;

    private litName: pcomb.Parser;
    private litValue: pcomb.Parser;
    private litValueOther: pcomb.Parser;
    private litColon: pcomb.Parser;
    private litSemicolon: pcomb.Parser;
    private litSpace: pcomb.Parser;
    private nameValuePair: pcomb.Parser;
    private nameValuePair2: pcomb.Parser;
    private eitherNameValuePair: pcomb.Parser;
    private allStoreName: pcomb.Parser;
    private optWsParser: pcomb.Parser;
    private optParser: pcomb.Parser;
    private anyParser1: pcomb.Parser;
    private anyParser2: pcomb.Parser;
    private numericParser: pcomb.Parser;
    private numericSequence: pcomb.Parser;
    private storeNameValue: (matched: string, output: TestOutput) => TestOutput;
    private recordWhitespace: (matched: string, output: TestOutput) => TestOutput;
    private dumbGrabber: (matched: string, output: TestOutput) => TestOutput;
    private nameTranslator: (matched: string, output: TestOutput) => TestOutput;
    private lastMatchIsName: (matched: string, output: TestOutput) => TestOutput;

    constructor() {
        super();
        this.parsers = new pcomb.ParserSet(new TestInput(), new TestOutput());
    }

    setUp() {
        this.litName = pcomb.lit("name");
        this.litValue = pcomb.lit("value");
        this.litValueOther = pcomb.lit("othervalue");
        this.litColon = pcomb.lit(":");
        this.litSemicolon = pcomb.lit(";");
        this.litSpace = pcomb.lit(" ");
        this.optWsParser = pcomb.opt(this.litSpace);
        this.allStoreName = pcomb.any(null, this.storeNameValue);
        this.nameValuePair = pcomb.and([this.litName, this.litColon, this.litValue], this.lastMatchIsName);
        this.eitherNameValuePair = pcomb.or([this.litValue, this.litValueOther], this.dumbGrabber);
        this.nameValuePair2 = pcomb.and([this.litName, this.litColon, this.eitherNameValuePair]);
        this.optParser = pcomb.and([
            this.litName, this.optWsParser, this.litColon,
            this.optWsParser, this.litValue]);
        this.anyParser1 = pcomb.and([this.litName, this.litColon, this.allStoreName]);
        this.anyParser2 = pcomb.and([this.litName, this.litColon, pcomb.any(this.litSemicolon), this.litSemicolon]);
        this.numericParser = pcomb.numeric();
        this.numericSequence = pcomb.all(this.numericParser);

        // Declare functions that are used in testing in this way to prevent tsUnit from throwing errors
        // related to them.
        this.storeNameValue = function (matched: string, output: TestOutput) {
            let newOutput = output.copy();
            newOutput.name = matched;

            return newOutput;
        };

        this.recordWhitespace = function (matched: string, output: TestOutput): TestOutput {
            let newOutput = output.copy();
            newOutput.containsWhitespace = true;

            return newOutput;
        };

        this.dumbGrabber = function (matched: string, output: TestOutput): TestOutput {
            let newOutput = output.copy();
            newOutput.name = matched;

            return newOutput;
        };

        this.nameTranslator = function (matched: string, output: TestOutput): TestOutput {
            let newOutput = output.copy();
            if (matched === "adam") {
                newOutput.name = "Adam C";
            } else {
                newOutput.name = matched;
            }

            return newOutput;
        };

        this.lastMatchIsName = function (matched: string, output: TestOutput): TestOutput {
            let newOutput = output.copy();
            newOutput.name = output.matched[output.matched.length - 1];

            return newOutput;
        };
    }

    setTest() {
        let set = new pcomb.ParserSet(new TestInput(), new TestOutput());
        set.add(pcomb.exact(this.litName, null));
        set.add(this.nameValuePair);
        set.add(this.numericSequence);

        let result = set.Parse("name:value");
        this.isTrue(result[0]);
        this.areIdentical(result[2].matched.length, 3);
        this.areIdentical(result[2].matched[0], "name");
        this.areIdentical(result[2].matched[1], ":");
        this.areIdentical(result[2].matched[2], "value");

        result = set.Parse("1234Hello!");
        this.isTrue(result[0]);
        this.areIdentical(result[1].text, "Hello!");
        this.areIdentical(result[2].matched.length, 1);
        this.areIdentical(result[2].matched[0], "1234");

        result = set.Parse("name");
        this.isTrue(result[0]);
        this.areIdentical(result[2].matched.length, 1);
        this.areIdentical(result[2].matched[0], "name");
    }

    litTest1() {
        let tryResult = pcomb.Parse(this.litName, "name", new TestInput(), new TestOutput());

        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 1);
        this.areIdentical(tryResult[2].matched[0], "name");
    }

    litTest2() {
        let tryResult = pcomb.Parse(this.litName, "NAME", new TestInput(), new TestOutput());

        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 1);
        this.areIdentical(tryResult[2].matched[0], "NAME");
    }

    litTest3() {
        let tryResult = pcomb.Parse(this.litName, "Foobar", new TestInput(), new TestOutput());

        this.isFalse(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 0);
    }

    andTest1() {
        let tryResult = pcomb.Parse(this.nameValuePair, "name:value", new TestInput(), new TestOutput());
        let resultAsTest: TestOutput = <TestOutput>tryResult[2];

        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "value");
        this.areIdentical(resultAsTest.name, "value");
    }

    orTest1() {
        let tryResult = pcomb.Parse(this.nameValuePair2, "name:value", new TestInput(), new TestOutput());
        let resultAsTest: TestOutput = <TestOutput>tryResult[2];

        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "value");
        this.areIdentical(resultAsTest.name, "value");

        tryResult = pcomb.Parse(this.nameValuePair2, "name:othervalue", new TestInput(), new TestOutput());
        resultAsTest = <TestOutput>tryResult[2];

        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "othervalue");
        this.areIdentical(resultAsTest.name, "othervalue");
    }

    optTest() {
        let tryResult1 = pcomb.Parse(this.optParser, "name:value", new TestInput(), new TestOutput());
        this.isTrue(tryResult1[0]);
        this.areIdentical(tryResult1[2].matched.length, 3);
        this.areIdentical(tryResult1[2].matched[0], "name");
        this.areIdentical(tryResult1[2].matched[1], ":");
        this.areIdentical(tryResult1[2].matched[2], "value");

        let tryResult2 = pcomb.Parse(this.optParser, "name : value", new TestInput(), new TestOutput());
        this.isTrue(tryResult2[0]);
        this.areIdentical(tryResult2[2].matched.length, 5);
        this.areIdentical(tryResult2[2].matched[0], "name");
        this.areIdentical(tryResult2[2].matched[1], " ");
        this.areIdentical(tryResult2[2].matched[2], ":");
        this.areIdentical(tryResult2[2].matched[3], " ");
        this.areIdentical(tryResult2[2].matched[4], "value");

        let tryResult3 = pcomb.Parse(this.optParser, "name :value", new TestInput(), new TestOutput());
        this.isTrue(tryResult3[0]);
        this.areIdentical(tryResult3[2].matched.length, 4);
        this.areIdentical(tryResult3[2].matched[0], "name");
        this.areIdentical(tryResult3[2].matched[1], " ");
        this.areIdentical(tryResult3[2].matched[2], ":");
        this.areIdentical(tryResult3[2].matched[3], "value");
    }

    anyTest1() {
        let tryResult = pcomb.Parse(this.anyParser1, "name:adam", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "adam");
    }

    anyTest2() {
        let tryResult = pcomb.Parse(this.anyParser2, "name:adam;", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 4);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "adam");
        this.areIdentical(tryResult[2].matched[3], ";");
    }

    actionAnyTest() {
        let testParser = pcomb.and([
            this.litName,
            this.litColon,
            pcomb.any(this.litSemicolon, this.storeNameValue),
            this.litSemicolon]
        );

        let tryResult = pcomb.Parse(testParser, "name:adamC;", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 4);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "adamC");
        let foo: TestOutput = <TestOutput>tryResult[2];
        this.areIdentical(foo.name, "adamC");
    }

    actionLitTest() {
        let altParser = pcomb.and([
            this.litName,
            this.litColon,
            pcomb.lit("adam", this.dumbGrabber)]
        );

        let tryResult = pcomb.Parse(altParser, "name:adam", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "adam");
        let foo: TestOutput = <TestOutput>tryResult[2];
        this.areIdentical(foo.name, "adam");
    }

    actionOptTest() {
        let wsParser = pcomb.opt(this.litSpace, this.recordWhitespace);
        let testParser = pcomb.and([
            this.litName,
            wsParser,
            this.litColon,
            wsParser,
            this.litValue]
        );

        let tryResult1 = pcomb.Parse(testParser, "name : value", new TestInput(), new TestOutput());
        this.isTrue(tryResult1[0]);
        this.areIdentical(tryResult1[2].matched.length, 5);
        this.areIdentical(tryResult1[2].matched[0], "name");
        this.areIdentical(tryResult1[2].matched[1], " ");
        this.areIdentical(tryResult1[2].matched[2], ":");
        this.areIdentical(tryResult1[2].matched[3], " ");
        this.areIdentical(tryResult1[2].matched[4], "value");
        let foo: TestOutput = <TestOutput>tryResult1[2];
        this.isTrue(foo.containsWhitespace);

        // And a negative test
        let tryResult2 = pcomb.Parse(testParser, "name:value", new TestInput(), new TestOutput());
        this.isTrue(tryResult2[0]);
        this.areIdentical(tryResult2[2].matched.length, 3);
        this.areIdentical(tryResult2[2].matched[0], "name");
        this.areIdentical(tryResult2[2].matched[1], ":");
        this.areIdentical(tryResult2[2].matched[2], "value");
        foo = <TestOutput>tryResult2[2];
        this.isFalse(foo.containsWhitespace);
    }

    allTest() {
        let tryResult = pcomb.Parse(this.numericSequence, "1234Hello!", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[1].text, "Hello!");
        this.areIdentical(tryResult[2].matched.length, 1);
        this.areIdentical(tryResult[2].matched[0], "1234");
    }

    applyTest1() {
        let tryResult = pcomb.Parse(pcomb.apply(this.anyParser1, this.nameTranslator), "name:adam",
            new TestInput(), new TestOutput());
        let tryOutput: TestOutput = <TestOutput>tryResult[2];

        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[1].text.length, 0);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "adam");
        this.areIdentical(tryOutput.name, "Adam C");
    }

    applyTest2() {
        let tryResult = pcomb.Parse(pcomb.apply(this.anyParser1, this.nameTranslator), "name:bob",
            new TestInput(), new TestOutput());
        let tryOutput: TestOutput = <TestOutput>tryResult[2];

        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[1].text.length, 0);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "bob");
        this.areIdentical(tryOutput.name, "bob");
    }

    wsTest() {
        let tryParser = pcomb.all(pcomb.whitespace());
        let tryResult = pcomb.Parse(tryParser, "   ", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[1].text.length, 0);
        this.areIdentical(tryResult[2].matched.length, 1);
        this.areIdentical(tryResult[2].matched[0].length, 3);

        tryParser = pcomb.and([this.litName, pcomb.whitespace(), this.litValue]);
        tryResult = pcomb.Parse(tryParser, "name value", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[1].text.length, 0);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1].length, 1);
        this.areIdentical(tryResult[2].matched[2], "value");

        tryResult = pcomb.Parse(tryParser, "name\tvalue", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[1].text.length, 0);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1].length, 1);
        this.areIdentical(tryResult[2].matched[2], "value");

        tryParser = pcomb.and([this.litName, pcomb.all(pcomb.whitespace()), this.litValue]);
        tryResult = pcomb.Parse(tryParser, "name\n \t\v \rvalue", new TestInput(), new TestOutput());
        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[1].text.length, 0);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1].length, 6);
        this.areIdentical(tryResult[2].matched[2], "value");
    }

    exactTest() {
        let exactParser: pcomb.Parser = pcomb.exact(this.nameValuePair, this.lastMatchIsName);
        let tryResult = pcomb.Parse(exactParser, "name:value", new TestInput(), new TestOutput());
        let resultAsTest: TestOutput = <TestOutput>tryResult[2];

        this.isTrue(tryResult[0]);
        this.areIdentical(tryResult[2].matched.length, 3);
        this.areIdentical(tryResult[2].matched[0], "name");
        this.areIdentical(tryResult[2].matched[1], ":");
        this.areIdentical(tryResult[2].matched[2], "value");
        this.areIdentical(resultAsTest.name, "value");

        tryResult = pcomb.Parse(exactParser, "name:value;", new TestInput(), new TestOutput());
        this.isFalse(tryResult[0]);
    }
}

