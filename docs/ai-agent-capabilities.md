# ESTT-AI: Proposed Functionalities & Integrations

This document outlines the potential functionalities and system integrations we can provide to the **ESTT-AI** agent to transform it from a simple chatbot into a powerful, action-oriented assistant for the ESTT Community.

## 1. Academic & Resource Intelligence
The agent should be the primary interface for navigating the complex library of resources.

- **Resource Search & Retrieval**: Allow the agent to search for specific PDFs, exam papers, or course materials based on major, semester, and module name.
- **Academic Pathfinding**: Enable the agent to explain the curriculum (e.g., "What modules will I study in S3 of IDD?").
- **Content Summarization**: Use the agent to summarize long resource descriptions or provided text into concise study notes.
- **Contribution Assistance**: Guide users through the upload process by validating their file metadata before submission.

## 2. Club & Community Management
The agent can act as a "Virtual Secretary" for the various clubs on campus.

- **Club Directory**: Provide the agent with full access to the list of verified clubs, their descriptions, and their organizational charts.
- **Event Coordination**: Allow the agent to retrieve upcoming events and explain how to register or buy tickets.
- **Membership Assistance**: Help students find clubs that match their interests and explain the requirements for joining.
- **Admin Drafting**: Help club admins draft professional announcements, event descriptions, or internal messages for their members.

## 3. Active Communication Tools
Give the agent the power to "notify" and "alert" users when necessary.

- **Broadcast Notifications**: Enable the agent (with admin permission) to trigger platform-wide or group-specific notifications about urgent news.
- **Drafting Emails/Slack**: Integrate with `/api/send-email` and `/api/slack` so the agent can help draft and queue operational alerts.
- **Personal Reminders**: Allow the agent to remind users of upcoming event deadlines or pending resource approvals.

## 4. User Personalization & Career
- **Profile Insights**: Let the agent summarize a user's contributions (e.g., "You have contributed 5 resources this month, keep it up!").
- **Skill Suggestions**: Based on the user's major and interests, recommend clubs or specific modules to focus on.
- **PFE Assistance**: Provide guidance and documentation standards for students working on their "Projet de Fin d'Études" (PFE).

## 5. Technical Implementation (Function Calling)
To achieve this, we should implement **Function Calling** in the Gemini model. Example functions to expose:

| Function Name | Description | Parameters |
| :--- | :--- | :--- |
| `search_resources` | Search the academic library | `query`, `major`, `semester` |
| `get_club_info` | Retrieve details about a specific club | `club_name` or `clubId` |
| `list_upcoming_events` | List events with registration links | `limit`, `category` |
| `check_user_profile` | Get summarized activity for the current user | `uid` |

---

### Priority #1: Read-Only Access
Start with **Read-Only** access to the academic structure and club list. This provides immediate value without complex write-permissions.

### Privacy First
The AI should never have access to private user data (passwords, private DMs) unless explicitly shared in the current conversation context.
