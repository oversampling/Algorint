import mongoose from "mongoose"

const Schema = mongoose.Schema;


const PostSchema = new Schema({
    title: String,
    description: String,
    isPublic: Boolean,
    publishDate: {
        type: Date,
        default: Date.now
    },
    stars: {
        type: Number,
        default: 0
    },
    assignments: [{
        type: Schema.Types.ObjectId,
        ref: "Assignment"
    }]
})

module.exports = mongoose.model("Post", PostSchema)
