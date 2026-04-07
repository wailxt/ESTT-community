import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const rewardClaimedEmail = ({ isGuest, rewardType, email }) => {
    // Format the reward string nicely
    const formatReward = (r) => {
        if (!r) return 'ESTTPlus+';
        if (r.includes('month')) return `ESTTPlus+ (${r.split('_')[1].replace('month', ' Mois')})`;
        if (r.includes('day')) return `ESTTPlus+ (${r.split('_')[1].replace('day', ' Jours')})`;
        return 'ESTTPlus+';
    };

    const formattedReward = formatReward(rewardType);

    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://fnaiedociknutdxoezhn.supabase.co/storage/v1/object/public/ressources/ESTT-1.jpg" alt="Campus ESTT" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: -40px;" />
            <img src="https://fnaiedociknutdxoezhn.supabase.co/storage/v1/object/public/ressources/icon-512x512-maskable.png" alt="ESTT Icon" style="width: 80px; height: 80px; border-radius: 20px; position: relative; z-index: 10; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
        </div>

        <h1 style="${emailStyles.h1}; text-align: center; color: #1e293b; margin-top: 10px;">Félicitations ! 🎉</h1>
        
        <p style="${emailStyles.paragraph}; text-align: center; font-size: 16px;">
            Vous venez de débloquer votre récompense exclusive : <br/>
            <strong style="color: #4f46e5; font-size: 20px; display: inline-block; margin-top: 8px;">${formattedReward}</strong>
        </p>

        <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 24px; border-radius: 12px; color: white; margin: 30px 0;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px; color: white;">C'est quoi l'ESTT Community ? 🚀</h2>
            <p style="margin: 0; line-height: 1.6; font-size: 15px; color: #e0e7ff;">
                Nous sommes la plateforme 100% étudiants de l'École Supérieure de Technologie de Tétouan. 
                Notre but ? Faciliter votre vie étudiante. Retrouvez vos cours, ne manquez aucun événement, et rejoignez les clubs de l'école directement depuis notre application.
            </p>
        </div>

        ${isGuest ? `
        <div style="${emailStyles.highlightBox}; border-left: 4px solid #f59e0b; background-color: #fef3c7;">
            <h3 style="margin: 0 0 8px 0; color: #d97706; font-size: 16px;">🚨 Action Requise pour Profiter de votre ESTTPlus+</h3>
            <p style="${emailStyles.paragraph}; color: #92400e; margin-bottom: 16px;">
                Votre récompense a bien été réservée pour l'adresse <strong>${email}</strong> ! 
                Cependant, vous n'avez pas encore de profil sur notre plateforme. 
                <br/><br/>
                Créez simplement votre compte avec cet email, et votre badge VIP sera automatiquement activé !
            </p>
            <div style="text-align: center;">
                <a href="https://estt-community.vercel.app/signup" style="${emailStyles.button}; background-color: #d97706; display: inline-block;">Créer mon Compte</a>
            </div>
        </div>
        ` : `
        <div style="${emailStyles.highlightBox}; border-left: 4px solid #10b981; background-color: #ecfdf5;">
            <h3 style="margin: 0 0 8px 0; color: #047857; font-size: 16px;">✅ Récompense Activée !</h3>
            <p style="${emailStyles.paragraph}; color: #065f46; margin-bottom: 16px;">
                Votre badge VIP ESTTPlus+ est désormais actif sur votre profil public. Vous pouvez le visualiser et commencer à explorer les clubs et événements exclusifs de l'école.
            </p>
            <div style="text-align: center;">
                <a href="https://estt-community.vercel.app/profile" style="${emailStyles.button}; background-color: #059669; display: inline-block;">Voir mon Profil</a>
            </div>
        </div>
        `}

        <h3 style="margin-top: 30px; margin-bottom: 10px; color: #334155;">Découvrez nos Clubs Étudiants</h3>
        <p style="${emailStyles.paragraph}">
            Il y en a pour tous les goûts : Tech, Sport, Art... Engagez-vous et enrichissez votre parcours universitaire.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
            <a href="https://estt-community.vercel.app/clubs" style="${emailStyles.button}; background-color: #1e293b; color: white;">Explorer les Clubs →</a>
        </div>
        
        <p style="${emailStyles.paragraph}; margin-top: 30px; text-align: center; color: #64748b;">
            À très vite sur le campus !<br>
            <strong>L'équipe ESTT Community</strong>
        </p>
    `;

    return baseLayout(content);
};
