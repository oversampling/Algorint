import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface ITestCase {
    stdin: string,
    stdout: string,
    inject: {
        from: string,
        to: string,
    }
}

const TestCaseSchema = new Schema<ITestCase>({
    stdin: String,
    stdout: String,
    inject: {
        from: String,
        to: String,
    }
});

const TestCase = mongoose.model<ITestCase>("TestCase", TestCaseSchema);
export default TestCase;
