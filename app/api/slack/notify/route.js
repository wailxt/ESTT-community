import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { channel, user, resource, message, title } = body;

        // Map channel IDs to environment variable keys
        const channelMap = {
            alerts: process.env.SLACK_WEBHOOK_ALERTS,
            admin: process.env.SLACK_WEBHOOK_ADMIN,
            finance: process.env.SLACK_WEBHOOK_FINANCE,
            community: process.env.SLACK_WEBHOOK_COMMUNITY
        };

        const slackWebhookUrl = channelMap[channel] || process.env.SLACK_WEBHOOK_ALERTS || process.env.SLACK_WEBHOOK_COMMUNITY;

        if (!slackWebhookUrl) {
            console.error(`Slack webhook URL for channel "${channel}" is not defined`);
            return NextResponse.json({ error: 'Slack webhook URL not configured' }, { status: 500 });
        }

        // Build premium blocks based on the context
        const blocks = [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*${title || 'Nouvelle Notification Multi-Canal'}*`
                }
            }
        ];

        if (message) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: message
                }
            });
        }

        blocks.push({ type: "divider" });

        const fields = [];
        if (user) {
            fields.push({
                type: "mrkdwn",
                text: `*Utilisateur:*\n${user.name || 'Anonyme'} (${user.email || 'N/A'})`
            });
        }
        if (resource) {
            fields.push({
                type: "mrkdwn",
                text: `*Cible:*\n${resource.title || 'N/A'} (${resource.type || 'item'})`
            });
        }

        if (fields.length > 0) {
            blocks.push({
                type: "section",
                fields: fields
            });
        }

        // Additional information for different channels
        if (channel === 'alerts' && resource?.severity) {
            blocks.push({
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `*Sévérité:* ${resource.severity}`
                    }
                ]
            });
        }

        if (resource?.id) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const link = resource.type === 'bug' ? `${baseUrl}/admin` : `${baseUrl}/resource/${resource.id}`;
            
            const actionElements = [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Voir les détails"
                    },
                    url: link,
                    style: "primary"
                }
            ];

            // Add Approve/Reject buttons for admin channel (contributions)
            if (channel === 'admin' && resource.type !== 'bug') {
                actionElements.push(
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Approuver ✅"
                        },
                        style: "primary",
                        value: resource.id,
                        action_id: "approve_resource"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Rejeter ❌"
                        },
                        style: "danger",
                        value: resource.id,
                        action_id: "reject_resource",
                        confirm: {
                            title: {
                                type: "plain_text",
                                text: "Êtes-vous sûr ?"
                            },
                            text: {
                                type: "plain_text",
                                text: "Voulez-vous vraiment rejeter cette ressource ?"
                            },
                            confirm: {
                                type: "plain_text",
                                text: "Rejeter"
                            },
                            deny: {
                                type: "plain_text",
                                text: "Annuler"
                            }
                        }
                    }
                );
            }

            blocks.push({
                type: "actions",
                elements: actionElements
            });
        }

        const slackMessage = { blocks };
        console.log('Sending Slack Message:', JSON.stringify(slackMessage, null, 2));

        const response = await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(slackMessage),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Slack API error: ${response.status} ${errorText}`);
            throw new Error(`Slack API error: ${response.status} ${errorText}`);
        }

        console.log('Slack notification sent successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in Slack notification route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
