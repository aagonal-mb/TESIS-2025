// client/src/components/AuthLayout.jsx
export default function AuthLayout({ title, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>{title}</h1>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
