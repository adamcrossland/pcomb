# PComb
## A parser combinator library written in TypeScript
A collection of general and specific-purpose parsers that can be composed with combinator functions to very powerful effect.
### Parsers
A parser is a function that takes a **ParserInput**, a **ParserOutput** and returns a **ParseResult**.
#### ParseResult
A **ParseResult** is a three-element tuple with these values:

1. a **boolean** that indicates if the parser successfully matched the input 

2. a copy of the **ParserInput** object that was passed in with any matched test removed from the text property

3. a copy of the **ParserOutput** object that was passed in with any matched text appended to the matched array

#### ParserInput
The code that uses PComb must provide input to the library with a class that implements the **ParserInput** interface:
```
export interface ParserInput {
     /** What is the text that is being parsed? */
     text: string;
     copy(): ParserInput;
 }
 ```

 #### ParserOutput
 Similarly to **ParserInput**, a class that implements **ParserOutput** is provided by the calling code to record the units of text that have been matched by individual parser as well to record any state that is specific to the particular use:
 ```
 export interface ParserOutput {
     /** The text that was matched by the parser. */
     matched: Array<string>;
     copy(): ParserOutput;
 }
 ```

### Combinators
A combinator is a higher-order function that takes one or more **Parser** functions as input and produces a new function that wraps and executes them in some particular way.
+ or -- matches one of a list of parsers. After one Parser matches the input, the or exits with a success result.
+ and -- match all of the listed parsers in order. If one fails to match, the and exits with a failure result.
+ opt -- optionally match a parser; always produces a success result.
+ all -- match the given single parser until matching fails; return all matches as a single match. If the given Parser does not match at least once, returns a failure result.
+ any -- collect all input as a single match up to the point that the provided parser matches. Always successful.
+ exact -- require that the given parser consume all available input; otherwise, parsing fails.
+ apply -- execute the given ParserAction if the given parser succeeds.

### ParserAction
A **ParserAction** is a function that takes a string of matched characters and a **ParserOutput** and returns a **ParserOutput**:
```
export type ParserAction = (matchedText: string, output: ParserOutput) => ParserOutput;
```
If such a function is provided to a Parser, it will be executed on a successful match. The returned **ParserOutput** object then becomes the return value for the Parser. This mechanism allows calling code to have use-specific state that is recorded and mutated on parser matching.

### Using PComb
There's pretty decent documentation available for PComb. Take a look at the [Getting Started](https://chiselapp.com/user/acrossland/repository/pcomb/wiki?name=Getting+Started) page and the [API Reference](https://chiselapp.com/user/acrossland/repository/pcomb/wiki?name=API+Reference).

Also, the source repo has extensive automated tests and a somewhat complex example application to look at to see how it works in practice.
