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
      viewBox="0 0 200 200"
      fill="none"
      {...props}
    >
      <g clipPath="url(#clip0_1_2)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M100 0L0 50V150L100 200L200 150V50L100 0ZM52.5 131.25L100 156.25L147.5 131.25L125 118.75L100 131.25L75 118.75L52.5 131.25ZM100 50L125 62.5V87.5L100 100L75 87.5V62.5L100 50Z"
          fill="currentColor"
          className="text-primary"
        />
        <path
          d="M100 50L75 62.5V87.5L100 100V50Z"
          fill="black"
          fillOpacity="0.2"
        />
        <path
          d="M100 156.25L75 118.75L52.5 131.25L100 156.25Z"
          fill="black"
          fillOpacity="0.2"
        />
        <path
          d="M100 131.25L125 118.75L147.5 131.25L100 131.25Z"
          fill="black"
          fillOpacity="0.2"
        />
      </g>
      <defs>
        <clipPath id="clip0_1_2">
          <rect width="200" height="200" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
};