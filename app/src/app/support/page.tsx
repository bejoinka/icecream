import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support - Help Organizations Defending Immigrant Rights",
  description:
    "Support organizations providing legal aid and advocacy for immigrants and asylum seekers.",
};

interface Organization {
  name: string;
  description: string;
  focus: string[];
  donateUrl: string;
  websiteUrl: string;
}

const ORGANIZATIONS: Organization[] = [
  {
    name: "RAICES (Refugee and Immigrant Center for Education and Legal Services)",
    description:
      "One of the largest immigration legal services providers in Texas, offering free and low-cost legal services to immigrant families, children, and refugees.",
    focus: ["Legal representation", "Family reunification", "Refugee services"],
    donateUrl: "https://www.raicestexas.org/donate/",
    websiteUrl: "https://www.raicestexas.org/",
  },
  {
    name: "ACLU Immigrants' Rights Project",
    description:
      "The ACLU's nationwide litigation and advocacy program defending the rights of immigrants through impact litigation, advocacy, and public education.",
    focus: ["Constitutional rights", "Detention conditions", "Due process"],
    donateUrl: "https://action.aclu.org/give/fund-immigrants-rights",
    websiteUrl: "https://www.aclu.org/issues/immigrants-rights",
  },
  {
    name: "National Immigration Law Center (NILC)",
    description:
      "Defends and advances the rights of low-income immigrants through policy analysis, litigation, and advocacy at the federal and state levels.",
    focus: ["Policy advocacy", "Workers' rights", "Access to services"],
    donateUrl: "https://www.nilc.org/donate/",
    websiteUrl: "https://www.nilc.org/",
  },
  {
    name: "Immigration Advocates Network",
    description:
      "Provides free immigration legal help through technology, connecting immigrants with pro bono attorneys and legal information resources.",
    focus: ["Legal aid access", "Pro bono coordination", "Legal tech"],
    donateUrl: "https://www.immigrationadvocates.org/donate",
    websiteUrl: "https://www.immigrationadvocates.org/",
  },
  {
    name: "Florence Immigrant & Refugee Rights Project",
    description:
      "Provides free legal and social services to adults and unaccompanied children in immigration custody in Arizona, one of the busiest detention corridors.",
    focus: ["Detention representation", "Unaccompanied minors", "Arizona"],
    donateUrl: "https://firrp.org/donate/",
    websiteUrl: "https://firrp.org/",
  },
  {
    name: "Al Otro Lado",
    description:
      "Serves refugees and deportees in Tijuana and throughout Southern California through direct legal services, humanitarian aid, and advocacy.",
    focus: ["Border region", "Deportee support", "Asylum seekers"],
    donateUrl: "https://alotrolado.org/donate/",
    websiteUrl: "https://alotrolado.org/",
  },
  {
    name: "Kids in Need of Defense (KIND)",
    description:
      "Partners with law firms, corporations, and law schools to provide pro bono representation to unaccompanied immigrant and refugee children.",
    focus: ["Unaccompanied children", "Pro bono network", "Child welfare"],
    donateUrl: "https://supportkind.org/donate/",
    websiteUrl: "https://supportkind.org/",
  },
  {
    name: "United We Dream",
    description:
      "The largest immigrant youth-led community in the country, advocating for the dignity of immigrants and working toward permanent protection.",
    focus: ["Youth organizing", "DACA", "Community power"],
    donateUrl: "https://unitedwedream.org/donate/",
    websiteUrl: "https://unitedwedream.org/",
  },
];

function OrganizationCard({ org }: { org: Organization }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">{org.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {org.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {org.focus.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-3 mt-auto pt-4">
        <a
          href={org.donateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Donate
        </a>
        <a
          href={org.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors"
        >
          Learn More
        </a>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Game
        </Link>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Support Real Organizations</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
          The situations depicted in this game are inspired by real challenges
          faced by immigrant communities. These organizations provide vital
          legal support, advocacy, and services to people navigating the
          immigration system.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">
          Legal Aid & Advocacy Organizations
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {ORGANIZATIONS.map((org) => (
            <OrganizationCard key={org.name} org={org} />
          ))}
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-semibold mb-4">Other Ways to Help</h2>
        <ul className="space-y-3 text-gray-600 dark:text-gray-300">
          <li>
            <strong>Volunteer:</strong> Many organizations need volunteers for
            legal clinics, translation services, and community support.
          </li>
          <li>
            <strong>Pro Bono Legal Work:</strong> If you&apos;re an attorney,
            consider taking pro bono immigration cases through organizations
            like KIND or the Immigration Advocates Network.
          </li>
          <li>
            <strong>Community Support:</strong> Local mutual aid networks and
            rapid response teams help protect community members during
            enforcement actions.
          </li>
          <li>
            <strong>Advocacy:</strong> Contact your representatives about
            immigration policy and support sanctuary measures in your community.
          </li>
        </ul>
      </section>

      <footer className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-8">
        <p>
          This page links to independent organizations. We are not affiliated
          with these organizations and receive no compensation for these
          referrals. Please verify current information directly with each
          organization.
        </p>
      </footer>
    </main>
  );
}
