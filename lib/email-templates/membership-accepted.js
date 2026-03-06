
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const membershipAcceptedEmail = (memberName, clubName, certificateLink) => {
    const content = `
        <h1 style="${emailStyles.h1}">Félicitations, ${memberName} !</h1>
        
        <p style="${emailStyles.paragraph}">
            Nous avons le plaisir de vous informer que votre demande d'adhésion au club <strong>${clubName}</strong> a été acceptée !
        </p>
        
        <div style="${emailStyles.highlightBox}">
            <p style="${emailStyles.paragraph}">
                Vous faites désormais partie de cette communauté. C'est le moment idéal pour découvrir les projets en cours et rencontrer les autres membres.
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            En tant que membre officiel, vous pouvez dès à présent télécharger votre <strong>Certificat d'Adhésion</strong> officiel et signé numériquement.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${certificateLink}" style="${emailStyles.button}">Télécharger mon Certificat</a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Bienvenue dans l'aventure,<br>
            L'équipe ESTT Community & ${clubName}
        </p>
    `;

    return baseLayout(content);
};
