export function Stats() {
  const stats = [
    {
      value: "2,500+",
      label: "Active Users",
      description: "Renters using our platform",
    },
    {
      value: "15K+",
      label: "Listings Tracked",
      description: "New listings every month",
    },
    {
      value: "85%",
      label: "Success Rate",
      description: "Users find their home",
    },
    {
      value: "< 5min",
      label: "Average Response",
      description: "From listing to notification",
    },
  ];

  return (
    <section className="border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {stat.value}
              </div>
              <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-primary">
                {stat.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
