import { getAuthToken } from "@/lib/auth-session";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

async function apiFetch(path: string): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { headers });
}

function inr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

type SmartCommandResult = {
  handled: boolean;
  response: string;
};

const COMMANDS: [RegExp, (lang: string) => Promise<string>][] = [
  // Donation summary
  [
    /(?:total|sab|saari?|saare?)?\s*(?:donation|daan|chanda|dan)\s*(?:summary|report|kitna|kita|bata|dikhao|dekhao|show|give|generate)/i,
    async (lang) => {
      const res = await apiFetch("/api/donations/summary?period=month");
      if (!res.ok) return "";
      const json = await res.json();
      const d = json.data;
      if (lang === "hi") {
        return `📊 **Is Mahine Ka Donation Summary**

| Metric | Value |
|--------|-------|
| Total Funds | ${inr(d.total_funds)} |
| Total Donations | ${d.total_donations} |
| Total Donors | ${d.total_donors} |
| Average Donation | ${inr(d.avg_donation)} |
| Max Donation | ${inr(d.max_donation)} |

${d.payment_modes?.length ? "**Payment Mode Breakdown:**\n" + d.payment_modes.map((m: { mode: string; count: number; amount: number }) => `- ${m.mode}: ${m.count} donations (${inr(m.amount)})`).join("\n") : ""}

Kya aur kuch chahiye? 🙏`;
      }
      return `📊 **Donation Summary — This Month**

| Metric | Value |
|--------|-------|
| Total Funds | ${inr(d.total_funds)} |
| Total Donations | ${d.total_donations} |
| Total Donors | ${d.total_donors} |
| Average Donation | ${inr(d.avg_donation)} |
| Max Donation | ${inr(d.max_donation)} |

${d.payment_modes?.length ? "**Payment Modes:**\n" + d.payment_modes.map((m: { mode: string; count: number; amount: number }) => `- ${m.mode}: ${m.count} donations (${inr(m.amount)})`).join("\n") : ""}

Need anything else? 🙏`;
    },
  ],

  // Top donors
  [
    /(?:top|best|sabse|bade)\s*(?:donor|daanidata|danikarta|supporter)/i,
    async (lang) => {
      const res = await apiFetch("/api/donations/top-donors?limit=10");
      if (!res.ok) return "";
      const json = await res.json();
      const donors = json.donors;
      if (!donors?.length)
        return lang === "hi" ? "Koi donor data nahi mila. 😔" : "No donor data found yet. 😔";

      const rows = donors
        .map(
          (d: { name: string; total_amount: number; donation_count: number }, i: number) =>
            `| ${i + 1}. ${d.name} | ${d.donation_count} | ${inr(d.total_amount)} |`,
        )
        .join("\n");

      if (lang === "hi") {
        return `👥 **Top 10 Donors**

| # | Donor | Donations | Total |
|---|-------|-----------|-------|
${rows}

In donors ko dhanyavaad! 🙏 Kuch aur chahiye?`;
      }
      return `👥 **Top 10 Donors**

| # | Donor | Donations | Total |
|---|-------|-----------|-------|
${rows}

Want to see more details? Ask me about any specific donor! 🙏`;
    },
  ],

  // Recent donations
  [
    /(?:recent|latest|aaj|kal|today|yesterday|abhi|haliya)\s*(?:donation|daan|chanda)/i,
    async (lang) => {
      const res = await apiFetch("/api/donations/recent?limit=10");
      if (!res.ok) return "";
      const json = await res.json();
      const donations = json.donations;
      if (!donations?.length)
        return lang === "hi"
          ? "Abhi koi recent donation nahi hai. 😔"
          : "No recent donations found. 😔";

      const rows = donations
        .map(
          (d: { donor_name: string; amount: number; date: string; payment_mode: string }) =>
            `| ${d.donor_name} | ${inr(d.amount)} | ${new Date(d.date).toLocaleDateString("en-IN")} | ${d.payment_mode} |`,
        )
        .join("\n");

      if (lang === "hi") {
        return `💰 **Recent Donations (Last 10)**

| Donor | Amount | Date | Mode |
|-------|--------|------|------|
${rows}

Kuch aur dekhna hai? 🙏`;
      }
      return `💰 **Recent Donations (Last 10)**

| Donor | Amount | Date | Mode |
|-------|--------|------|------|
${rows}

Want to add or export these? 🙏`;
    },
  ],

  // Donor list
  [
    /(?:donor|daanidata|danikarta)\s*(?:list|sab|all|everyone|poora)/i,
    async (lang) => {
      const res = await apiFetch("/api/donors");
      if (!res.ok) return "";
      const json = await res.json();
      const stats = json.stats;
      const donors = json.donors?.slice(0, 15);
      if (!donors?.length)
        return lang === "hi" ? "Koi donor nahi mila. 😔" : "No donors found yet. 😔";

      const rows = donors
        .map(
          (d: {
            name: string;
            donation_count: number;
            lifetime_amount: number;
            category: string;
          }) => `| ${d.name} | ${d.donation_count} | ${inr(d.lifetime_amount)} | ${d.category} |`,
        )
        .join("\n");

      if (lang === "hi") {
        return `👥 **Donor List**

**Stats:** Total Donors: ${stats.total_donors} | Repeat: ${stats.repeat_donors} | New This Month: ${stats.new_this_month}

| Donor | Donations | Total | Category |
|-------|-----------|-------|----------|
${rows}

${json.donors.length > 15 ? `... aur ${json.donors.length - 15} donors hain. Dashboard pe dekho.` : ""}

Kisi specific donor ke baare mein puchna hai? 🙏`;
      }
      return `👥 **Donor List**

**Stats:** Total: ${stats.total_donors} | Repeat: ${stats.repeat_donors} | New This Month: ${stats.new_this_month}

| Donor | Donations | Total | Category |
|-------|-----------|-------|----------|
${rows}

${json.donors.length > 15 ? `...and ${json.donors.length - 15} more donors. Check dashboard for full list.` : ""}

Ask about any specific donor for more details! 🙏`;
    },
  ],

  // Compliance status
  [
    /(?:compliance|80g|12a|fcra|audit)\s*(?:status|check|report|summary|kitna|bata|dikhao)/i,
    async (lang) => {
      const res = await apiFetch("/api/compliance/summary");
      if (!res.ok) return "";
      const json = await res.json();
      const s = json;
      const counts = s.counts;

      const alertRows =
        s.alerts
          ?.map((a: { tone: string; title: string; description: string }) => {
            const icon = a.tone === "danger" ? "🔴" : a.tone === "warning" ? "🟡" : "🟢";
            return `| ${icon} ${a.title} | ${a.description} |`;
          })
          .join("\n") || "";

      if (lang === "hi") {
        return `📋 **Compliance Score: ${s.score}%**

**Donor Data Quality:**
| Metric | Count |
|--------|-------|
| Total Donors | ${counts.total_donors} |
| Complete | ${counts.complete_donors} |
| Incomplete | ${counts.incomplete_donors} |
| Missing Phone | ${counts.missing_phone} |
| Missing PAN | ${counts.missing_pan} |
| Pending Reviews | ${counts.pending_reviews} |

${alertRows ? "**Alerts:**\n" + alertRows : "🟢 Sab kuch theek hai!"}

Detail mein dekhna hai toh Dashboard > Compliance pe jao. 🙏`;
      }
      return `📋 **Compliance Score: ${s.score}%**

**Data Quality:**
| Metric | Count |
|--------|-------|
| Total Donors | ${counts.total_donors} |
| Complete | ${counts.complete_donors} |
| Incomplete | ${counts.incomplete_donors} |
| Missing Phone | ${counts.missing_phone} |
| Missing PAN | ${counts.missing_pan} |
| Pending Reviews | ${counts.pending_reviews} |

${alertRows ? "**Alerts:**\n" + alertRows : "🟢 All looks good!"}

Visit Dashboard > Compliance for full details. 🙏`;
    },
  ],

  // Dashboard summary
  [
    /(?:dashboard|summary|overview|snapshot|quick)\s*(?:summary|overview|bata|dikhao|dekhao|snapshot|report)/i,
    async (lang) => {
      const [donationRes, donorsRes, complianceRes] = await Promise.all([
        apiFetch("/api/donations/summary?period=month"),
        apiFetch("/api/donors"),
        apiFetch("/api/compliance/summary"),
      ]);

      const d = donationRes.ok ? (await donationRes.json()).data : null;
      const dr = donorsRes.ok ? await donorsRes.json() : null;
      const c = complianceRes.ok ? await complianceRes.json() : null;

      if (lang === "hi") {
        return `📈 **Dashboard Quick Summary**

**Donations:** ${d ? `${inr(d.total_funds)} total (${d.total_donations} donations)` : "Data unavailable"}
**Donors:** ${dr ? `${dr.stats.total_donors} total, ${dr.stats.new_this_month} new this month` : "Data unavailable"}
**Compliance:** ${c ? `${c.score}% score` : "Data unavailable"}

Aur detail mein dekhna hai? Specific section puchho — donations, donors, ya compliance! 🙏`;
      }
      return `📈 **Dashboard Quick Summary**

**Donations:** ${d ? `${inr(d.total_funds)} total (${d.total_donations} donations)` : "Data unavailable"}
**Donors:** ${dr ? `${dr.stats.total_donors} total, ${dr.stats.new_this_month} new this month` : "Data unavailable"}
**Compliance:** ${c ? `${c.score}% score` : "Data unavailable"}

Want more details? Ask about donations, donors, or compliance! 🙏`;
    },
  ],

  // Today's donations
  [
    /(?:aaj|today|is din)\s*(?:ka|ki|ke)?\s*(?:donation|daan|chanda)/i,
    async (lang) => {
      const res = await apiFetch("/api/donations/summary?period=today");
      if (!res.ok) return "";
      const json = await res.json();
      const d = json.data;

      if (lang === "hi") {
        return `📊 **Aaj Ka Donation Summary**

| Metric | Value |
|--------|-------|
| Aaj Ka Total | ${inr(d.total_funds)} |
| Donations | ${d.total_donations} |
| Donors | ${d.total_donors} |
| Average | ${inr(d.avg_donation)} |

Aur kuch chahiye? 🙏`;
      }
      return `📊 **Today's Donation Summary**

| Metric | Value |
|--------|-------|
| Total Today | ${inr(d.total_funds)} |
| Donations | ${d.total_donations} |
| Donors | ${d.total_donors} |
| Average | ${inr(d.avg_donation)} |

Need anything else? 🙏`;
    },
  ],

  // Monthly income
  [
    /(?:month|mahina|is mahine)\s*(?:ka|ki|ke)?\s*(?:income|aay|kamai|earn)/i,
    async (lang) => {
      const res = await apiFetch("/api/donations/summary?period=month");
      if (!res.ok) return "";
      const json = await res.json();
      const d = json.data;

      if (lang === "hi") {
        return `📅 **Is Mahine Ki Income**

| Metric | Value |
|--------|-------|
| Total Income | ${inr(d.total_funds)} |
| Donations | ${d.total_donations} |
| Average | ${inr(d.avg_donation)} |
| Max Single | ${inr(d.max_donation)} |
| Unique Donors | ${d.total_donors} |

${d.changes ? `**Growth:** ${d.changes.total_funds > 0 ? "📈" : "📉"} ${d.changes.total_funds > 0 ? "+" : ""}${d.changes.total_funds}% vs last month` : ""}

Kuch aur chahiye? 🙏`;
      }
      return `📅 **Monthly Income Summary**

| Metric | Value |
|--------|-------|
| Total Income | ${inr(d.total_funds)} |
| Donations | ${d.total_donations} |
| Average | ${inr(d.avg_donation)} |
| Max Single | ${inr(d.max_donation)} |
| Unique Donors | ${d.total_donors} |

${d.changes ? `**Growth:** ${d.changes.total_funds > 0 ? "📈" : "📉"} ${d.changes.total_funds > 0 ? "+" : ""}${d.changes.total_funds}% vs last month` : ""}

Anything else? 🙏`;
    },
  ],

  // Monthly report
  [
    /(?:generate|banao|banao|create|export)\s*(?:monthly|mahine ka|is mahine ka)?\s*(?:report|summary)/i,
    async (lang) => {
      const res = await apiFetch("/api/donations/summary?period=month");
      if (!res.ok) return "";
      const json = await res.json();
      const d = json.data;

      const modeBreakdown =
        d.payment_modes
          ?.map(
            (m: { mode: string; count: number; amount: number; percent: number }) =>
              `| ${m.mode} | ${m.count} | ${inr(m.amount)} | ${m.percent}% |`,
          )
          .join("\n") || "";

      if (lang === "hi") {
        return `📄 **Monthly Donation Report**

**Overview:**
| Metric | Value |
|--------|-------|
| Total Funds | ${inr(d.total_funds)} |
| Total Donations | ${d.total_donations} |
| Unique Donors | ${d.total_donors} |
| Average Donation | ${inr(d.avg_donation)} |
| Highest Donation | ${inr(d.max_donation)} |
| Lowest Donation | ${inr(d.min_donation)} |

${modeBreakdown ? `**Payment Modes:**\n| Mode | Count | Amount | Share |\n|------|-------|--------|-------|\n${modeBreakdown}` : ""}

Full report ke liye Dashboard > Reports pe jao — wahan se PDF/Excel mein export kar sakte ho! 🙏`;
      }
      return `📄 **Monthly Donation Report**

**Overview:**
| Metric | Value |
|--------|-------|
| Total Funds | ${inr(d.total_funds)} |
| Total Donations | ${d.total_donations} |
| Unique Donors | ${d.total_donors} |
| Average Donation | ${inr(d.avg_donation)} |
| Highest Donation | ${inr(d.max_donation)} |
| Lowest Donation | ${inr(d.min_donation)} |

${modeBreakdown ? `**Payment Modes:**\n| Mode | Count | Amount | Share |\n|------|-------|--------|-------|\n${modeBreakdown}` : ""}

For the full report with PDF/Excel export, visit Dashboard > Reports! 🙏`;
    },
  ],
];

export async function trySmartCommand(
  userMessage: string,
  language: string,
): Promise<SmartCommandResult> {
  for (const [pattern, handler] of COMMANDS) {
    if (pattern.test(userMessage)) {
      try {
        const response = await handler(language);
        if (response) {
          return { handled: true, response };
        }
      } catch {
        // API call failed — fall through to AI
      }
      break;
    }
  }
  return { handled: false, response: "" };
}
