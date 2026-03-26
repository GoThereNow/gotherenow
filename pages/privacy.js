import Nav from '../components/Nav'
import Head from 'next/head'
import Link from 'next/link'

export default function Privacy() {
  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>Privacy Policy — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }
        .wrap { max-width: 720px; margin: 0 auto; padding: 100px 24px 80px; }
        .page-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .page-title { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 700; color: #1a6b7a; margin-bottom: 8px; }
        .page-date { font-size: 13px; color: rgba(26,107,122,0.45); margin-bottom: 48px; }
        h2 { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1a6b7a; margin: 36px 0 12px; }
        p { font-size: 15px; color: rgba(26,107,122,0.75); line-height: 1.8; margin-bottom: 16px; }
        ul { padding-left: 20px; margin-bottom: 16px; }
        li { font-size: 15px; color: rgba(26,107,122,0.75); line-height: 1.8; margin-bottom: 6px; }
        a { color: #1a6b7a; }
        .contact-box { background: white; border-radius: 16px; padding: 24px; border: 1px solid rgba(26,107,122,0.1); margin-top: 48px; }
        .contact-box p { margin: 0; }
      `}</style>

      <Nav />

      <div className="wrap">
        <div className="page-eyebrow">legal</div>
        <h1 className="page-title">Privacy Policy</h1>
        <div className="page-date">Last updated: March 2026</div>

        <p>GoThereNow ("we", "our", or "us") is committed to protecting your privacy. This policy explains how we collect, use, and share information about you when you use GoThereNow.</p>

        <h2>Information We Collect</h2>
        <p>We collect information you provide directly to us when you:</p>
        <ul>
          <li>Create an account (name, email address, password)</li>
          <li>Complete your profile (bio, profile photo, social media links)</li>
          <li>Add hotel recommendations (hotel names, locations, photos, quotes)</li>
          <li>Interact with content (likes, comments, follows)</li>
          <li>Subscribe to our mailing list (email address)</li>
        </ul>
        <p>We also automatically collect certain information when you use our service, including your IP address, browser type, pages visited, and referring URLs.</p>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To provide, maintain, and improve our services</li>
          <li>To process transactions and send related information</li>
          <li>To send you technical notices, updates, and support messages</li>
          <li>To send marketing communications (with your consent)</li>
          <li>To track affiliate commissions and process payouts</li>
          <li>To monitor and analyze usage patterns</li>
        </ul>

        <h2>Affiliate Links & Commission Tracking</h2>
        <p>GoThereNow uses affiliate links to earn commissions when users book hotels through our platform. When you click a booking link, we may redirect you through an affiliate tracking system that records the click. This is how we — and the creators who recommend hotels — earn commission. We work with Expedia, Booking.com, and other travel platforms through their affiliate programs.</p>

        <h2>Cookies</h2>
        <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

        <h2>Sharing Your Information</h2>
        <p>We do not sell your personal information. We may share your information with:</p>
        <ul>
          <li>Service providers who perform services on our behalf (Supabase for database, Vercel for hosting, Mailchimp for email)</li>
          <li>Affiliate partners as required to track and pay commissions</li>
          <li>Law enforcement when required by law</li>
        </ul>

        <h2>Your Rights (GDPR)</h2>
        <p>If you are located in the European Economic Area, you have certain rights regarding your personal data, including the right to access, correct, or delete your data. To exercise these rights, please contact us at the email below.</p>

        <h2>Data Retention</h2>
        <p>We retain your personal information for as long as your account is active or as needed to provide you services. You may delete your account at any time by contacting us.</p>

        <h2>Children's Privacy</h2>
        <p>GoThereNow is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>

        <h2>Changes to This Policy</h2>
        <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the date above.</p>

        <div className="contact-box">
          <p>Questions about this policy? Contact us at <a href="mailto:support@gotherenow.app">support@gotherenow.app</a></p>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}

