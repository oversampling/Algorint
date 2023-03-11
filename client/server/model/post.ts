import mongoose, { Schema, Types } from "mongoose"

export interface IPost {
    title: string,
    description: string,
    isPublic: boolean,
    publishDate: Date,
    stars: number,
    assignments: [
        Types.ObjectId,
    ]
}

const PostSchema = new Schema<IPost>({
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
    assignments: [
        {type: Types.ObjectId, ref: "Assignment"}
    ]
})
PostSchema.index({'$**': 'text'});
const Post = mongoose.model<IPost>("Post", PostSchema)
export default Post
