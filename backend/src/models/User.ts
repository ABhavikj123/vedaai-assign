import bcrypt from "bcryptjs";
import { Schema, model, type HydratedDocument, type Model } from "mongoose";

export interface IUser {
  email: string;
  password: string;
  fullName: string;
  schoolName: string;
  schoolAddress: string;
  profileLogoUrl?: string;
  schoolLogoUrl?: string;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type IUserDocument = HydratedDocument<IUser, IUserMethods>;

type UserModel = Model<IUser, object, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email must be valid"]
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    schoolName: {
      type: String,
      required: true,
      trim: true
    },
    schoolAddress: {
      type: String,
      required: true,
      trim: true
    },
    profileLogoUrl: {
      type: String,
      default: "default_profile_logo"
    },
    schoolLogoUrl: {
      type: String,
      default: "default_school_logo"
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser, UserModel>("User", userSchema);
