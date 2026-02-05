import { Header } from "@/components/dashboard/Header";
import { Hero } from "@/components/dashboard/Hero";
import { DesignCard } from "@/components/dashboard/DesignCard";
import { CreateDesignCard } from "@/components/dashboard/CreateDesignCard";

export default function DashboardPage() {
  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Hero />

          {/* Recent Designs Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Designs</h3>
              <p className="text-sm text-slate-500 dark:text-text-muted-dark">Manage and organize your architecture diagrams</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-dashboard-card rounded-lg p-1">
                <button className="p-1.5 rounded bg-white dark:bg-surface-highlight-dark text-primary shadow-sm cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button className="p-1.5 rounded text-slate-500 dark:text-text-muted-dark hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
              </div>
              <select className="h-9 rounded-lg border-none bg-slate-100 dark:bg-dashboard-card text-sm text-slate-700 dark:text-text-input-dark focus:ring-primary focus:outline-none px-2 cursor-pointer">
                <option>Last Edited</option>
                <option>Name (A-Z)</option>
                <option>Status</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <CreateDesignCard />
            <DesignCard
              title="Uber Backend Architecture"
              status="DRAFT"
              editedTime="10m ago"
              imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBJoIpOy7nuvwTgWRMWCpWIVWAqoMB8BBZTb-sSsNI3EJvR8bxd2EHDTRId1qj7pFsoRTLb_YYBcodhBTG92V0nIL8B1YWXRfvpGZl-KP8JIWV6rz2muL9rLxB_2xOP1e_l107r08Q2M-7UpDJVFM0Cpqe598_1DTh-fMCQHJJ61CpThBIw59dTNwy0Rpx15LdCwlOR3mtqB0MFIjbExt5OJ7DYEBquURtedT6pzdvMhFq1qClT-PvLVGuEVWNW5SoSAL07d9Sh2gCG"
            />
            <DesignCard
              title="Twitter Newsfeed Feed"
              status="REVIEWED"
              editedTime="2h ago"
              imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCyT_0pfKBmD34RdXMURPsnEzq83ggVFZrfuVnjmcQu83CkicE2Y9yy9G6UbKYuJ5v8RR9MKGEqG5_4tEE5261TLU7lGejyntGyV485-xtW0OIf14XscI93Aqiah0jSUA8v5wjs55A0Qbny0lhZgESOe-PnWXYO_YQaMu6Q0qxOldDiY7p4UDXPjXu24O1BKamFb5a2LmAmAtcIAXt6p6OodDzq0i_1QKWKdCqd6kirodD5ys0Low0wg8SK3pPIBbGv2KD_8TmqXVIw"
              reviewers={true}
            />
            <DesignCard
              title="Ticketmaster Booking System"
              status="COMPLETED"
              editedTime="1d ago"
              imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBWOGY7UhPjK57HarTSo-3Ygs2aOgJ_v7jUutvN692A3jeT_HSW0iTxNfzxS6Jrc1k7sM-6yFUrU6aRo4smzMo6ZYF2isBCEXJGW5JwGMc_di0Fj-jSzTcNRpn98ixK3_5gDEKmNM920iJunDzWIxgM9-WXM-ie0724N68gL5kOcl4vVIsd390Dlt--PzDdUhgtUq27sYApZ_CowpLMFoo4ruZp3XBi_Mle6UMJfkK9piZpaLuyZctg3B9KxmbdXViMs3ZLGPPPB-sr"
            />
             <DesignCard
              title="WhatsApp Chat Schema"
              status="DRAFT"
              editedTime="3d ago"
              imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDs-nK1OqXNZbfbKqmTaOFL2ld6oWv6vPRIpoilOYR5tJozeT-VbfZbsasIAmNsFVWXF74D10OU_YK86FBIKLU1FsV9hqvTITOseD6W2OzWvpbdMGzMDQf18YG0P1WpBhCbb1R29-bXU9Hud-arxFyen5xEZ82K6_3MeoMMaH6WTOhqeiamG6SkzlPd62tt-9h-0FE6I8n3z0xRMYNHV8AoYlM2Su5kCDIfradTcJ8PeSJjmBLJJiWKgPBZ7XBKeSPLGH43taCzw5na"
            />
          </div>
        </div>
      </div>
    </>
  );
}
