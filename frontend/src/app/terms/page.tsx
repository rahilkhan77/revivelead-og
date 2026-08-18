import { LegalDocument } from "@/components/marketing/legal-document";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata = marketingMetadata(
  "Terms & Conditions",
  "Terms governing access to and use of ReviveLead, including accounts, billing, cancellation, and acceptable use.",
  "/terms",
);

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms & Conditions"
      dated="Effective Date: 18 August 2026 · Last Updated: 18 August 2026"
      intro="These Terms & Conditions govern your access to and use of ReviveLead, including its website, software application, services, features, and related products."
    >
      <h2>1. Acceptance</h2>
      <p>
        By creating an account, accessing, or using ReviveLead, you agree to these Terms. If you do not
        agree, do not use the Services.
      </p>

      <h2>2. The Service</h2>
      <p>
        ReviveLead is software for international B2B real-estate agencies and businesses, designed to
        organize leads, manage follow-ups, automate workflows, and support lead recovery.
      </p>

      <h2>3. Eligibility and Accounts</h2>
      <p>
        You must provide accurate information and keep your account information reasonably current. You are
        responsible for protecting your credentials and for activity performed through your account.
      </p>

      <h2>4. Business Customers</h2>
      <p>
        If you use ReviveLead on behalf of a business or agency, you represent that you have authority to do
        so. The organization is responsible for its authorized users and their use of the Services.
      </p>

      <h2>5. Customer Data and Ownership</h2>
      <p>
        You retain ownership of the leads, contacts, notes, files, messages, and other content you submit to
        ReviveLead. You grant ReviveLead the limited rights necessary to host, process, transmit, display,
        and otherwise handle that content to provide the Services.
      </p>

      <h2>6. Customer Responsibility for Lead Data</h2>
      <p>
        You are responsible for ensuring that you have the legal right, required permissions, and
        appropriate notices to upload, process, or contact people whose information you provide to
        ReviveLead. You must comply with applicable privacy, marketing, telecommunications, and
        data-protection laws.
      </p>

      <h2>7. Acceptable Use</h2>
      <p>
        You must not use ReviveLead to violate applicable law, infringe rights, upload malicious code,
        obtain unauthorized access, disrupt the Services, abuse or overload infrastructure, send unlawful or
        deceptive communications, or process data without appropriate authority.
      </p>

      <h2>8. AI and Automated Features</h2>
      <p>
        ReviveLead may provide AI-generated lead analysis, recommendations, messages, and automated
        assistance. AI output is not guaranteed to be accurate or complete. Customers must review
        AI-generated content before sending, publishing, or relying on it.
      </p>

      <h2>9. Lead and Revenue Outcomes</h2>
      <p>
        ReviveLead is designed to support lead recovery and revenue generation. Where ReviveLead expressly
        offers a specific recovery or revenue guarantee for a particular plan or commercial arrangement, the
        applicable written offer will define the eligibility criteria, measurement method, scope,
        exclusions, and claim process. No general outcome guarantee is created merely by using the Services.
      </p>

      <h2>10. Subscriptions and Billing</h2>
      <p>
        ReviveLead may offer monthly and annual subscriptions. Applicable pricing, billing frequency, usage
        limits, taxes, and payment terms will be presented at purchase. Payments may be processed by
        Razorpay.
      </p>

      <h2>11. Cancellation and Refunds</h2>
      <p>
        Customers may cancel subscriptions at any time. Monthly subscription charges are non-refundable
        except where required by applicable law or expressly stated otherwise.
      </p>
      <p>
        For annual subscriptions, cancellation does not provide a refund of the remaining paid period. The
        subscription remains active through the end of the period already paid for.
      </p>

      <h2>12. Price Changes</h2>
      <p>
        ReviveLead may change pricing. Where a price change affects an existing subscription, we will
        provide notice before the change applies to the next billing cycle, subject to applicable law and
        any contractual commitments.
      </p>

      <h2>13. Suspension and Termination</h2>
      <p>
        We may suspend or terminate access where reasonably necessary because of fraud, abuse, illegal
        activity, security risk, non-payment, material Terms violations, or to comply with law. We may also
        take measures necessary to protect customers and the Services.
      </p>

      <h2>14. Data After Cancellation</h2>
      <p>
        After cancellation or termination, customer data may be retained for a defined operational retention
        period before deletion, subject to applicable law, backups, and legal requirements. Any data-export
        functionality available at the relevant time will be governed by the applicable product terms.
      </p>

      <h2>15. Third-Party Services</h2>
      <p>
        ReviveLead may integrate with authentication, infrastructure, payment, email, AI, analytics, and
        other third-party services. Your use of a third-party service may be subject to its separate terms
        and policies.
      </p>

      <h2>16. Intellectual Property</h2>
      <p>
        ReviveLead and its licensors retain all rights in the software, interface, branding, designs,
        documentation, technology, and other materials provided by ReviveLead, excluding customer content.
        These Terms do not transfer ownership of ReviveLead intellectual property.
      </p>

      <h2>17. Feedback</h2>
      <p>
        Suggestions and feedback you provide may be used by ReviveLead to improve the Services without
        compensation, provided that confidential information is not improperly disclosed.
      </p>

      <h2>18. Availability</h2>
      <p>
        We aim to provide reliable Services but do not guarantee uninterrupted or error-free operation.
        Maintenance, upgrades, security incidents, third-party failures, and circumstances beyond our
        reasonable control may affect availability.
      </p>

      <h2>19. Disclaimers</h2>
      <p>
        To the maximum extent permitted by applicable law, the Services are provided on an &quot;as is&quot; and
        &quot;as available&quot; basis. ReviveLead does not guarantee that the Services will always be
        uninterrupted, completely secure, or error-free.
      </p>

      <h2>20. Limitation of Liability</h2>
      <p>
        Any limitation of liability applicable to a particular subscription, order, or commercial agreement
        will be governed by that agreement and applicable law. Nothing in these Terms excludes or limits
        liability that cannot lawfully be excluded or limited.
      </p>

      <h2>21. Indemnification</h2>
      <p>
        To the extent permitted by applicable law, you agree to defend and indemnify ReviveLead and its
        personnel from third-party claims arising from your unlawful use of the Services, violation of these
        Terms, or infringement of third-party rights.
      </p>

      <h2>22. Governing Law</h2>
      <p>
        These Terms are governed by the laws of <strong>India</strong>, subject to mandatory applicable law.
      </p>

      <h2>23. Jurisdiction</h2>
      <p>
        Subject to applicable law and any mandatory dispute-resolution requirements, courts located in{" "}
        <strong>Delhi, India</strong> will have jurisdiction over disputes arising from these Terms.
      </p>

      <h2>24. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes may be communicated through the
        Services or other reasonable means. Continued use after the effective date constitutes acceptance to
        the extent permitted by law.
      </p>

      <h2>25. Severability</h2>
      <p>
        If any provision is found unenforceable, the remaining provisions remain effective to the extent
        permitted by applicable law.
      </p>

      <h2>26. Entire Agreement</h2>
      <p>
        These Terms, together with applicable order forms, subscription terms, data-processing agreements,
        and other written agreements, govern your use of the Services.
      </p>

      <h2>27. Contact</h2>
      <p>
        For general, account, billing, or technical support, contact{" "}
        <a href="mailto:support@revivelead.io">support@revivelead.io</a>.
      </p>

      <p className="legal-doc-end">© 2026 ReviveLead. All rights reserved.</p>
    </LegalDocument>
  );
}
