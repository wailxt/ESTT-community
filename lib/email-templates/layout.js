
import { emailStyles } from './styles';

export const baseLayout = (content) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESTT Community</title>
</head>
<body style="${emailStyles.body}">
    <div style="${emailStyles.container}">
        <!-- Header -->
        <div style="${emailStyles.header}">
            <a href="https://estt-community.vercel.app" style="${emailStyles.logo}">
                ESTT<span style="${emailStyles.logoHighlight}">.Community</span>
            </a>
        </div>

        <!-- Content -->
        <div style="${emailStyles.content}">
            ${content}
        </div>

        <!-- Footer -->
        <div style="${emailStyles.footer}">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
                © ${new Date().getFullYear()} ESTT Community. Tous droits réservés.
            </p>
            <div style="margin-top: 10px;">
                <a href="https://estt-community.vercel.app" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 5px;">Accueil</a>
                <span style="color: #cbd5e1;">|</span>
                <a href="https://estt-community.vercel.app/clubs" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 5px;">Clubs</a>
            </div>
        </div>
    </div>
</body>
</html>
// End of file
    `;
};
