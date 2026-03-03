
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const bugResolvedEmail = (userName, bugTitle, referenceId) => {
    const content = `
        <h1 style="${emailStyles.h1}">Bug résolu ! 🚀</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName || 'Cher utilisateur'}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Bonne nouvelle ! Le bug que vous avez signalé a été corrigé par notre équipe technique.
        </p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-weight: bold;">Détails du rapport :</p>
            <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">
                <strong>Sujet :</strong> ${bugTitle}<br>
                <strong>Référence :</strong> ${referenceId}
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Merci encore pour votre contribution à l'amélioration de la plateforme ESTT Community. Votre aide est précieuse pour toute la communauté.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://estt-community.vercel.app/" style="${emailStyles.button}">
                Visiter la plateforme
            </a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Si vous remarquez que le problème persiste ou si vous avez d'autres questions, n'hésitez pas à nous le faire savoir.
        </p>
    `;

    return baseLayout(content);
};
