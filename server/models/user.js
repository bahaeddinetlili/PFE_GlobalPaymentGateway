import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      require: true
    },
    email: {
      type: String,
      require: true
    },
    password: {
      type: String
    },
    token: {
      type: String
    },
    ProfilePhoto: {
      type: String
    },
    resetTokens: {
      type: String,
      default: ""
    },

    OTPReset: {
      type: String,
      default: null
    },

    verificationToken: {
      type: String,
      default: ""
    },
    Verified: {
      type: Boolean,
      default: false,
    },

  }
);
const User = mongoose.model("user", userSchema);
export { User };

