import mongoose, { Schema, Types } from "mongoose"

export interface IUser {
    googleId: string,
    refresh_token: string,
    starredPosts: [
        Types.ObjectId
    ],
    posts: [
        Types.ObjectId
    ]
}

const userSchema = new Schema({
    googleId: String,
    refresh_token: String,
    starredPosts: [
        {type: Types.ObjectId, ref: "Post"}
    ],
    posts: [
        {type: Types.ObjectId, ref: "Post"}
    ]
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
