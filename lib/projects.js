export const PROJECT_CATEGORIES = [
    { value: 'web', label: 'Web development' },
    { value: 'mobile', label: 'Mobile development' },
    { value: 'ai', label: 'AI and machine learning' },
    { value: 'embedded', label: 'Embedded systems' },
    { value: 'networking', label: 'Networking' },
    { value: 'cybersecurity', label: 'Cybersecurity' },
    { value: 'ui-ux', label: 'UI and UX' },
    { value: 'data', label: 'Data science' },
    { value: 'automation', label: 'Automation' },
    { value: 'club-tools', label: 'Club tools' },
    { value: 'education', label: 'Education tools' },
];

export const PROJECT_DIFFICULTIES = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
];

export const PROJECT_STATUSES = [
    { value: 'open', label: 'Ouvert' },
    { value: 'closed', label: 'Ferme' },
    { value: 'completed', label: 'Termine' },
];

export const PROJECT_VOTE_MODE = 'single_vote_per_project';

const ensureArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => `${item}`.trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return parseCommaSeparatedList(value);
    }
    return [];
};

export function slugifyProjectTitle(value = '') {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function normalizeExternalUrl(value = '') {
    const trimmed = `${value || ''}`.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    return `https://${trimmed}`;
}

export function parseCommaSeparatedList(value = '') {
    return `${value || ''}`
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function parseLineSeparatedList(value = '') {
    return `${value || ''}`
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function buildProjectAuthorName(profile, user) {
    if (profile?.firstName || profile?.lastName) {
        return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
    }

    if (user?.displayName) {
        return user.displayName;
    }

    if (user?.email) {
        return user.email.split('@')[0];
    }

    return 'Etudiant ESTT';
}

export function getProjectCategoryLabel(value = '') {
    return PROJECT_CATEGORIES.find((item) => item.value === value)?.label || value || 'General';
}

export function getProjectDifficultyLabel(value = '') {
    return PROJECT_DIFFICULTIES.find((item) => item.value === value)?.label || value || 'Open';
}

export function getProjectStatusLabel(value = '') {
    return PROJECT_STATUSES.find((item) => item.value === value)?.label || value || 'Ouvert';
}

export function getProjectStatusClasses(value = '') {
    switch (value) {
        case 'completed':
            return 'border-slate-200 bg-slate-100 text-slate-700';
        case 'closed':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'open':
        default:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
}

export function getDifficultyClasses(value = '') {
    switch (value) {
        case 'advanced':
            return 'border-rose-200 bg-rose-50 text-rose-700';
        case 'intermediate':
            return 'border-sky-200 bg-sky-50 text-sky-700';
        case 'beginner':
        default:
            return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    }
}

export function formatProjectDate(timestamp) {
    if (!timestamp) return 'Date inconnue';
    return new Date(timestamp).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function getProjectVoteModeLabel(value = '') {
    if (value === PROJECT_VOTE_MODE) {
        return '1 vote par projet';
    }
    return 'Vote libre';
}

export function getFirstProjectImage(item) {
    return item?.coverImage || item?.screenshots?.[0] || '';
}

export function normalizeProject(id, data = {}) {
    return {
        id,
        title: data.title || 'Projet sans titre',
        slug: data.slug || slugifyProjectTitle(data.title || id),
        summary: data.summary || '',
        description: data.description || '',
        category: data.category || 'web',
        difficulty: data.difficulty || 'beginner',
        tags: ensureArray(data.tags),
        skills: ensureArray(data.skills),
        requirements: ensureArray(data.requirements),
        evaluationCriteria: ensureArray(data.evaluationCriteria),
        status: data.status || 'open',
        moderationStatus: data.moderationStatus || 'approved',
        coverImage: normalizeExternalUrl(data.coverImage || ''),
        voteMode: data.voteMode || PROJECT_VOTE_MODE,
        featured: Boolean(data.featured),
        createdBy: data.createdBy || '',
        authorName: data.authorName || 'Etudiant ESTT',
        createdAt: Number(data.createdAt || 0),
        deadline: Number(data.deadline || 0) || null,
        submissionCount: Number(data.submissionCount || 0),
    };
}

export function normalizeSubmission(id, data = {}) {
    return {
        id,
        projectId: data.projectId || '',
        authorId: data.authorId || '',
        authorName: data.authorName || 'Etudiant ESTT',
        projectTitle: data.projectTitle || '',
        title: data.title || 'Implementation sans titre',
        description: data.description || '',
        githubUrl: normalizeExternalUrl(data.githubUrl || ''),
        demoUrl: normalizeExternalUrl(data.demoUrl || ''),
        coverImage: normalizeExternalUrl(data.coverImage || ''),
        screenshots: ensureArray(data.screenshots).map(normalizeExternalUrl).filter(Boolean),
        techStack: ensureArray(data.techStack),
        notes: data.notes || '',
        status: data.status || 'approved',
        createdAt: Number(data.createdAt || 0),
        votesCount: Number(data.votesCount || 0),
        commentsCount: Number(data.commentsCount || 0),
    };
}

export function normalizeShowcase(id, data = {}) {
    return {
        id,
        authorId: data.authorId || '',
        authorName: data.authorName || 'Etudiant ESTT',
        title: data.title || 'Projet sans titre',
        summary: data.summary || '',
        description: data.description || '',
        category: data.category || 'web',
        tags: ensureArray(data.tags),
        techStack: ensureArray(data.techStack),
        githubUrl: normalizeExternalUrl(data.githubUrl || ''),
        demoUrl: normalizeExternalUrl(data.demoUrl || ''),
        coverImage: normalizeExternalUrl(data.coverImage || ''),
        screenshots: ensureArray(data.screenshots).map(normalizeExternalUrl).filter(Boolean),
        status: data.status || 'approved',
        createdAt: Number(data.createdAt || 0),
        votesCount: Number(data.votesCount || 0),
        featured: Boolean(data.featured),
    };
}

export function isProjectVisible(project) {
    return project?.moderationStatus !== 'rejected';
}

export function getProjectRuntimeStatus(project) {
    if (!project) return 'open';
    if (project.status === 'completed') return 'completed';
    if (project.status === 'closed') return 'closed';
    if (project.deadline && project.deadline < Date.now()) return 'closed';
    return 'open';
}

export function sortByNewest(first, second) {
    return (second?.createdAt || 0) - (first?.createdAt || 0);
}

export function countUniqueAuthors(items = []) {
    return new Set(items.map((item) => item.authorId).filter(Boolean)).size;
}
