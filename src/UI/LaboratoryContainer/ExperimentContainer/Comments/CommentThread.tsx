import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useSession } from "@variamosple/variamos-components";
import { CommentTargetType, ExperimentComment } from "../../../../Domain/Laboratory/Entities/Comment";
import { useComments } from "./CommentsContext";

const when = (value: string | null) => (value ? new Date(value).toLocaleString() : "");

export function CommentItem({ comment, showTarget = false }: { comment: ExperimentComment; showTarget?: boolean }) {
    const state = useComments();
    const { user } = useSession();
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(comment.body ?? "");
    const mine = comment.author === user?.id;

    return (
        <li className="list-group-item small" aria-label={`Comment by ${comment.authorName ?? comment.author}`}>
            <div className="d-flex justify-content-between gap-2">
                <span>
                    <strong>{comment.authorName ?? comment.author}</strong>
                    <span className="text-muted"> · {when(comment.createdAt)}{comment.editedAt ? " · edited" : ""}</span>
                    {showTarget && <span className="badge bg-light text-dark border ms-2">{comment.targetLabel}</span>}
                </span>
                {!comment.deleted && !editing && (
                    <span className="d-flex gap-1">
                        {mine && <Button size="sm" variant="link" className="p-0" onClick={() => setEditing(true)}>Edit</Button>}
                        {(mine || state?.canModerate) && (
                            <Button size="sm" variant="link" className="p-0 text-danger" onClick={() => state?.remove(comment.id)}>Delete</Button>
                        )}
                    </span>
                )}
            </div>
            {comment.deleted ? (
                <em className="text-muted">Comment deleted.</em>
            ) : editing ? (
                <Form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (await state?.edit(comment.id, text)) setEditing(false);
                    }}
                >
                    <Form.Control as="textarea" rows={2} value={text} onChange={(e) => setText(e.target.value)} aria-label="Edit the comment" />
                    <div className="d-flex gap-2 mt-1">
                        <Button size="sm" type="submit" disabled={!text.trim()}>Save</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                </Form>
            ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>{comment.body}</div>
            )}
        </li>
    );
}

type CommentThreadProps = {
    targetType: CommentTargetType;
    targetId: string;
    metricId?: string | null;
    /** Shown above the thread and in the input label. */
    title: string;
};

/** LAB-COL-03: the comments on one element, and a box to add one. */
export default function CommentThread({ targetType, targetId, metricId = null, title }: CommentThreadProps) {
    const state = useComments();
    const [text, setText] = useState("");
    if (!state) return null;

    const comments = state.comments.filter(
        (c) => c.targetType === targetType && c.targetId === targetId && (c.metricId ?? null) === metricId
    );

    return (
        <section className="mt-3" aria-label={`Comments on ${title}`}>
            <h6 className="small fw-semibold mb-2">Comments on {title} ({comments.filter((c) => !c.deleted).length})</h6>
            {comments.length > 0 && (
                <ul className="list-group mb-2">
                    {comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)}
                </ul>
            )}
            <Form
                className="d-flex gap-2"
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (await state.add({ targetType, targetId, metricId }, text)) setText("");
                }}
            >
                <Form.Control size="sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment" aria-label={`Comment on ${title}`} />
                <Button size="sm" type="submit" disabled={!text.trim()}>Comment</Button>
            </Form>
        </section>
    );
}
