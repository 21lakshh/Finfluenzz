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
    <figure className="relative h-full w-64 cursor-pointer overflow-hidden border-3 border-[#007FFF]/60 p-4 mx-2 bg-white/70 backdrop-blur-sm hover:bg-white/85 hover:border-[#007FFF] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" style={{ borderRadius: '8px' }}>
      {/* Subtle corner accents */}
      <div className="absolute top-2 left-2 w-2 h-2 bg-[#007FFF]/40 rounded-sm"></div>
      <div className="absolute top-2 right-2 w-2 h-2 bg-[#001F3F]/40 rounded-sm"></div>
      
      <div className="flex flex-row items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#007FFF]/90 to-[#001F3F]/90 border-2 border-[#007FFF]/50 flex items-center justify-center text-white font-bold text-sm rounded-lg shadow-md">
          {name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <figcaption className="text-sm font-bold text-[#001F3F] tracking-wide">
            {name}
          </figcaption>
          <p className="text-xs font-semibold text-[#007FFF]/80">{username}</p>
        </div>
      </div>
      <blockquote className="text-sm text-[#001F3F]/90 font-medium leading-relaxed">{body}</blockquote>
      
      {/* Enhanced rating stars */}
      <div className="mt-4 flex items-center gap-1">
        {[1,2,3,4,5].map(star => (
          <div key={star} className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-yellow-500 transform rotate-45 shadow-sm"></div>
        ))}
      </div>
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
      {/* Enhanced gradient blending */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#B3DBFF] via-[#B3DBFF]/50 to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#B3DBFF] via-[#B3DBFF]/50 to-transparent"></div>
    </div>
  );
}