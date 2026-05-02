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
        <strong>预览已就绪</strong>
        <p>在编辑器中输入 Markdown 内容，渲染结果将显示在此处。</p>
      </div>
    );
  }

  return (
    <div className="markdown-preview">
      <div className="markdown-preview__content">
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
            h4(props) {
              return <h4 {...props} className="markdown-preview__h4" />;
            },
            h5(props) {
              return <h5 {...props} className="markdown-preview__h5" />;
            },
            h6(props) {
              return <h6 {...props} className="markdown-preview__h6" />;
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
            li(props) {
              const hasCheckbox = props.children && 
                typeof props.children === 'object' && 
                'props' in props.children &&
                (props.children as any).props?.type === 'checkbox';
              
              if (hasCheckbox) {
                return <li {...props} className="markdown-preview__task-item" />;
              }
              return <li {...props} />;
            },
            input(props) {
              if (props.type === 'checkbox') {
                return <input {...props} className="markdown-preview__task-checkbox" disabled />;
              }
              return <input {...props} />;
            },
            hr(props) {
              return <hr {...props} className="markdown-preview__hr" />;
            },
            a(props) {
              return <a {...props} className="markdown-preview__link" target="_blank" rel="noopener noreferrer" />;
            },
            strong(props) {
              return <strong {...props} className="markdown-preview__strong" />;
            },
            em(props) {
              return <em {...props} className="markdown-preview__emphasis" />;
            },
            del(props) {
              return <del {...props} className="markdown-preview__strike" />;
            },
            img(props) {
              return <img {...props} className="markdown-preview__image" />;
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
    </div>
  );
}
