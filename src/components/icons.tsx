export const Icons = {
  helmet: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m8.5 11 7 7" />
      <path d="m15.5 11-7 7" />
    </svg>
  ),
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <g transform="rotate(45 12 12) translate(0, -1)">
        <path d="M15.5 8.5h-7L7 10h8.5Z" />
        <path d="M15.5 13.5h-7L7 12h8.5Z" />
        <path d="M14 10v2" />
      </g>
       <g transform="rotate(-45 12 12) translate(0, -1)">
        <path d="M15.5 8.5h-7L7 10h8.5Z" />
        <path d="M15.5 13.5h-7L7 12h8.5Z" />
        <path d="M14 10v2" />
      </g>
    </svg>
  ),
};
