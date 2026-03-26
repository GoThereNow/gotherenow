import Nav from '../components/Nav'
import Head from 'next/head'
import Link from 'next/link'

export default function Terms() {
  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>Terms of Service — GoThereNow</title>
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
        <h1 className="page-title">Terms of Service</h1>
        <div className="page-date">Last updated: March 2026</div>

        <p>Welcome to GoThereNow. By using our platform, you agree to these Terms of Service. Please read them carefully.</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using GoThereNow, you agree to be bound by these terms. If you do not agree, please do not use our service.</p>

        <h2>2. Your Account</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating your account.</p>

        <h2>3. Content You Post</h2>
        <p>By posting hotel recommendations, photos, quotes, or comments on GoThereNow, you grant us a non-exclusive, royalty-free license to use, display, and distribute that content on our platform. You represent that:</p>
        <ul>
          <li>You own or have the rights to post the content</li>
          <li>Your recommendations are based on genuine personal experience</li>
          <li>Your content does not violate any third-party rights</li>
          <li>Your content is not misleading, fraudulent, or harmful</li>
        </ul>

        <h2>4. Affiliate Commission Program</h2>
        <p>GoThereNow operates an affiliate commission program. When followers book hotels through your profile links, you may earn a commission. The following terms apply:</p>
        <ul>
          <li>Commission rates are set by GoThereNow and may change with notice</li>
          <li>Commissions are only paid on verified, completed bookings</li>
          <li>GoThereNow reserves the right to withhold commissions for fraudulent activity</li>
          <li>Payouts are processed monthly with a minimum threshold</li>
          <li>Tax obligations are the responsibility of the creator</li>
        </ul>

        <h2>5. Prohibited Conduct</h2>
        <p>You may not:</p>
        <ul>
          <li>Post fake or misleading hotel recommendations</li>
          <li>Manipulate affiliate links or attempt to fraudulently generate commissions</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Scrape, copy, or republish content from GoThereNow without permission</li>
          <li>Use our platform for any illegal purpose</li>
          <li>Create multiple accounts to circumvent restrictions</li>
        </ul>

        <h2>6. Booking Links & Third Parties</h2>
        <p>Booking links on GoThereNow direct users to third-party platforms (Expedia, Booking.com, etc.). GoThereNow is not responsible for the accuracy of pricing, availability, or the quality of bookings made through these platforms. Your relationship with those platforms is governed by their own terms and policies.</p>

        <h2>7. Intellectual Property</h2>
        <p>GoThereNow and its logo, design, and original content are owned by GoThereNow. You may not use our brand without written permission.</p>

        <h2>8. Termination</h2>
        <p>We may suspend or terminate your account at any time if you violate these terms or for any other reason at our discretion. You may delete your account at any time by contacting us.</p>

        <h2>9. Disclaimer of Warranties</h2>
        <p>GoThereNow is provided "as is" without warranties of any kind. We do not guarantee that hotel recommendations are accurate, that bookings will be available, or that the platform will be uninterrupted.</p>

        <h2>10. Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, GoThereNow shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>

        <h2>11. Changes to Terms</h2>
        <p>We may update these terms at any time. We will notify you of significant changes. Continued use of GoThereNow after changes constitutes acceptance of the new terms.</p>

        <h2>12. Governing Law</h2>
        <p>These terms are governed by the laws of Canada, without regard to conflict of law provisions.</p>

        <div className="contact-box">
          <p>Questions about these terms? Contact us at <a href="mailto:support@gotherenow.app">support@gotherenow.app</a></p>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}

