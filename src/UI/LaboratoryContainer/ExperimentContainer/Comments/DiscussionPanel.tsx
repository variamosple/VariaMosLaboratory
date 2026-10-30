import { useComments } from "./CommentsContext";
import CommentThread, { CommentItem } from "./CommentThread";

/** LAB-COL-03: the whole discussion of the experiment, every element included, and comments on the experiment itself. */
export default function DiscussionPanel({ experimentId }: { experimentId: string }) {
    const state = useComments();
    if (!state) return null;
    const elsewhere = state.comments.filter((c) => c.targetType !== "experiment");

    return (
        <section className="experiment-card mt-4" aria-labelledby="discussion-title" id="discussion">
            <h5 id="discussion-title" className="mb-3">Discussion</h5>
            <CommentThread targetType="experiment" targetId={experimentId} title="the experiment" />
            {elsewhere.length > 0 && (
                <>
                    <h6 className="small fw-semibold mt-4">On scenarios, runs and results ({elsewhere.filter((c) => !c.deleted).length})</h6>
                    <ul className="list-group" aria-label="Comments on scenarios, runs and results">
                        {elsewhere.map((comment) => <CommentItem key={comment.id} comment={comment} showTarget />)}
                    </ul>
                </>
            )}
        </section>
    );
}
