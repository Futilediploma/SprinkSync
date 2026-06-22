import { useState } from 'react';
import fieldfabLogo from '../assets/field_fab.jpg';
import AuthScreen from './AuthScreen';
import { ApiError } from '../api/client';
import { submitSalesLead } from '../api/sales';
import './MarketingLanding.css';

interface MarketingLandingProps {
  onAuth: () => void;
}

export default function MarketingLanding({ onAuth }: MarketingLandingProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesSuccess, setSalesSuccess] = useState(false);
  const [salesError, setSalesError] = useState('');
  const [salesForm, setSalesForm] = useState({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
    company_size: '',
    message: '',
  });
  const stripeUpgradeUrl = import.meta.env.VITE_STRIPE_UPGRADE_URL as string | undefined;

  const handleContactSales = () => {
    setSalesError('');
    setSalesSuccess(false);
    setShowSalesForm(true);
  };

  const handleUpgrade = () => {
    if (stripeUpgradeUrl) {
      window.open(stripeUpgradeUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setShowAuth(true);
  };

  const updateSalesField = (field: keyof typeof salesForm, value: string) => {
    setSalesForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalesError('');
    setSalesLoading(true);
    try {
      await submitSalesLead({
        full_name: salesForm.full_name.trim(),
        email: salesForm.email.trim(),
        company_name: salesForm.company_name.trim(),
        phone: salesForm.phone.trim() || undefined,
        company_size: salesForm.company_size.trim() || undefined,
        message: salesForm.message.trim(),
      });
      setSalesSuccess(true);
      setSalesForm({
        full_name: '',
        email: '',
        company_name: '',
        phone: '',
        company_size: '',
        message: '',
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setSalesError(err.message);
      } else {
        setSalesError('Unable to send request right now. Please try again.');
      }
    } finally {
      setSalesLoading(false);
    }
  };

  return (
    <div className="marketing-page">
      <div className="marketing-grid-overlay" aria-hidden="true" />

      <header className="marketing-topbar">
        <div className="marketing-brand">
          <img src={fieldfabLogo} alt="FieldFab logo" className="marketing-logo" />
          <div>
            <div className="marketing-brand-row">
              <div className="marketing-brand-title">FieldFab</div>
              <span className="marketing-version-pill">v0.2 beta</span>
            </div>
            <div className="marketing-brand-sub">Fabrication Management</div>
          </div>
        </div>
        <button className="marketing-ghost-button" onClick={() => setShowAuth(true)}>
          Log In
        </button>
      </header>

      <main className="marketing-main">
        <section className="marketing-hero">
          <p className="marketing-kicker">Built for organized field operations</p>
          <h1>Keep every project organized, accessible, and moving.</h1>
          <p className="marketing-copy">
            FieldFab gives field teams and fabrication crews one place to organize pipe pieces,
            welded outlets, and loose material—accessible from the office, shop, or jobsite.
          </p>
          <div className="marketing-cta-row">
            <button className="marketing-primary-button" onClick={() => setShowAuth(true)}>
              Start Free
            </button>
            <button className="marketing-secondary-button" onClick={handleContactSales}>
              Contact FieldFab Team
            </button>
          </div>
          <div className="marketing-plan-note">Keep project details clear, field information easy to reach, and every handoff organized.</div>
        </section>

        <section className="marketing-panel marketing-panel-steps">
          <div className="marketing-panel-title">Organized Project Flow</div>
          <div className="marketing-step">
            <span>01</span>
            <div>Create each project and keep job details in one place.</div>
          </div>
          <div className="marketing-step">
            <span>02</span>
            <div>Organize pipe specs, welded outlets, and loose material.</div>
          </div>
          <div className="marketing-step">
            <span>03</span>
            <div>Access and export clear fabrication information from anywhere.</div>
          </div>
        </section>
      </main>

      <section className="marketing-metrics">
        <div className="marketing-metric-card">
          <div className="marketing-metric-value">One Workspace</div>
          <div className="marketing-metric-label">Projects and materials organized</div>
        </div>
        <div className="marketing-metric-card">
          <div className="marketing-metric-value">Field Access</div>
          <div className="marketing-metric-label">Job information wherever you work</div>
        </div>
        <div className="marketing-metric-card">
          <div className="marketing-metric-value">Clear Handoffs</div>
          <div className="marketing-metric-label">Export-ready records for every team</div>
        </div>
      </section>

      <section className="marketing-pricing" aria-label="Pricing">
        <article className="marketing-price-card">
          <div className="marketing-price-eyebrow">Free</div>
          <h3>Development access</h3>
          <p>Use FieldFab on active jobs while v0.2 is being tested.</p>
          <div className="marketing-beta-badge">2 projects during development</div>
          <ul>
            <li>2 active projects during development</li>
            <li>Pipe + outlet tracking</li>
            <li>Loose material lists</li>
            <li>PDF, CSV, and Excel exports</li>
          </ul>
          <button className="marketing-secondary-button" onClick={() => setShowAuth(true)}>Create Free Account</button>
        </article>

        <article className="marketing-price-card marketing-price-card-featured">
          <div className="marketing-price-eyebrow">Pro</div>
          <h3>For growing fabrication operations</h3>
          <p>Keep production moving without project limits.</p>
          <ul>
            <li>Unlimited active projects</li>
            <li>Priority support</li>
            <li>Team-ready growth path</li>
            <li>Expanded project and material list capacity</li>
            <li>Early access to material ordering and tracking tools as they launch</li>
          </ul>
          <button className="marketing-primary-button" onClick={handleUpgrade}>Upgrade to Pro</button>
        </article>
      </section>

      <section className="marketing-trust" aria-label="Trust">
        <article className="marketing-trust-item">
          <div className="marketing-trust-item-title">Built for Fire Protection Contractors</div>
          <div className="marketing-trust-item-body">Workflow is centered on how fabrication teams actually prep and ship jobs.</div>
        </article>
        <article className="marketing-trust-item">
          <div className="marketing-trust-item-title">Exports That Match Shop Reality</div>
          <div className="marketing-trust-item-body">PDF and spreadsheet outputs are ready for handoff, print, and field reference.</div>
        </article>
        <article className="marketing-trust-item">
          <div className="marketing-trust-item-title">Web + Jobsite Friendly</div>
          <div className="marketing-trust-item-body">Use it in the office or on mobile at the site without changing process.</div>
        </article>
      </section>

      {showAuth && (
        <div className="marketing-auth-shell" role="dialog" aria-modal="true" aria-label="Authentication">
          <div className="marketing-auth-head">
            <strong>Account Access</strong>
            <button className="marketing-close" onClick={() => setShowAuth(false)} aria-label="Close">
              x
            </button>
          </div>
          <AuthScreen onAuth={onAuth} variant="panel" />
        </div>
      )}

      {showSalesForm && (
        <div className="marketing-sales-overlay" role="dialog" aria-modal="true" aria-label="Contact FieldFab Team">
          <div className="marketing-sales-modal">
            <div className="marketing-sales-header">
              <strong>Contact FieldFab Team</strong>
              <button
                className="marketing-close"
                onClick={() => setShowSalesForm(false)}
                aria-label="Close"
                type="button"
              >
                x
              </button>
            </div>

            {salesSuccess ? (
              <div className="marketing-sales-success">
                <h3>Thanks. We got your request.</h3>
                <p>A FieldFab team member will reach out shortly.</p>
                <button className="marketing-primary-button" type="button" onClick={() => setShowSalesForm(false)}>
                  Close
                </button>
              </div>
            ) : (
              <form className="marketing-sales-form" onSubmit={handleSalesSubmit}>
                <label>
                  Full Name
                  <input
                    required
                    value={salesForm.full_name}
                    onChange={(e) => updateSalesField('full_name', e.target.value)}
                    maxLength={120}
                  />
                </label>
                <label>
                  Work Email
                  <input
                    type="email"
                    required
                    value={salesForm.email}
                    onChange={(e) => updateSalesField('email', e.target.value)}
                  />
                </label>
                <label>
                  Company
                  <input
                    required
                    value={salesForm.company_name}
                    onChange={(e) => updateSalesField('company_name', e.target.value)}
                    maxLength={160}
                  />
                </label>
                <div className="marketing-sales-row">
                  <label>
                    Phone (optional)
                    <input
                      value={salesForm.phone}
                      onChange={(e) => updateSalesField('phone', e.target.value)}
                      maxLength={40}
                    />
                  </label>
                  <label>
                    Team Size (optional)
                    <input
                      value={salesForm.company_size}
                      onChange={(e) => updateSalesField('company_size', e.target.value)}
                      maxLength={40}
                    />
                  </label>
                </div>
                <label>
                  What are you trying to solve?
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    value={salesForm.message}
                    onChange={(e) => updateSalesField('message', e.target.value)}
                  />
                </label>

                {salesError && <div className="marketing-sales-error">{salesError}</div>}

                <button className="marketing-primary-button" type="submit" disabled={salesLoading}>
                  {salesLoading ? 'Sending...' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
