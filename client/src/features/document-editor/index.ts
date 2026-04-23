export { CollaborativeEditor } from "./CollaborativeEditor";
export type {
  CollaborativeEditorProps,
  ConnectionStatus
} from "./CollaborativeEditor";

export const documentEditorFeature = {
  status: "ready",
  provider: "yjs-codemirror"
} as const;
