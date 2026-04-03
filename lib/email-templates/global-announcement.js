import { baseLayout } from './layout';
import { emailStyles } from './styles';

/**
 * Global Announcement Email Template
 * @param {string} title - The title/heading of the announcement
 * @param {string} content - The main body text
 * @param {string} ctaLabel - Optional button label
 * @param {string} ctaLink - Optional button link
 * @param {string} coverImageUrl - Optional header image
 * @returns {string} - Full HTML email content
 */
export const globalAnnouncementEmail = (title, content, ctaLabel, ctaLink, coverImageUrl) => {
    // Process content to handle new lines as paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    const contentHtml = paragraphs.map(p => `<p style="${emailStyles.paragraph}">${p}</p>`).join('');

    const themeColor = '#2563eb'; // Default ESTT Primary Blue
    const buttonStyle = `${emailStyles.button}; background-color: ${themeColor};`;
    const headerAccentStyle = `border-top: 4px solid ${themeColor};`;

    const mainContent = `
        <div style="${headerAccentStyle} padding: 30px 0; border-bottom: 1px solid #f8fafc; margin-bottom: 40px; text-align: center;">
            <img src="https://i.ibb.co/Y4rHtbvR/icon-512x512-maskable.png" alt="ESTT-Plus Icon" style="width: 80px; height: 80px; display: inline-block;">
        </div>

        ${coverImageUrl ? `
        <div style="margin-bottom: 30px;">
            <img src="${coverImageUrl}" alt="Announcement Image" style="width: 100%; height: auto; border-radius: 8px; display: block; max-height: 400px; object-fit: cover;">
        </div>
        ` : ''}

        <h1 style="${emailStyles.h1}">${title}</h1>
        
        <div style="margin-bottom: 30px; color: #334155;">
            ${contentHtml}
        </div>
        
        ${ctaLabel && ctaLink ? `
        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
            <a href="${ctaLink}" style="${buttonStyle}">${ctaLabel}</a>
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">
            <p style="${emailStyles.paragraph}">
                Cordialement,<br>
                <strong>L'équipe ESTT-Community</strong>
            </p>
        </div>
    `;

    return baseLayout(mainContent);
};
