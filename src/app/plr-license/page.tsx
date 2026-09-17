export const metadata = {
  title: "PLR License Agreement — AiDigitalProducts.com",
  robots: { index: false },
};

export default function PlrLicensePage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-gray-800">
      <a href="/" className="text-sm text-gray-500 hover:text-gray-800 no-underline">
        &larr; Back to AiDigitalProducts.com
      </a>

      <h1 className="text-3xl font-semibold mt-6 mb-2">
        Personal Label Rights (PLR) License Agreement
      </h1>
      <p className="text-sm text-gray-500 mb-10">
        This license applies to any product purchased on AiDigitalProducts.com
        with a PLR license.
      </p>

      <p className="text-sm text-gray-600 mb-8">
        <strong>Licensor:</strong> HONNYDO LLC ("Licensor," "we," "us")
        <br />
        This license is granted upon full payment of the purchase price for a
        PLR-licensed product ("the Product") on AiDigitalProducts.com.
      </p>

      <Section title="1. Grant of License">
        Licensor grants Licensee a non-exclusive, non-transferable license to
        use, modify, rebrand, and resell the Product, subject to the
        restrictions below. This license applies per purchase — a separate
        license is required for each individual or business entity that will
        resell the Product.
      </Section>

      <Section title="2. What You May Do">
        <ul className="list-disc pl-5 space-y-1">
          <li>Edit, rebrand, and customize the Product, including names, logos, branding, and content.</li>
          <li>Resell or give away the modified or unmodified Product as your own, finished product, under your own brand name.</li>
          <li>Use the Product, or derivatives of it, across multiple brands or businesses you own.</li>
          <li>Keep 100% of the revenue from your own sales of the Product.</li>
          <li>Bundle the Product with other products you sell, as part of a package.</li>
        </ul>
      </Section>

      <Section title="3. What You May Not Do">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            You may not resell, transfer, sublicense, or otherwise grant PLR,
            resale rights, or "master resell rights" in the Product, or in
            any modified version of it, to anyone else. Anyone who purchases
            the Product (or a rebranded version of it) from you receives a
            personal-use license only.
          </li>
          <li>
            You may not distribute or share the raw, unmodified source files
            publicly, for free or for payment, in a way that grants others
            the ability to resell them.
          </li>
          <li>
            You may not claim to be the original creator of the underlying
            Product when doing so would misrepresent authorship in a legal
            filing, trademark application, or copyright registration.
            Rebranding the Product for sale to your customers is expressly
            permitted; claiming original authorship for registration
            purposes is not.
          </li>
          <li>
            You may not use HONNYDO LLC's name, logo, or brand in a way that
            implies endorsement, partnership, or affiliation, unless
            separately agreed in writing.
          </li>
        </ul>
      </Section>

      <Section title="4. End-User License (Your Buyers)">
        Any license you issue to your own buyers must be personal-use only,
        and must not grant them resale, distribution, or further
        sublicensing rights of any kind. You are responsible for ensuring
        your own buyers are aware of this restriction.
      </Section>

      <Section title="5. No Warranty">
        The Product is provided "as-is," without warranty of any kind,
        express or implied, including but not limited to fitness for a
        particular purpose, accuracy, or non-infringement. Licensee assumes
        all risk associated with use, modification, and resale of the
        Product.
      </Section>

      <Section title="6. No Refunds">
        Due to the nature of digital products and the rights granted upon
        delivery, all sales are final.
      </Section>

      <Section title="7. Termination">
        Licensor may terminate this license if Licensee violates any term of
        this agreement, including reselling PLR/resale rights in violation
        of Section 3. Upon termination, Licensee must cease all resale and
        distribution of the Product.
      </Section>

      <Section title="8. Governing Law">
        This agreement is governed by the laws of the State of Arizona,
        United States, without regard to conflict-of-law principles.
      </Section>

      <p className="text-xs text-gray-400 mt-12 pt-6 border-t border-gray-200">
        This page is general template language and is not a substitute for
        advice from a qualified attorney. Consider having it reviewed before
        relying on it for actual sales.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-medium mb-2">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}