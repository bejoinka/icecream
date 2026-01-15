import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resources - Know Your Rights & Legal Information",
  description:
    "Real resources for understanding your rights and finding legal help. This is not legal advice.",
};

interface Resource {
  title: string;
  description: string;
  url: string;
  type: "guide" | "hotline" | "directory" | "organization";
}

const KNOW_YOUR_RIGHTS: Resource[] = [
  {
    title: "ACLU Know Your Rights: Immigrants' Rights",
    description:
      "Comprehensive guide covering your rights during encounters with immigration officers, at airports, at work, and at home.",
    url: "https://www.aclu.org/know-your-rights/immigrants-rights",
    type: "guide",
  },
  {
    title: "National Immigration Law Center: Know Your Rights",
    description:
      "Resources on rights at work, access to services, and what to do if you're stopped by immigration agents.",
    url: "https://www.nilc.org/get-involved/community-education-resources/know-your-rights/",
    type: "guide",
  },
  {
    title: "United We Dream: Deportation Defense",
    description:
      "Guides on preparing for immigration enforcement, family preparedness planning, and community defense.",
    url: "https://unitedwedream.org/our-work/deportation-defense/",
    type: "guide",
  },
  {
    title: "Immigrant Legal Resource Center: Red Cards",
    description:
      "Printable cards in multiple languages asserting your constitutional rights if approached by immigration agents.",
    url: "https://www.ilrc.org/red-cards",
    type: "guide",
  },
];

const HOTLINES: Resource[] = [
  {
    title: "National Immigrant Family Unity Hotline",
    description:
      "United We Dream's hotline for reporting raids and getting connected to local rapid response networks.",
    url: "tel:1-844-363-1423",
    type: "hotline",
  },
  {
    title: "ICE Detention Reporting Hotline",
    description:
      "Report immigration detention or find a detained family member.",
    url: "tel:1-888-351-4024",
    type: "hotline",
  },
  {
    title: "National Immigration Legal Services Hotline",
    description:
      "Catholic Charities immigration legal assistance line (available in many cities).",
    url: "https://www.catholiccharitiesusa.org/find-help/",
    type: "directory",
  },
];

const LEGAL_DIRECTORIES: Resource[] = [
  {
    title: "Immigration Advocates Network Legal Services Directory",
    description:
      "Search for free or low-cost immigration legal services in your area.",
    url: "https://www.immigrationadvocates.org/nonprofit/legaldirectory/",
    type: "directory",
  },
  {
    title: "CLINIC Legal Services Directory",
    description:
      "Catholic Legal Immigration Network directory of accredited representatives and attorneys.",
    url: "https://cliniclegal.org/resources/directory",
    type: "directory",
  },
  {
    title: "American Immigration Lawyers Association: Find a Lawyer",
    description: "Search for immigration attorneys by location and practice area.",
    url: "https://www.ailalawyer.com/",
    type: "directory",
  },
  {
    title: "DOJ Accredited Representatives",
    description:
      "Official list of DOJ-accredited representatives who can provide immigration legal services.",
    url: "https://www.justice.gov/eoir/recognized-organizations-and-accredited-representatives-roster-state-and-city",
    type: "directory",
  },
];

const ADDITIONAL_RESOURCES: Resource[] = [
  {
    title: "Informed Immigrant",
    description:
      "Curated, verified information and resources for immigrants and those who serve them.",
    url: "https://www.informedimmigrant.com/",
    type: "organization",
  },
  {
    title: "National Immigrant Justice Center",
    description:
      "Provides legal services and policy advocacy for immigrants, refugees, and asylum seekers.",
    url: "https://immigrantjustice.org/",
    type: "organization",
  },
  {
    title: "American Friends Service Committee: Immigrant Rights",
    description:
      "Community education, legal support referrals, and immigrant rights advocacy.",
    url: "https://www.afsc.org/issues/immigrant-rights",
    type: "organization",
  },
];

function ResourceCard({ resource }: { resource: Resource }) {
  const isPhone = resource.url.startsWith("tel:");

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold mb-1">{resource.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {resource.description}
          </p>
        </div>
        <a
          href={resource.url}
          target={isPhone ? undefined : "_blank"}
          rel={isPhone ? undefined : "noopener noreferrer"}
          className="shrink-0 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm font-medium transition-colors"
        >
          {isPhone ? "Call" : "Visit"}
        </a>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Game
        </Link>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Resources</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Real information for real situations. These resources are provided for
          educational purposes.
        </p>
      </header>

      {/* Important Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-12">
        <h2 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
          Important Notice
        </h2>
        <p className="text-amber-700 dark:text-amber-300 text-sm">
          <strong>This is not legal advice.</strong> Every situation is
          different. The information here is for general education only. If you
          or someone you know is facing immigration issues, please consult with
          a qualified immigration attorney or accredited representative. Many
          organizations listed below offer free or low-cost consultations.
        </p>
      </div>

      {/* Know Your Rights */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">Know Your Rights</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Understanding your constitutional rights is the first step. These
          guides explain what rights you have during encounters with law
          enforcement and immigration officials.
        </p>
        <div className="space-y-4">
          {KNOW_YOUR_RIGHTS.map((resource) => (
            <ResourceCard key={resource.title} resource={resource} />
          ))}
        </div>
      </section>

      {/* Hotlines */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">Hotlines & Rapid Response</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Emergency contacts and reporting lines for immigration-related
          situations.
        </p>
        <div className="space-y-4">
          {HOTLINES.map((resource) => (
            <ResourceCard key={resource.title} resource={resource} />
          ))}
        </div>
      </section>

      {/* Legal Directories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">Find Legal Help</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Directories to find immigration attorneys and accredited
          representatives in your area. Many offer free consultations or
          sliding-scale fees.
        </p>
        <div className="space-y-4">
          {LEGAL_DIRECTORIES.map((resource) => (
            <ResourceCard key={resource.title} resource={resource} />
          ))}
        </div>
      </section>

      {/* Additional Organizations */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">Additional Organizations</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Organizations providing advocacy, education, and support services.
        </p>
        <div className="space-y-4">
          {ADDITIONAL_RESOURCES.map((resource) => (
            <ResourceCard key={resource.title} resource={resource} />
          ))}
        </div>
      </section>

      {/* Preparation Tips */}
      <section className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-semibold mb-4">Family Preparedness</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Organizations recommend having a plan in place. Consider:
        </p>
        <ul className="space-y-2 text-gray-600 dark:text-gray-300 list-disc list-inside">
          <li>Keeping important documents in a secure, accessible place</li>
          <li>Having emergency contacts memorized or written down</li>
          <li>Designating a trusted person to care for children if needed</li>
          <li>Knowing your rights and how to assert them calmly</li>
          <li>Having a family communication plan</li>
        </ul>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          For detailed preparedness guides, visit{" "}
          <a
            href="https://unitedwedream.org/our-work/deportation-defense/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            United We Dream&apos;s Deportation Defense resources
          </a>
          .
        </p>
      </section>

      <footer className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-8">
        <p className="mb-2">
          <strong>Disclaimer:</strong> This page is for informational purposes
          only and does not constitute legal advice. Laws and policies change
          frequently. Always consult with a qualified legal professional for
          advice about your specific situation.
        </p>
        <p>
          We are not affiliated with the organizations listed here and cannot
          guarantee the accuracy of external content. Please verify current
          information directly with each organization.
        </p>
      </footer>
    </main>
  );
}
