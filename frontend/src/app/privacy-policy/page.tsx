import { LegalDocument } from "@/components/marketing/legal-document";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata = marketingMetadata(
  "Privacy Policy",
  "How ReviveLead collects, uses, stores, discloses, and protects personal information.",
  "/privacy-policy",
);

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      dated="Effective Date: 18 August 2026 · Last Updated: 18 August 2026"
      intro="This Privacy Policy explains how ReviveLead collects, uses, stores, discloses, and protects personal information when you visit our website, create an account, use our services, or communicate with us."
    >
      <h2>1. About ReviveLead</h2>
      <p>
        ReviveLead is a software service operated from India for international B2B real-estate agencies and
        businesses. ReviveLead is currently not operated through a registered company entity. Our privacy
        contact is <a href="mailto:privacy@revivelead.io">privacy@revivelead.io</a>.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>Account and business information</h3>
      <p>
        We may collect your name, email address, company or agency information, account preferences,
        authentication information, subscription information, and information you provide to support.
      </p>
      <h3>Lead and customer information</h3>
      <p>
        Customers may upload or import lead information such as names, email addresses, phone numbers,
        property information, lead status, notes, communication history, lead source, and preferences.
      </p>
      <h3>Technical information</h3>
      <p>
        We may collect IP address, browser and device information, operating system, approximate technical
        location, access times, pages visited, application activity, and diagnostic information.
      </p>

      <h2>3. How We Use Information</h2>
      <ul>
        <li>Provide and operate ReviveLead.</li>
        <li>Create and secure accounts and authentication sessions.</li>
        <li>Process and manage customer lead data.</li>
        <li>Provide follow-up, automation, AI, and lead-management features.</li>
        <li>Provide customer support.</li>
        <li>Maintain security and prevent fraud or abuse.</li>
        <li>Improve performance and develop the product.</li>
        <li>Process subscriptions and payments through applicable providers.</li>
        <li>Send service-related communications.</li>
        <li>Comply with applicable law and protect our rights.</li>
      </ul>
      <p>We do not sell customer lead databases as a product.</p>

      <h2>4. Customer-Provided Lead Data</h2>
      <p>
        When a customer uploads lead or customer information, the customer is responsible for having the
        necessary legal basis, permissions, notices, and authority to process and contact those individuals.
        ReviveLead processes such information to provide the Services and according to the customer&apos;s
        instructions and applicable agreements.
      </p>

      <h2>5. Legal Bases</h2>
      <p>
        Where applicable law requires a legal basis, processing may rely on performance of a contract, legal
        obligations, consent, legitimate interests, or protection of rights and security.
      </p>

      <h2>6. Authentication, Infrastructure and Providers</h2>
      <p>
        ReviveLead may use third-party providers for authentication, cloud infrastructure, database hosting,
        payment processing, email delivery, analytics, security, customer support, and AI or automation
        features. Such providers may process information necessary to perform their services.
      </p>

      <h2>7. AI and Automated Processing</h2>
      <p>
        ReviveLead uses AI and automated functionality for features such as lead analysis, recommendations,
        follow-up assistance, or related workflows. AI outputs may contain errors or omissions. Customers
        remain responsible for reviewing outputs before relying on or sending them.
      </p>

      <h2>8. Payments</h2>
      <p>
        Paid subscriptions may be processed through Razorpay or other payment providers used by ReviveLead.
        Payment providers process payment information under their own applicable terms and privacy policies.
        ReviveLead does not intend to store complete payment-card numbers on its own systems.
      </p>

      <h2>9. Cookies and Similar Technologies</h2>
      <p>
        We may use cookies and similar technologies for authentication, sessions, preferences, security,
        analytics, and performance. Where legally required, appropriate consent will be obtained for
        non-essential technologies.
      </p>

      <h2>10. Data Retention and Deletion</h2>
      <p>
        We retain information only for as long as reasonably necessary for service delivery, security,
        contractual obligations, dispute resolution, and legal requirements. When an account is cancelled or
        deleted, customer data may be retained for a defined operational retention period before deletion,
        subject to applicable law, backups, and legal obligations.
      </p>

      <h2>11. Security</h2>
      <p>
        We use reasonable technical and organizational measures designed to protect information against
        unauthorized access, alteration, disclosure, loss, misuse, or destruction. No internet-based system
        can be guaranteed completely secure.
      </p>

      <h2>12. International Processing</h2>
      <p>
        Because ReviveLead serves international customers and may use infrastructure and providers in
        different countries, information may be processed outside the country in which it was collected.
        Where applicable law requires transfer safeguards, appropriate mechanisms will be used.
      </p>

      <h2>13. Your Privacy Rights</h2>
      <p>
        Depending on your jurisdiction, you may have rights including access, correction, deletion,
        restriction, objection, portability where applicable, withdrawal of consent, and the right to
        complain to an applicable regulator. We may need to verify your identity before processing a request.
      </p>

      <h2>14. India</h2>
      <p>
        Where applicable, ReviveLead will process digital personal data in accordance with applicable Indian
        data-protection requirements, including requirements that become applicable under India&apos;s Digital
        Personal Data Protection framework.
      </p>

      <h2>15. European Economic Area and United Kingdom</h2>
      <p>
        Where applicable privacy law applies, individuals may have additional rights concerning access,
        rectification, erasure, restriction, objection, and portability, subject to applicable legal
        conditions.
      </p>

      <h2>16. United Arab Emirates and Other Jurisdictions</h2>
      <p>
        Where applicable, ReviveLead will take into account relevant data-protection requirements in the
        jurisdictions in which it operates or serves customers, including applicable UAE personal-data
        protection requirements.
      </p>

      <h2>17. Children&apos;s Privacy</h2>
      <p>
        ReviveLead is a business software service and is not intended for children. We do not knowingly
        design the service to collect children&apos;s personal information.
      </p>

      <h2>18. Marketing Communications</h2>
      <p>
        We may send service-related communications necessary to operate an account. Where permitted and where
        appropriate, we may also send marketing communications. Marketing communications will provide an
        appropriate unsubscribe mechanism where required.
      </p>

      <h2>19. Security Incidents</h2>
      <p>
        If we become aware of a security incident involving personal information, we will assess it and take
        reasonable steps appropriate to the circumstances and applicable legal requirements, including
        notifications where legally required.
      </p>

      <h2>20. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy periodically. Material changes may be communicated through the
        Services or other appropriate means. The updated date identifies the current version.
      </p>

      <h2>21. Contact</h2>
      <p>
        For privacy questions or data requests, contact{" "}
        <a href="mailto:privacy@revivelead.io">privacy@revivelead.io</a>.
      </p>

      <p className="legal-doc-end">© 2026 ReviveLead. All rights reserved.</p>
    </LegalDocument>
  );
}
