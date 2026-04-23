import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownPreviewProps = {
  content: string;
};

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="markdown-preview__empty">
        <strong>Preview is ready</strong>
        <p>Start typing Markdown in the editor and the rendered result will appear here.</p>
      </div>
    );
  }

  return (
    <div className="markdown-preview markdown-preview__content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1(props) {
            return <h1 {...props} className="markdown-preview__h1" />;
          },
          h2(props) {
            return <h2 {...props} className="markdown-preview__h2" />;
          },
          h3(props) {
            return <h3 {...props} className="markdown-preview__h3" />;
          },
          p(props) {
            return <p {...props} className="markdown-preview__paragraph" />;
          },
          blockquote(props) {
            return <blockquote {...props} className="markdown-preview__quote" />;
          },
          ul(props) {
            return <ul {...props} className="markdown-preview__list" />;
          },
          ol(props) {
            return <ol {...props} className="markdown-preview__list" />;
          },
          table(props) {
            return (
              <div className="markdown-preview__table-wrap">
                <table {...props} className="markdown-preview__table" />
              </div>
            );
          },
          code({ inline, className, children, ...props }: CodeProps) {
            if (inline) {
              return (
                <code
                  {...props}
                  className={`markdown-preview__inline-code ${className ?? ""}`.trim()}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="markdown-preview__code">
                <code {...props} className={className}>
                  {children}
                </code>
              </pre>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
