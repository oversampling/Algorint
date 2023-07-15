require('dotenv').config()
import mongoose from 'mongoose';
import Post from '../model/post';
import Assignment from '../model/assignment';
import TestCase from '../model/test_case';
import posts from "./posts.json"

let mongo_uri = ""
if (!process.env.MONGO_USER) {
    mongo_uri = process.env.MONGO_URI || "mongodb://localhost:27017/algorint"
    mongoose.connect(mongo_uri).then(() => console.log('Mongodb Connected'));
}else{
    mongo_uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URI}:27017/algorint`
    mongoose.connect(mongo_uri, {
        ssl: true,
        retryWrites: false,
        replicaSet: 'rs0',
        readPreference: 'secondaryPreferred',
        sslValidate: true,
        sslCA: `./rds-combined-ca-bundle.pem`
    }).then(() => console.log('Mongodb Connected'));
}


async function seeds() {
    await Post.deleteMany({});
    await Assignment.deleteMany({});
    await TestCase.deleteMany({});
    for (let post of posts) {
        const newPost = new Post({
            title: post.title,
            description: btoa(post.description),
            isPublic: post.isPublic,
            publishDate: post.publishDate,
            stars: post.stars,
            assignments: []
        });
        for (let assignment of post.assignments) {
            const newAssignment = new Assignment({
                question: btoa(assignment.question),
                language: assignment.language || "python",
                code_template: btoa(assignment.code_template),
                test_cases: []
            });
            for (let test_case of assignment.test_cases) {
                const newTestCase = new TestCase({
                    stdin: btoa(test_case.stdin),
                    stdout: btoa(test_case.stdout),
                    replace: [],
                    isHidden: test_case.isHidden ? test_case.isHidden : true,
                    configuration: test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200}
                });
                for (let replace of test_case.replace) {
                    newTestCase.replace.push({
                        from: btoa(replace.from),
                        to: btoa(replace.to)
                    });
                }
                newAssignment.test_cases.push(newTestCase._id);
                await newTestCase.save();
            }
            await newAssignment.save();
            newPost.assignments.push(newAssignment._id);
        }
        await newPost.save();
    }
}

seeds().then(() => {
    console.log("Done")
    mongoose.connection.close()
}).catch((err) => {
    console.log(err)
    mongoose.connection.close()
})
