import { ComponentProps } from "react";

type CodeProps = ComponentProps<"code"> & { inline?: boolean };


const CodeBlock = ({ inline, className, children, ...props }: CodeProps) => {
  return inline ? (
    <code className="bg-neutral-200 dark:bg-neutral-700 px-1 rounded text-sm" {...props}>
      {children}
    </code>
  ) : (
    <pre className="bg-neutral-800 text-white p-3 rounded-md overflow-x-auto text-sm">
      <code className={className} {...props}>
        {children}
      </code>
    </pre>
  );
};

export default CodeBlock;

