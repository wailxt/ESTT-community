
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const eventReminderEmail = (event, club, ticketId) => {
    const clubName = club?.name || 'Votre club';
    const clubLogo = club?.logo;
    const eventImage = event?.imageUrl;
    const ticketUrl = `https://estt-community.vercel.app/tickets/${ticketId}`;

    const content = `
        <div style="text-align: center; margin-bottom: 30px;">
            ${clubLogo ? `<img src="${clubLogo}" alt="${clubName}" style="${emailStyles.clubLogo}">` : ''}
            <h1 style="${emailStyles.h1}; margin-bottom: 5px;">Rappel d'événement</h1>
            <p style="color: #64748b; font-size: 16px; margin-top: 0;">Organisé par <strong>${clubName}</strong></p>
        </div>

        ${eventImage ? `
            <img src="${eventImage}" alt="${event.title}" style="${emailStyles.eventImage}">
        ` : ''}

        <h2 style="${emailStyles.h2}">${event.title}</h2>
        
        <p style="${emailStyles.paragraph}">
            Bonjour,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Ceci est un rappel pour l'événement <strong>${event.title}</strong> auquel vous êtes inscrit. Nous avons hâte de vous y voir !
        </p>

        <div style="${emailStyles.highlightBox}">
            <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${event.date || 'À venir'} ${event.time ? `à ${event.time}` : ''}</p>
            <p style="margin: 5px 0;"><strong>📍 Lieu :</strong> ${event.location || 'Campus'}</p>
        </div>

        ${ticketId ? `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${ticketUrl}" style="${emailStyles.button}">Voir mon billet</a>
            </div>
        ` : ''}

        ${event.description ? `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="${emailStyles.paragraph}">${event.description}</p>
            </div>
        ` : ''}

        <p style="${emailStyles.paragraph}; margin-top: 30px;">
            À très bientôt,
        </p>
        
        <p style="font-weight: bold; color: #0f172a; margin-top: 0;">
            L'équipe ${clubName}
        </p>
    `;

    return baseLayout(content);
};
