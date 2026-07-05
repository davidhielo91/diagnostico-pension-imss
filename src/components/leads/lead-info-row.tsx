export function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted uppercase tracking-wider font-medium flex items-center gap-1">
        <Icon className="h-3 w-3 opacity-70" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-card-foreground">{value}</dd>
    </div>
  );
}
