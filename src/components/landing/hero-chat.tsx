import { motion } from "framer-motion";
import { BarChart3, Bell, Globe2, Image as ImageIcon } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import GlobalChat from "@/components/chat-support/GlobalChat";

// A floating card wrapper that continuously bobs up and down
function FloatingCard({
  children,
  className,
  delay = 0,
  yOffset = 15,
  duration = 4,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ y: 20 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      // xl, not lg: the cards sit ~400px either side of centre, so below ~1280px they
      // collide with the chat and get cropped by the section's overflow-hidden.
      className={`absolute hidden xl:block z-10 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -yOffset, 0] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: delay * 0.5 }}
        className="rounded-2xl bg-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100/50 p-4"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * The landing hero, redesigned with a central chat and floating UI elements to feel
 * dynamic, airy, and deeply professional.
 */
export function HeroChat() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[#FFF5F2]/60 via-white to-[#F2F8FF] px-6 pt-16 pb-32 lg:px-12 lg:pt-24">
      {/* Soft background mesh gradient elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/60 blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-pink-100/40 blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-[1248px]">
        {/* Only the eyebrow sits above the chat. The headline moved BELOW it — see the
            block after the chat. This section's whole premise is that the conversation
            IS the pitch, and putting a 68px headline plus a paragraph in front of it
            asked visitors to read the claim before they could see the thing that backs
            it up. The badge is small enough to frame the chat without competing. */}
        <div className="flex flex-col items-center text-center mb-10 relative z-20">
          <motion.span
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-brand shadow-sm border border-brand/10"
          >
            ⭐ Trusted by 200+ Korean SMEs going global
          </motion.span>
        </div>

        {/* Central UI with Floating Cards */}
        <div className="relative mx-auto w-full max-w-[1240px] flex justify-center">
          {/* Card 1: Social Media (Top Left) */}
          <FloatingCard className="right-[50%] mr-[400px] top-10 rotate-[-4deg]" delay={0.2} duration={5}>
            <div className="flex items-center gap-3 min-w-[180px]">
              <div className="flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-500">
                <ImageIcon size={18} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-gray-900">Viral Content</div>
                <div className="text-[11px] text-gray-500">2.4M Views this week</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 opacity-60">
              <div className="h-8 rounded bg-gray-100" />
              <div className="h-8 rounded bg-gray-100" />
              <div className="h-8 rounded bg-gray-100" />
            </div>
          </FloatingCard>

          {/* Card 2: Translation (Bottom Left) */}
          <FloatingCard
            className="right-[50%] mr-[395px] bottom-32 rotate-[3deg]"
            delay={0.4}
            duration={6}
            yOffset={20}
          >
            <div className="min-w-[200px]">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Globe2 size={12} /> Auto-Translated
              </div>
              <div className="rounded-xl rounded-bl-sm bg-gray-50 p-3 text-[13px] text-gray-700 mb-2">
                Can you ship to New York?
              </div>
              <div className="rounded-xl rounded-br-sm bg-brand/10 p-3 text-[13px] text-brand ml-4 border border-brand/10">
                뉴욕 배송 가능한가요?
              </div>
            </div>
          </FloatingCard>

          {/* Card 3: Analytics (Top Right) */}
          <FloatingCard className="left-[50%] ml-[400px] top-4 rotate-[5deg]" delay={0.3} duration={4.5}>
            <div className="flex items-start justify-between min-w-[220px]">
              <div>
                <div className="text-[13px] font-medium text-gray-500">Global Reach</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">+45%</span>
                  <span className="text-[11px] font-semibold text-green-500">↑ This sprint</span>
                </div>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                <BarChart3 size={14} />
              </div>
            </div>
            {/* Fake mini chart */}
            <div className="mt-4 flex h-10 w-full items-end gap-1.5 opacity-60">
              {[40, 30, 60, 50, 80, 100].map((h) => (
                <div key={h} className="flex-1 rounded-t-sm bg-brand" style={{ height: `${h}%` }} />
              ))}
            </div>
          </FloatingCard>

          {/* Card 4: Sales Notification (Bottom Right) */}
          <FloatingCard
            className="left-[50%] ml-[415px] bottom-32 rotate-[-2deg]"
            delay={0.5}
            duration={5.5}
            yOffset={12}
          >
            <div className="min-w-[240px] rounded-xl bg-white p-1 -m-4 text-gray-900 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3 p-3">
                <div className="relative flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <Bell size={16} />
                  <span className="absolute top-0 right-0 flex size-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold">New Partnership</div>
                  <div className="text-[11px] text-gray-500">Deal closed in Singapore</div>
                </div>
              </div>
            </div>
          </FloatingCard>

          {/* The Central Chat Component */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            id="talk-to-us"
            className="w-full max-w-[760px] scroll-mt-6 relative z-20"
          >
            <div className="h-[560px] overflow-hidden rounded-[24px] shadow-[0_32px_80px_rgba(20,71,229,0.15)] ring-1 ring-black/5 bg-white lg:h-[660px]">
              <ClientOnly>
                <GlobalChat />
              </ClientOnly>
            </div>
          </motion.div>
        </div>

        {/* The headline, now reading as a caption under the product rather than a
            billboard in front of it. Kept at full hero weight — it is still the page's
            h1, and demoting the type would cost the SEO and the scan-ability without
            buying anything back. */}
        <div className="flex flex-col items-center text-center gap-6 mt-16 relative z-20 lg:mt-20">
          <motion.h1
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[40px] font-extrabold leading-[1.06] tracking-tight text-ink sm:text-[52px] lg:text-[68px]"
          >
            Speak Local.{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand to-purple-600">Sell Global.</span>
            <br />
            Grow Without Limits.
          </motion.h1>

          <motion.p
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-[700px] text-[17px] leading-[1.6] text-ink-body lg:text-[19px]"
          >
            The done for you growth team that turns SMEs into global brands content, commerce, and partnerships, handled
            end to end.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
