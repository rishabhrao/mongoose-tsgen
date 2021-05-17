/* tslint:disable */
/* eslint-disable */

// ######################################## THIS FILE WAS GENERATED BY MONGOOSE-TSGEN ######################################## //

// NOTE: ANY CHANGES MADE WILL BE OVERWRITTEN ON SUBSEQUENT EXECUTIONS OF MONGOOSE-TSGEN.

import mongoose from "mongoose";

/**
 * Lean version of UserFriendDocument
 * 
 * This has all Mongoose getters & functions removed. This type will be returned from `UserDocument.toObject()`.
 * ```
 * const userObject = user.toObject();
 * ```
 */
export interface UserFriend {
uid: User["_id"] | User;
nickname?: string;
_id: mongoose.Types.ObjectId;
}

/**
 * Lean version of UserCitySubdocWithoutDefaultDocument
 * 
 * This has all Mongoose getters & functions removed. This type will be returned from `UserDocument.toObject()`.
 * ```
 * const userObject = user.toObject();
 * ```
 */
export interface UserCitySubdocWithoutDefault {
a?: string;
_id: mongoose.Types.ObjectId;
}

/**
 * Lean version of UserDocument (type alias of `User`)
 * 
 * Use this type alias to avoid conflicts with model names:
 * ```
 * import { User } from "../models"
 * import { UserObject } from "../interfaces/mongoose.gen.ts"
 * 
 * const userObject: UserObject = user.toObject();
 * ```
 */
export type UserObject = User

/**
 * Mongoose Query types
 * 
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const User = mongoose.model<UserDocument, UserModel, UserQueries>("User", UserSchema);
 * ```
 */
export type UserQueries = {
populateFriends: <Q extends mongoose.Query<any, UserDocument, any>>(this: Q) => Q;
}

export type UserMethods = {
isMetadataString: (this: UserDocument) => boolean;
}

export type UserStatics = {
getFriends: (this: UserModel, friendUids: UserDocument["_id"][]) => Promise<UserObject[]>;
}

/**
 * Mongoose Model type
 * 
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const User = mongoose.model<UserDocument, UserModel, UserQueries>("User", UserSchema);
 * ```
 */
export interface UserModel extends mongoose.Model<UserDocument, UserQueries>, UserStatics {}

/**
 * Mongoose Schema type
 * 
 * Assign this type to new User schema instances:
 * ```
 * const UserSchema: UserSchema = new mongoose.Schema({ ... })
 * ```
 */
export type UserSchema = mongoose.Schema<UserDocument, UserModel>

/**
 * Lean version of UserDocument
 * 
 * This has all Mongoose getters & functions removed. This type will be returned from `UserDocument.toObject()`. To avoid conflicts with model names, use the type alias `UserObject`.
 * ```
 * const userObject = user.toObject();
 * ```
 */
export interface User {
email: string;
firstName: string;
lastName: string;
metadata?: any;
bestFriend?: User["_id"] | User;
friends: UserFriend[];
city: {
coordinates: number[];
subdocWithoutDefault?: UserCitySubdocWithoutDefault[];
};
tags: string[];
alternateObjectId?: mongoose.Types.ObjectId;
socialMediaHandles?: Map<string, string>;
arrayOfMaps: (Map<string, number>)[];
buffer: Buffer;
bufferString?: Buffer;
bufferSchemaType?: Buffer;
decimal128?: number;
otherDecimal128?: number;
numberString?: number;
stringString?: string;
otherNumberString: number;
otherStringString: string;
_id: mongoose.Types.ObjectId;
}

/**
 * Mongoose Embedded Document type
 * 
 * Type of `UserDocument["friends"]` element.
 */
export interface UserFriendDocument extends mongoose.Types.EmbeddedDocument {
uid: UserDocument["_id"] | UserDocument;
nickname?: string;
_id: mongoose.Types.ObjectId;
}

/**
 * Mongoose Embedded Document type
 * 
 * Type of `UserDocument["city.subdocWithoutDefault"]` element.
 */
export interface UserCitySubdocWithoutDefaultDocument extends mongoose.Types.EmbeddedDocument {
a?: string;
_id: mongoose.Types.ObjectId;
}

/**
 * Mongoose Document type
 * 
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const User = mongoose.model<UserDocument, UserModel, UserQueries>("User", UserSchema);
 * ```
 */
export interface UserDocument extends mongoose.Document<mongoose.Types.ObjectId, UserQueries>, UserMethods {
email: string;
firstName: string;
lastName: string;
metadata?: any;
bestFriend?: UserDocument["_id"] | UserDocument;
friends: mongoose.Types.DocumentArray<UserFriendDocument>;
city: {
coordinates: mongoose.Types.Array<number>;
subdocWithoutDefault?: mongoose.Types.DocumentArray<UserCitySubdocWithoutDefaultDocument>;
};
tags: mongoose.Types.Array<string>;
alternateObjectId?: mongoose.Types.ObjectId;
socialMediaHandles?: mongoose.Types.Map<string>;
arrayOfMaps: mongoose.Types.Array<mongoose.Types.Map<number>>;
buffer: mongoose.Types.Buffer;
bufferString?: mongoose.Types.Buffer;
bufferSchemaType?: mongoose.Types.Buffer;
decimal128?: mongoose.Types.Decimal128;
otherDecimal128?: mongoose.Types.Decimal128;
numberString?: number;
stringString?: string;
otherNumberString: number;
otherStringString: string;
_id: mongoose.Types.ObjectId;
name: string;
}

/**
* Populate properties on a document type:
* ```
* import { PopulatedDocument } from "../interfaces/mongoose.gen.ts"
* 
* function example(user: PopulatedDocument<UserDocument, "bestFriend">) {
*   console.log(user.bestFriend) // this will be typed as UserDocument rather than mongoose.Types.ObjectId
* }
* ```
*/
export type PopulatedDocument<DocType extends mongoose.Document, T extends keyof DocType> = Omit<DocType, T> & { [ref in T]: Exclude<DocType[T], mongoose.Types.ObjectId> }

/**
 * Check if a property on a document is populated:
 * ```
 * import { IsPopulated } from "../interfaces/mongoose.gen.ts"
 * 
 * if (IsPopulated<UserDocument["bestFriend"]>) { ... }
 * ```
 */
export function IsPopulated<T>(doc: T | mongoose.Types.ObjectId): doc is T {
  return doc instanceof mongoose.Document;
}

/**
* Helper types for unwrapping an array type &and  modifying an interface property, used by the populate overloads
*/
type Unarray<T> = T extends Array<infer U> ? U : T;
type Modify<T, R> = Omit<T, keyof R> & R;

type T0 = Exclude<"a" & "b" & "c", "a">;

/**
* Augment mongoose with Query.populate overloads
*/
declare module "mongoose" {
 interface Query<ResultType, DocType extends Document, THelpers = {}> {
  //  populate<T extends keyof DocType>(path: T, select?: string | any, model?: string | Model<any>, match?: any): Query<ResultType extends Array<DocType> ? Array<PopulatedDocument<Unarray<ResultType>, T>> : PopulatedDocument<DocType, T>, DocType, THelpers>
      
   populate<T extends keyof DocType>(
    path: T,
    select?: string | any,
    model?: string | Model<any, THelpers>,
    match?: any
  ): Query<
    ResultType extends Array<DocType>
      ? Array<PopulatedDocument<Unarray<ResultType>, T>>
      : (ResultType extends DocType 
        ? PopulatedDocument<Unarray<ResultType>, T> 
        : ResultType),
    DocType,
    THelpers
  >;

  populate<T extends keyof DocType>(
    options: Modify<PopulateOptions, { path: T }> | Array<PopulateOptions>
    ): Query<
      ResultType extends Array<DocType> 
        ? Array<PopulatedDocument<Unarray<ResultType>, T>> 
        : (ResultType extends DocType ? PopulatedDocument<ResultType, T> : ResultType),
      DocType, 
      THelpers
    >;
 }
}

