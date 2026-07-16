import { Aside } from "@/components/mdx/Aside";
import { Callout } from "@/components/mdx/Callout";
import { MdxCard } from "@/components/mdx/MdxCard";
import { ArrowRight } from "lucide-react";
import React, { ReactNode } from "react";

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className: string;
  children: ReactNode;
}

const Heading: React.FC<HeadingProps> = ({ level, className, children }) => {
  const HeadingTag = `h${level}` as keyof React.ElementType;
  const headingId = children?.toString() ?? "";

  return React.createElement(
    HeadingTag,
    { id: headingId, className },
    children
  );
};

interface MDXComponentsProps {
  [key: string]: React.FC<any>;
}

interface ToolCtaProps {
  href: string;
  title: string;
  description: string;
  action: string;
}

const ToolCta: React.FC<ToolCtaProps> = ({
  href,
  title,
  description,
  action,
}) => (
  <div className="my-8 flex flex-col gap-5 rounded-md border-2 border-[#17201d] bg-[#f8d36b] p-5 text-[#17201d] shadow-[5px_5px_0_#17201d] sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="m-0 text-xl font-black leading-tight text-[#17201d]">
        {title}
      </p>
      <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-[#3d4d47]">
        {description}
      </p>
    </div>
    <a
      href={href}
      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border-2 border-[#17201d] bg-[#17201d] px-4 py-2.5 text-sm font-black text-[#fffaf0] no-underline transition hover:bg-[#b84a2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b84a2b] focus-visible:ring-offset-2"
    >
      {action}
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </a>
  </div>
);

const MDXComponents: MDXComponentsProps = {
  h1: (props) => (
    <Heading level={1} className="text-4xl font-bold mt-8 mb-6" {...props} />
  ),
  h2: (props) => (
    <Heading
      level={2}
      className="text-3xl font-semibold mt-8 mb-6 border-b-2 border-gray-200 pb-2"
      {...props}
    />
  ),
  h3: (props) => (
    <Heading
      level={3}
      className="text-2xl font-semibold mt-6 mb-4"
      {...props}
    />
  ),
  h4: (props) => (
    <Heading level={4} className="text-xl font-semibold mt-6 mb-4" {...props} />
  ),
  h5: (props) => (
    <Heading level={5} className="text-lg font-semibold mt-6 mb-4" {...props} />
  ),
  h6: (props) => (
    <Heading
      level={6}
      className="text-base font-semibold mt-6 mb-4"
      {...props}
    />
  ),
  hr: (props) => <hr className="border-t border-gray-200 my-8" {...props} />,
  p: (props) => (
    <p
      className="mt-6 mb-6 leading-relaxed text-gray-700 dark:text-gray-300"
      {...props}
    />
  ),
  a: ({ href, ...props }) => {
    const isExternal =
      typeof href === "string" && /^(?:https?:)?\/\//.test(href);

    return (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline underline-offset-4"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        {...props}
      />
    );
  },
  ul: (props) => <ul className="list-disc pl-6 mt-0 mb-6" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 mt-0 mb-6" {...props} />,
  li: (props) => (
    <li className="mb-3 text-gray-700 dark:text-gray-300" {...props} />
  ),
  code: (props) => (
    <code
      className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="rounded-lg p-4 overflow-x-auto my-4 bg-gray-100 dark:bg-gray-800"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="pl-6 border-l-4 my-6 text-gray-600 dark:text-gray-400 italic"
      {...props}
    />
  ),
  img: (props) => (
    <img className="rounded-lg border-2 border-gray-200 my-6" {...props} />
  ),
  strong: (props) => <strong className="font-bold" {...props} />,
  table: (props) => (
    <div className="my-8 w-full overflow-x-auto">
      <table
        className="w-full shadow-sm rounded-lg overflow-hidden"
        {...props}
      />
    </div>
  ),
  tr: (props) => <tr className="border-t border-gray-200" {...props} />,
  th: (props) => (
    <th
      className="px-6 py-3 font-bold text-left bg-gray-100 dark:bg-gray-700 [&[align=center]]:text-center [&[align=right]]:text-right"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="px-6 py-4 text-left border-t border-gray-100 dark:border-gray-700 [&[align=center]]:text-center [&[align=right]]:text-right"
      {...props}
    />
  ),
  Aside,
  Callout,
  Card: MdxCard,
  ToolCta,
};

export default MDXComponents;
