import ContributorsSection from '@/components/features/marketing/ContributorsSection';

export const metadata = {
    title: 'Contributeurs | ESTT Community',
    description:
        'Découvrez les étudiants qui ont contribué à la plateforme ESTT Community sur GitHub.',
};

export default function ContributorsPage() {
    return (
        <main className="min-h-screen pt-8">
            <ContributorsSection />
        </main>
    );
}
