import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import * as alertify from "alertifyjs";
import { addComment, deleteComment, editComment, getComments } from "../../../../DataProvider/Services/commentService";
import { CommentTargetType, ExperimentComment } from "../../../../Domain/Laboratory/Entities/Comment";
import { errorMessage } from "../../../errorMessage";

interface CommentsState {
    comments: ExperimentComment[];
    /** The owner and the director may delete any comment. */
    canModerate: boolean;
    add: (target: { targetType: CommentTargetType; targetId: string; metricId?: string | null }, body: string) => Promise<boolean>;
    edit: (commentId: string, body: string) => Promise<boolean>;
    remove: (commentId: string) => Promise<void>;
}

const CommentsContext = createContext<CommentsState | null>(null);

/** The comments of the experiment, for every thread of the page; read again every 5 s (LAB-COL-03). */
export function CommentsProvider({ experimentId, canModerate, children }: { experimentId: string; canModerate: boolean; children: ReactNode }) {
    const [comments, setComments] = useState<ExperimentComment[]>([]);

    const reload = useCallback(() => {
        getComments(experimentId).then(setComments).catch(() => undefined);
    }, [experimentId]);

    useEffect(() => {
        reload();
        const timer = setInterval(reload, 5000);
        return () => clearInterval(timer);
    }, [reload]);

    const act = async (action: () => Promise<unknown>, fallback: string) => {
        try {
            await action();
            reload();
            return true;
        } catch (error) {
            alertify.error(errorMessage(error, fallback));
            return false;
        }
    };

    return (
        <CommentsContext.Provider
            value={{
                comments,
                canModerate,
                add: (target, body) => act(() => addComment(experimentId, { ...target, body }), "The comment could not be added."),
                edit: (commentId, body) => act(() => editComment(experimentId, commentId, body), "The comment could not be edited."),
                remove: async (commentId) => {
                    await act(() => deleteComment(experimentId, commentId), "The comment could not be deleted.");
                },
            }}
        >
            {children}
        </CommentsContext.Provider>
    );
}

export const useComments = () => useContext(CommentsContext);
