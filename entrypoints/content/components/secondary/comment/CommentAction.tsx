// Packages:
import { useState } from "react";

// Typescript:
import { VoteCount } from "types/votes";
interface VoteCountProps {
  voteCount: VoteCount;
}

enum VoteStatus {
  UPVOTED = "UPVOTED",
  DOWNVOTED = "DOWNVOTED",
}

// Imports::
import {
  ArrowBigDown,
  ArrowBigUp,
  Ellipsis,
  Forward,
  MessageSquare,
} from "lucide-react";

const CommentAction: React.FC<VoteCountProps> = ({ voteCount: { up, down } }) => {
  const [voteCount, setVoteCount] = useState(0);
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>();

  useEffect(() => {
    setVoteCount(up - down);
  }, [up, down]);

  useEffect(() => {
    console.log(voteCount, voteStatus)
  }, [voteCount, voteStatus])

  // Maybe take all the states into one single object state
  const upvoteComment = () => {
    
    /**
     * if its already upvoted then turn off upvote and decrease vote count by 1
     */
    if (voteStatus === VoteStatus.UPVOTED) {
      setVoteStatus(null)
      setVoteCount(voteCount - 1)
      return
    }

    /**
     * if its downvoted then set votestatus to be upvoted and increase the votecount to be +2
     * to offset the votecount that was already decreased by 1 when it was downvoted
     */
    if (voteStatus === VoteStatus.DOWNVOTED) {
      setVoteStatus(VoteStatus.UPVOTED)
      setVoteCount(voteCount + 2)
      return
    }

    /**
     * if null: then simply increase the vote count and set votestatus to be upvoted
     */
    setVoteStatus(VoteStatus.UPVOTED);
    setVoteCount(voteCount + 1);
  };

  const downvoteComment = () => {
    // if its already downvoted then turn off downvote and increase votecount by 1
    if (voteStatus === VoteStatus.DOWNVOTED) {
      setVoteStatus(null)
      setVoteCount(voteCount + 1)
      return
    }

    /** 
     * if its already upvoted then set it to be downvoted and decrease votecount by 2 to offset 
     * the votecount that was already increased by 1 when it was upvoted
     * */ 
    if (voteStatus === VoteStatus.UPVOTED) {
      setVoteStatus(VoteStatus.DOWNVOTED)
      setVoteCount(voteCount - 2)
      return
    }

    /** 
     * if nothing simply set votestatus to be downvoted and decrease votecount by 1
     * */ 
    setVoteStatus(VoteStatus.DOWNVOTED);
    setVoteCount(voteCount - 1);
  };

  const isUpvoted = useMemo(
    () => voteStatus === VoteStatus.UPVOTED,
    [voteStatus]
  );
  const isDownvoted = useMemo(
    () => voteStatus === VoteStatus.DOWNVOTED,
    [voteStatus]
  );

  return (
    <div className="flex space-x-6 items-center pt-1 -ml-[px]">
      <div className="flex space-x-2 items-center">
        <ArrowBigUp
          size={18}
          fill={isUpvoted ? "green" : "currentColor"}
          color={isUpvoted ? "green" : "currentColor"}
          onClick={upvoteComment}
        />
        <p className="text-[12px]"> {voteCount} </p>
        <ArrowBigDown
          size={18}
          fill={isDownvoted ? "red" : "currentColor"}
          color={isDownvoted ? "red" : "currentColor"}
          onClick={downvoteComment}
        />
      </div>
      <div className="flex space-x-2 items-center">
        <MessageSquare size={14} />
        <p className="text-[13px]">Reply</p>
      </div>
      <div className="flex space-x-1 items-center">
        <Forward size={18} />
        <p className="text-[13px]">Share</p>
      </div>
      <div>
        <Ellipsis size={18} />
      </div>
    </div>
  );
};

// Exports:
export default CommentAction;
