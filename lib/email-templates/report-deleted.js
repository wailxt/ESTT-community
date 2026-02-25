import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const reportDeletedEmail = (userName, resourceTitle) => {
    const content = `
        <h1 style="${emailStyles.h1}">Action suite à votre signalement</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Nous vous informons que suite à votre signalement concernant la ressource "<strong>${resourceTitle}</strong>", celle-ci a été examinée et supprimée de notre plateforme.
        </p>
        
        <p style="${emailStyles.paragraph}">
            Merci beaucoup pour votre vigilance qui contribue grandement à maintenir la qualité et la sécurité de l'ESTT Community pour tous nos membres.
        </p>
        
        <p style="${emailStyles.paragraph}">
            L'équipe ESTT Community
        </p>
    `;

    return baseLayout(content);
};
