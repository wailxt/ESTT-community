import Image from 'next/image';
import Link from 'next/link';


export default function ClubCard({ club }) {
    const truncateDescription = (text, maxLength = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    return (
        <Link href={`/clubs/${club.id}`} className="h-full">
            <div className="group flex flex-col sm:flex-row items-center sm:items-start gap-3 md:gap-4 p-3 md:p-5 bg-white border border-slate-200 rounded-xl hover:border-primary/50 transition-colors cursor-pointer h-full text-center sm:text-left">
                <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                    {club.logo ? (
                        <Image
                            src={club.logo}
                            alt={`${club.name} logo`}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center text-lg md:text-xl font-bold"
                            style={{ color: club.themeColor || '#64748b' }}
                        >
                            {club.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-center sm:justify-start gap-1 md:gap-2 mb-1">
                        <h3 className="text-xs md:text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                            {club.name}
                        </h3>
                        {club.verified && (
                            <i className="fa-solid fa-circle-check text-blue-500 text-[10px] flex-shrink-0"></i>
                        )}
                    </div>
                    <p className="text-[10px] md:text-sm text-slate-500 line-clamp-2 md:line-clamp-3">
                        {truncateDescription(club.description, 80)}
                    </p>
                </div>
            </div>
        </Link>
    );
}
