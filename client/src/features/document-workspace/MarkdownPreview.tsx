import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownPreviewProps = {
  content: string;
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
            li({ children, ...props }: any) {
              const hasCheckbox = children && 
                typeof children === 'object' && 
                'props' in children &&
                (children as any).props?.type === 'checkbox';
              
              if (hasCheckbox) {
                return <li {...props} className="markdown-preview__task-item">{children}</li>;
              }
              return <li {...props}>{children}</li>;
            },
            input(props: any) {
              if (props.type === 'checkbox') {
                return <input {...props} className="markdown-preview__task-checkbox" disabled />;
              }
              return <input {...props} />;
            },
            hr(props) {
              return <hr {...props} className="markdown-preview__hr" />;
            },
            a({ children, ...props }: any) {
              return (
                <a {...props} className="markdown-preview__link" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
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
              return <img {...props} className="markdown-preview__image" alt={props.alt || ""} />;
            },
            table({ children, ...props }: any) {
              return (
                <div className="markdown-preview__table-wrap">
                  <table {...props} className="markdown-preview__table">
                    {children}
                  </table>
                </div>
              );
            },
            thead(props) {
              return <thead {...props} className="markdown-preview__thead" />;
            },
            tbody(props) {
              return <tbody {...props} className="markdown-preview__tbody" />;
            },
            tr(props) {
              return <tr {...props} className="markdown-preview__tr" />;
            },
            th(props) {
              return <th {...props} className="markdown-preview__th" />;
            },
            td(props) {
              return <td {...props} className="markdown-preview__td" />;
            },
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = inline || !match;

              if (isInline) {
                return (
                  <code
                    {...props}
                    className="markdown-preview__inline-code"
                  >
                    {children}
                  </code>
                );
              }

              return (
                <pre className="markdown-preview__code">
                  <code
                    {...props}
                    className={`${match ? className : ""}`.trim()}
                  >
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
