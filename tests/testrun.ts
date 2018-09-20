import * as tsUnit from "../node_modules/tsUnit.external/tsUnit";
import * as pcombtests from "./test";


let tap = new tsUnit.Test(pcombtests).run().getTapResults();
console.log(tap);