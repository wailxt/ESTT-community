import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const reportDismissedEmail = (userName, resourceTitle) => {
    const content = `
        <h1 style="${emailStyles.h1}">Mise à jour de votre signalement</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Nous avons examiné votre signalement concernant la ressource "<strong>${resourceTitle}</strong>".
        </p>
        
        <p style="${emailStyles.paragraph}">
            Après vérification par notre équipe, nous avons décidé de ne pas supprimer ce contenu car il ne semble pas enfreindre nos règles. 
        </p>
        
        <p style="${emailStyles.paragraph}">
            Nous vous remercions toutefois pour votre vigilance qui contribue à maintenir la qualité de notre plateforme.
        </p>
        
        <p style="${emailStyles.paragraph}">
            L'équipe ESTT Community
        </p>
    `;

    return baseLayout(content);
};
