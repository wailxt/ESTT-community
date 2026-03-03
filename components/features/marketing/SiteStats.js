'use client';

export default function SiteStats({ stats }) {
    return (
        <section id="site-stats" className="py-12 border-y border-slate-100">
            <div className="container">
                <div className="grid grid-cols-3 gap-2 md:gap-6" id="stats-container">
                    {[
                        { value: stats.contributions, label: "En attente" },
                        { value: stats.resources, label: "Ressources" },
                        { value: stats.modules, label: "Modules" },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-2 md:p-6 text-center">
                            <div className="text-xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                            <div className="text-slate-500 text-[10px] md:text-sm font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
