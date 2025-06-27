import { cn } from "../lib/utils";
import { Marquee } from "../components/magicui/marquee";
 
const reviews = [
  {
    name: "Alex Chen",
    username: "@alexinvests",
    body: "Finally, a fintech app that speaks my language! The pixel UI makes investing fun and the AI insights are spot-on. 🚀",
    img: "https://avatar.vercel.sh/alex",
  },
  {
    name: "Maya Patel",
    username: "@mayamoney",
    body: "Finfluenzz turned me from a financial noob to someone who actually understands my portfolio. The gamification is addictive!",
    img: "https://avatar.vercel.sh/maya",
  },
  {
    name: "Jordan Kim",
    username: "@jordantrades",
    body: "Best budgeting app for Gen Z hands down. The retro aesthetic + modern features = chef's kiss 👌",
    img: "https://avatar.vercel.sh/jordan",
  },
  {
    name: "Sam Rodriguez",
    username: "@samstocks",
    body: "Made my first profitable trade using Finfluenzz's AI analysis. This app is literally changing my financial future.",
    img: "https://avatar.vercel.sh/sam",
  },
  {
    name: "Riley Thompson",
    username: "@rileysaves",
    body: "Love how it breaks down complex financial concepts into bite-sized, understandable pieces. Perfect for beginners!",
    img: "https://avatar.vercel.sh/riley",
  },
  {
    name: "Casey Wong",
    username: "@caseycoins",
    body: "The pixel art style + serious financial tools = exactly what our generation needed. It's like if TikTok made a finance app.",
    img: "https://avatar.vercel.sh/casey",
  },
];
 
const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);
 
const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4 mx-2",
        // light styles
        "border-blue-200 bg-white/80 hover:bg-white/90 shadow-lg",
        // dark styles
        "dark:border-blue-800 dark:bg-slate-800/80 dark:hover:bg-slate-800/90",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium text-[#001F3F] dark:text-white font-minecraft">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-[#007FFF] dark:text-blue-300">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm text-gray-700 dark:text-gray-200">{body}</blockquote>
    </figure>
  );
};
 
export function MarqueeDemo() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
}