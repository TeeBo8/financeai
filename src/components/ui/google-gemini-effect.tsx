import { cn } from "../../lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const GoogleGeminiEffect = ({
  pathLengths,
  className,
}: {
  pathLengths: number[];
  className?: string;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);

  return (
    <div className={cn("absolute inset-0", className)}>
      <div className="relative w-full h-full">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg
            width="1024"
            height="1024"
            viewBox="0 0 1024 1024"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[300px] h-[300px] md:w-[500px] md:h-[500px]"
          >
            <path
              d="M928 512C928 739.2 739.2 928 512 928C284.8 928 96 739.2 96 512C96 284.8 284.8 96 512 96C739.2 96 928 284.8 928 512Z"
              stroke="url(#gradient1)"
              strokeWidth="3"
              strokeMiterlimit="10"
              className="fill-transparent"
            />
            <defs>
              <radialGradient
                id="gradient1"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(512 512) rotate(90) scale(512)"
              >
                <stop stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "calc(100% - 4rem)",
            height: "calc(100% - 4rem)",
          }}
        >
          <svg
            width="1024"
            height="1024"
            viewBox="0 0 1024 1024"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <motion.path
              d="M928 512C928 739.2 739.2 928 512 928C284.8 928 96 739.2 96 512C96 284.8 284.8 96 512 96C739.2 96 928 284.8 928 512Z"
              stroke="url(#gradient2)"
              strokeWidth="3"
              strokeMiterlimit="10"
              className="fill-transparent"
              style={{
                pathLength: pathLengthFirst,
              }}
            />
            <motion.path
              d="M702 512C702 614.3 614.3 702 512 702C409.7 702 322 614.3 322 512C322 409.7 409.7 322 512 322C614.3 322 702 409.7 702 512Z"
              stroke="url(#gradient2)"
              strokeWidth="3"
              strokeMiterlimit="10"
              className="fill-transparent"
              style={{
                pathLength: pathLengthSecond,
              }}
            />
            <motion.path
              d="M477 512C477 555 442 589 399 589C356 589 321 555 321 512C321 469 356 435 399 435C442 435 477 469 477 512Z"
              stroke="url(#gradient2)"
              strokeWidth="3"
              strokeMiterlimit="10"
              className="fill-transparent"
              style={{
                pathLength: pathLengthThird,
              }}
            />
            <motion.path
              d="M512 1024L512 0"
              stroke="url(#gradient2)"
              strokeWidth="3"
              strokeMiterlimit="10"
              className="fill-transparent"
              style={{
                pathLength: pathLengthFourth,
              }}
            />
            <motion.path
              d="M1024 512L0 512"
              stroke="url(#gradient2)"
              strokeWidth="3"
              strokeMiterlimit="10"
              className="fill-transparent"
              style={{
                pathLength: pathLengthFifth,
              }}
            />
            <defs>
              <radialGradient
                id="gradient2"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(512 512) rotate(90) scale(512)"
              >
                <stop stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
    </div>
  );
}; 