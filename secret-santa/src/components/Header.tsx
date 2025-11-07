export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <h1>{title}</h1>
      {subtitle && <div className="sub">{subtitle}</div>}
    </>
  );
}
