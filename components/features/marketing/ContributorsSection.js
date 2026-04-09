'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Github, GitCommit } from 'lucide-react';

export default function ContributorsSection() {
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('https://api.github.com/repos/abdelhakim-sahifa/ESTT-community/contributors')
            .then((res) => {
                if (!res.ok) throw new Error('Impossible de charger les contributeurs.');
                return res.json();
            })
            .then((data) => {
                const filtered = data.filter((c) => c.login !== 'semantic-release-bot');
                setContributors(filtered);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section
            className="min-h-screen px-4 py-24 flex flex-col items-center"
            style={{
                background: 'linear-gradient(160deg, #eef4fb 0%, #f7fafd 50%, #edf3fa 100%)',
            }}
        >
            {/* Header */}
            <div className="text-center mb-14 max-w-xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-500 text-xs font-medium tracking-widest uppercase mb-6 shadow-sm">
                    <Github className="w-3 h-3" />
                    Open Source
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
                    Créé par les étudiants de l&apos;ESTT
                </h1>

                <p className="text-slate-500 text-base leading-relaxed">
                    Cette plateforme est propulsée par les contributions des{' '}
                    <span className="text-slate-700 font-medium">étudiants talentueux</span> de l&apos;EST Tétouan.
                    Rejoignez-nous et laissez votre marque&nbsp;!
                </p>
            </div>

            {/* Error */}
            {error && (
                <p className="text-red-500 font-medium text-sm mb-10">{error}</p>
            )}

            {/* Loading Skeletons */}
            {loading && (
                <div className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto mb-14">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-[170px] rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex flex-col items-center gap-3 animate-pulse"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-100" />
                            <div className="w-24 h-3.5 rounded-full bg-slate-100" />
                            <div className="w-16 h-3 rounded-full bg-slate-100" />
                            <div className="w-14 h-3 rounded-full bg-slate-100 mt-1" />
                        </div>
                    ))}
                </div>
            )}

            {/* Contributor Cards */}
            {!loading && !error && (
                <div className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto mb-14">
                    {contributors.map((c) => (
                        <div
                            key={c.id}
                            className="w-[170px] rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 flex flex-col items-center gap-2"
                        >
                            {/* Avatar */}
                            <div className="relative w-16 h-16 rounded-full overflow-hidden mb-1">
                                <Image
                                    src={c.avatar_url}
                                    alt={c.login}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            </div>

                            {/* Username */}
                            <p className="text-sm font-semibold text-slate-800 text-center truncate w-full">
                                {c.login}
                            </p>

                            {/* Commits */}
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <GitCommit className="w-3 h-3 text-blue-400" />
                                {c.contributions} commit{c.contributions > 1 ? 's' : ''}
                            </p>

                            {/* GitHub link */}
                            <Link
                                href={c.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors mt-1 font-medium"
                            >
                                <Github className="w-3 h-3" />
                                GitHub
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* CTA Button */}
            <Link
                href="https://github.com/abdelhakim-sahifa/ESTT-community"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors shadow-md"
            >
                <Github className="w-4 h-4" />
                Contribuer sur GitHub
            </Link>
        </section>
    );
}
