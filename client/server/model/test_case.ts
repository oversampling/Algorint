import mongoose from "mongoose";

const Schema = mongoose.Schema;

const TestCaseSchema = new Schema({
    stdin: String,
    stdout: String,
    inject: {
        from: String,
        to: String,
    }
});

module.exports = mongoose.model("TestCase", TestCaseSchema);
