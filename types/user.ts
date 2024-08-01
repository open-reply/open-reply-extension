// Imports:
import { Comment, Reply } from './comments-and-replies'

// Exports:
/**
 * The UID uniquely identifies a user on the **OpenReply** platform.
 * 
 * It is generated by Firebase Authentication.
 */
export type UID = string

/**
 * The `FlatComment` interface is a partial copy of the `Comment` interface.
 */
export interface FlatComment extends Pick<Comment, 'id' | 'URLHash' | 'URL' | 'domain'> {}

/**
 * The `FlatReply` interface is a partial copy of the `Reply` interface.
 */
export interface FlatReply extends Pick<Reply, 'id' | 'commentID' | 'URLHash' | 'URL' | 'domain'> {}
